-- ============================================================
-- 015: BOOKING RESERVATION WINDOWS
-- Run after 014_payment_ledger.sql. Idempotent.
-- ============================================================
-- create_booking reserves the room the moment a student submits, and
-- nothing ever gave the room back. The failure mode is not exotic — it is
-- the ordinary one:
--
--     student books  →  room reserved  →  student never returns
--                    →  admin never confirms  →  room dead forever
--
-- One abandoned tab took a room off the market permanently. On a campus
-- with a few hundred beds and a two-week intake, that is the whole
-- inventory going quiet.
--
-- Two clocks, both configurable in platform_settings (014):
--
--   pending    → expires after booking_reservation_minutes (default 30).
--                Long enough to finish the form and think, short enough
--                that a room comes back the same hour.
--   confirmed  → expires after payment_window_hours (default 48). The
--                team has confirmed the room is really free; the student
--                gets two days to pay before it is offered to someone else.
--
-- A settled payment clears expires_at (see record_gateway_charge, 014).
-- A paid booking has no clock.
--
-- expire_stale_bookings() is the sweeper. It is written to be safe to run
-- every minute, concurrently with itself: it takes rooms under the same
-- lock ordering as create_booking and never touches a booking a payment
-- has settled.

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ;

-- Partial: the sweeper only ever looks at bookings that hold a room.
CREATE INDEX IF NOT EXISTS idx_bookings_expiring
    ON bookings(expires_at)
    WHERE expires_at IS NOT NULL
      AND deleted_at IS NULL
      AND status IN ('pending', 'confirmed');

-- Existing pending/confirmed rows have no clock. Give them one from now
-- rather than from their creation date, so applying this migration does
-- not cancel a queue of live bookings in its first sweep.
UPDATE bookings b
SET expires_at = NOW() + (
        CASE b.status
            WHEN 'pending' THEN (SELECT booking_reservation_minutes FROM platform_settings WHERE id) * INTERVAL '1 minute'
            ELSE (SELECT payment_window_hours FROM platform_settings WHERE id) * INTERVAL '1 hour'
        END
    )
WHERE b.expires_at IS NULL
  AND b.deleted_at IS NULL
  AND b.status IN ('pending', 'confirmed')
  AND NOT EXISTS (
      SELECT 1 FROM payments p WHERE p.booking_id = b.id AND p.settles_booking
  );

-- ============================================================
-- 1. create_booking: stamp the reservation clock
-- ============================================================
-- Identical to 013 except for expires_at and the queued notification —
-- the tenancy is still a derived year and the total is still read from
-- the room, so neither can be set by the client.

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
    v_hold_minutes INTEGER;
BEGIN
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;

    IF p_check_in_date IS NULL THEN
        RAISE EXCEPTION 'INVALID_DATES';
    END IF;

    IF p_check_in_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'CHECK_IN_PAST';
    END IF;

    -- A move-in date years out is not a booking, it is a room taken off
    -- the market by someone who will not turn up.
    IF p_check_in_date > CURRENT_DATE + INTERVAL '1 year' THEN
        RAISE EXCEPTION 'CHECK_IN_TOO_FAR';
    END IF;

    v_check_out_date := p_check_in_date + INTERVAL '1 year';

    SELECT booking_reservation_minutes INTO v_hold_minutes
    FROM platform_settings WHERE id;

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
        currency, special_requests, expires_at
    ) VALUES (
        v_student_id, p_room_id, p_property_id, 'pending',
        p_check_in_date, v_check_out_date, 12,
        v_room.annual_rent, v_room.agency_fee, v_room.caution_fee,
        v_room.annual_rent + v_room.agency_fee + v_room.caution_fee,
        v_room.currency, NULLIF(TRIM(p_special_requests), ''),
        NOW() + (COALESCE(v_hold_minutes, 30) * INTERVAL '1 minute')
    )
    RETURNING * INTO v_booking;

    UPDATE rooms
    SET status = 'reserved', is_available = FALSE
    WHERE id = p_room_id;

    PERFORM public.enqueue_notification(
        'booking', 'received', 'booking', v_booking.id, '{}'::jsonb
    );

    RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking(UUID, UUID, DATE, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_booking(UUID, UUID, DATE, TEXT) TO authenticated;

-- ============================================================
-- 2. admin_update_booking_status: move the clock on confirm
-- ============================================================
-- Confirming does not just change a status: it starts the payment window
-- and tells the student. Completing or cancelling stops the clock.

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
    v_window INTEGER;
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

    SELECT payment_window_hours INTO v_window FROM platform_settings WHERE id;

    PERFORM 1 FROM rooms WHERE id = v_booking.room_id FOR UPDATE;

    IF p_action = 'confirm' THEN
        IF v_booking.status <> 'pending' THEN
            RAISE EXCEPTION 'INVALID_TRANSITION';
        END IF;

        UPDATE bookings
        SET status = 'confirmed',
            expires_at = NOW() + (COALESCE(v_window, 48) * INTERVAL '1 hour')
        WHERE id = p_booking_id
        RETURNING * INTO v_booking;

        UPDATE rooms SET status = 'occupied', is_available = FALSE WHERE id = v_booking.room_id;

        PERFORM public.enqueue_notification(
            'booking', 'confirmed', 'booking', p_booking_id, '{}'::jsonb
        );

    ELSIF p_action = 'complete' THEN
        IF v_booking.status <> 'confirmed' THEN
            RAISE EXCEPTION 'INVALID_TRANSITION';
        END IF;

        UPDATE bookings SET status = 'completed', expires_at = NULL
        WHERE id = p_booking_id RETURNING * INTO v_booking;

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

        UPDATE bookings SET status = 'cancelled', expires_at = NULL
        WHERE id = p_booking_id RETURNING * INTO v_booking;

        UPDATE payment_intents SET status = 'cancelled', updated_at = NOW()
        WHERE booking_id = p_booking_id AND status = 'active';

        IF NOT EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.room_id = v_booking.room_id AND b.deleted_at IS NULL
              AND b.status IN ('pending', 'confirmed')
        ) THEN
            UPDATE rooms SET status = 'available', is_available = TRUE
            WHERE id = v_booking.room_id AND status IN ('reserved', 'occupied');
        END IF;

        PERFORM public.enqueue_notification(
            'booking', 'cancelled', 'booking', p_booking_id, '{}'::jsonb
        );

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

-- ============================================================
-- 3. THE SWEEPER
-- ============================================================
-- Cancels bookings whose window has closed and hands their rooms back.
-- Bounded per call so a backlog cannot turn one cron tick into a
-- long-running transaction holding room locks.

CREATE OR REPLACE FUNCTION public.expire_stale_bookings(p_limit INTEGER DEFAULT 200)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking bookings%ROWTYPE;
    v_expired INTEGER := 0;
    v_rooms_freed INTEGER := 0;
    v_ids UUID[] := '{}';
BEGIN
    FOR v_booking IN
        SELECT * FROM bookings b
        WHERE b.deleted_at IS NULL
          AND b.status IN ('pending', 'confirmed')
          AND b.expires_at IS NOT NULL
          AND b.expires_at <= NOW()
        ORDER BY b.expires_at
        LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 200), 1000))
        FOR UPDATE SKIP LOCKED
    LOOP
        -- Belt and braces: a payment may have settled between the scan
        -- and the lock. Money always wins over a clock.
        IF EXISTS (
            SELECT 1 FROM payments p
            WHERE p.booking_id = v_booking.id AND p.settles_booking
        ) THEN
            UPDATE bookings SET expires_at = NULL WHERE id = v_booking.id;
            CONTINUE;
        END IF;

        UPDATE bookings
        SET status = 'cancelled',
            expires_at = NULL,
            expired_at = NOW(),
            admin_notes = CONCAT_WS(
                E'\n', admin_notes,
                'Auto-cancelled at ' || to_char(NOW(), 'YYYY-MM-DD HH24:MI') ||
                ': the reservation window closed before payment.'
            )
        WHERE id = v_booking.id;

        UPDATE payment_intents SET status = 'expired', updated_at = NOW()
        WHERE booking_id = v_booking.id AND status = 'active';

        PERFORM 1 FROM rooms WHERE id = v_booking.room_id FOR UPDATE;

        IF NOT EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.room_id = v_booking.room_id
              AND b.deleted_at IS NULL
              AND b.status IN ('pending', 'confirmed')
        ) THEN
            UPDATE rooms
            SET status = 'available', is_available = TRUE
            WHERE id = v_booking.room_id AND status IN ('reserved', 'occupied');

            IF FOUND THEN
                v_rooms_freed := v_rooms_freed + 1;
            END IF;
        END IF;

        INSERT INTO audit_logs (user_id, table_name, record_id, action, old_data, new_data)
        VALUES (
            NULL, 'bookings', v_booking.id::TEXT, 'UPDATE',
            jsonb_build_object('status', v_booking.status),
            jsonb_build_object('status', 'cancelled', 'via', 'expire_stale_bookings')
        );

        PERFORM public.enqueue_notification(
            'booking', 'expired', 'booking', v_booking.id,
            jsonb_build_object('previous_status', v_booking.status)
        );

        v_expired := v_expired + 1;
        v_ids := array_append(v_ids, v_booking.id);
    END LOOP;

    RETURN jsonb_build_object(
        'expired', v_expired,
        'rooms_freed', v_rooms_freed,
        'booking_ids', to_jsonb(v_ids)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_bookings(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_bookings(INTEGER) TO service_role;

-- ============================================================
-- 4. SCHEDULING
-- ============================================================
-- If pg_cron is available (Supabase: Database → Extensions → pg_cron),
-- the sweep runs in the database and needs nothing deployed. If it is
-- not, /api/cron/expire-bookings does the same job from a platform cron
-- — see vercel.json. Running both is harmless: the sweeper is idempotent.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
        CREATE EXTENSION IF NOT EXISTS pg_cron;

        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'schedule'
                     AND pronamespace = 'cron'::regnamespace) THEN
            PERFORM cron.unschedule(jobid)
            FROM cron.job WHERE jobname = 'haloft-expire-bookings';

            PERFORM cron.schedule(
                'haloft-expire-bookings',
                '*/5 * * * *',
                $cron$SELECT public.expire_stale_bookings(500);$cron$
            );
        END IF;
    ELSE
        RAISE NOTICE 'pg_cron not available — schedule /api/cron/expire-bookings instead';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron scheduling skipped: %', SQLERRM;
END $$;
