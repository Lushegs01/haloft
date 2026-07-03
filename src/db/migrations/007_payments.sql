-- ============================================
-- 007: PAYSTACK PAYMENTS
-- Run after 006_media_storage_and_booking_admin.sql. Idempotent.
--
-- Payments are recorded server-side only (Paystack webhook / verify
-- callback) using the service role, which bypasses RLS by design.
-- Students still cannot write payments through the API — there is no
-- INSERT/UPDATE policy for them. These indexes are the integrity
-- backstop for the recording path:
--   - a Paystack transaction reference can be recorded at most once
--     (makes webhook + callback double-delivery idempotent)
--   - a booking can have at most one successful payment
-- ============================================

-- Replaced by the unique index below
DROP INDEX IF EXISTS idx_payments_reference;

-- Full (non-partial) unique index so PostgREST upserts can target it
-- with ON CONFLICT (transaction_reference). Multiple NULLs stay allowed
-- for legacy/manual rows without a reference.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_reference
    ON payments(transaction_reference);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_booking_success
    ON payments(booking_id) WHERE status = 'success';

-- ============================================
-- cancel_booking (from 002), updated: a paid booking cannot be
-- self-cancelled by the student — cancellations after payment imply a
-- refund and must go through an admin (admin_update_booking_status).
-- New sentinel: BOOKING_PAID
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

    IF EXISTS (
        SELECT 1 FROM payments
        WHERE booking_id = p_booking_id AND status = 'success'
    ) THEN
        RAISE EXCEPTION 'BOOKING_PAID';
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
