-- ============================================
-- 013: ANNUAL PRICING
-- Run after 012_media_visibility.sql.
--
-- Haloft lets on the Nigerian annual model: a student pays one year's
-- rent up front, in a single transaction, alongside the agency and
-- caution fees. The monthly model this replaces could not express that.
--
-- It also mispriced it. create_booking charged
--     price_per_month * ceil(days / 30) + deposit
-- so a genuine twelve-month tenancy (365 days) billed THIRTEEN monthly
-- blocks, because 365/30 ceils to 13. Every year-long booking taken
-- before this migration overcharged by a month.
--
-- What changes:
--   - rooms carry annual_rent + agency_fee + caution_fee, not a monthly
--     rate and a deposit expressed in months
--   - a tenancy is exactly one year; the student picks a move-in date
--     and the move-out date is derived, so the term cannot be gamed
--   - properties declare whether they let whole or room-by-room
--   - bookings keep the three components they were charged, so a
--     receipt can be reconstructed years later even if the room's
--     price has moved on
-- ============================================

-- ── 1. Views must go first: they depend on the columns being dropped ──
DROP VIEW IF EXISTS public.property_listings;
DROP VIEW IF EXISTS public.room_listings;

-- ── 2. Rooms: annual rent and the two fees ─────────────────
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS annual_rent DECIMAL(12, 2);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS agency_fee DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS caution_fee DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Carry the old model across: a year of rent, and the deposit becomes
-- the caution fee since that is what it functionally was.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'rooms' AND column_name = 'price_per_month'
    ) THEN
        UPDATE rooms
        SET annual_rent = COALESCE(annual_rent, price_per_month * 12),
            caution_fee = CASE
                WHEN caution_fee = 0
                THEN price_per_month * COALESCE(deposit_months, 0)
                ELSE caution_fee
            END;
    END IF;
END $$;

-- Any row still without a rent (there should be none) is not lettable.
UPDATE rooms SET annual_rent = 0 WHERE annual_rent IS NULL;

ALTER TABLE rooms ALTER COLUMN annual_rent SET NOT NULL;
ALTER TABLE rooms ADD CONSTRAINT rooms_annual_rent_non_negative CHECK (annual_rent >= 0) NOT VALID;
ALTER TABLE rooms VALIDATE CONSTRAINT rooms_annual_rent_non_negative;
ALTER TABLE rooms ADD CONSTRAINT rooms_agency_fee_non_negative CHECK (agency_fee >= 0) NOT VALID;
ALTER TABLE rooms VALIDATE CONSTRAINT rooms_agency_fee_non_negative;
ALTER TABLE rooms ADD CONSTRAINT rooms_caution_fee_non_negative CHECK (caution_fee >= 0) NOT VALID;
ALTER TABLE rooms VALIDATE CONSTRAINT rooms_caution_fee_non_negative;

DROP INDEX IF EXISTS idx_rooms_price;
CREATE INDEX IF NOT EXISTS idx_rooms_annual_rent
    ON rooms(annual_rent) WHERE deleted_at IS NULL;

ALTER TABLE rooms DROP COLUMN IF EXISTS price_per_month;
ALTER TABLE rooms DROP COLUMN IF EXISTS deposit_months;

-- ── 3. Properties: let whole, or room by room ─────────────────
-- 'whole'  — one tenant takes the entire place; the property has a
--            single bookable unit and the UI calls it an apartment.
-- 'rooms'  — several students each take a room and each pay their own
--            annual rent. The pre-existing behaviour, so it defaults.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS letting_mode TEXT NOT NULL DEFAULT 'rooms';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'properties_letting_mode_check'
    ) THEN
        ALTER TABLE properties ADD CONSTRAINT properties_letting_mode_check
            CHECK (letting_mode IN ('whole', 'rooms'));
    END IF;
END $$;

-- ── 4. Bookings: keep the breakdown that was charged ─────────────────
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS annual_rent DECIMAL(12, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS agency_fee DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS caution_fee DECIMAL(12, 2) NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'monthly_price'
    ) THEN
        UPDATE bookings
        SET annual_rent = COALESCE(annual_rent, monthly_price * total_months),
            caution_fee = CASE
                WHEN caution_fee = 0 THEN COALESCE(deposit_amount, 0)
                ELSE caution_fee
            END;
    END IF;
END $$;

UPDATE bookings SET annual_rent = 0 WHERE annual_rent IS NULL;
ALTER TABLE bookings ALTER COLUMN annual_rent SET NOT NULL;

ALTER TABLE bookings DROP COLUMN IF EXISTS monthly_price;
ALTER TABLE bookings DROP COLUMN IF EXISTS deposit_amount;

-- ── 5. Property min/max price now track annual rent ─────────────────
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
            MIN(annual_rent) FILTER (WHERE deleted_at IS NULL) AS min_price,
            MAX(annual_rent) FILTER (WHERE deleted_at IS NULL) AS max_price
        FROM rooms
        WHERE property_id = v_property_id
    ) sub
    WHERE p.id = v_property_id;
    RETURN COALESCE(NEW, OLD);
END;
$$;

UPDATE properties p SET
    min_price = sub.min_price,
    max_price = sub.max_price
FROM (
    SELECT property_id,
        MIN(annual_rent) AS min_price,
        MAX(annual_rent) AS max_price
    FROM rooms WHERE deleted_at IS NULL
    GROUP BY property_id
) sub
WHERE p.id = sub.property_id;

-- ── 6. Recreate the listing views ─────────────────
-- Both keep security_invoker (011) and the inner join to properties, so
-- an unpublished property still hides its units.
CREATE VIEW public.property_listings
WITH (security_invoker = on) AS
SELECT
    r.id,
    r.property_id,
    p.title AS property_title,
    p.slug AS property_slug,
    p.campus_id,
    p.letting_mode,
    r.building_id,
    b.name AS building_name,
    r.name,
    r.description,
    r.room_type,
    r.floor,
    r.size_sqm,
    r.max_occupancy,
    r.annual_rent,
    r.agency_fee,
    r.caution_fee,
    (r.annual_rent + r.agency_fee + r.caution_fee) AS total_payable,
    r.currency,
    r.is_available,
    r.amenities,
    r.status,
    r.created_at,
    r.updated_at,
    (
        SELECT m.url
        FROM media m
        WHERE m.entity_type = 'room' AND m.entity_id = r.id AND m.deleted_at IS NULL
        ORDER BY m.is_featured DESC, m.display_order ASC
        LIMIT 1
    ) AS media_url,
    (
        SELECT COUNT(*)::INTEGER
        FROM media m
        WHERE m.entity_type = 'room' AND m.entity_id = r.id AND m.deleted_at IS NULL
    ) AS media_count
FROM rooms r
JOIN properties p ON p.id = r.property_id
LEFT JOIN buildings b ON b.id = r.building_id
WHERE r.deleted_at IS NULL;

CREATE VIEW public.room_listings
WITH (security_invoker = on) AS
SELECT * FROM public.property_listings;

-- ── 7. create_booking: a one-year tenancy, priced once ─────────────────
-- The move-out date is derived, not supplied, so the term is always
-- exactly a year and the total cannot be moved by picking dates.
-- Sentinels: AUTH_REQUIRED, CHECK_IN_PAST, ROOM_NOT_FOUND,
--            ROOM_PROPERTY_MISMATCH, ROOM_UNAVAILABLE
DROP FUNCTION IF EXISTS public.create_booking(UUID, UUID, DATE, DATE, TEXT);

CREATE OR REPLACE FUNCTION public.create_booking(
    p_room_id UUID,
    p_property_id UUID,
    p_check_in_date DATE,
    p_special_requests TEXT DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id UUID := auth.uid();
    v_room rooms%ROWTYPE;
    v_property_status TEXT;
    v_check_out_date DATE;
    v_booking bookings%ROWTYPE;
BEGIN
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;

    IF p_check_in_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'CHECK_IN_PAST';
    END IF;

    v_check_out_date := p_check_in_date + INTERVAL '1 year';

    -- Serialize concurrent bookings for the same room
    SELECT * INTO v_room
    FROM rooms
    WHERE id = p_room_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ROOM_NOT_FOUND';
    END IF;

    IF v_room.property_id IS DISTINCT FROM p_property_id THEN
        RAISE EXCEPTION 'ROOM_PROPERTY_MISMATCH';
    END IF;

    IF NOT v_room.is_available OR v_room.status <> 'available' THEN
        RAISE EXCEPTION 'ROOM_UNAVAILABLE';
    END IF;

    SELECT status INTO v_property_status
    FROM properties
    WHERE id = p_property_id AND deleted_at IS NULL;

    IF NOT FOUND OR v_property_status <> 'published' THEN
        RAISE EXCEPTION 'ROOM_UNAVAILABLE';
    END IF;

    IF EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.room_id = p_room_id
          AND b.deleted_at IS NULL
          AND b.status IN ('pending', 'confirmed')
          AND daterange(b.check_in_date, b.check_out_date, '[)')
              && daterange(p_check_in_date, v_check_out_date, '[)')
    ) THEN
        RAISE EXCEPTION 'ROOM_UNAVAILABLE';
    END IF;

    INSERT INTO bookings (
        student_id, room_id, property_id, status,
        check_in_date, check_out_date, total_months,
        annual_rent, agency_fee, caution_fee, total_amount,
        currency, special_requests
    ) VALUES (
        v_student_id, p_room_id, p_property_id, 'pending',
        p_check_in_date, v_check_out_date, 12,
        v_room.annual_rent, v_room.agency_fee, v_room.caution_fee,
        v_room.annual_rent + v_room.agency_fee + v_room.caution_fee,
        v_room.currency, NULLIF(TRIM(p_special_requests), '')
    )
    RETURNING * INTO v_booking;

    UPDATE rooms
    SET status = 'reserved', is_available = FALSE
    WHERE id = p_room_id;

    RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking(UUID, UUID, DATE, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_booking(UUID, UUID, DATE, TEXT) TO authenticated;
