-- ============================================================
-- 011: Make the listing views run as the querying user
-- ============================================================
-- Postgres creates views SECURITY DEFINER by default: the view runs with
-- its owner's rights, and the owner here is the role that ran the
-- migrations, which owns the underlying tables. RLS is not enforced for a
-- table's owner, so every policy on properties/rooms/media is skipped when
-- the query arrives through one of these views.
--
-- ── Why this is not only a lint on property_listings ────────
--
-- property_listings filters `WHERE p.deleted_at IS NULL` and nothing else.
-- It never filters status. The app always adds `.eq("status","published")`
-- itself, so the pages are correct — but the anon key is public by design
-- (it ships in the browser bundle), and PostgREST exposes the view
-- directly. So this, today, returns draft, unpublished and archived
-- properties to anyone who asks:
--
--   curl "$SUPABASE_URL/rest/v1/property_listings?select=*" \
--        -H "apikey: $ANON_KEY"
--
-- That is address, latitude, longitude, description and pricing for
-- listings the team has not published yet. `properties_public_read`
-- already says `status = 'published' AND deleted_at IS NULL`; the view was
-- simply bypassing it.
--
-- security_invoker makes the caller's policies apply, which closes that
-- without duplicating the predicate in the view — public traffic gets
-- published rows, and a campus admin still sees their own drafts through
-- properties_admin_write. One definition, correct for both.
--
-- Requires Postgres 15+ (Supabase is well past that).

-- ── property_listings ───────────────────────────────────────
-- Columns and joins are unchanged; only the rights change.
ALTER VIEW public.property_listings SET (security_invoker = on);

-- ── room_listings ───────────────────────────────────────────
-- Recreated rather than altered, because the join has to change too.
--
-- The join to properties was LEFT. Under invoker rights a LEFT JOIN would
-- still emit rooms belonging to properties the caller cannot see, just
-- with property_title and property_slug nulled out — the room's own name,
-- description and price would still leak. rooms.property_id is NOT NULL
-- (001, line 167), so an inner join drops nothing legitimate and makes an
-- invisible property hide its rooms.
--
-- The join to buildings stays LEFT: rooms.building_id is nullable.
CREATE OR REPLACE VIEW public.room_listings
WITH (security_invoker = on) AS
SELECT
    r.id,
    r.property_id,
    p.title AS property_title,
    p.slug AS property_slug,
    p.campus_id,
    r.building_id,
    b.name AS building_name,
    r.name,
    r.description,
    r.room_type,
    r.floor,
    r.size_sqm,
    r.max_occupancy,
    r.price_per_month,
    r.currency,
    r.deposit_months,
    r.is_available,
    r.amenities,
    r.status,
    r.created_at,
    r.updated_at,
    (
        SELECT m.url
        FROM media m
        WHERE m.entity_type = 'room' AND m.entity_id = r.id AND m.deleted_at IS NULL
        ORDER BY m.is_featured DESC, m.display_order ASC
        LIMIT 1
    ) AS media_url,
    (
        SELECT COUNT(*)::INTEGER
        FROM media m
        WHERE m.entity_type = 'room' AND m.entity_id = r.id AND m.deleted_at IS NULL
    ) AS media_count
FROM rooms r
JOIN properties p ON p.id = r.property_id
LEFT JOIN buildings b ON b.id = r.building_id
WHERE r.deleted_at IS NULL;

-- ── public_profiles: deliberately left SECURITY DEFINER ─────
--
--   DO NOT "fix" this one. The linter flags it, and it must stay flagged.
--
-- 003 dropped `profiles_public_read` on purpose: profiles holds role,
-- phone and soft-delete state, and nothing anonymous should read that
-- table. What remains is `profiles_self_read` (id = auth.uid()) plus the
-- admin policies — all TO authenticated, none granting anon anything.
--
-- public_profiles is the sanctioned way back out: three harmless columns
-- (id, full_name, avatar_url), active rows only, granted to anon. It is
-- SECURITY DEFINER *because* that is what lets it cross the RLS boundary
-- it was built to cross. That is the standard Postgres pattern for a
-- curated projection, not an oversight.
--
-- Setting security_invoker on it would mean anon matches no policy and
-- gets zero rows, and a signed-in student matches only their own row. The
-- visible breakage is review attribution on the property page:
--
--   .select("id, overall_rating, comment, created_at,
--            profiles:public_profiles(full_name, avatar_url)")
--
-- Every review would render with a missing author.
--
-- The alternative — granting anon SELECT on profiles and flipping the
-- view — is worse, not better. RLS is row-level, so a policy permissive
-- enough to feed the view opens whole profile rows, and column-level
-- GRANTs only bite after REVOKEing the blanket SELECT that Supabase
-- issues to anon/authenticated, which would take profiles_self_read down
-- with it. More moving parts, wider surface, same three columns exposed.
--
-- So: dismiss this finding in the Supabase advisor rather than resolving
-- it. Left here uncommented-out on purpose, as the thing NOT to run:
--
--   -- ALTER VIEW public.public_profiles SET (security_invoker = on);

-- ── Verification ────────────────────────────────────────────
-- Expect exactly three rows: the two listing views ON, public_profiles OFF.
--
--   SELECT c.relname,
--          COALESCE(
--            (SELECT o FROM unnest(c.reloptions) o WHERE o LIKE 'security_invoker=%'),
--            'security_invoker=off (definer)'
--          ) AS setting
--   FROM pg_class c
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE c.relkind = 'v' AND n.nspname = 'public'
--   ORDER BY c.relname;
--
-- And the leak itself, which should now come back empty for anon:
--
--   SET ROLE anon;
--   SELECT count(*) FROM property_listings WHERE status <> 'published';
--   RESET ROLE;
