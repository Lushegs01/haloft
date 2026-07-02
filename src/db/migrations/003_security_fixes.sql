-- ============================================
-- 003: SECURITY FIXES
-- Run after 002_booking_integrity.sql. Idempotent — safe to run on a
-- database that already has (any state of) the 001 policies.
--
-- Fixes:
--   1. Role checks via SECURITY DEFINER helpers (avoids RLS recursion on
--      profiles and replaces the malformed admin-write policies from 001)
--   2. Privilege escalation: users could set their own profiles.role —
--      now blocked by a trigger; profile inserts are forced to 'student'
--   3. profiles_super_admin_all checked the target row's role instead of
--      the caller's — any user could edit/delete super_admin profiles
--   4. PII exposure: landlords (bank_account, tax_id, phone, email) and
--      profiles (email, phone) were readable by anonymous visitors —
--      landlords are now admin-only; public reviewer info goes through
--      the public_profiles view (id, full_name, avatar_url only)
--   5. Students could INSERT/UPDATE bookings with arbitrary status and
--      prices — those policies are dropped; all student booking writes
--      go through the create_booking/cancel_booking functions from 002
-- ============================================

-- ============================================
-- 1. ROLE HELPER FUNCTIONS
-- SECURITY DEFINER so they can read profiles without recursing into
-- profiles' own RLS policies.
-- ============================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM profiles
    WHERE id = auth.uid() AND is_active = TRUE AND deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.current_user_role() IN ('admin', 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.current_user_role() = 'super_admin';
$$;

CREATE OR REPLACE FUNCTION public.is_campus_admin(p_campus_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.is_super_admin() OR (
        public.current_user_role() = 'admin' AND EXISTS (
            SELECT 1 FROM admin_campus_assignments
            WHERE admin_id = auth.uid() AND campus_id = p_campus_id
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.is_property_admin(p_property_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM properties pr
        WHERE pr.id = p_property_id AND public.is_campus_admin(pr.campus_id)
    );
$$;

-- ============================================
-- 2. PROFILES: lock down reads, block role self-escalation
-- ============================================

DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
DROP POLICY IF EXISTS "profiles_self_write" ON profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_super_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_self_read" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_read" ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;

CREATE POLICY "profiles_self_read" ON profiles FOR SELECT TO authenticated
    USING (id = auth.uid());
CREATE POLICY "profiles_admin_read" ON profiles FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "profiles_self_insert" ON profiles FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE TO authenticated
    USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_super_admin_all" ON profiles FOR ALL TO authenticated
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Only super admins may change role / account status. Inserts from
-- regular signups are forced to the student role. Requests without a
-- JWT (service_role, direct SQL) are exempt.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL OR public.is_super_admin() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.role := 'student';
        NEW.is_active := TRUE;
        NEW.deleted_at := NULL;
    ELSIF NEW.role IS DISTINCT FROM OLD.role
        OR NEW.is_active IS DISTINCT FROM OLD.is_active
        OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
        RAISE EXCEPTION 'PROFILE_PRIVILEGED_COLUMNS';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_privileged_columns ON profiles;
CREATE TRIGGER profiles_protect_privileged_columns
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- Safe public projection of profiles for review listings etc.
-- Owned by the migration role, so it bypasses profiles RLS by design and
-- exposes only these three columns of active accounts.
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, full_name, avatar_url
FROM profiles
WHERE is_active = TRUE AND deleted_at IS NULL;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ============================================
-- 3. LANDLORDS: admin-only (bank details, tax ids, contacts)
-- ============================================

DROP POLICY IF EXISTS "landlords_public_read" ON landlords;
DROP POLICY IF EXISTS "landlords_admin_read" ON landlords;
DROP POLICY IF EXISTS "landlords_admin_write" ON landlords;

CREATE POLICY "landlords_admin_read" ON landlords FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "landlords_admin_write" ON landlords FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- 4. ADMIN WRITE POLICIES (replaces the malformed 001 versions)
-- ============================================

DROP POLICY IF EXISTS "properties_admin_write" ON properties;
DROP POLICY IF EXISTS "buildings_admin_write" ON buildings;
DROP POLICY IF EXISTS "rooms_admin_write" ON rooms;

CREATE POLICY "properties_admin_write" ON properties FOR ALL TO authenticated
    USING (public.is_campus_admin(campus_id))
    WITH CHECK (public.is_campus_admin(campus_id));

CREATE POLICY "buildings_admin_write" ON buildings FOR ALL TO authenticated
    USING (public.is_property_admin(property_id))
    WITH CHECK (public.is_property_admin(property_id));

CREATE POLICY "rooms_admin_write" ON rooms FOR ALL TO authenticated
    USING (public.is_property_admin(property_id))
    WITH CHECK (public.is_property_admin(property_id));

-- ============================================
-- 5. BOOKINGS: students no longer write rows directly
-- All student booking mutations go through create_booking/cancel_booking
-- (002), which validate status, pricing, and availability server-side.
-- ============================================

DROP POLICY IF EXISTS "bookings_student_write" ON bookings;
DROP POLICY IF EXISTS "bookings_student_update" ON bookings;
