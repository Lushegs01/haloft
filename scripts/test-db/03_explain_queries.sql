-- ============================================================
-- EXPLAIN ANALYZE for every query shape the app actually issues
-- ============================================================
-- An index existing and an index being USED are different facts, and only
-- the second one is worth anything. This runs the real query shapes —
-- copied from src/lib/data/campus.ts, the dashboards and the admin
-- queues — and prints the plan for each.
--
--     psql -d haloft_test -f scripts/test-db/02_load_dataset.sql
--     psql -d haloft_test -f scripts/test-db/03_explain_queries.sql
--
-- ── What to look for ────────────────────────────────────────
--
--   * "Seq Scan on properties" in anything filtered by campus + status.
--     That is the catalogue reading the whole table.
--   * "Rows Removed by Filter" much larger than "actual rows". The index
--     was used to get in the door and then most of the work was thrown
--     away — usually a missing column in a composite.
--   * Sort nodes with "external merge  Disk". The sort did not fit in
--     work_mem.
--   * A planned/actual row-count ratio worse than about 10x. The planner
--     is guessing wrong and will eventually pick the wrong join.
--
-- Timings from a laptop are not production numbers. The PLAN SHAPE is
-- what transfers; the milliseconds are not.

\set ON_ERROR_STOP on
\timing on
\pset pager off

\echo ''
\echo '════════ 1. Campus catalogue, default sort (the hot path) ════════'
\echo 'src/lib/data/campus.ts → queryCampusProperties, no filters'

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT *
FROM property_listings
WHERE campus_id = (SELECT id FROM campuses WHERE slug LIKE 'load-campus-%' LIMIT 1)
  AND status = 'published'
ORDER BY featured_order ASC NULLS LAST, created_at DESC
LIMIT 24;

\echo ''
\echo '════════ 2. Catalogue + neighbourhood filter ════════'

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT *
FROM property_listings
WHERE campus_id = (SELECT id FROM campuses WHERE slug LIKE 'load-campus-%' LIMIT 1)
  AND status = 'published'
  AND neighbourhood_id = (
      SELECT id FROM neighbourhoods
      WHERE campus_id = (SELECT id FROM campuses WHERE slug LIKE 'load-campus-%' LIMIT 1)
      LIMIT 1
  )
ORDER BY featured_order ASC NULLS LAST, created_at DESC
LIMIT 24;

\echo ''
\echo '════════ 3. Catalogue + price band ════════'
\echo 'Should use idx_properties_campus_price (018)'

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT *
FROM property_listings
WHERE campus_id = (SELECT id FROM campuses WHERE slug LIKE 'load-campus-%' LIMIT 1)
  AND status = 'published'
  AND min_price >= 150000
  AND max_price <= 400000
ORDER BY featured_order ASC NULLS LAST, created_at DESC
LIMIT 24;

\echo ''
\echo '════════ 4. Amenity filter (array containment) ════════'
\echo 'Should use idx_properties_amenities, the GIN index from 009'

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id, title, amenities
FROM properties
WHERE deleted_at IS NULL
  AND status = 'published'
  AND amenities @> ARRAY['wifi', 'security']
LIMIT 24;

\echo ''
\echo '════════ 5. Free-text search (title OR description OR address) ════════'
\echo 'Should use the trigram GIN indexes from 008/009, not three scans'

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id, title
FROM properties
WHERE deleted_at IS NULL
  AND status = 'published'
  AND (title ILIKE '%harmony%' OR description ILIKE '%harmony%' OR address ILIKE '%harmony%')
LIMIT 24;

\echo ''
\echo '════════ 6. Deep pagination — page 40 ════════'
\echo 'OFFSET discards rows it has already fetched. This is the shape that'
\echo 'degrades linearly with page number; keyset pagination is the fix if'
\echo 'the numbers here stop being acceptable.'

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT *
FROM property_listings
WHERE campus_id = (SELECT id FROM campuses WHERE slug LIKE 'load-campus-%' LIMIT 1)
  AND status = 'published'
ORDER BY featured_order ASC NULLS LAST, created_at DESC
OFFSET 936 LIMIT 24;

\echo ''
\echo '════════ 7. Exact count for the same filter set ════════'
\echo 'PostgREST count=exact runs this alongside every page. If it is the'
\echo 'expensive half, switch to count=planned above a threshold.'

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT COUNT(*)
FROM property_listings
WHERE campus_id = (SELECT id FROM campuses WHERE slug LIKE 'load-campus-%' LIMIT 1)
  AND status = 'published';

\echo ''
\echo '════════ 8. One listing by slug ════════'

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT * FROM property_listings
WHERE campus_id = (SELECT campus_id FROM properties WHERE slug = 'load-500')
  AND slug = 'load-500'
  AND status = 'published';

\echo ''
\echo '════════ 9. Bookable rooms for one property ════════'
\echo 'Should use idx_rooms_property_available (009) / idx_rooms_property_rent (018)'

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT * FROM room_listings
WHERE property_id = (SELECT id FROM properties WHERE slug = 'load-500')
  AND is_available = TRUE
  AND status = 'available'
ORDER BY annual_rent ASC;

\echo ''
\echo '════════ 10. A property gallery ════════'
\echo 'Should use idx_media_entity_order (018)'

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT url, alt_text, is_featured, display_order
FROM media
WHERE entity_type = 'property'
  AND entity_id = (SELECT id FROM properties WHERE slug = 'load-500')
  AND deleted_at IS NULL
ORDER BY display_order ASC;

\echo ''
\echo '════════ 11. A student dashboard ════════'
\echo 'Should use idx_bookings_student_recent (018)'

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT b.*, r.name, p.title
FROM bookings b
LEFT JOIN rooms r ON r.id = b.room_id
LEFT JOIN properties p ON p.id = b.property_id
WHERE b.student_id = (SELECT student_id FROM bookings LIMIT 1)
  AND b.deleted_at IS NULL
ORDER BY b.created_at DESC;

\echo ''
\echo '════════ 12. Admin bookings queue, filtered by status ════════'
\echo 'Should use idx_bookings_status_recent (018)'

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT * FROM bookings
WHERE deleted_at IS NULL AND status = 'pending'
ORDER BY created_at DESC
LIMIT 50;

\echo ''
\echo '════════ 13. The finance queue ════════'
\echo 'Should use idx_payments_reconciliation (014)'

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT * FROM payment_reconciliation_queue
ORDER BY created_at DESC
LIMIT 100;

\echo ''
\echo '════════ 14. Is this booking paid? ════════'
\echo 'Runs on every dashboard row. Should use uq_payments_booking_settled.'

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT 1 FROM payments
WHERE booking_id = (SELECT id FROM bookings LIMIT 1) AND settles_booking;

\echo ''
\echo '════════ 15. The expiry sweeper''s scan ════════'
\echo 'Runs every five minutes forever. Should use idx_bookings_expiring (015)'
\echo 'and touch almost nothing when there is nothing to expire.'

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT * FROM bookings
WHERE deleted_at IS NULL
  AND status IN ('pending', 'confirmed')
  AND expires_at IS NOT NULL
  AND expires_at <= NOW()
ORDER BY expires_at
LIMIT 200;

\echo ''
\echo '════════ 16. create_booking''s overlap check ════════'
\echo 'Runs inside the row lock, so its cost is time the room is held.'

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT 1 FROM bookings b
WHERE b.room_id = (SELECT id FROM rooms LIMIT 1)
  AND b.deleted_at IS NULL
  AND b.status IN ('pending', 'confirmed')
  AND daterange(b.check_in_date, b.check_out_date, '[)')
      && daterange(CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 year')::DATE, '[)');

\echo ''
\echo '════════ 17. Reviews for a listing ════════'

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id, overall_rating, comment, created_at
FROM reviews
WHERE property_id = (SELECT id FROM properties WHERE slug = 'load-500')
  AND is_approved = TRUE AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;

\echo ''
\echo '════════ Index usage across the whole run ════════'
\echo 'idx_scan = 0 on a large table means an index nobody uses: it costs'
\echo 'write throughput and disk and buys nothing. Drop it, or fix the'
\echo 'query that was supposed to use it.'

SELECT
    relname AS table,
    indexrelname AS index,
    idx_scan AS scans,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname IN ('properties', 'rooms', 'bookings', 'payments', 'media', 'reviews')
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

\echo ''
\echo '════════ Table sizes ════════'

SELECT
    relname AS table,
    n_live_tup AS rows,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 15;
