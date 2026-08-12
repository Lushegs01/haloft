-- ============================================================
-- Functional tests for the money, booking and verification paths
-- ============================================================
-- Run against a database that has 00_supabase_stub.sql plus every
-- migration applied — `bash scripts/verify-migrations.sh` does both.
--
-- Every check is an assertion that raises. A clean run prints its
-- progress and ends with ALL TESTS PASSED; a failure stops on the line
-- that broke, naming what it expected.

\set ON_ERROR_STOP on
SET client_min_messages = WARNING;

CREATE OR REPLACE FUNCTION pg_temp.assert(p_condition BOOLEAN, p_what TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    IF p_condition IS NOT TRUE THEN
        RAISE EXCEPTION 'ASSERTION FAILED: %', p_what;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.assert_eq(p_a ANYELEMENT, p_b ANYELEMENT, p_what TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    IF p_a IS DISTINCT FROM p_b THEN
        RAISE EXCEPTION 'ASSERTION FAILED: % (got %, expected %)', p_what, p_a, p_b;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.sign_in(p_user UUID)
RETURNS VOID LANGUAGE sql AS $$
    SELECT set_config('request.jwt.claim.sub', COALESCE(p_user::TEXT, ''), FALSE);
$$;

CREATE OR REPLACE FUNCTION pg_temp.sign_out() RETURNS VOID LANGUAGE sql AS $$
    SELECT set_config('request.jwt.claim.sub', '', FALSE);
$$;

-- ── Fixtures ────────────────────────────────────────────────

DO $$
DECLARE
    v_campus UUID := '550e8400-e29b-41d4-a716-446655440002';
    v_hood UUID := '550e8400-e29b-41d4-a716-446655440003';
    v_landlord UUID;
    v_student UUID := '11111111-1111-1111-1111-111111111111';
    v_admin UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
    INSERT INTO auth.users (id, email) VALUES
        (v_student, 'student@test.local'),
        (v_admin, 'admin@test.local')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO profiles (id, role, full_name, email) VALUES
        (v_student, 'student', 'Test Student', 'student@test.local'),
        (v_admin, 'super_admin', 'Test Admin', 'admin@test.local')
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

    INSERT INTO admin_campus_assignments (admin_id, campus_id)
    VALUES (v_admin, v_campus) ON CONFLICT DO NOTHING;

    INSERT INTO landlords (id, full_name, verification_state, is_verified)
    VALUES ('33333333-3333-3333-3333-333333333333', 'Test Landlord', 'approved', TRUE)
    ON CONFLICT (id) DO UPDATE SET verification_state = 'approved';

    INSERT INTO properties (
        id, campus_id, neighbourhood_id, landlord_id, title, slug, address,
        property_type, status, verification_state, letting_mode, currency, commission_bps
    ) VALUES (
        '44444444-4444-4444-4444-444444444444', v_campus, v_hood,
        '33333333-3333-3333-3333-333333333333',
        'Test Hostel', 'test-hostel', '1 Test Road', 'hostel', 'published',
        'verified', 'rooms', 'NGN', 1000  -- 10% commission
    ) ON CONFLICT (id) DO UPDATE SET status = 'published', verification_state = 'verified';

    -- Three identical rooms: one per payment scenario.
    INSERT INTO rooms (id, property_id, name, room_type, max_occupancy,
                       annual_rent, agency_fee, caution_fee, currency, status, is_available)
    VALUES
        ('55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444444',
         'Room A', 'single', 1, 400000, 50000, 50000, 'NGN', 'available', TRUE),
        ('55555555-5555-5555-5555-555555555552', '44444444-4444-4444-4444-444444444444',
         'Room B', 'single', 1, 400000, 50000, 50000, 'NGN', 'available', TRUE),
        ('55555555-5555-5555-5555-555555555553', '44444444-4444-4444-4444-444444444444',
         'Room C', 'single', 1, 400000, 50000, 50000, 'NGN', 'available', TRUE),
        ('55555555-5555-5555-5555-555555555554', '44444444-4444-4444-4444-444444444444',
         'Room D', 'single', 1, 400000, 50000, 50000, 'NGN', 'available', TRUE)
    ON CONFLICT (id) DO UPDATE SET status = 'available', is_available = TRUE;

    RAISE NOTICE 'fixtures ready (booking total = 500,000)';
END $$;

-- ============================================================
-- 1. create_booking stamps a reservation window
-- ============================================================

DO $$
DECLARE
    v_booking bookings%ROWTYPE;
    v_room rooms%ROWTYPE;
BEGIN
    PERFORM pg_temp.sign_in('11111111-1111-1111-1111-111111111111');

    v_booking := public.create_booking(
        '55555555-5555-5555-5555-555555555551',
        '44444444-4444-4444-4444-444444444444',
        CURRENT_DATE + 7,
        'ground floor please'
    );

    PERFORM pg_temp.assert_eq(v_booking.total_amount, 500000::DECIMAL, 'booking total is rent + fees');
    PERFORM pg_temp.assert(v_booking.expires_at IS NOT NULL, 'pending booking carries an expiry');
    PERFORM pg_temp.assert(
        v_booking.expires_at BETWEEN NOW() + INTERVAL '25 minutes' AND NOW() + INTERVAL '35 minutes',
        'expiry is the configured 30-minute hold'
    );
    PERFORM pg_temp.assert_eq(v_booking.check_out_date, (CURRENT_DATE + 7 + INTERVAL '1 year')::DATE,
        'tenancy is exactly one year');

    SELECT * INTO v_room FROM rooms WHERE id = '55555555-5555-5555-5555-555555555551';
    PERFORM pg_temp.assert_eq(v_room.status, 'reserved', 'room is reserved');

    PERFORM pg_temp.assert(
        EXISTS (SELECT 1 FROM notification_outbox
                WHERE subject_id = v_booking.id AND event = 'received' AND status = 'pending'),
        'a "received" email is queued, not sent inline'
    );

    RAISE NOTICE '  1. create_booking: reservation window + queued email  OK';
END $$;

-- ============================================================
-- 2. Exact payment settles, and decomposes into a balanced ledger
-- ============================================================

DO $$
DECLARE
    v_booking_id UUID;
    v_result JSONB;
    v_payment payments%ROWTYPE;
    v_imbalance DECIMAL;
BEGIN
    SELECT id INTO v_booking_id FROM bookings
    WHERE room_id = '55555555-5555-5555-5555-555555555551';

    PERFORM pg_temp.sign_in('22222222-2222-2222-2222-222222222222');
    PERFORM public.admin_update_booking_status(v_booking_id, 'confirm');
    PERFORM pg_temp.sign_out();

    -- 500,000 naira = 50,000,000 kobo. Paystack fee 7,500 naira.
    v_result := public.record_gateway_charge(
        'paystack', 'HLF-EXACT-1', v_booking_id, 50000000, 'NGN', 'card', NOW(), 750000
    );

    PERFORM pg_temp.assert_eq(v_result->>'outcome', 'recorded', 'charge recorded');
    PERFORM pg_temp.assert_eq(v_result->>'status', 'success', 'exact charge is a success');
    PERFORM pg_temp.assert_eq((v_result->>'settles_booking')::BOOLEAN, TRUE, 'exact charge settles the booking');
    PERFORM pg_temp.assert(v_result->>'anomaly' IS NULL, 'no anomaly on an exact charge');

    SELECT * INTO v_payment FROM payments WHERE transaction_reference = 'HLF-EXACT-1';
    PERFORM pg_temp.assert_eq(v_payment.amount, 500000::DECIMAL, 'payment amount in naira');
    PERFORM pg_temp.assert_eq(v_payment.gateway_fee, 7500::DECIMAL, 'gateway fee in naira');
    PERFORM pg_temp.assert_eq(v_payment.reconciliation_status, 'not_required', 'nothing to reconcile');

    -- 10% commission on 500,000 = 50,000 → landlord 450,000
    PERFORM pg_temp.assert_eq(
        (SELECT -SUM(signed_amount) FROM ledger_entries
         WHERE payment_id = v_payment.id AND entry_type = 'landlord_payable'),
        450000::DECIMAL, 'landlord accrues 90% of the booking'
    );
    -- commission = 50,000 − 7,500 gateway fee = 42,500
    PERFORM pg_temp.assert_eq(
        (SELECT -SUM(signed_amount) FROM ledger_entries
         WHERE payment_id = v_payment.id AND entry_type = 'platform_commission'),
        42500::DECIMAL, 'commission is the platform share less the gateway fee'
    );

    SELECT COALESCE(SUM(signed_amount), 0) INTO v_imbalance
    FROM ledger_entries WHERE payment_id = v_payment.id;
    PERFORM pg_temp.assert_eq(v_imbalance, 0::DECIMAL, 'the payment ledger balances');

    PERFORM pg_temp.assert(
        EXISTS (SELECT 1 FROM notification_outbox
                WHERE subject_id = v_booking_id AND event = 'paid'),
        'the paid email is queued'
    );
    PERFORM pg_temp.assert(
        (SELECT expires_at FROM bookings WHERE id = v_booking_id) IS NULL,
        'a paid booking has no expiry clock'
    );

    RAISE NOTICE '  2. exact payment: settles + balanced ledger  OK';
END $$;

-- ============================================================
-- 3. Replaying the same reference is a no-op
-- ============================================================

DO $$
DECLARE
    v_booking_id UUID;
    v_result JSONB;
    v_count INTEGER;
BEGIN
    SELECT id INTO v_booking_id FROM bookings WHERE room_id = '55555555-5555-5555-5555-555555555551';

    v_result := public.record_gateway_charge(
        'paystack', 'HLF-EXACT-1', v_booking_id, 50000000, 'NGN', 'card', NOW(), 750000
    );

    PERFORM pg_temp.assert_eq(v_result->>'outcome', 'already_recorded',
        'the webhook and the callback reporting the same charge write once');

    SELECT COUNT(*) INTO v_count FROM payments WHERE transaction_reference = 'HLF-EXACT-1';
    PERFORM pg_temp.assert_eq(v_count, 1, 'exactly one row for one reference');

    SELECT COUNT(*) INTO v_count FROM ledger_entries WHERE reference = 'HLF-EXACT-1';
    PERFORM pg_temp.assert(v_count <= 5, 'the replay wrote no extra ledger entries');

    RAISE NOTICE '  3. idempotent replay  OK';
END $$;

-- ============================================================
-- 4. A DUPLICATE payment is recorded and queued for refund
-- ============================================================
-- The old code caught the unique violation, logged "paid twice" and
-- returned ok. The money existed at Paystack and nowhere else.

DO $$
DECLARE
    v_booking_id UUID;
    v_result JSONB;
    v_payment payments%ROWTYPE;
BEGIN
    SELECT id INTO v_booking_id FROM bookings WHERE room_id = '55555555-5555-5555-5555-555555555551';

    v_result := public.record_gateway_charge(
        'paystack', 'HLF-DUPLICATE-1', v_booking_id, 50000000, 'NGN', 'card', NOW(), 750000
    );

    PERFORM pg_temp.assert_eq(v_result->>'outcome', 'recorded', 'the second charge IS recorded');
    PERFORM pg_temp.assert_eq(v_result->>'status', 'duplicate', 'and marked a duplicate');
    PERFORM pg_temp.assert_eq((v_result->>'settles_booking')::BOOLEAN, FALSE, 'it does not settle anything');
    PERFORM pg_temp.assert_eq(v_result->>'reconciliation_status', 'pending_refund', 'it lands in the refund queue');

    SELECT * INTO v_payment FROM payments WHERE transaction_reference = 'HLF-DUPLICATE-1';
    PERFORM pg_temp.assert_eq(
        (SELECT -SUM(signed_amount) FROM ledger_entries
         WHERE payment_id = v_payment.id AND entry_type = 'refund_due'),
        500000::DECIMAL, 'the whole duplicate is owed back'
    );
    PERFORM pg_temp.assert_eq(
        (SELECT COALESCE(SUM(signed_amount), 0) FROM ledger_entries WHERE payment_id = v_payment.id),
        0::DECIMAL, 'the duplicate ledger balances'
    );
    -- The platform is out the gateway fee on money it must return.
    PERFORM pg_temp.assert_eq(
        (SELECT -SUM(signed_amount) FROM ledger_entries
         WHERE payment_id = v_payment.id AND entry_type = 'platform_commission'),
        -7500::DECIMAL, 'the gateway fee on a returned charge is a loss'
    );
    PERFORM pg_temp.assert(
        EXISTS (SELECT 1 FROM payment_reconciliation_queue WHERE payment_id = v_payment.id),
        'it appears in the finance queue'
    );

    RAISE NOTICE '  4. duplicate payment: recorded, owed back, queued  OK';
END $$;

-- ============================================================
-- 5. OVERPAYMENT settles the booking and books the surplus back
-- ============================================================

DO $$
DECLARE
    v_booking bookings%ROWTYPE;
    v_result JSONB;
    v_payment payments%ROWTYPE;
BEGIN
    PERFORM pg_temp.sign_in('11111111-1111-1111-1111-111111111111');
    v_booking := public.create_booking(
        '55555555-5555-5555-5555-555555555552', '44444444-4444-4444-4444-444444444444',
        CURRENT_DATE + 7, NULL
    );
    PERFORM pg_temp.sign_in('22222222-2222-2222-2222-222222222222');
    PERFORM public.admin_update_booking_status(v_booking.id, 'confirm');
    PERFORM pg_temp.sign_out();

    -- 550,000 paid against a 500,000 booking: the review's exact case.
    v_result := public.record_gateway_charge(
        'paystack', 'HLF-OVER-1', v_booking.id, 55000000, 'NGN', 'card', NOW(), 750000
    );

    PERFORM pg_temp.assert_eq(v_result->>'status', 'overpaid', 'an overpayment is not a plain success');
    PERFORM pg_temp.assert_eq((v_result->>'settles_booking')::BOOLEAN, TRUE, 'the booking is covered');
    PERFORM pg_temp.assert_eq((v_result->>'surplus')::DECIMAL, 50000::DECIMAL, 'the surplus is measured');
    PERFORM pg_temp.assert_eq(v_result->>'reconciliation_status', 'pending_refund', 'the surplus is queued for refund');

    SELECT * INTO v_payment FROM payments WHERE transaction_reference = 'HLF-OVER-1';
    PERFORM pg_temp.assert_eq(
        (SELECT -SUM(signed_amount) FROM ledger_entries
         WHERE payment_id = v_payment.id AND entry_type = 'refund_due'),
        50000::DECIMAL, 'exactly the surplus is owed back'
    );
    -- The landlord accrues on the booking, never on the surplus.
    PERFORM pg_temp.assert_eq(
        (SELECT -SUM(signed_amount) FROM ledger_entries
         WHERE payment_id = v_payment.id AND entry_type = 'landlord_payable'),
        450000::DECIMAL, 'the landlord accrues on the booking, not the overpayment'
    );
    PERFORM pg_temp.assert_eq(
        (SELECT COALESCE(SUM(signed_amount), 0) FROM ledger_entries WHERE payment_id = v_payment.id),
        0::DECIMAL, 'the overpayment ledger balances'
    );

    RAISE NOTICE '  5. overpayment: settled, surplus owed back  OK';
END $$;

-- ============================================================
-- 6. UNDERPAYMENT is recorded and does NOT settle
-- ============================================================

DO $$
DECLARE
    v_booking bookings%ROWTYPE;
    v_result JSONB;
BEGIN
    PERFORM pg_temp.sign_in('11111111-1111-1111-1111-111111111111');
    v_booking := public.create_booking(
        '55555555-5555-5555-5555-555555555553', '44444444-4444-4444-4444-444444444444',
        CURRENT_DATE + 7, NULL
    );
    PERFORM pg_temp.sign_in('22222222-2222-2222-2222-222222222222');
    PERFORM public.admin_update_booking_status(v_booking.id, 'confirm');
    PERFORM pg_temp.sign_out();

    v_result := public.record_gateway_charge(
        'paystack', 'HLF-UNDER-1', v_booking.id, 40000000, 'NGN', 'card', NOW(), 600000
    );

    PERFORM pg_temp.assert_eq(v_result->>'status', 'underpaid', 'a short charge is recorded as short');
    PERFORM pg_temp.assert_eq((v_result->>'settles_booking')::BOOLEAN, FALSE, 'and does not settle the booking');
    PERFORM pg_temp.assert_eq((v_result->>'shortfall')::DECIMAL, 100000::DECIMAL, 'the shortfall is measured');
    PERFORM pg_temp.assert(
        (SELECT expires_at FROM bookings WHERE id = v_booking.id) IS NOT NULL,
        'an unsettled booking keeps its payment clock'
    );

    RAISE NOTICE '  6. underpayment: recorded, unsettled, queued  OK';
END $$;

-- ============================================================
-- 7. A charge that names no booking is parked, not dropped
-- ============================================================

DO $$
DECLARE
    v_result JSONB;
BEGIN
    v_result := public.record_gateway_charge(
        'paystack', 'HLF-ORPHAN-1', NULL, 50000000, 'NGN', 'card', NOW(), 750000
    );

    PERFORM pg_temp.assert_eq(v_result->>'outcome', 'unattributable', 'it cannot be attached');
    PERFORM pg_temp.assert(
        EXISTS (SELECT 1 FROM payment_exceptions
                WHERE reference = 'HLF-ORPHAN-1' AND reason = 'missing_metadata'),
        'but it is on the books as an exception'
    );

    v_result := public.record_gateway_charge(
        'paystack', 'HLF-ORPHAN-2', '99999999-9999-9999-9999-999999999999',
        50000000, 'NGN', 'card', NOW(), 0
    );
    PERFORM pg_temp.assert(
        EXISTS (SELECT 1 FROM payment_exceptions
                WHERE reference = 'HLF-ORPHAN-2' AND reason = 'booking_not_found'),
        'an unknown booking id is an exception too'
    );

    RAISE NOTICE '  7. unattributable charges parked  OK';
END $$;

-- ============================================================
-- 8. Refunding clears the obligation and keeps the ledger square
-- ============================================================

DO $$
DECLARE
    v_payment payments%ROWTYPE;
    v_result JSONB;
BEGIN
    PERFORM pg_temp.sign_in('22222222-2222-2222-2222-222222222222');

    SELECT * INTO v_payment FROM payments WHERE transaction_reference = 'HLF-OVER-1';
    v_result := public.record_refund(v_payment.id, 50000, 'RFND-1', 'surplus returned');

    PERFORM pg_temp.assert_eq(v_result->>'status', 'partially_refunded',
        'refunding only the surplus leaves the booking paid');
    PERFORM pg_temp.assert_eq((v_result->>'settles_booking')::BOOLEAN, TRUE,
        'the booking stays settled');

    PERFORM pg_temp.assert_eq(
        (SELECT -SUM(signed_amount) FROM ledger_entries
         WHERE payment_id = v_payment.id AND entry_type = 'refund_due'),
        0::DECIMAL, 'nothing is owed back any more'
    );
    PERFORM pg_temp.assert_eq(
        (SELECT COALESCE(SUM(signed_amount), 0) FROM ledger_entries WHERE payment_id = v_payment.id),
        0::DECIMAL, 'the ledger still balances after the refund'
    );

    -- Refunding a duplicate in full releases it entirely.
    SELECT * INTO v_payment FROM payments WHERE transaction_reference = 'HLF-DUPLICATE-1';
    v_result := public.record_refund(v_payment.id, 500000, 'RFND-2', 'duplicate returned');
    PERFORM pg_temp.assert_eq(v_result->>'status', 'refunded', 'a full refund is a refund');
    PERFORM pg_temp.assert_eq(
        (SELECT reconciliation_status FROM payments WHERE id = v_payment.id),
        'refund_issued', 'and it leaves the queue'
    );

    PERFORM pg_temp.sign_out();
    RAISE NOTICE '  8. refunds: obligation discharged, ledger square  OK';
END $$;

-- ============================================================
-- 9. Landlord payouts draw down the payable
-- ============================================================

DO $$
DECLARE
    v_booking_id UUID;
    v_result JSONB;
BEGIN
    PERFORM pg_temp.sign_in('22222222-2222-2222-2222-222222222222');
    SELECT id INTO v_booking_id FROM bookings WHERE room_id = '55555555-5555-5555-5555-555555555551';

    v_result := public.record_landlord_payout(v_booking_id, 450000, 'PAYOUT-1', 'first payout');
    PERFORM pg_temp.assert_eq((v_result->>'remaining_payable')::DECIMAL, 0::DECIMAL,
        'the payable is drawn down to zero');

    BEGIN
        PERFORM public.record_landlord_payout(v_booking_id, 1, 'PAYOUT-2', 'overdraw');
        RAISE EXCEPTION 'ASSERTION FAILED: paying out more than is owed should be refused';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM NOT LIKE '%PAYOUT_EXCEEDS_PAYABLE%' THEN RAISE; END IF;
    END;

    PERFORM pg_temp.sign_out();
    RAISE NOTICE '  9. landlord payouts bounded by the payable  OK';
END $$;

-- ============================================================
-- 10. Stale bookings expire and give the room back
-- ============================================================

DO $$
DECLARE
    v_booking bookings%ROWTYPE;
    v_result JSONB;
    v_room rooms%ROWTYPE;
BEGIN
    PERFORM pg_temp.sign_in('11111111-1111-1111-1111-111111111111');
    v_booking := public.create_booking(
        '55555555-5555-5555-5555-555555555554', '44444444-4444-4444-4444-444444444444',
        CURRENT_DATE + 7, NULL
    );
    PERFORM pg_temp.sign_out();

    -- Wind the clock back rather than waiting thirty minutes.
    UPDATE bookings SET expires_at = NOW() - INTERVAL '1 minute' WHERE id = v_booking.id;

    v_result := public.expire_stale_bookings(50);
    PERFORM pg_temp.assert((v_result->>'expired')::INTEGER >= 1, 'the stale booking expired');

    SELECT * INTO v_room FROM rooms WHERE id = '55555555-5555-5555-5555-555555555554';
    PERFORM pg_temp.assert_eq(v_room.status, 'available', 'the room went back on the market');
    PERFORM pg_temp.assert_eq(v_room.is_available, TRUE, 'and is bookable again');
    PERFORM pg_temp.assert_eq(
        (SELECT status FROM bookings WHERE id = v_booking.id), 'cancelled',
        'the abandoned booking is cancelled'
    );

    -- A settled booking must never be swept, whatever its clock says.
    UPDATE bookings SET expires_at = NOW() - INTERVAL '1 day', status = 'confirmed'
    WHERE room_id = '55555555-5555-5555-5555-555555555551';
    PERFORM public.expire_stale_bookings(50);
    PERFORM pg_temp.assert_eq(
        (SELECT status FROM bookings WHERE room_id = '55555555-5555-5555-5555-555555555551'),
        'confirmed', 'a paid booking survives the sweeper'
    );

    RAISE NOTICE ' 10. expiry: room released, paid bookings untouched  OK';
END $$;

-- ============================================================
-- 11. Publishing requires verification
-- ============================================================

DO $$
DECLARE
    v_prop UUID := '66666666-6666-6666-6666-666666666666';
BEGIN
    INSERT INTO properties (id, campus_id, neighbourhood_id, title, slug, address,
                            property_type, status, verification_state)
    VALUES (v_prop, '550e8400-e29b-41d4-a716-446655440002',
            '550e8400-e29b-41d4-a716-446655440003', 'Unverified Place', 'unverified-place',
            '2 Test Road', 'hostel', 'draft', 'draft')
    ON CONFLICT (id) DO UPDATE SET status = 'draft', verification_state = 'draft';

    PERFORM pg_temp.sign_in('22222222-2222-2222-2222-222222222222');

    BEGIN
        UPDATE properties SET status = 'published' WHERE id = v_prop;
        RAISE EXCEPTION 'ASSERTION FAILED: an unverified property must not publish';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM NOT LIKE '%PROPERTY_NOT_VERIFIED%' THEN RAISE; END IF;
    END;

    -- Walk it through the machine.
    PERFORM public.set_property_verification_state(v_prop, 'submitted');
    PERFORM public.set_property_verification_state(v_prop, 'under_review');

    BEGIN
        PERFORM public.set_property_verification_state(v_prop, 'archived');
        PERFORM public.set_property_verification_state(v_prop, 'verified');
        RAISE EXCEPTION 'ASSERTION FAILED: archived → verified is not a legal move';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM NOT LIKE '%INVALID_VERIFICATION_TRANSITION%' THEN RAISE; END IF;
    END;

    PERFORM public.set_property_verification_state(v_prop, 'draft');
    PERFORM public.set_property_verification_state(v_prop, 'submitted');
    PERFORM public.set_property_verification_state(v_prop, 'under_review');
    PERFORM public.set_property_verification_state(v_prop, 'verified', 'visited 12 Aug');

    PERFORM pg_temp.assert_eq(
        (SELECT is_verified FROM properties WHERE id = v_prop), TRUE,
        'is_verified is derived from the state, not set by hand'
    );

    UPDATE properties SET status = 'published' WHERE id = v_prop;
    PERFORM pg_temp.assert_eq(
        (SELECT status FROM properties WHERE id = v_prop), 'published',
        'a verified property publishes'
    );

    -- Suspending the landlord pulls the listing down.
    PERFORM public.set_landlord_verification_state(
        '33333333-3333-3333-3333-333333333333', 'suspended', 'documents lapsed'
    );
    PERFORM pg_temp.assert_eq(
        (SELECT status FROM properties WHERE id = '44444444-4444-4444-4444-444444444444'),
        'unpublished', 'suspending a landlord unpublishes their listings'
    );

    -- Suspending the property unpublishes it too.
    PERFORM public.set_property_verification_state(v_prop, 'suspended', 'complaint received');
    PERFORM pg_temp.assert_eq(
        (SELECT status FROM properties WHERE id = v_prop), 'unpublished',
        'losing verification takes the listing off the site'
    );

    PERFORM pg_temp.sign_out();
    RAISE NOTICE ' 11. verification state machine  OK';
END $$;

-- ============================================================
-- 12. One cover photo, always
-- ============================================================

DO $$
DECLARE
    v_a UUID := '77777777-7777-7777-7777-777777777771';
    v_b UUID := '77777777-7777-7777-7777-777777777772';
    v_prop UUID := '44444444-4444-4444-4444-444444444444';
BEGIN
    INSERT INTO media (id, entity_type, entity_id, url, storage_path, mime_type, file_size, display_order, is_featured)
    VALUES
        (v_a, 'property', v_prop, 'https://x/a.jpg', 'property/' || v_prop || '/a.jpg', 'image/jpeg', 1000, 0, TRUE),
        (v_b, 'property', v_prop, 'https://x/b.jpg', 'property/' || v_prop || '/b.jpg', 'image/jpeg', 1000, 1, FALSE)
    ON CONFLICT (id) DO NOTHING;

    -- The index makes two covers unrepresentable.
    BEGIN
        UPDATE media SET is_featured = TRUE WHERE id = v_b;
        RAISE EXCEPTION 'ASSERTION FAILED: two covers should be impossible';
    EXCEPTION WHEN unique_violation THEN
        NULL;
    END;

    PERFORM pg_temp.sign_in('22222222-2222-2222-2222-222222222222');
    PERFORM public.set_featured_media(v_b);

    PERFORM pg_temp.assert_eq(
        (SELECT COUNT(*)::INTEGER FROM media
         WHERE entity_type = 'property' AND entity_id = v_prop AND is_featured AND deleted_at IS NULL),
        1, 'exactly one cover after the swap'
    );
    PERFORM pg_temp.assert_eq(
        (SELECT is_featured FROM media WHERE id = v_b), TRUE, 'the chosen photo is the cover'
    );

    PERFORM pg_temp.sign_out();
    RAISE NOTICE ' 12. one cover photo, set atomically  OK';
END $$;

-- ============================================================
-- 13. Payment intents are reused, not stacked
-- ============================================================

DO $$
DECLARE
    v_booking bookings%ROWTYPE;
    v_first payment_intents%ROWTYPE;
    v_second payment_intents%ROWTYPE;
BEGIN
    -- Test 11 suspended the landlord, which correctly unpublished this
    -- property. Reinstate them — which also exercises the way back.
    PERFORM pg_temp.sign_in('22222222-2222-2222-2222-222222222222');
    PERFORM public.set_landlord_verification_state(
        '33333333-3333-3333-3333-333333333333', 'approved', 'documents renewed'
    );
    UPDATE properties SET status = 'published' WHERE id = '44444444-4444-4444-4444-444444444444';
    PERFORM pg_temp.assert_eq(
        (SELECT status FROM properties WHERE id = '44444444-4444-4444-4444-444444444444'),
        'published', 'an approved landlord can be published again'
    );

    PERFORM pg_temp.sign_in('11111111-1111-1111-1111-111111111111');
    v_booking := public.create_booking(
        '55555555-5555-5555-5555-555555555554', '44444444-4444-4444-4444-444444444444',
        CURRENT_DATE + 30, NULL
    );
    PERFORM pg_temp.sign_in('22222222-2222-2222-2222-222222222222');
    PERFORM public.admin_update_booking_status(v_booking.id, 'confirm');

    PERFORM pg_temp.sign_in('11111111-1111-1111-1111-111111111111');
    v_first := public.create_payment_intent(v_booking.id, 'HLF-INTENT-A');
    v_second := public.create_payment_intent(v_booking.id, 'HLF-INTENT-B');

    PERFORM pg_temp.assert_eq(v_second.reference, v_first.reference,
        'a second checkout attempt reuses the live reference');
    PERFORM pg_temp.assert_eq(v_second.attempt_count, 2, 'attempts are counted');
    PERFORM pg_temp.assert_eq(
        (SELECT COUNT(*)::INTEGER FROM payment_intents WHERE booking_id = v_booking.id),
        1, 'one booking, one intent'
    );

    -- Another student cannot start a checkout for this booking.
    PERFORM pg_temp.sign_in('22222222-2222-2222-2222-222222222222');
    BEGIN
        PERFORM public.create_payment_intent(v_booking.id, 'HLF-INTENT-C');
        RAISE EXCEPTION 'ASSERTION FAILED: only the booking owner may start a checkout';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM NOT LIKE '%BOOKING_NOT_FOUND%' THEN RAISE; END IF;
    END;

    PERFORM pg_temp.sign_out();
    RAISE NOTICE ' 13. payment intents reused, owner-scoped  OK';
END $$;

-- ============================================================
-- 14. Nothing anywhere is out of balance
-- ============================================================

DO $$
DECLARE
    v_bad INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO v_bad FROM ledger_imbalances;
    PERFORM pg_temp.assert_eq(v_bad, 0, 'no payment has an unbalanced ledger');

    -- Every settling payment is unique per booking.
    SELECT COUNT(*)::INTEGER INTO v_bad FROM (
        SELECT booking_id FROM payments WHERE settles_booking
        GROUP BY booking_id HAVING COUNT(*) > 1
    ) x;
    PERFORM pg_temp.assert_eq(v_bad, 0, 'no booking has two settling payments');

    RAISE NOTICE ' 14. global invariants  OK';
END $$;

\echo ''
\echo '  ALL TESTS PASSED'
\echo ''
