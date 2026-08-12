-- ============================================================
-- 018: THE INDEXES THE QUERIES ACTUALLY ISSUE, AND A SECURITY LOG
-- Run after 017_media_integrity.sql. Idempotent.
-- ============================================================
-- Part one is index coverage. 008 and 009 indexed the public catalogue;
-- what stayed unindexed was everything the dashboards read — bookings by
-- student, payments by booking, the admin queues — plus the two-column
-- shapes the search page issues but the single-column indexes only half
-- serve. `scripts/explain-search.sql` is the check that these are used:
-- an index existing is not an index being chosen.
--
-- Part two is a security log. audit_logs answers "what changed"; it does
-- not answer "who tried, from where, and did it work" — which is the
-- question asked after an incident, and the one nobody can answer from a
-- console log in a serverless runtime that has already been recycled.
--
-- ── On CONCURRENTLY ─────────────────────────────────────────
-- CREATE INDEX takes an ACCESS EXCLUSIVE lock for the duration of the
-- build. At today's row counts that is milliseconds. Past a few hundred
-- thousand rows, re-run these by hand as CREATE INDEX CONCURRENTLY,
-- outside a transaction, so writes are not blocked.

-- ============================================================
-- 1. BOOKINGS
-- ============================================================
-- The student dashboard reads "my bookings, newest first"; the admin
-- queue reads "everything, newest first", filtered by status. Neither had
-- created_at in an index, so both sorted the whole table.

CREATE INDEX IF NOT EXISTS idx_bookings_student_recent
    ON bookings(student_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_created
    ON bookings(created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_status_recent
    ON bookings(status, created_at DESC) WHERE deleted_at IS NULL;

-- The admin property page lists a property's bookings by status.
CREATE INDEX IF NOT EXISTS idx_bookings_property_status
    ON bookings(property_id, status) WHERE deleted_at IS NULL;

-- create_booking's overlap check scans a room's live bookings.
CREATE INDEX IF NOT EXISTS idx_bookings_room_active
    ON bookings(room_id, check_in_date, check_out_date)
    WHERE deleted_at IS NULL AND status IN ('pending', 'confirmed');

-- ============================================================
-- 2. PROPERTIES AND ROOMS
-- ============================================================
-- Every public listing query filters campus + status together, and the
-- neighbourhood filter adds a second equality. Composite beats two
-- single-column indexes here because the planner gets both selectivities
-- from one scan.

CREATE INDEX IF NOT EXISTS idx_properties_campus_status
    ON properties(campus_id, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_properties_neighbourhood_status
    ON properties(neighbourhood_id, status) WHERE deleted_at IS NULL;

-- Price filtering on the catalogue, per campus.
CREATE INDEX IF NOT EXISTS idx_properties_campus_price
    ON properties(campus_id, min_price, max_price)
    WHERE deleted_at IS NULL AND status = 'published';

-- The listing page's room list: this property, cheapest first.
CREATE INDEX IF NOT EXISTS idx_rooms_property_rent
    ON rooms(property_id, annual_rent) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rooms_property_status
    ON rooms(property_id, status) WHERE deleted_at IS NULL;

-- ============================================================
-- 3. MEDIA AND REVIEWS
-- ============================================================
-- idx_media_entity from 001 covers (entity_type, entity_id); the gallery
-- also orders by display_order, which was a sort on top of the scan.

CREATE INDEX IF NOT EXISTS idx_media_entity_order
    ON media(entity_type, entity_id, display_order)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_property_approved
    ON reviews(property_id, is_approved, created_at DESC)
    WHERE deleted_at IS NULL;

-- ============================================================
-- 4. AUDIT LOG READS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_record_recent
    ON audit_logs(table_name, record_id, created_at DESC);

-- ============================================================
-- 5. SECURITY EVENTS
-- ============================================================
-- Structured, queryable, and kept in the database rather than in a log
-- drain that expires. One row per attempt at anything that moves money,
-- publishes a listing, changes availability or grants a role — including
-- the attempts that were REFUSED, which is the half a diff-based audit
-- table can never capture.

CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    result TEXT NOT NULL CHECK (result IN ('allowed', 'denied', 'error')),
    ip_address INET,
    user_agent TEXT,
    request_id TEXT,
    detail JSONB
);

CREATE INDEX IF NOT EXISTS idx_security_events_recent
    ON public.security_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_actor
    ON public.security_events(actor_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_action
    ON public.security_events(action, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_denied
    ON public.security_events(occurred_at DESC) WHERE result = 'denied';
CREATE INDEX IF NOT EXISTS idx_security_events_resource
    ON public.security_events(resource_type, resource_id, occurred_at DESC);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_events_admin_read" ON public.security_events;
CREATE POLICY "security_events_admin_read" ON public.security_events
    FOR SELECT TO authenticated USING ((SELECT public.is_admin()));

-- No write policy: the application writes through the service role, so a
-- compromised session cannot forge or suppress its own trail.

CREATE OR REPLACE FUNCTION public.log_security_event(
    p_action TEXT,
    p_result TEXT,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id TEXT DEFAULT NULL,
    p_actor_id UUID DEFAULT NULL,
    p_actor_role TEXT DEFAULT NULL,
    p_ip TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_request_id TEXT DEFAULT NULL,
    p_detail JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO security_events (
        actor_id, actor_role, action, resource_type, resource_id,
        result, ip_address, user_agent, request_id, detail
    )
    VALUES (
        COALESCE(p_actor_id, auth.uid()), p_actor_role, p_action,
        p_resource_type, p_resource_id, p_result,
        -- A spoofable proxy header must never be able to abort the write
        -- it is describing.
        public.try_inet(p_ip), LEFT(p_user_agent, 500), p_request_id, p_detail
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.try_inet(p_value TEXT)
RETURNS INET
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF p_value IS NULL OR LENGTH(TRIM(p_value)) = 0 THEN
        RETURN NULL;
    END IF;
    RETURN p_value::INET;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.try_inet(TEXT) TO authenticated, anon, service_role;

REVOKE ALL ON FUNCTION public.log_security_event(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB)
    TO service_role;

-- ============================================================
-- 6. ROOM AVAILABILITY CHANGES ARE SECURITY EVENTS
-- ============================================================
-- Taking a room off the market, or putting one back, decides who can
-- book. It belongs in the trail next to publishing and payments.

CREATE OR REPLACE FUNCTION public.log_room_availability_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.is_available IS DISTINCT FROM OLD.is_available THEN
        INSERT INTO security_events (
            actor_id, action, resource_type, resource_id, result, detail
        )
        VALUES (
            auth.uid(), 'room.availability_changed', 'room', NEW.id::TEXT, 'allowed',
            jsonb_build_object(
                'from', jsonb_build_object('status', OLD.status, 'is_available', OLD.is_available),
                'to', jsonb_build_object('status', NEW.status, 'is_available', NEW.is_available),
                'property_id', NEW.property_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rooms_log_availability ON rooms;
CREATE TRIGGER rooms_log_availability
AFTER UPDATE OF status, is_available ON rooms
FOR EACH ROW
EXECUTE FUNCTION public.log_room_availability_change();

CREATE OR REPLACE FUNCTION public.log_property_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.verification_state IS DISTINCT FROM OLD.verification_state
       OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
        INSERT INTO security_events (
            actor_id, action, resource_type, resource_id, result, detail
        )
        VALUES (
            auth.uid(),
            CASE WHEN NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
                 THEN 'property.deleted' ELSE 'property.status_changed' END,
            'property', NEW.id::TEXT, 'allowed',
            jsonb_build_object(
                'from', jsonb_build_object('status', OLD.status, 'verification_state', OLD.verification_state),
                'to', jsonb_build_object('status', NEW.status, 'verification_state', NEW.verification_state),
                'campus_id', NEW.campus_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_log_status ON properties;
CREATE TRIGGER properties_log_status
AFTER UPDATE OF status, verification_state, deleted_at ON properties
FOR EACH ROW
EXECUTE FUNCTION public.log_property_status_change();

CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        INSERT INTO security_events (
            actor_id, action, resource_type, resource_id, result, detail
        )
        VALUES (
            auth.uid(), 'profile.role_changed', 'profile', NEW.id::TEXT, 'allowed',
            jsonb_build_object('from', OLD.role, 'to', NEW.role)
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_log_role_change ON profiles;
CREATE TRIGGER profiles_log_role_change
AFTER UPDATE OF role ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_role_change();

-- ============================================================
-- 7. REFRESH PLANNER STATISTICS
-- ============================================================

ANALYZE bookings;
ANALYZE payments;
ANALYZE properties;
ANALYZE rooms;
ANALYZE media;
ANALYZE reviews;
