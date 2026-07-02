-- ============================================
-- 005: PROFILE CREATION VIA AUTH TRIGGER
-- Run after 004_review_integrity.sql. Idempotent — safe to re-run.
--
-- Profiles were inserted client-side after supabase.auth.signUp(). With
-- email confirmation enabled, signUp returns no session, so that insert
-- ran as anon and was silently rejected by RLS — the user ended up with
-- no profile row. Profiles are now created by a trigger on auth.users,
-- which runs for every signup regardless of confirmation settings.
--
-- The profiles trigger protect_profile_privileged_columns (003) exempts
-- requests where auth.uid() IS NULL, which covers this trigger's insert.
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, phone, role)
    VALUES (
        NEW.id,
        NEW.email,
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
        'student'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Backfill: create profiles for existing users whose client-side insert
-- was silently rejected
INSERT INTO public.profiles (id, email, full_name, phone, role)
SELECT
    u.id,
    u.email,
    NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'phone'), ''),
    'student'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
