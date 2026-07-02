-- ============================================
-- 006: MEDIA STORAGE + ADMIN BOOKING MANAGEMENT
-- Run after 005_profile_creation.sql. Idempotent — safe to re-run.
--
-- Adds:
--   - property-media storage bucket (public read, admin-only write) for
--     property photos uploaded from the admin CMS
--   - admin_update_booking_status(): confirm / complete / cancel a booking
--     and keep the room's status in sync, atomically under row locks
--     (campus-scoped: uses is_property_admin from 003)
-- ============================================

-- ============================================
-- 1. STORAGE BUCKET + POLICIES
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'property-media',
    'property-media',
    TRUE,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "property_media_public_read" ON storage.objects;
CREATE POLICY "property_media_public_read" ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'property-media');

DROP POLICY IF EXISTS "property_media_admin_insert" ON storage.objects;
CREATE POLICY "property_media_admin_insert" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'property-media' AND public.is_admin());

DROP POLICY IF EXISTS "property_media_admin_update" ON storage.objects;
CREATE POLICY "property_media_admin_update" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'property-media' AND public.is_admin());

DROP POLICY IF EXISTS "property_media_admin_delete" ON storage.objects;
CREATE POLICY "property_media_admin_delete" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'property-media' AND public.is_admin());

-- ============================================
-- 2. ADMIN BOOKING STATUS TRANSITIONS
-- Sentinel messages: AUTH_REQUIRED, ADMIN_ONLY, BOOKING_NOT_FOUND,
-- INVALID_TRANSITION, INVALID_ACTION
--
-- Transitions and their room side effects:
--   confirm  (pending   -> confirmed): room becomes occupied
--   complete (confirmed -> completed): room freed if no other active booking
--   cancel   (pending|confirmed -> cancelled): room freed likewise
-- ============================================

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

    -- Lock the room so room-state updates don't race create_booking/cancel_booking
    PERFORM 1 FROM rooms WHERE id = v_booking.room_id FOR UPDATE;

    IF p_action = 'confirm' THEN
        IF v_booking.status <> 'pending' THEN
            RAISE EXCEPTION 'INVALID_TRANSITION';
        END IF;

        UPDATE bookings SET status = 'confirmed'
        WHERE id = p_booking_id
        RETURNING * INTO v_booking;

        UPDATE rooms SET status = 'occupied', is_available = FALSE
        WHERE id = v_booking.room_id;

    ELSIF p_action = 'complete' THEN
        IF v_booking.status <> 'confirmed' THEN
            RAISE EXCEPTION 'INVALID_TRANSITION';
        END IF;

        UPDATE bookings SET status = 'completed'
        WHERE id = p_booking_id
        RETURNING * INTO v_booking;

        IF NOT EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.room_id = v_booking.room_id
              AND b.deleted_at IS NULL
              AND b.status IN ('pending', 'confirmed')
        ) THEN
            UPDATE rooms SET status = 'available', is_available = TRUE
            WHERE id = v_booking.room_id AND status IN ('reserved', 'occupied');
        END IF;

    ELSIF p_action = 'cancel' THEN
        IF v_booking.status NOT IN ('pending', 'confirmed') THEN
            RAISE EXCEPTION 'INVALID_TRANSITION';
        END IF;

        UPDATE bookings SET status = 'cancelled'
        WHERE id = p_booking_id
        RETURNING * INTO v_booking;

        IF NOT EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.room_id = v_booking.room_id
              AND b.deleted_at IS NULL
              AND b.status IN ('pending', 'confirmed')
        ) THEN
            UPDATE rooms SET status = 'available', is_available = TRUE
            WHERE id = v_booking.room_id AND status IN ('reserved', 'occupied');
        END IF;

    ELSE
        RAISE EXCEPTION 'INVALID_ACTION';
    END IF;

    RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_booking_status(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_booking_status(UUID, TEXT) TO authenticated, service_role;
