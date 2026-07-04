-- ============================================
-- 008: PERFORMANCE, DATA INTEGRITY, AUDIT
-- Run after 007_payments.sql. Idempotent — safe to re-run.
--
-- 1. Denormalize rating + price aggregates onto properties, maintained
--    by triggers, and rewrite property_listings to read them (kills the
--    per-row correlated subqueries the view ran on every catalog load).
-- 2. Trigram GIN index so title/address search uses an index, not a
--    full-table ILIKE scan.
-- 3. Keep min_price / max_price in sync with the property's rooms.
-- 4. Write audit_logs rows for admin booking transitions.
-- ============================================

-- ── 1. Denormalized rating columns ──────────────────────────
ALTER TABLE properties ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(2,1);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.refresh_property_rating(p_property_id UUID)
RETURNS void
LANGUAGE sql
AS $$
    UPDATE properties p SET
        avg_rating = sub.avg_rating,
        review_count = sub.review_count
    FROM (
        SELECT
            ROUND(AVG(overall_rating), 1) AS avg_rating,
            COUNT(*)::INTEGER AS review_count
        FROM reviews
        WHERE property_id = p_property_id
          AND is_approved = TRUE
          AND deleted_at IS NULL
    ) sub
    WHERE p.id = p_property_id;
$$;

CREATE OR REPLACE FUNCTION public.reviews_sync_property_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM public.refresh_property_rating(COALESCE(NEW.property_id, OLD.property_id));
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS reviews_sync_rating ON reviews;
CREATE TRIGGER reviews_sync_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION public.reviews_sync_property_rating();

-- Backfill existing rows once
UPDATE properties p SET
    avg_rating = sub.avg_rating,
    review_count = COALESCE(sub.review_count, 0)
FROM (
    SELECT
        pr.id AS property_id,
        ROUND(AVG(r.overall_rating), 1) AS avg_rating,
        COUNT(r.id)::INTEGER AS review_count
    FROM properties pr
    LEFT JOIN reviews r
        ON r.property_id = pr.id AND r.is_approved = TRUE AND r.deleted_at IS NULL
    GROUP BY pr.id
) sub
WHERE p.id = sub.property_id;

-- ── 2. Keep min/max price synced with rooms ─────────────────
-- Extends the existing room-count trigger's job with price aggregation.
CREATE OR REPLACE FUNCTION public.update_property_room_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_property_id UUID := COALESCE(NEW.property_id, OLD.property_id);
BEGIN
    UPDATE properties p SET
        total_rooms = sub.total_rooms,
        available_rooms = sub.available_rooms,
        min_price = sub.min_price,
        max_price = sub.max_price
    FROM (
        SELECT
            COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_rooms,
            COUNT(*) FILTER (WHERE deleted_at IS NULL AND status = 'available' AND is_available = TRUE) AS available_rooms,
            MIN(price_per_month) FILTER (WHERE deleted_at IS NULL) AS min_price,
            MAX(price_per_month) FILTER (WHERE deleted_at IS NULL) AS max_price
        FROM rooms
        WHERE property_id = v_property_id
    ) sub
    WHERE p.id = v_property_id;
    RETURN COALESCE(NEW, OLD);
END;
$$;
-- (trigger rooms_update_property_counts from 001 already calls this)

-- Backfill prices from current rooms
UPDATE properties p SET
    min_price = sub.min_price,
    max_price = sub.max_price
FROM (
    SELECT property_id,
        MIN(price_per_month) AS min_price,
        MAX(price_per_month) AS max_price
    FROM rooms WHERE deleted_at IS NULL
    GROUP BY property_id
) sub
WHERE p.id = sub.property_id;

-- ── 3. Rewrite property_listings without correlated subqueries ──
-- DROP + CREATE (not REPLACE) because a column type changes (avg_rating).
-- Nothing in the database depends on this view; the app reads it directly.
DROP VIEW IF EXISTS property_listings;
CREATE VIEW property_listings AS
SELECT
    p.id,
    p.campus_id,
    p.neighbourhood_id,
    n.name AS neighbourhood_name,
    p.title,
    p.slug,
    p.description,
    p.address,
    p.latitude,
    p.longitude,
    p.property_type,
    p.status,
    p.total_rooms,
    p.available_rooms,
    p.min_price,
    p.max_price,
    p.currency,
    p.amenities,
    p.is_verified,
    p.featured_order,
    p.rules,
    p.created_at,
    p.updated_at,
    feat.url AS media_url,
    COALESCE(mc.media_count, 0) AS media_count,
    p.avg_rating,
    p.review_count
FROM properties p
LEFT JOIN neighbourhoods n ON n.id = p.neighbourhood_id
LEFT JOIN LATERAL (
    SELECT m.url
    FROM media m
    WHERE m.entity_type = 'property' AND m.entity_id = p.id AND m.deleted_at IS NULL
    ORDER BY m.is_featured DESC, m.display_order ASC
    LIMIT 1
) feat ON TRUE
LEFT JOIN LATERAL (
    SELECT COUNT(*)::INTEGER AS media_count
    FROM media m
    WHERE m.entity_type = 'property' AND m.entity_id = p.id AND m.deleted_at IS NULL
) mc ON TRUE
WHERE p.deleted_at IS NULL;

-- ── 4. Trigram search index ─────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_properties_title_trgm
    ON properties USING gin (title gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_properties_address_trgm
    ON properties USING gin (address gin_trgm_ops) WHERE deleted_at IS NULL;

-- Composite index for the default catalog sort (published, per campus)
CREATE INDEX IF NOT EXISTS idx_properties_catalog
    ON properties (campus_id, status, featured_order, created_at DESC)
    WHERE deleted_at IS NULL;

-- ── 5. Audit logging for admin booking transitions ──────────
-- Extends admin_update_booking_status (006) to record who did what.
CREATE OR REPLACE FUNCTION public.admin_update_booking_status(
    p_booking_id UUID,
    p_action TEXT
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking bookings%ROWTYPE;
    v_old_status TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;

    SELECT * INTO v_booking
    FROM bookings
    WHERE id = p_booking_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND';
    END IF;

    IF NOT public.is_property_admin(v_booking.property_id) THEN
        RAISE EXCEPTION 'ADMIN_ONLY';
    END IF;

    v_old_status := v_booking.status;

    PERFORM 1 FROM rooms WHERE id = v_booking.room_id FOR UPDATE;

    IF p_action = 'confirm' THEN
        IF v_booking.status <> 'pending' THEN
            RAISE EXCEPTION 'INVALID_TRANSITION';
        END IF;
        UPDATE bookings SET status = 'confirmed' WHERE id = p_booking_id RETURNING * INTO v_booking;
        UPDATE rooms SET status = 'occupied', is_available = FALSE WHERE id = v_booking.room_id;

    ELSIF p_action = 'complete' THEN
        IF v_booking.status <> 'confirmed' THEN
            RAISE EXCEPTION 'INVALID_TRANSITION';
        END IF;
        UPDATE bookings SET status = 'completed' WHERE id = p_booking_id RETURNING * INTO v_booking;
        IF NOT EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.room_id = v_booking.room_id AND b.deleted_at IS NULL
              AND b.status IN ('pending', 'confirmed')
        ) THEN
            UPDATE rooms SET status = 'available', is_available = TRUE
            WHERE id = v_booking.room_id AND status IN ('reserved', 'occupied');
        END IF;

    ELSIF p_action = 'cancel' THEN
        IF v_booking.status NOT IN ('pending', 'confirmed') THEN
            RAISE EXCEPTION 'INVALID_TRANSITION';
        END IF;
        UPDATE bookings SET status = 'cancelled' WHERE id = p_booking_id RETURNING * INTO v_booking;
        IF NOT EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.room_id = v_booking.room_id AND b.deleted_at IS NULL
              AND b.status IN ('pending', 'confirmed')
        ) THEN
            UPDATE rooms SET status = 'available', is_available = TRUE
            WHERE id = v_booking.room_id AND status IN ('reserved', 'occupied');
        END IF;

    ELSE
        RAISE EXCEPTION 'INVALID_ACTION';
    END IF;

    INSERT INTO audit_logs (user_id, table_name, record_id, action, old_data, new_data)
    VALUES (
        auth.uid(), 'bookings', p_booking_id::TEXT, 'UPDATE',
        jsonb_build_object('status', v_old_status),
        jsonb_build_object('status', v_booking.status, 'via', 'admin_update_booking_status:' || p_action)
    );

    RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_booking_status(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_booking_status(UUID, TEXT) TO authenticated, service_role;
