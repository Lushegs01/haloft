-- ============================================================
-- 014: PAYMENT LEDGER, INTENTS AND RECONCILIATION
-- Run after 013_annual_pricing.sql. Idempotent.
-- ============================================================
-- Up to now `payments` was the whole financial model, and it recorded
-- only the happy path. Three holes followed from that:
--
--   1. OVERPAYMENT WAS ACCEPTED SILENTLY. The recording path took any
--      charge >= the booking total. A ₦550,000 charge against a ₦500,000
--      booking was written down as a successful ₦500,000-ish payment and
--      nothing said the student was ₦50,000 out of pocket.
--
--   2. A DUPLICATE PAYMENT WAS DISCARDED. The one-success-per-booking
--      index did its job — the database stayed correct — but the second
--      charge was caught, logged to stdout and dropped. Paystack held two
--      payments; Haloft's books held one. The difference existed only in
--      a log line nobody reads.
--
--   3. UNDERPAYMENT AND WRONG-CURRENCY CHARGES WERE REJECTED OUTRIGHT,
--      which sounds safe and is worse: the money still moved at the
--      gateway, and refusing to write a row means the only trace of it is
--      at Paystack.
--
-- The rule now is: every charge the gateway confirms gets a row, always.
-- What differs between them is the STATUS the row carries and whether it
-- SETTLES the booking:
--
--   status                 settles?  what it means
--   ─────────────────────  ────────  ───────────────────────────────────
--   pending                no        initialised, not yet confirmed
--   success                yes       exact amount, exact currency
--   overpaid               yes       covers the booking; surplus owed back
--   underpaid              no        short; held pending review
--   duplicate              no        booking already settled; owed back
--   failed                 no        gateway failure, or wrong currency
--   partially_refunded     yes       settled, part returned
--   refunded               no        returned in full
--
-- and every one of the non-settling anomalies lands in a reconciliation
-- queue with an explicit next step, instead of in a console.
--
-- On top of that this migration adds the two things a marketplace cannot
-- run without once landlords are paid:
--
--   * PAYMENT INTENTS, so repeated checkout attempts against one booking
--     reuse a single reference instead of littering Paystack with
--     abandoned transactions nobody can reconcile later.
--   * A LEDGER, so a charge decomposes into gateway fee, landlord
--     payable, platform commission and refund obligations rather than
--     being one opaque number.
--
-- ── Ledger sign convention ──────────────────────────────────
--
-- Entries are written from the perspective of Haloft's clearing account.
-- `signed_amount` is positive when that account receives money and
-- negative when the money is committed elsewhere. The entries for one
-- payment ALWAYS sum to zero — `platform_commission` is computed as the
-- residual, so the identity holds by construction:
--
--     gateway_charge  +A
--     gateway_fee     −F
--     landlord_payable−L
--     refund_due      −S
--     platform_commission −(A − F − L − S)
--     ────────────────────
--                      0
--
-- To read a category as "what this is owed / what this earned", negate
-- its sum: `-SUM(signed_amount) FILTER (WHERE entry_type = 'landlord_payable')`.
-- A commission that comes out negative is a real loss — that is what a
-- refunded charge looks like once the gateway has kept its fee.
--
-- `ledger_imbalances` (bottom of this file) should always be empty.

-- ============================================================
-- 1. PLATFORM SETTINGS
-- ============================================================
-- One row, enforced by the primary key. Values the finance and booking
-- flows read at runtime, so changing a commission rate or a reservation
-- window is a data change, not a deploy.

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
    platform_commission_bps INTEGER NOT NULL DEFAULT 500
        CHECK (platform_commission_bps BETWEEN 0 AND 10000),
    -- How long a pending booking holds a room before it is released (015)
    booking_reservation_minutes INTEGER NOT NULL DEFAULT 30
        CHECK (booking_reservation_minutes BETWEEN 5 AND 10080),
    -- How long a confirmed booking waits for payment before release (015)
    payment_window_hours INTEGER NOT NULL DEFAULT 48
        CHECK (payment_window_hours BETWEEN 1 AND 720),
    -- How long a checkout reference stays reusable (item 7)
    payment_intent_ttl_minutes INTEGER NOT NULL DEFAULT 60
        CHECK (payment_intent_ttl_minutes BETWEEN 5 AND 1440),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.platform_settings (id) VALUES (TRUE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_settings_admin_read" ON public.platform_settings;
CREATE POLICY "platform_settings_admin_read" ON public.platform_settings
    FOR SELECT TO authenticated USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "platform_settings_super_admin_write" ON public.platform_settings;
CREATE POLICY "platform_settings_super_admin_write" ON public.platform_settings
    FOR UPDATE TO authenticated
    USING ((SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.is_super_admin()));

CREATE OR REPLACE FUNCTION public.platform_settings_row()
RETURNS public.platform_settings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT * FROM public.platform_settings WHERE id;
$$;

GRANT EXECUTE ON FUNCTION public.platform_settings_row() TO authenticated, service_role;

-- Per-property commission override. NULL means "use the platform rate".
ALTER TABLE properties ADD COLUMN IF NOT EXISTS commission_bps INTEGER;

-- The reservation clock. 015 gives it its lifecycle (who sets it, who
-- sweeps it); it is declared here because recording a payment clears it,
-- and a function must not reference a column that does not exist yet.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'properties_commission_bps_check'
    ) THEN
        ALTER TABLE properties ADD CONSTRAINT properties_commission_bps_check
            CHECK (commission_bps IS NULL OR commission_bps BETWEEN 0 AND 10000);
    END IF;
END $$;

-- ============================================================
-- 2. PAYMENT INTENTS
-- ============================================================
-- A student who bounces off the Paystack page and comes back used to get
-- a brand new reference every time, so one booking could accumulate a
-- dozen abandoned transactions. An intent is created once, reused while
-- it is live, and consumed when a charge lands against it.

CREATE TABLE IF NOT EXISTS public.payment_intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reference TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL DEFAULT 'paystack',
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'consumed', 'expired', 'cancelled', 'superseded')),
    authorization_url TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- At most one live intent per booking: this is what makes "reuse" the
-- default rather than a best effort.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_intents_active
    ON public.payment_intents(booking_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_payment_intents_booking
    ON public.payment_intents(booking_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_intents_expiry
    ON public.payment_intents(expires_at) WHERE status = 'active';

ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_intents_student_read" ON public.payment_intents;
CREATE POLICY "payment_intents_student_read" ON public.payment_intents
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = payment_intents.booking_id
              AND b.student_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "payment_intents_admin_read" ON public.payment_intents;
CREATE POLICY "payment_intents_admin_read" ON public.payment_intents
    FOR SELECT TO authenticated USING ((SELECT public.is_admin()));

-- No INSERT/UPDATE policy on purpose. Intents are created by
-- create_payment_intent() below, which is SECURITY DEFINER and checks
-- the caller owns the booking.

-- ============================================================
-- 3. PAYMENTS: statuses, reconciliation, settlement
-- ============================================================

ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'paystack';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS intent_id UUID REFERENCES public.payment_intents(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS expected_amount DECIMAL(12, 2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_fee DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_amount DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS anomaly TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reconciliation_status TEXT NOT NULL DEFAULT 'not_required';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reconciliation_notes TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reconciled_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reconciled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS settles_booking BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing rows: a 'success' row was, by the old rules, the settling one.
UPDATE payments SET settles_booking = TRUE
WHERE status = 'success' AND settles_booking = FALSE;

UPDATE payments p SET expected_amount = b.total_amount
FROM bookings b
WHERE b.id = p.booking_id AND p.expected_amount IS NULL;

DO $$
BEGIN
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
    ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (
        status IN (
            'pending', 'success', 'overpaid', 'underpaid',
            'failed', 'refunded', 'partially_refunded', 'duplicate'
        )
    );

    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_anomaly_check;
    ALTER TABLE payments ADD CONSTRAINT payments_anomaly_check CHECK (
        anomaly IS NULL OR anomaly IN (
            'overpayment', 'underpayment', 'duplicate_payment',
            'currency_mismatch', 'amount_unverifiable'
        )
    );

    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_reconciliation_status_check;
    ALTER TABLE payments ADD CONSTRAINT payments_reconciliation_status_check CHECK (
        reconciliation_status IN (
            'not_required', 'pending_review', 'pending_refund',
            'refund_issued', 'resolved', 'written_off'
        )
    );

    -- Only a status that represents money actually applied to the booking
    -- may settle it. This is the guard that stops a duplicate or a short
    -- payment from ever being mistaken for the real one.
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_settles_status_check;
    ALTER TABLE payments ADD CONSTRAINT payments_settles_status_check CHECK (
        NOT settles_booking OR status IN ('success', 'overpaid', 'partially_refunded')
    );

    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_refunded_amount_check;
    ALTER TABLE payments ADD CONSTRAINT payments_refunded_amount_check CHECK (
        refunded_amount >= 0 AND refunded_amount <= amount
    );
END $$;

-- The one-settling-payment-per-booking index replaces the old
-- one-success-per-booking index. A duplicate charge no longer collides
-- with it (it is recorded as 'duplicate'), so the recording path never
-- has to swallow a unique violation to stay alive.
DROP INDEX IF EXISTS uq_payments_booking_success;
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_booking_settled
    ON payments(booking_id) WHERE settles_booking;

CREATE INDEX IF NOT EXISTS idx_payments_reconciliation
    ON payments(reconciliation_status, created_at DESC)
    WHERE reconciliation_status IN ('pending_review', 'pending_refund');
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_booking_status ON payments(booking_id, status);

-- Payments are written by SECURITY DEFINER functions only. The 001
-- policy let any admin INSERT or UPDATE a payments row directly, which
-- means an admin account could mark a booking paid without money having
-- moved. Reads stay; writes go.
DROP POLICY IF EXISTS "payments_admin_write" ON payments;

-- ============================================================
-- 4. PAYMENT EXCEPTIONS
-- ============================================================
-- A confirmed charge that cannot be attached to a booking (metadata
-- missing, booking deleted) still moved real money. It lands here rather
-- than in a log line.

CREATE TABLE IF NOT EXISTS public.payment_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL DEFAULT 'paystack',
    reference TEXT NOT NULL UNIQUE,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    booking_id UUID,
    reason TEXT NOT NULL CHECK (reason IN (
        'booking_not_found', 'booking_deleted', 'missing_metadata', 'invalid_amount'
    )),
    raw JSONB,
    notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_exceptions_open
    ON public.payment_exceptions(created_at DESC) WHERE resolved_at IS NULL;

ALTER TABLE public.payment_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_exceptions_admin_read" ON public.payment_exceptions;
CREATE POLICY "payment_exceptions_admin_read" ON public.payment_exceptions
    FOR SELECT TO authenticated USING ((SELECT public.is_admin()));

-- ============================================================
-- 5. LEDGER
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    landlord_id UUID REFERENCES landlords(id) ON DELETE SET NULL,
    entry_type TEXT NOT NULL CHECK (entry_type IN (
        'gateway_charge',      -- money arriving from the gateway
        'gateway_fee',         -- the gateway's cut
        'platform_commission', -- Haloft's net revenue (the residual)
        'landlord_payable',    -- accrued, owed to the landlord
        'landlord_payout',     -- paid out to the landlord
        'refund_due',          -- owed back to the student
        'refund_paid',         -- returned to the student
        'adjustment'           -- a manual correction, always explained
    )),
    direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
    amount DECIMAL(14, 2) NOT NULL CHECK (amount >= 0),
    signed_amount DECIMAL(14, 2) GENERATED ALWAYS AS (
        CASE WHEN direction = 'credit' THEN amount ELSE -amount END
    ) STORED,
    currency TEXT NOT NULL DEFAULT 'NGN',
    reference TEXT,
    notes TEXT,
    metadata JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_booking ON public.ledger_entries(booking_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_ledger_payment ON public.ledger_entries(payment_id);
CREATE INDEX IF NOT EXISTS idx_ledger_property ON public.ledger_entries(property_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_ledger_landlord ON public.ledger_entries(landlord_id, occurred_at)
    WHERE landlord_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_type ON public.ledger_entries(entry_type, occurred_at);

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ledger_admin_read" ON public.ledger_entries;
CREATE POLICY "ledger_admin_read" ON public.ledger_entries
    FOR SELECT TO authenticated USING ((SELECT public.is_admin()));

-- No write policy: entries come from the functions below, which is what
-- keeps every payment's entries summing to zero.

-- ============================================================
-- 6. NOTIFICATION OUTBOX
-- ============================================================
-- Booking and payment writes used to await an HTTPS call to Resend
-- inside the request that recorded them. A slow mail provider slowed the
-- checkout; a failing one could make a recorded payment look like a
-- failed one. Events are enqueued in the same transaction as the money
-- and delivered afterwards, by a worker.

CREATE TABLE IF NOT EXISTS public.notification_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic TEXT NOT NULL,
    event TEXT NOT NULL,
    subject_type TEXT NOT NULL DEFAULT 'booking',
    subject_id UUID NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'dead')),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_at TIMESTAMPTZ,
    locked_by TEXT,
    last_error TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One delivery per (subject, event). A webhook and a browser callback
-- reporting the same charge enqueue the same row, and the second one is
-- a no-op — which is where the old "send the email only if this call was
-- the one that inserted" trick used to live.
CREATE UNIQUE INDEX IF NOT EXISTS uq_outbox_subject_event
    ON public.notification_outbox(subject_type, subject_id, event)
    WHERE status <> 'dead';

CREATE INDEX IF NOT EXISTS idx_outbox_claimable
    ON public.notification_outbox(available_at)
    WHERE status IN ('pending', 'failed');

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "outbox_admin_read" ON public.notification_outbox;
CREATE POLICY "outbox_admin_read" ON public.notification_outbox
    FOR SELECT TO authenticated USING ((SELECT public.is_admin()));

CREATE OR REPLACE FUNCTION public.enqueue_notification(
    p_topic TEXT,
    p_event TEXT,
    p_subject_type TEXT,
    p_subject_id UUID,
    p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO notification_outbox (topic, event, subject_type, subject_id, payload)
    VALUES (p_topic, p_event, p_subject_type, p_subject_id, COALESCE(p_payload, '{}'::jsonb))
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_notification(TEXT, TEXT, TEXT, UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_notification(TEXT, TEXT, TEXT, UUID, JSONB) TO service_role;

/**
 * Claims up to p_limit deliverable events for one worker. The
 * FOR UPDATE SKIP LOCKED is what lets two workers (or two serverless
 * invocations of the same cron) run at once without sending twice.
 */
CREATE OR REPLACE FUNCTION public.claim_notifications(
    p_limit INTEGER DEFAULT 25,
    p_worker TEXT DEFAULT 'worker'
)
RETURNS SETOF public.notification_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH claimed AS (
        SELECT id FROM notification_outbox
        WHERE status IN ('pending', 'failed')
          AND available_at <= NOW()
          AND attempts < max_attempts
        ORDER BY available_at
        FOR UPDATE SKIP LOCKED
        LIMIT GREATEST(1, LEAST(p_limit, 200))
    )
    UPDATE notification_outbox o
    SET status = 'processing',
        attempts = o.attempts + 1,
        locked_at = NOW(),
        locked_by = p_worker,
        updated_at = NOW()
    FROM claimed
    WHERE o.id = claimed.id
    RETURNING o.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_notifications(INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notifications(INTEGER, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.complete_notification(
    p_id UUID,
    p_ok BOOLEAN,
    p_error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_ok THEN
        UPDATE notification_outbox
        SET status = 'sent', sent_at = NOW(), last_error = NULL,
            locked_at = NULL, locked_by = NULL, updated_at = NOW()
        WHERE id = p_id;
    ELSE
        UPDATE notification_outbox
        SET status = CASE WHEN attempts >= max_attempts THEN 'dead' ELSE 'failed' END,
            last_error = LEFT(COALESCE(p_error, 'unknown'), 2000),
            -- 1, 4, 9, 16… minutes: quick retries for a blip, long ones
            -- for an outage, without a scheduler to track them.
            available_at = NOW() + (POWER(GREATEST(attempts, 1), 2) * INTERVAL '1 minute'),
            locked_at = NULL, locked_by = NULL, updated_at = NOW()
        WHERE id = p_id;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_notification(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_notification(UUID, BOOLEAN, TEXT) TO service_role;

-- ============================================================
-- 7. INTERNAL: write a payment's ledger decomposition
-- ============================================================

CREATE OR REPLACE FUNCTION public.write_payment_ledger(
    p_payment_id UUID,
    p_settles BOOLEAN,
    p_refund_due DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payment payments%ROWTYPE;
    v_booking bookings%ROWTYPE;
    v_property properties%ROWTYPE;
    v_bps INTEGER;
    v_landlord DECIMAL(14, 2) := 0;
    v_commission DECIMAL(14, 2);
    v_refund DECIMAL(14, 2) := COALESCE(p_refund_due, 0);
BEGIN
    SELECT * INTO v_payment FROM payments WHERE id = p_payment_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'PAYMENT_NOT_FOUND';
    END IF;

    SELECT * INTO v_booking FROM bookings WHERE id = v_payment.booking_id;
    SELECT * INTO v_property FROM properties WHERE id = v_booking.property_id;

    SELECT COALESCE(v_property.commission_bps, s.platform_commission_bps)
    INTO v_bps
    FROM platform_settings s WHERE s.id;

    -- The landlord accrues on what the booking was actually for, never on
    -- an overpayment: the surplus belongs to the student.
    IF p_settles THEN
        v_landlord := ROUND(COALESCE(v_payment.expected_amount, 0) * (10000 - COALESCE(v_bps, 0)) / 10000.0, 2);
    END IF;

    -- Residual, so the entries below always sum to zero.
    v_commission := v_payment.amount - v_payment.gateway_fee - v_landlord - v_refund;

    INSERT INTO ledger_entries (
        booking_id, payment_id, property_id, landlord_id,
        entry_type, direction, amount, currency, reference, notes
    )
    VALUES (
        v_booking.id, v_payment.id, v_booking.property_id, v_property.landlord_id,
        'gateway_charge', 'credit', v_payment.amount, v_payment.currency,
        v_payment.transaction_reference, NULL
    );

    IF v_payment.gateway_fee > 0 THEN
        INSERT INTO ledger_entries (
            booking_id, payment_id, property_id, landlord_id,
            entry_type, direction, amount, currency, reference
        )
        VALUES (
            v_booking.id, v_payment.id, v_booking.property_id, v_property.landlord_id,
            'gateway_fee', 'debit', v_payment.gateway_fee, v_payment.currency,
            v_payment.transaction_reference
        );
    END IF;

    IF v_landlord > 0 THEN
        INSERT INTO ledger_entries (
            booking_id, payment_id, property_id, landlord_id,
            entry_type, direction, amount, currency, reference
        )
        VALUES (
            v_booking.id, v_payment.id, v_booking.property_id, v_property.landlord_id,
            'landlord_payable', 'debit', v_landlord, v_payment.currency,
            v_payment.transaction_reference
        );
    END IF;

    IF v_refund > 0 THEN
        INSERT INTO ledger_entries (
            booking_id, payment_id, property_id, landlord_id,
            entry_type, direction, amount, currency, reference, notes
        )
        VALUES (
            v_booking.id, v_payment.id, v_booking.property_id, v_property.landlord_id,
            'refund_due', 'debit', v_refund, v_payment.currency,
            v_payment.transaction_reference,
            'raised by ' || COALESCE(v_payment.anomaly, 'reconciliation')
        );
    END IF;

    IF v_commission <> 0 THEN
        INSERT INTO ledger_entries (
            booking_id, payment_id, property_id, landlord_id,
            entry_type, direction, amount, currency, reference, notes
        )
        VALUES (
            v_booking.id, v_payment.id, v_booking.property_id, v_property.landlord_id,
            'platform_commission',
            CASE WHEN v_commission > 0 THEN 'debit' ELSE 'credit' END,
            ABS(v_commission), v_payment.currency,
            v_payment.transaction_reference,
            CASE WHEN v_commission < 0
                 THEN 'negative commission: the gateway fee exceeds the platform share'
                 ELSE NULL END
        );
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.write_payment_ledger(UUID, BOOLEAN, DECIMAL) FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 8. RECORD A GATEWAY CHARGE
-- ============================================================
-- The one entry point for money arriving. Everything the webhook and the
-- browser callback used to do in application code — validate, classify,
-- insert, decide about email — happens here, in one transaction.
--
-- Returns a JSON object; it never raises for a business outcome, because
-- the caller (a webhook) has to answer 200 either way.
--
--   outcome: recorded | already_recorded | unattributable
--   status:  as written to payments.status
--   settles_booking, anomaly, reconciliation_status, surplus, shortfall

CREATE OR REPLACE FUNCTION public.record_gateway_charge(
    p_provider TEXT,
    p_reference TEXT,
    p_booking_id UUID,
    p_amount_minor BIGINT,
    p_currency TEXT,
    p_channel TEXT,
    p_paid_at TIMESTAMPTZ DEFAULT NOW(),
    p_gateway_fee_minor BIGINT DEFAULT 0,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking bookings%ROWTYPE;
    v_existing payments%ROWTYPE;
    v_payment payments%ROWTYPE;
    v_intent payment_intents%ROWTYPE;
    v_amount DECIMAL(12, 2) := ROUND(p_amount_minor::DECIMAL / 100, 2);
    v_fee DECIMAL(12, 2) := ROUND(COALESCE(p_gateway_fee_minor, 0)::DECIMAL / 100, 2);
    v_expected_minor BIGINT;
    v_status TEXT;
    v_anomaly TEXT;
    v_recon TEXT;
    v_settles BOOLEAN := FALSE;
    v_refund_due DECIMAL(12, 2) := 0;
    v_surplus DECIMAL(12, 2) := 0;
    v_shortfall DECIMAL(12, 2) := 0;
    v_method TEXT;
    v_reason TEXT;
BEGIN
    IF p_reference IS NULL OR LENGTH(TRIM(p_reference)) = 0 THEN
        RAISE EXCEPTION 'REFERENCE_REQUIRED';
    END IF;

    IF p_amount_minor IS NULL OR p_amount_minor < 0 THEN
        RAISE EXCEPTION 'INVALID_AMOUNT';
    END IF;

    -- Paystack's channels, mapped to the payment_method enum.
    v_method := CASE
        WHEN p_channel IN ('bank', 'bank_transfer') THEN 'bank_transfer'
        WHEN p_channel IN ('ussd', 'mobile_money') THEN 'mobile_money'
        ELSE 'card'
    END;

    -- Idempotency. The webhook and the browser callback both report the
    -- same charge; whichever arrives second gets the first one's answer.
    SELECT * INTO v_existing FROM payments WHERE transaction_reference = p_reference;
    IF FOUND THEN
        RETURN jsonb_build_object(
            'outcome', 'already_recorded',
            'payment_id', v_existing.id,
            'booking_id', v_existing.booking_id,
            'status', v_existing.status,
            'settles_booking', v_existing.settles_booking,
            'anomaly', v_existing.anomaly,
            'reconciliation_status', v_existing.reconciliation_status,
            'amount', v_existing.amount
        );
    END IF;

    IF p_booking_id IS NULL THEN
        v_reason := 'missing_metadata';
    ELSE
        SELECT * INTO v_booking FROM bookings
        WHERE id = p_booking_id AND deleted_at IS NULL
        FOR UPDATE;
        IF NOT FOUND THEN
            v_reason := 'booking_not_found';
        END IF;
    END IF;

    -- Money that cannot be attached to a booking is still money. It is
    -- parked where finance can see it rather than dropped.
    IF v_reason IS NOT NULL THEN
        INSERT INTO payment_exceptions (provider, reference, amount, currency, booking_id, reason, raw)
        VALUES (COALESCE(p_provider, 'paystack'), p_reference, v_amount,
                COALESCE(p_currency, 'NGN'), p_booking_id, v_reason,
                COALESCE(p_metadata, '{}'::jsonb))
        ON CONFLICT (reference) DO NOTHING;

        RETURN jsonb_build_object(
            'outcome', 'unattributable',
            'reason', v_reason,
            'amount', v_amount,
            'booking_id', p_booking_id
        );
    END IF;

    v_expected_minor := ROUND(v_booking.total_amount * 100)::BIGINT;

    -- ── Classification ──────────────────────────────────────
    IF p_currency IS DISTINCT FROM v_booking.currency THEN
        -- Cannot be compared to the booking total, so it cannot settle it.
        v_status := 'failed';
        v_anomaly := 'currency_mismatch';
        v_recon := 'pending_review';
        v_refund_due := v_amount;

    ELSIF EXISTS (
        SELECT 1 FROM payments
        WHERE booking_id = v_booking.id AND settles_booking
    ) THEN
        -- The booking is already paid. The second charge is recorded in
        -- full, owed back, and queued for a refund — never discarded.
        v_status := 'duplicate';
        v_anomaly := 'duplicate_payment';
        v_recon := 'pending_refund';
        v_refund_due := v_amount;

    ELSIF p_amount_minor < v_expected_minor THEN
        v_status := 'underpaid';
        v_anomaly := 'underpayment';
        v_recon := 'pending_review';
        v_shortfall := ROUND((v_expected_minor - p_amount_minor)::DECIMAL / 100, 2);
        v_refund_due := v_amount;

    ELSIF p_amount_minor > v_expected_minor THEN
        -- Accepted, because the booking IS covered, but the surplus is
        -- the student's money and is booked as owed back on the spot.
        v_status := 'overpaid';
        v_anomaly := 'overpayment';
        v_recon := 'pending_refund';
        v_settles := TRUE;
        v_surplus := ROUND((p_amount_minor - v_expected_minor)::DECIMAL / 100, 2);
        v_refund_due := v_surplus;

    ELSE
        v_status := 'success';
        v_anomaly := NULL;
        v_recon := 'not_required';
        v_settles := TRUE;
    END IF;

    -- Consume the intent this charge belongs to, if there is one.
    SELECT * INTO v_intent FROM payment_intents
    WHERE reference = p_reference FOR UPDATE;

    INSERT INTO payments (
        booking_id, intent_id, provider, amount, expected_amount, currency,
        payment_method, status, anomaly, reconciliation_status, settles_booking,
        gateway_fee, transaction_reference, paid_at, metadata
    )
    VALUES (
        v_booking.id, v_intent.id, COALESCE(p_provider, 'paystack'), v_amount,
        v_booking.total_amount, COALESCE(p_currency, v_booking.currency),
        v_method, v_status, v_anomaly, v_recon, v_settles,
        v_fee, p_reference, COALESCE(p_paid_at, NOW()),
        COALESCE(p_metadata, '{}'::jsonb)
    )
    RETURNING * INTO v_payment;

    IF v_intent.id IS NOT NULL THEN
        UPDATE payment_intents
        SET status = 'consumed', consumed_at = NOW(), updated_at = NOW()
        WHERE id = v_intent.id;
    END IF;

    PERFORM public.write_payment_ledger(v_payment.id, v_settles, v_refund_due);

    -- Emails leave the transaction as a queued event, not an HTTPS call.
    IF v_settles THEN
        PERFORM public.enqueue_notification(
            'booking', 'paid', 'booking', v_booking.id,
            jsonb_build_object('payment_id', v_payment.id, 'amount', v_amount)
        );

        UPDATE bookings SET expires_at = NULL WHERE id = v_booking.id;
    END IF;

    IF v_anomaly IS NOT NULL THEN
        PERFORM public.enqueue_notification(
            'finance', 'payment_anomaly', 'payment', v_payment.id,
            jsonb_build_object(
                'booking_id', v_booking.id,
                'anomaly', v_anomaly,
                'amount', v_amount,
                'expected', v_booking.total_amount,
                'surplus', v_surplus,
                'shortfall', v_shortfall
            )
        );
    END IF;

    INSERT INTO audit_logs (user_id, table_name, record_id, action, old_data, new_data)
    VALUES (
        NULL, 'payments', v_payment.id::TEXT, 'INSERT',
        NULL,
        jsonb_build_object(
            'booking_id', v_booking.id, 'status', v_status, 'anomaly', v_anomaly,
            'amount', v_amount, 'expected', v_booking.total_amount,
            'settles_booking', v_settles, 'reference', p_reference
        )
    );

    RETURN jsonb_build_object(
        'outcome', 'recorded',
        'payment_id', v_payment.id,
        'booking_id', v_booking.id,
        'status', v_status,
        'settles_booking', v_settles,
        'anomaly', v_anomaly,
        'reconciliation_status', v_recon,
        'amount', v_amount,
        'expected_amount', v_booking.total_amount,
        'surplus', v_surplus,
        'shortfall', v_shortfall
    );
END;
$$;

REVOKE ALL ON FUNCTION public.record_gateway_charge(TEXT, TEXT, UUID, BIGINT, TEXT, TEXT, TIMESTAMPTZ, BIGINT, JSONB)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_gateway_charge(TEXT, TEXT, UUID, BIGINT, TEXT, TEXT, TIMESTAMPTZ, BIGINT, JSONB)
    TO service_role;

-- ============================================================
-- 9. PAYMENT INTENTS: create or reuse
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_payment_intent(
    p_booking_id UUID,
    p_reference TEXT,
    p_provider TEXT DEFAULT 'paystack'
)
RETURNS public.payment_intents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_booking bookings%ROWTYPE;
    v_intent payment_intents%ROWTYPE;
    v_ttl INTEGER;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;

    SELECT * INTO v_booking FROM bookings
    WHERE id = p_booking_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND OR v_booking.student_id <> v_uid THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND';
    END IF;

    IF v_booking.status <> 'confirmed' THEN
        RAISE EXCEPTION 'BOOKING_NOT_CONFIRMED';
    END IF;

    IF EXISTS (
        SELECT 1 FROM payments WHERE booking_id = p_booking_id AND settles_booking
    ) THEN
        RAISE EXCEPTION 'BOOKING_PAID';
    END IF;

    SELECT payment_intent_ttl_minutes INTO v_ttl FROM platform_settings WHERE id;

    -- Expire anything stale before looking for something to reuse.
    UPDATE payment_intents
    SET status = 'expired', updated_at = NOW()
    WHERE booking_id = p_booking_id AND status = 'active' AND expires_at <= NOW();

    SELECT * INTO v_intent FROM payment_intents
    WHERE booking_id = p_booking_id AND status = 'active'
    FOR UPDATE;

    IF FOUND THEN
        -- A live intent for the same amount is the whole point: the
        -- student returns to the checkout they already started.
        IF v_intent.amount = v_booking.total_amount THEN
            UPDATE payment_intents
            SET attempt_count = attempt_count + 1, updated_at = NOW()
            WHERE id = v_intent.id
            RETURNING * INTO v_intent;
            RETURN v_intent;
        END IF;

        -- The price moved under it. Retire it rather than charge the
        -- student an amount the booking no longer says.
        UPDATE payment_intents
        SET status = 'superseded', updated_at = NOW()
        WHERE id = v_intent.id;
    END IF;

    INSERT INTO payment_intents (
        booking_id, reference, provider, amount, currency,
        expires_at, created_by, attempt_count
    )
    VALUES (
        p_booking_id, p_reference, COALESCE(p_provider, 'paystack'),
        v_booking.total_amount, v_booking.currency,
        NOW() + (COALESCE(v_ttl, 60) * INTERVAL '1 minute'), v_uid, 1
    )
    RETURNING * INTO v_intent;

    RETURN v_intent;
END;
$$;

REVOKE ALL ON FUNCTION public.create_payment_intent(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_payment_intent(UUID, TEXT, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.attach_intent_authorization(
    p_intent_id UUID,
    p_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE payment_intents
    SET authorization_url = p_url, updated_at = NOW()
    WHERE id = p_intent_id;
END;
$$;

REVOKE ALL ON FUNCTION public.attach_intent_authorization(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.attach_intent_authorization(UUID, TEXT) TO authenticated, service_role;

-- ============================================================
-- 10. REFUNDS AND RECONCILIATION
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_refund(
    p_payment_id UUID,
    p_amount DECIMAL,
    p_reference TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payment payments%ROWTYPE;
    v_booking bookings%ROWTYPE;
    v_property properties%ROWTYPE;
    v_remaining DECIMAL(12, 2);
    v_new_total DECIMAL(12, 2);
    v_status TEXT;
    v_settles BOOLEAN;
    v_due DECIMAL(14, 2);
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'ADMIN_ONLY';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'INVALID_AMOUNT';
    END IF;

    SELECT * INTO v_payment FROM payments WHERE id = p_payment_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'PAYMENT_NOT_FOUND';
    END IF;

    v_remaining := v_payment.amount - v_payment.refunded_amount;
    IF p_amount > v_remaining THEN
        RAISE EXCEPTION 'REFUND_EXCEEDS_PAYMENT';
    END IF;

    v_new_total := v_payment.refunded_amount + p_amount;

    -- A payment refunded in full stops settling its booking, which frees
    -- the uq_payments_booking_settled index for a genuine re-payment.
    IF v_new_total >= v_payment.amount THEN
        v_status := 'refunded';
        v_settles := FALSE;
    ELSIF v_payment.settles_booking THEN
        v_status := 'partially_refunded';
        v_settles := TRUE;
    ELSE
        v_status := v_payment.status;
        v_settles := FALSE;
    END IF;

    UPDATE payments
    SET refunded_amount = v_new_total,
        status = v_status,
        settles_booking = v_settles,
        reconciliation_status = CASE
            WHEN reconciliation_status IN ('pending_refund', 'pending_review')
            THEN 'refund_issued' ELSE reconciliation_status END,
        reconciliation_notes = COALESCE(p_notes, reconciliation_notes),
        reconciled_at = NOW(),
        reconciled_by = auth.uid(),
        updated_at = NOW()
    WHERE id = p_payment_id
    RETURNING * INTO v_payment;

    SELECT * INTO v_booking FROM bookings WHERE id = v_payment.booking_id;
    SELECT * INTO v_property FROM properties WHERE id = v_booking.property_id;

    -- What was still owed BEFORE this refund. `refund_due` alone: the
    -- obligation account. `refund_paid` is the cash side and would double
    -- count if it were included here.
    SELECT COALESCE(-SUM(signed_amount), 0) INTO v_due
    FROM ledger_entries
    WHERE payment_id = v_payment.id AND entry_type = 'refund_due';

    -- Cash leaving.
    INSERT INTO ledger_entries (
        booking_id, payment_id, property_id, landlord_id,
        entry_type, direction, amount, currency, reference, notes, created_by
    )
    VALUES (
        v_booking.id, v_payment.id, v_booking.property_id, v_property.landlord_id,
        'refund_paid', 'debit', p_amount, v_payment.currency, p_reference, p_notes, auth.uid()
    );

    -- The obligation it discharges, up to what was actually owed.
    IF v_due > 0 THEN
        INSERT INTO ledger_entries (
            booking_id, payment_id, property_id, landlord_id,
            entry_type, direction, amount, currency, reference, notes, created_by
        )
        VALUES (
            v_booking.id, v_payment.id, v_booking.property_id, v_property.landlord_id,
            'refund_due', 'credit', LEAST(v_due, p_amount), v_payment.currency, p_reference,
            'refund obligation discharged', auth.uid()
        );
    END IF;

    -- Anything returned beyond what was owed (ops handing back a charge
    -- that was only partly flagged) is a loss, and lands on commission —
    -- which is where a loss belongs, and keeps the sum at zero.
    IF p_amount > v_due THEN
        INSERT INTO ledger_entries (
            booking_id, payment_id, property_id, landlord_id,
            entry_type, direction, amount, currency, reference, notes, created_by
        )
        VALUES (
            v_booking.id, v_payment.id, v_booking.property_id, v_property.landlord_id,
            'platform_commission', 'credit', p_amount - v_due, v_payment.currency, p_reference,
            'refund beyond the recorded obligation, absorbed by the platform', auth.uid()
        );
    END IF;

    -- A settling payment returned in full means the booking is refunded.
    IF v_status = 'refunded' AND v_booking.status IN ('pending', 'confirmed', 'completed') THEN
        UPDATE bookings SET status = 'refunded' WHERE id = v_booking.id;
    END IF;

    INSERT INTO audit_logs (user_id, table_name, record_id, action, old_data, new_data)
    VALUES (
        auth.uid(), 'payments', p_payment_id::TEXT, 'UPDATE',
        jsonb_build_object('refunded_amount', v_payment.refunded_amount - p_amount),
        jsonb_build_object('refunded_amount', v_new_total, 'status', v_status,
                           'via', 'record_refund', 'reference', p_reference)
    );

    RETURN jsonb_build_object(
        'payment_id', v_payment.id,
        'status', v_status,
        'refunded_amount', v_new_total,
        'settles_booking', v_settles
    );
END;
$$;

REVOKE ALL ON FUNCTION public.record_refund(UUID, DECIMAL, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_refund(UUID, DECIMAL, TEXT, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.resolve_payment_reconciliation(
    p_payment_id UUID,
    p_status TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payment payments%ROWTYPE;
    v_old TEXT;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'ADMIN_ONLY';
    END IF;

    IF p_status NOT IN ('pending_review', 'pending_refund', 'resolved', 'written_off') THEN
        RAISE EXCEPTION 'INVALID_RECONCILIATION_STATUS';
    END IF;

    SELECT * INTO v_payment FROM payments WHERE id = p_payment_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'PAYMENT_NOT_FOUND';
    END IF;

    v_old := v_payment.reconciliation_status;

    UPDATE payments
    SET reconciliation_status = p_status,
        reconciliation_notes = COALESCE(p_notes, reconciliation_notes),
        reconciled_at = NOW(),
        reconciled_by = auth.uid(),
        updated_at = NOW()
    WHERE id = p_payment_id
    RETURNING * INTO v_payment;

    INSERT INTO audit_logs (user_id, table_name, record_id, action, old_data, new_data)
    VALUES (
        auth.uid(), 'payments', p_payment_id::TEXT, 'UPDATE',
        jsonb_build_object('reconciliation_status', v_old),
        jsonb_build_object('reconciliation_status', p_status, 'notes', p_notes,
                           'via', 'resolve_payment_reconciliation')
    );

    RETURN v_payment;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_payment_reconciliation(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_payment_reconciliation(UUID, TEXT, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.record_landlord_payout(
    p_booking_id UUID,
    p_amount DECIMAL,
    p_reference TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking bookings%ROWTYPE;
    v_property properties%ROWTYPE;
    v_payable DECIMAL(14, 2);
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'ADMIN_ONLY';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'INVALID_AMOUNT';
    END IF;

    SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND';
    END IF;

    SELECT * INTO v_property FROM properties WHERE id = v_booking.property_id;

    -- `landlord_payable` alone, for the same reason record_refund reads
    -- `refund_due` alone: it is the obligation account, and each payout
    -- credits it back down. `landlord_payout` is the cash side.
    SELECT COALESCE(-SUM(signed_amount), 0) INTO v_payable
    FROM ledger_entries
    WHERE booking_id = p_booking_id AND entry_type = 'landlord_payable';

    IF p_amount > v_payable THEN
        RAISE EXCEPTION 'PAYOUT_EXCEEDS_PAYABLE';
    END IF;

    INSERT INTO ledger_entries (
        booking_id, property_id, landlord_id, entry_type, direction,
        amount, currency, reference, notes, created_by
    )
    VALUES
    (v_booking.id, v_booking.property_id, v_property.landlord_id,
     'landlord_payout', 'debit', p_amount, v_booking.currency, p_reference, p_notes, auth.uid()),
    (v_booking.id, v_booking.property_id, v_property.landlord_id,
     'landlord_payable', 'credit', p_amount, v_booking.currency, p_reference,
     'payout settled', auth.uid());

    RETURN jsonb_build_object('booking_id', p_booking_id, 'paid', p_amount,
                              'remaining_payable', v_payable - p_amount);
END;
$$;

REVOKE ALL ON FUNCTION public.record_landlord_payout(UUID, DECIMAL, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_landlord_payout(UUID, DECIMAL, TEXT, TEXT) TO authenticated, service_role;

-- ============================================================
-- 11. cancel_booking: settlement, not status, decides
-- ============================================================
-- 007 blocked self-cancellation when a payment row had status 'success'.
-- 'overpaid' is also a paid booking, so the check moves to the column
-- that means exactly that.

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
        WHERE booking_id = p_booking_id AND settles_booking
    ) THEN
        RAISE EXCEPTION 'BOOKING_PAID';
    END IF;

    UPDATE bookings
    SET status = 'cancelled'
    WHERE id = p_booking_id
    RETURNING * INTO v_booking;

    UPDATE payment_intents
    SET status = 'cancelled', updated_at = NOW()
    WHERE booking_id = p_booking_id AND status = 'active';

    PERFORM 1 FROM rooms WHERE id = v_booking.room_id FOR UPDATE;

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

    PERFORM public.enqueue_notification(
        'booking', 'cancelled', 'booking', p_booking_id, '{}'::jsonb
    );

    RETURN v_booking;
END;
$$;

-- ============================================================
-- 12. FINANCE VIEWS
-- ============================================================

CREATE OR REPLACE VIEW public.booking_financials
WITH (security_invoker = on) AS
SELECT
    b.id AS booking_id,
    b.property_id,
    b.student_id,
    b.status AS booking_status,
    b.total_amount AS booking_total,
    b.currency,
    -- Obligation accounts (`landlord_payable`, `refund_due`) net to what
    -- is still owed, because settling them credits them back down. The
    -- cash accounts (`landlord_payout`, `refund_paid`) accumulate what
    -- actually left. Reading the two together would double count.
    COALESCE(SUM(l.signed_amount) FILTER (WHERE l.entry_type = 'gateway_charge'), 0) AS gross_received,
    COALESCE(-SUM(l.signed_amount) FILTER (WHERE l.entry_type = 'gateway_fee'), 0) AS gateway_fees,
    COALESCE(-SUM(l.signed_amount) FILTER (WHERE l.entry_type = 'platform_commission'), 0) AS platform_commission,
    COALESCE(-SUM(l.signed_amount) FILTER (WHERE l.entry_type = 'landlord_payable'), 0) AS landlord_outstanding,
    COALESCE(-SUM(l.signed_amount) FILTER (WHERE l.entry_type = 'landlord_payout'), 0) AS landlord_paid_out,
    COALESCE(-SUM(l.signed_amount) FILTER (WHERE l.entry_type = 'refund_due'), 0) AS refunds_outstanding,
    COALESCE(-SUM(l.signed_amount) FILTER (WHERE l.entry_type = 'refund_paid'), 0) AS refunds_paid
FROM bookings b
LEFT JOIN ledger_entries l ON l.booking_id = b.id
WHERE b.deleted_at IS NULL
GROUP BY b.id, b.property_id, b.student_id, b.status, b.total_amount, b.currency;

GRANT SELECT ON public.booking_financials TO authenticated, service_role;

/** The finance queue: every charge that needs a human decision. */
CREATE OR REPLACE VIEW public.payment_reconciliation_queue
WITH (security_invoker = on) AS
SELECT
    p.id AS payment_id,
    p.booking_id,
    p.transaction_reference,
    p.status,
    p.anomaly,
    p.reconciliation_status,
    p.reconciliation_notes,
    p.amount,
    p.expected_amount,
    p.amount - COALESCE(p.expected_amount, p.amount) AS variance,
    p.refunded_amount,
    p.currency,
    p.paid_at,
    p.created_at,
    b.student_id,
    b.property_id,
    COALESCE(-SUM(l.signed_amount) FILTER (WHERE l.entry_type = 'refund_due'), 0) AS refund_outstanding
FROM payments p
JOIN bookings b ON b.id = p.booking_id
LEFT JOIN ledger_entries l ON l.payment_id = p.id
WHERE p.reconciliation_status IN ('pending_review', 'pending_refund')
GROUP BY p.id, b.student_id, b.property_id;

GRANT SELECT ON public.payment_reconciliation_queue TO authenticated, service_role;

/**
 * Should always be empty. A row here means a payment's ledger entries do
 * not sum to zero, i.e. money was recorded that is not accounted for.
 * Worth an alert, not just a dashboard.
 */
CREATE OR REPLACE VIEW public.ledger_imbalances
WITH (security_invoker = on) AS
SELECT payment_id, SUM(signed_amount) AS imbalance, COUNT(*) AS entries
FROM ledger_entries
WHERE payment_id IS NOT NULL
GROUP BY payment_id
HAVING SUM(signed_amount) <> 0;

GRANT SELECT ON public.ledger_imbalances TO authenticated, service_role;

-- ============================================================
-- 13. BACKFILL: ledger rows for payments taken before this
-- ============================================================
-- Without this the ledger starts half-empty and every historical booking
-- looks unpaid to the finance views.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT p.id FROM payments p
        WHERE NOT EXISTS (SELECT 1 FROM ledger_entries l WHERE l.payment_id = p.id)
          AND p.status IN ('success', 'overpaid', 'partially_refunded')
        ORDER BY p.created_at
    LOOP
        PERFORM public.write_payment_ledger(r.id, TRUE, 0);
    END LOOP;
END $$;
