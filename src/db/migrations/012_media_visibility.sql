-- ============================================================
-- 012: Media follows the visibility of the thing it belongs to
-- ============================================================
-- media_public_read said, in full:
--
--   USING (deleted_at IS NULL)
--
-- Every non-deleted row, to anon. media is polymorphic — entity_type is
-- one of property, room, university, campus, inspection — and the policy
-- never looked at what the row was attached to. So anon could read:
--
--   * photos of draft and unpublished properties, with entity_id naming
--     the property, alt_text describing it, and url fetching it;
--   * photos of rooms in those properties;
--   * inspection photos. inspections themselves are admin-only
--     (inspections_admin_read, TO authenticated, admin check) — their
--     media was not.
--
-- 011 stopped property_listings handing out unpublished rows, but media
-- is its own table with its own endpoint, so it needed its own fix.
--
-- ── The correlated subqueries here are deliberate ───────────
--
-- 010 wrapped auth functions in (SELECT ...) so the planner hoists them
-- to an InitPlan. That is not possible here and should not be attempted:
-- these EXISTS clauses take media.entity_id, so the result genuinely
-- differs per row. Each one is a primary-key lookup on a table that is
-- already indexed, and on the public path media is only read through
-- property_listings, which is behind unstable_cache — so this runs on a
-- cache miss, not per visitor.

DROP POLICY IF EXISTS "media_public_read" ON media;
CREATE POLICY "media_public_read" ON media FOR SELECT TO anon, authenticated USING (
    deleted_at IS NULL
    AND CASE entity_type
        WHEN 'property' THEN EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = media.entity_id
              AND p.status = 'published'
              AND p.deleted_at IS NULL
        )
        WHEN 'room' THEN EXISTS (
            SELECT 1 FROM rooms r
            JOIN properties p ON p.id = r.property_id
            WHERE r.id = media.entity_id
              AND r.deleted_at IS NULL
              AND p.status = 'published'
              AND p.deleted_at IS NULL
        )
        WHEN 'university' THEN EXISTS (
            SELECT 1 FROM universities u
            WHERE u.id = media.entity_id
              AND u.is_active = TRUE
              AND u.deleted_at IS NULL
        )
        WHEN 'campus' THEN EXISTS (
            SELECT 1 FROM campuses c
            WHERE c.id = media.entity_id
              AND c.is_active = TRUE
              AND c.deleted_at IS NULL
        )
        -- 'inspection', and anything added to the CHECK later without
        -- being considered here. Default closed.
        ELSE FALSE
    END
);

-- Admins are unaffected: media_admin_write is FOR ALL and permissive, so
-- it ORs with the above and still covers drafts and inspection photos.

-- ── storage.objects: stop anonymous enumeration ─────────────
--
-- 006 created property-media as a public bucket and then granted:
--
--   CREATE POLICY "property_media_public_read" ON storage.objects
--       FOR SELECT TO public USING (bucket_id = 'property-media');
--
-- On a public bucket that SELECT grant does not serve the images — the
-- /object/public/<bucket>/<path> route bypasses RLS, which is what makes
-- the bucket public in the first place. What the grant does serve is the
-- list API, so anyone could enumerate every object in the bucket and walk
-- straight to the files the media policy above now hides.
--
-- Nothing in the app lists the bucket. The admin CMS uploads (INSERT),
-- deletes (DELETE) and builds URLs with getPublicUrl(), which is string
-- concatenation in the client and touches no policy. So the public SELECT
-- can go, replaced with an admin one to keep the CMS whole.
DROP POLICY IF EXISTS "property_media_public_read" ON storage.objects;

DROP POLICY IF EXISTS "property_media_admin_read" ON storage.objects;
CREATE POLICY "property_media_admin_read" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'property-media' AND (SELECT public.is_admin()));

-- ── What this does NOT do ───────────────────────────────────
--
-- property-media is still a public bucket. Anyone already holding an
-- object URL keeps being able to fetch it, and no policy changes that —
-- public buckets skip RLS on that route by design.
--
-- What changes is that the URLs are no longer discoverable: the media
-- table no longer lists them and the bucket no longer enumerates. Paths
-- are property/<property_id>/<random uuid>.<ext>, so there is nothing
-- left to guess.
--
-- Closing it completely means making the bucket private and moving to
-- signed URLs. That is a real architectural change, not a policy tweak:
-- signed URLs expire, so they cannot sit in an ISR-cached page, and the
-- caching model in the README is what lets one campus serve an intake off
-- a handful of renders. Worth doing only if the photos themselves are
-- ever sensitive — which, for listing photography meant to be seen, they
-- are not.

-- ── Verification ────────────────────────────────────────────
-- 1. Anon sees no media belonging to anything unpublished. Expect 0.
--
--   SET ROLE anon;
--   SELECT count(*) FROM media;                     -- published only
--   SELECT count(*) FROM media WHERE entity_type = 'inspection';  -- 0
--   RESET ROLE;
--
-- 2. Compare against the truth, as a superuser. The first number should
--    equal the anon count above; the second is what was leaking.
--
--   SELECT count(*) FILTER (WHERE m.entity_type = 'property'
--                             AND p.status = 'published') AS visible,
--          count(*) FILTER (WHERE m.entity_type = 'property'
--                             AND p.status <> 'published') AS was_leaking
--   FROM media m JOIN properties p ON p.id = m.entity_id
--   WHERE m.entity_type = 'property' AND m.deleted_at IS NULL;
--
-- 3. Images must still render on a published property page. This is the
--    one thing to check by eye after applying: it is the step that would
--    break if the public-bucket route did consult RLS after all.
