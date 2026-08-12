-- ============================================================
-- 019: property_listings is about PROPERTIES again
-- Run after 018_indexes_and_security_log.sql. Idempotent.
-- ============================================================
-- This is a correctness fix, not a feature. It came out of writing
-- scripts/test-db/03_explain_queries.sql: the first EXPLAIN, on the
-- catalogue's hottest query, failed with
--
--     ERROR: column "featured_order" does not exist
--
-- ── What happened ───────────────────────────────────────────
--
-- 013_annual_pricing.sql had to drop both listing views to change the
-- columns underneath them, and when it recreated them it gave BOTH the
-- room-shaped body:
--
--     CREATE VIEW property_listings AS SELECT ... FROM rooms r JOIN properties p ...
--     CREATE VIEW room_listings AS SELECT * FROM property_listings;
--
-- So `property_listings` — which the entire public catalogue reads —
-- started returning one row per ROOM, with room columns. Every query in
-- src/lib/data/campus.ts asks it for `featured_order`, `neighbourhood_id`,
-- `min_price`, `title`, `slug`, `avg_rating`; none of those exist on it
-- any more. src/types/database.ts still describes the property shape, so
-- TypeScript never noticed: the types and the database disagreed, and the
-- types were the ones that were right.
--
-- The effect is that the campus home page, the search page, the listing
-- page and the sitemap all fail against a database migrated to 013. The
-- app compiles, the tests pass, and the catalogue is empty — which is
-- exactly the kind of break that survives a review, because nothing in
-- the codebase is wrong. Only the schema is.
--
-- ── What this does ──────────────────────────────────────────
--
--   property_listings — one row per property, the shape the catalogue
--                       and src/types/database.ts have always expected,
--                       plus letting_mode, which the annual model added.
--   room_listings     — one row per room; 013's body, kept, because that
--                       part was right and getPropertyRooms depends on it.
--
-- Both keep security_invoker (011) so RLS is evaluated as the querying
-- user, and both keep the inner join to properties so an unpublished
-- property cannot leak its units.

DROP VIEW IF EXISTS public.room_listings;
DROP VIEW IF EXISTS public.property_listings;

-- ── One row per property ────────────────────────────────────
-- The LATERAL joins replace the correlated subqueries 001 used and 008
-- removed; keeping them means the cover photo and media count are one
-- indexed lookup each rather than a scan per row.
CREATE VIEW public.property_listings
WITH (security_invoker = on) AS
SELECT
    p.id,
    p.campus_id,
    p.neighbourhood_id,
    n.name AS neighbourhood_name,
    p.title,
    p.slug,
    p.description,
    p.address,
    p.latitude,
    p.longitude,
    p.property_type,
    p.status,
    p.letting_mode,
    p.total_rooms,
    p.available_rooms,
    p.min_price,
    p.max_price,
    p.currency,
    p.amenities,
    p.rules,
    p.is_verified,
    p.verification_state,
    p.featured_order,
    p.created_at,
    p.updated_at,
    feat.url AS media_url,
    COALESCE(mc.media_count, 0) AS media_count,
    p.avg_rating,
    p.review_count
FROM properties p
LEFT JOIN neighbourhoods n ON n.id = p.neighbourhood_id
LEFT JOIN LATERAL (
    SELECT m.url
    FROM media m
    WHERE m.entity_type = 'property' AND m.entity_id = p.id AND m.deleted_at IS NULL
    ORDER BY m.is_featured DESC, m.display_order ASC
    LIMIT 1
) feat ON TRUE
LEFT JOIN LATERAL (
    SELECT COUNT(*)::INTEGER AS media_count
    FROM media m
    WHERE m.entity_type = 'property' AND m.entity_id = p.id AND m.deleted_at IS NULL
) mc ON TRUE
WHERE p.deleted_at IS NULL;

-- ── One row per room ────────────────────────────────────────
CREATE VIEW public.room_listings
WITH (security_invoker = on) AS
SELECT
    r.id,
    r.property_id,
    p.title AS property_title,
    p.slug AS property_slug,
    p.campus_id,
    p.letting_mode,
    r.building_id,
    b.name AS building_name,
    r.name,
    r.description,
    r.room_type,
    r.floor,
    r.size_sqm,
    r.max_occupancy,
    r.annual_rent,
    r.agency_fee,
    r.caution_fee,
    (r.annual_rent + r.agency_fee + r.caution_fee) AS total_payable,
    r.currency,
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

GRANT SELECT ON public.property_listings TO anon, authenticated, service_role;
GRANT SELECT ON public.room_listings TO anon, authenticated, service_role;

-- ── Verification ────────────────────────────────────────────
-- Both of these must return rows on a seeded database. The first was
-- returning an error before this migration, and the second is here so a
-- future migration cannot quietly swap them again.
--
--   SELECT id, title, featured_order, min_price FROM property_listings
--   WHERE status = 'published' LIMIT 5;
--
--   SELECT id, property_title, annual_rent, total_payable FROM room_listings
--   WHERE is_available LIMIT 5;

DO $$
DECLARE
    v_missing TEXT;
BEGIN
    SELECT string_agg(col, ', ') INTO v_missing
    FROM unnest(ARRAY[
        'featured_order', 'min_price', 'max_price', 'neighbourhood_id',
        'title', 'slug', 'avg_rating', 'review_count'
    ]) col
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'property_listings'
          AND column_name = col
    );

    IF v_missing IS NOT NULL THEN
        RAISE EXCEPTION 'property_listings is missing: %', v_missing;
    END IF;

    SELECT string_agg(col, ', ') INTO v_missing
    FROM unnest(ARRAY['property_id', 'annual_rent', 'total_payable', 'property_slug']) col
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'room_listings'
          AND column_name = col
    );

    IF v_missing IS NOT NULL THEN
        RAISE EXCEPTION 'room_listings is missing: %', v_missing;
    END IF;
END $$;
