-- ============================================================
-- 010: Stop RLS policies re-evaluating auth functions per row
-- ============================================================
-- Postgres treats `auth.uid()` written bare in a policy as something it
-- must call for every candidate row. Wrapped in a scalar subquery —
-- `(select auth.uid())` — the planner hoists it to an InitPlan and calls
-- it once for the whole statement. On a page of 24 listings that is the
-- difference between 24 calls and 1; on an admin table scan it is the
-- difference between one profiles lookup per row and one per query.
--
-- The same applies to the SECURITY DEFINER helpers from 003
-- (is_admin / is_super_admin), which each run a profiles lookup.
--
-- ── What is deliberately NOT changed ────────────────────────
--
--   properties_admin_write, buildings_admin_write, rooms_admin_write
--
-- use is_campus_admin(campus_id) / is_property_admin(property_id), which
-- take a column as an argument. Their result genuinely differs per row,
-- so `(select ...)` would build a correlated subquery that cannot be
-- hoisted — no gain, and a misleading read. They are left alone.
--
--   bookings_student_write, bookings_student_update
--
-- were dropped in 003 on purpose: students mutate bookings only through
-- create_booking/cancel_booking, which validate status, pricing and
-- availability server-side. This migration must not resurrect them.
--
-- Every predicate below is otherwise character-for-character what it
-- replaces. Nobody gains or loses access.

-- ── profiles (from 003) ─────────────────────────────────────
DROP POLICY IF EXISTS "profiles_self_read" ON profiles;
CREATE POLICY "profiles_self_read" ON profiles FOR SELECT TO authenticated
    USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "profiles_admin_read" ON profiles;
CREATE POLICY "profiles_admin_read" ON profiles FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "profiles_self_insert" ON profiles;
CREATE POLICY "profiles_self_insert" ON profiles FOR INSERT TO authenticated
    WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE TO authenticated
    USING (id = (SELECT auth.uid()))
    WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "profiles_super_admin_all" ON profiles;
CREATE POLICY "profiles_super_admin_all" ON profiles FOR ALL TO authenticated
    USING ((SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.is_super_admin()));

-- ── landlords (from 003) ────────────────────────────────────
DROP POLICY IF EXISTS "landlords_admin_read" ON landlords;
CREATE POLICY "landlords_admin_read" ON landlords FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "landlords_admin_write" ON landlords;
CREATE POLICY "landlords_admin_write" ON landlords FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- ── admin_campus_assignments ────────────────────────────────
DROP POLICY IF EXISTS "admin_assignments_read" ON admin_campus_assignments;
CREATE POLICY "admin_assignments_read" ON admin_campus_assignments FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "admin_assignments_super_admin_write" ON admin_campus_assignments;
CREATE POLICY "admin_assignments_super_admin_write" ON admin_campus_assignments FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'super_admin')
) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'super_admin')
);

-- ── bookings ────────────────────────────────────────────────
DROP POLICY IF EXISTS "bookings_student_read" ON bookings;
CREATE POLICY "bookings_student_read" ON bookings FOR SELECT TO authenticated USING (
    student_id = (SELECT auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'super_admin')
);

DROP POLICY IF EXISTS "bookings_admin_campus_read" ON bookings;
CREATE POLICY "bookings_admin_campus_read" ON bookings FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN admin_campus_assignments aca ON aca.admin_id = p.id
        JOIN properties pr ON pr.campus_id = aca.campus_id
        WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin' AND pr.id = bookings.property_id
    )
);

DROP POLICY IF EXISTS "bookings_admin_campus_write" ON bookings;
CREATE POLICY "bookings_admin_campus_write" ON bookings FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN admin_campus_assignments aca ON aca.admin_id = p.id
        JOIN properties pr ON pr.campus_id = aca.campus_id
        WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin' AND pr.id = bookings.property_id
    )
);

-- ── payments ────────────────────────────────────────────────
DROP POLICY IF EXISTS "payments_student_read" ON payments;
CREATE POLICY "payments_student_read" ON payments FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM bookings WHERE id = payments.booking_id AND student_id = (SELECT auth.uid())) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'super_admin')
);

DROP POLICY IF EXISTS "payments_admin_read" ON payments;
CREATE POLICY "payments_admin_read" ON payments FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

DROP POLICY IF EXISTS "payments_admin_write" ON payments;
CREATE POLICY "payments_admin_write" ON payments FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin'))
);

-- ── reviews ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "reviews_student_read" ON reviews;
CREATE POLICY "reviews_student_read" ON reviews FOR SELECT TO authenticated USING (
    student_id = (SELECT auth.uid()) OR is_approved = TRUE
);

DROP POLICY IF EXISTS "reviews_student_write" ON reviews;
CREATE POLICY "reviews_student_write" ON reviews FOR INSERT TO authenticated
    WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "reviews_student_update" ON reviews;
CREATE POLICY "reviews_student_update" ON reviews FOR UPDATE TO authenticated
    USING (student_id = (SELECT auth.uid()))
    WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "reviews_admin_moderate" ON reviews;
CREATE POLICY "reviews_admin_moderate" ON reviews FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin'))
);

-- ── favorites ───────────────────────────────────────────────
DROP POLICY IF EXISTS "favorites_student_read" ON favorites;
CREATE POLICY "favorites_student_read" ON favorites FOR SELECT TO authenticated
    USING (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "favorites_student_write" ON favorites;
CREATE POLICY "favorites_student_write" ON favorites FOR ALL TO authenticated
    USING (student_id = (SELECT auth.uid()))
    WITH CHECK (student_id = (SELECT auth.uid()));

-- ── inspections ─────────────────────────────────────────────
DROP POLICY IF EXISTS "inspections_admin_read" ON inspections;
CREATE POLICY "inspections_admin_read" ON inspections FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "inspections_admin_write" ON inspections;
CREATE POLICY "inspections_admin_write" ON inspections FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin'))
);

-- ── notifications ───────────────────────────────────────────
DROP POLICY IF EXISTS "notifications_user_read" ON notifications;
CREATE POLICY "notifications_user_read" ON notifications FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "notifications_user_update" ON notifications;
CREATE POLICY "notifications_user_update" ON notifications FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "notifications_system_write" ON notifications;
CREATE POLICY "notifications_system_write" ON notifications FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin'))
);

-- ── audit_logs ──────────────────────────────────────────────
DROP POLICY IF EXISTS "audit_logs_admin_read" ON audit_logs;
CREATE POLICY "audit_logs_admin_read" ON audit_logs FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin'))
);

-- ── media ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "media_admin_write" ON media;
CREATE POLICY "media_admin_write" ON media FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin'))
);

-- ── storage.objects (from 006) ──────────────────────────────
DROP POLICY IF EXISTS "property_media_admin_insert" ON storage.objects;
CREATE POLICY "property_media_admin_insert" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'property-media' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "property_media_admin_update" ON storage.objects;
CREATE POLICY "property_media_admin_update" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'property-media' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "property_media_admin_delete" ON storage.objects;
CREATE POLICY "property_media_admin_delete" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'property-media' AND (SELECT public.is_admin()));

-- ── Verification ────────────────────────────────────────────
-- Should return zero rows. Anything listed still calls an auth function
-- bare, and the Supabase linter will keep flagging it.
--
--   SELECT schemaname, tablename, policyname
--   FROM pg_policies
--   WHERE (qual ~ '(?<!select )auth\.(uid|role|jwt)\(\)'
--       OR with_check ~ '(?<!select )auth\.(uid|role|jwt)\(\)')
--     AND schemaname IN ('public', 'storage');
