-- ============================================
-- 002: BOOKING INTEGRITY
-- Run after 001_initial_schema.sql.
--
-- Makes booking creation/cancellation atomic and race-safe:
--   - CHECK constraint: check_out_date must be after check_in_date
--   - Exclusion constraint: no overlapping active bookings per room
--   - create_booking(): locks the room, validates, prices, inserts the
--     booking, and reserves the room in one transaction
--   - cancel_booking(): cancels and frees the room in one transaction
--
-- Both functions are SECURITY DEFINER so the room status update works
-- for students (rooms are otherwise admin-write-only under RLS).
-- ============================================

-- Needed for the room_id (uuid) column in the GiST exclusion constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
    ADD CONSTRAINT bookings_dates_valid CHECK (check_out_date > check_in_date);

-- A room cannot have two pending/confirmed bookings with overlapping stays.
-- This is the hard backstop; create_booking() also checks it under a row lock.
ALTER TABLE bookings
    ADD CONSTRAINT bookings_no_overlapping_active EXCLUDE USING gist (
        room_id WITH =,
        daterange(check_in_date, check_out_date, '[)') WITH &&
    ) WHERE (status IN ('pending', 'confirmed') AND deleted_at IS NULL);

-- ============================================
-- create_booking
-- Raises exceptions with sentinel messages the app maps to friendly text:
--   AUTH_REQUIRED, INVALID_DATES, CHECK_IN_PAST, ROOM_NOT_FOUND,
--   ROOM_PROPERTY_MISMATCH, ROOM_UNAVAILABLE
-- ============================================

CREATE OR REPLACE FUNCTION public.create_booking(
    p_room_id UUID,
    p_property_id UUID,
    p_check_in_date DATE,
    p_check_out_date DATE,
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
    v_total_months INTEGER;
    v_monthly_price DECIMAL(12, 2);
    v_deposit_amount DECIMAL(12, 2);
    v_booking bookings%ROWTYPE;
BEGIN
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;

    IF p_check_out_date <= p_check_in_date THEN
        RAISE EXCEPTION 'INVALID_DATES';
    END IF;

    IF p_check_in_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'CHECK_IN_PAST';
    END IF;

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
              && daterange(p_check_in_date, p_check_out_date, '[)')
    ) THEN
        RAISE EXCEPTION 'ROOM_UNAVAILABLE';
    END IF;

    v_total_months := GREATEST(1, CEIL((p_check_out_date - p_check_in_date) / 30.0))::INTEGER;
    v_monthly_price := v_room.price_per_month;
    v_deposit_amount := v_monthly_price * COALESCE(v_room.deposit_months, 1);

    INSERT INTO bookings (
        student_id, room_id, property_id, status,
        check_in_date, check_out_date, total_months,
        monthly_price, deposit_amount, total_amount,
        currency, special_requests
    ) VALUES (
        v_student_id, p_room_id, p_property_id, 'pending',
        p_check_in_date, p_check_out_date, v_total_months,
        v_monthly_price, v_deposit_amount,
        v_monthly_price * v_total_months + v_deposit_amount,
        v_room.currency, NULLIF(TRIM(p_special_requests), '')
    )
    RETURNING * INTO v_booking;

    UPDATE rooms
    SET status = 'reserved', is_available = FALSE
    WHERE id = p_room_id;

    RETURN v_booking;
END;
$$;

-- ============================================
-- cancel_booking
-- Sentinel messages: AUTH_REQUIRED, BOOKING_NOT_FOUND, BOOKING_NOT_CANCELLABLE
-- ============================================

CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id UUID)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id UUID := auth.uid();
    v_booking bookings%ROWTYPE;
BEGIN
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;

    SELECT * INTO v_booking
    FROM bookings
    WHERE id = p_booking_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND OR v_booking.student_id <> v_student_id THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND';
    END IF;

    IF v_booking.status NOT IN ('pending', 'confirmed') THEN
        RAISE EXCEPTION 'BOOKING_NOT_CANCELLABLE';
    END IF;

    UPDATE bookings
    SET status = 'cancelled'
    WHERE id = p_booking_id
    RETURNING * INTO v_booking;

    -- Lock the room so this doesn't race a concurrent create_booking
    PERFORM 1 FROM rooms WHERE id = v_booking.room_id FOR UPDATE;

    -- Free the room only if no other active booking holds it, and only if
    -- it is still 'reserved' — never override an admin-set occupied/maintenance
    IF NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.room_id = v_booking.room_id
          AND b.deleted_at IS NULL
          AND b.status IN ('pending', 'confirmed')
    ) THEN
        UPDATE rooms
        SET status = 'available', is_available = TRUE
        WHERE id = v_booking.room_id AND status = 'reserved';
    END IF;

    RETURN v_booking;
END;
$$;

-- Callable by signed-in users only
REVOKE ALL ON FUNCTION public.create_booking(UUID, UUID, DATE, DATE, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_booking(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_booking(UUID, UUID, DATE, DATE, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_booking(UUID) TO authenticated, service_role;
