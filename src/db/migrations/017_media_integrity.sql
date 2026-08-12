-- ============================================================
-- 017: ONE COVER PHOTO, AND STORAGE THAT FOLLOWS THE PROPERTY
-- Run after 016_verification_state_machines.sql. Idempotent.
-- ============================================================
-- Two separate problems, both about media.
--
-- ── 1. Setting a cover photo was two statements ─────────────
--
-- The admin CMS did:
--
--     UPDATE media SET is_featured = false WHERE entity = <property>;
--     UPDATE media SET is_featured = true  WHERE id = <the one>;
--
-- from the browser, as two round trips. Between them the property has no
-- cover at all, and the listing view — which orders by is_featured DESC —
-- picks an arbitrary photo for anyone loading the page in that window.
-- Two operators doing it at once can leave two covers set, or none.
--
-- The fix is the usual one: do it in the database, in one transaction,
-- and add the index that makes the bad state unrepresentable.
--
-- ── 2. Storage authorisation was bucket-wide ────────────────
--
-- The property-media policies asked only `public.is_admin()`. A campus
-- admin for Ibadan could write and delete objects belonging to a FUNAAB
-- property — not through the CMS, which never offers it, but the grant
-- was there, and the `media` rows those objects back are campus-scoped.
-- Storage was the loose end.
--
-- Objects are stored at `property/<property_id>/<uuid>.<ext>`, so the
-- property is in the path and authorisation can follow it: the same
-- is_property_admin() check the rest of the schema already uses.

-- ============================================================
-- 1. ONE COVER PER ENTITY
-- ============================================================

-- Fix any entity that already carries more than one cover: keep the
-- lowest display_order, demote the rest. Without this the index below
-- cannot be created.
WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY entity_type, entity_id
               ORDER BY display_order ASC, created_at ASC, id ASC
           ) AS rn
    FROM media
    WHERE is_featured AND deleted_at IS NULL
)
UPDATE media m SET is_featured = FALSE
FROM ranked r
WHERE m.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_media_one_featured_per_entity
    ON media(entity_type, entity_id)
    WHERE is_featured AND deleted_at IS NULL;

/**
 * Makes one photo the cover for its entity, atomically.
 *
 * Order matters: the demote must land before the promote or the unique
 * index rejects the pair. Inside one transaction that is invisible to
 * readers — nobody ever observes zero covers or two.
 */
CREATE OR REPLACE FUNCTION public.set_featured_media(p_media_id UUID)
RETURNS public.media
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_media media%ROWTYPE;
    v_property_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;

    SELECT * INTO v_media FROM media
    WHERE id = p_media_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'MEDIA_NOT_FOUND';
    END IF;

    -- Authorise against the thing the photo belongs to, not the bucket.
    v_property_id := public.media_property_id(v_media.entity_type, v_media.entity_id);

    IF v_property_id IS NOT NULL THEN
        IF NOT public.is_property_admin(v_property_id) THEN
            RAISE EXCEPTION 'ADMIN_ONLY';
        END IF;
    ELSIF NOT public.is_admin() THEN
        -- university / campus / inspection media: no property to scope to
        RAISE EXCEPTION 'ADMIN_ONLY';
    END IF;

    -- Lock the whole set for this entity so two operators racing on the
    -- same property serialise instead of colliding on the index.
    PERFORM 1 FROM media
    WHERE entity_type = v_media.entity_type
      AND entity_id = v_media.entity_id
      AND deleted_at IS NULL
    FOR UPDATE;

    UPDATE media SET is_featured = FALSE
    WHERE entity_type = v_media.entity_type
      AND entity_id = v_media.entity_id
      AND deleted_at IS NULL
      AND is_featured
      AND id <> p_media_id;

    UPDATE media SET is_featured = TRUE
    WHERE id = p_media_id
    RETURNING * INTO v_media;

    RETURN v_media;
END;
$$;

REVOKE ALL ON FUNCTION public.set_featured_media(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_featured_media(UUID) TO authenticated, service_role;

-- ============================================================
-- 2. WHICH PROPERTY DOES THIS MEDIA BELONG TO?
-- ============================================================
-- Property media names its property directly; room media names a room,
-- whose property is one hop away. Everything else has no property, and
-- says so rather than guessing.

CREATE OR REPLACE FUNCTION public.media_property_id(p_entity_type TEXT, p_entity_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE p_entity_type
        WHEN 'property' THEN (SELECT id FROM properties WHERE id = p_entity_id)
        WHEN 'room' THEN (SELECT property_id FROM rooms WHERE id = p_entity_id)
        WHEN 'inspection' THEN (SELECT property_id FROM inspections WHERE id = p_entity_id)
        ELSE NULL
    END;
$$;

GRANT EXECUTE ON FUNCTION public.media_property_id(TEXT, UUID) TO authenticated, service_role;

-- ============================================================
-- 3. MEDIA WRITES FOLLOW THE PROPERTY
-- ============================================================
-- 001 gave every admin write access to every media row. Campus scoping
-- for media now matches campus scoping for the properties and rooms the
-- media hangs off — the same is_property_admin() used since 003.

DROP POLICY IF EXISTS "media_admin_write" ON media;

CREATE POLICY "media_admin_write" ON media FOR ALL TO authenticated
    USING (
        CASE
            WHEN public.media_property_id(entity_type, entity_id) IS NOT NULL
            THEN public.is_property_admin(public.media_property_id(entity_type, entity_id))
            -- university / campus media is platform-level
            ELSE (SELECT public.is_super_admin())
        END
    )
    WITH CHECK (
        CASE
            WHEN public.media_property_id(entity_type, entity_id) IS NOT NULL
            THEN public.is_property_admin(public.media_property_id(entity_type, entity_id))
            ELSE (SELECT public.is_super_admin())
        END
    );

-- ============================================================
-- 4. STORAGE OBJECTS FOLLOW THE PROPERTY TOO
-- ============================================================

/** A cast that returns NULL instead of raising on a malformed path. */
CREATE OR REPLACE FUNCTION public.try_uuid(p_value TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN p_value::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.try_uuid(TEXT) TO authenticated, anon, service_role;

/**
 * The property an object path names, for `property/<uuid>/<file>`.
 * Anything else in the bucket returns NULL and is therefore reachable
 * only by a super admin — a path shape nobody writes today, so a new one
 * appearing is a thing to notice, not to silently permit.
 */
CREATE OR REPLACE FUNCTION public.storage_object_property_id(p_name TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
    SELECT CASE
        WHEN (storage.foldername(p_name))[1] = 'property'
        THEN public.try_uuid((storage.foldername(p_name))[2])
        ELSE NULL
    END;
$$;

GRANT EXECUTE ON FUNCTION public.storage_object_property_id(TEXT) TO authenticated, anon, service_role;

DROP POLICY IF EXISTS "property_media_admin_insert" ON storage.objects;
CREATE POLICY "property_media_admin_insert" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'property-media'
        AND public.storage_object_property_id(name) IS NOT NULL
        AND public.is_property_admin(public.storage_object_property_id(name))
    );

-- Update / delete / list: scoped the same way. A path that names no
-- property (nothing writes one today) falls back to super admin rather
-- than to "any admin" — is_property_admin(NULL) is FALSE, not NULL, so
-- this has to be a CASE and not a COALESCE.
DROP POLICY IF EXISTS "property_media_admin_update" ON storage.objects;
CREATE POLICY "property_media_admin_update" ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'property-media'
        AND CASE
            WHEN public.storage_object_property_id(name) IS NOT NULL
            THEN public.is_property_admin(public.storage_object_property_id(name))
            ELSE (SELECT public.is_super_admin())
        END
    );

DROP POLICY IF EXISTS "property_media_admin_delete" ON storage.objects;
CREATE POLICY "property_media_admin_delete" ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'property-media'
        AND CASE
            WHEN public.storage_object_property_id(name) IS NOT NULL
            THEN public.is_property_admin(public.storage_object_property_id(name))
            ELSE (SELECT public.is_super_admin())
        END
    );

DROP POLICY IF EXISTS "property_media_admin_read" ON storage.objects;
CREATE POLICY "property_media_admin_read" ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'property-media'
        AND CASE
            WHEN public.storage_object_property_id(name) IS NOT NULL
            THEN public.is_property_admin(public.storage_object_property_id(name))
            ELSE (SELECT public.is_super_admin())
        END
    );

-- ============================================================
-- 5. WHAT THE BUCKET ACCEPTS
-- ============================================================
-- Unchanged limits, restated so a re-run of 006 cannot widen them, and
-- so this file is the single place they are declared.
--
-- The MIME type here is what the CLIENT claims. It is a filter, not a
-- guarantee — src/lib/images.ts reads the file's actual signature bytes
-- server-side before anything is stored, because a .exe renamed .jpg
-- announces itself as image/jpeg just as convincingly.

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'property-media';
