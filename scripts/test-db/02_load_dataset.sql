-- ============================================================
-- A catalogue big enough to be worth measuring
-- ============================================================
-- "It feels fast" is not a claim about a search index; it is a claim
-- about a table with six rows in it. Every plan the catalogue queries
-- produce today is a sequential scan that happens to be instant, and a
-- sequential scan stays instant right up until it does not.
--
-- This builds, by default:
--
--     10,000 properties
--    ~50,000 rooms          (1–10 per property)
--   ~120,000 media rows     (0–20 per property)
--    ~40,000 bookings
--    ~25,000 payments + their ledger entries
--    ~20,000 reviews
--
-- across 12 campuses, with realistic skew: a handful of neighbourhoods
-- hold most of the stock, prices cluster, and 70% of properties are
-- published. Uniform random data makes every index look good, because
-- uniform random data has no hot rows.
--
-- Usage — against a THROWAWAY database, never a real one:
--
--     bash scripts/verify-migrations.sh          # schema + flow tests
--     psql -d haloft_test -f scripts/test-db/02_load_dataset.sql
--     psql -d haloft_test -f scripts/test-db/03_explain_queries.sql
--
-- Takes a couple of minutes. Scale it with :properties, e.g.
--
--     psql -d haloft_test -v properties=50000 -f .../02_load_dataset.sql

\set ON_ERROR_STOP on
\if :{?properties}
\else
  \set properties 10000
\endif

SET client_min_messages = WARNING;

-- Triggers that recompute aggregates per row turn a bulk insert into a
-- per-row update storm. They are disabled for the load and the
-- aggregates are computed once at the end — which is also how a real
-- bulk import should be done.
ALTER TABLE rooms DISABLE TRIGGER rooms_update_property_counts;
ALTER TABLE rooms DISABLE TRIGGER rooms_log_availability;
ALTER TABLE reviews DISABLE TRIGGER reviews_sync_rating;
ALTER TABLE properties DISABLE TRIGGER properties_log_status;

\echo '→ campuses and neighbourhoods'

INSERT INTO campuses (university_id, name, slug, city, state, latitude, longitude, is_active)
SELECT
    '550e8400-e29b-41d4-a716-446655440001',
    'Load Campus ' || i,
    'load-campus-' || i,
    'City ' || i,
    'State ' || i,
    6.5 + (i * 0.1),
    3.3 + (i * 0.1),
    TRUE
FROM generate_series(1, 12) i
ON CONFLICT DO NOTHING;

-- Zipf-ish: neighbourhood 1 of each campus ends up holding far more
-- stock than neighbourhood 8, which is what a real city looks like.
INSERT INTO neighbourhoods (campus_id, name, slug, is_active)
SELECT c.id, 'Area ' || n, 'area-' || n, TRUE
FROM campuses c
CROSS JOIN generate_series(1, 8) n
WHERE c.slug LIKE 'load-campus-%'
ON CONFLICT DO NOTHING;

\echo '→ landlords'

INSERT INTO landlords (full_name, email, phone, verification_state, is_verified)
SELECT
    'Landlord ' || i,
    'landlord' || i || '@example.test',
    '+23480' || LPAD(i::TEXT, 8, '0'),
    CASE WHEN i % 10 = 0 THEN 'documents_verified' ELSE 'approved' END,
    i % 10 <> 0
FROM generate_series(1, 800) i;

\echo '→ properties'

INSERT INTO properties (
    campus_id, neighbourhood_id, landlord_id, title, slug, description, address,
    latitude, longitude, property_type, status, verification_state, is_verified,
    letting_mode, currency, amenities, created_at
)
SELECT
    n.campus_id,
    n.id,
    l.id,
    titles.word || ' ' || suffixes.word || ' ' || i,
    'load-' || i,
    'A ' || titles.word || ' near campus with ' ||
        (i % 5 + 1) || ' minutes to the gate. Rooms are let by the year.',
    i || ' ' || titles.word || ' Road',
    6.5 + (i % 100) * 0.001,
    3.3 + (i % 100) * 0.001,
    (ARRAY['hostel', 'apartment', 'shared_house', 'single_room', 'self_contained', 'studio'])[1 + i % 6],
    -- 70% published, the rest spread across the other states, so index
    -- selectivity on status is realistic rather than 100%.
    (ARRAY['published', 'published', 'published', 'published', 'published',
           'published', 'published', 'draft', 'unpublished', 'archived'])[1 + i % 10],
    CASE WHEN i % 10 < 7 THEN 'verified' ELSE 'draft' END,
    i % 10 < 7,
    CASE WHEN i % 7 = 0 THEN 'whole' ELSE 'rooms' END,
    'NGN',
    -- A CASE, not a nested ARRAY[...]: Postgres reads the latter as a
    -- two-dimensional array, and subscripting it yields one text element
    -- rather than the text[] the column wants.
    CASE i % 5
        WHEN 0 THEN ARRAY['wifi', 'security', 'kitchen']
        WHEN 1 THEN ARRAY['wifi', '24_7_power', 'security', 'kitchen', 'laundry']
        WHEN 2 THEN ARRAY['generator', 'security', 'parking']
        WHEN 3 THEN ARRAY['wifi', 'ac', 'water_heater', 'en_suite', 'security']
        ELSE ARRAY['wifi', 'security']
    END,
    NOW() - ((i % 500) || ' days')::INTERVAL
FROM generate_series(1, :properties) i
CROSS JOIN LATERAL (
    -- Skewed pick: low-numbered areas get most of the stock.
    SELECT nb.id, nb.campus_id FROM neighbourhoods nb
    JOIN campuses c ON c.id = nb.campus_id AND c.slug LIKE 'load-campus-%'
    ORDER BY (nb.name || i) LIMIT 1 OFFSET (i % 3)
) n
CROSS JOIN LATERAL (
    SELECT id FROM landlords ORDER BY (full_name || i) LIMIT 1
) l
CROSS JOIN LATERAL (
    SELECT (ARRAY['Adeyemi', 'Blessed', 'Famous', 'Damico', 'Osiele', 'Alabata',
                  'Harmony', 'Unity', 'Grace', 'Summit'])[1 + i % 10] AS word
) titles
CROSS JOIN LATERAL (
    SELECT (ARRAY['Heights', 'Court', 'Lodge', 'Residence', 'Villa',
                  'Gardens', 'Hostel', 'Place'])[1 + (i / 10) % 8] AS word
) suffixes;

\echo '→ rooms'

INSERT INTO rooms (
    property_id, name, description, room_type, floor, max_occupancy,
    annual_rent, agency_fee, caution_fee, currency, status, is_available, amenities
)
SELECT
    p.id,
    'Room ' || r,
    'Room ' || r || ' with a wardrobe and reading table.',
    (ARRAY['single', 'double', 'triple', 'quad', 'suite', 'shared'])[1 + r % 6],
    1 + r % 4,
    1 + r % 3,
    -- Clustered around common price points rather than uniform noise.
    (ARRAY[150000, 180000, 220000, 250000, 300000, 350000, 420000, 500000])[1 + (r * 3) % 8],
    (ARRAY[0, 25000, 50000])[1 + r % 3],
    (ARRAY[0, 50000, 100000])[1 + r % 3],
    'NGN',
    (ARRAY['available', 'available', 'available', 'occupied', 'reserved', 'maintenance'])[1 + r % 6],
    r % 6 < 3,
    ARRAY['wardrobe', 'reading_table']
FROM properties p
CROSS JOIN LATERAL generate_series(1, 1 + (('x' || substr(md5(p.id::TEXT), 1, 4))::BIT(16)::INT % 10)) r
WHERE p.slug LIKE 'load-%';

\echo '→ media'

INSERT INTO media (entity_type, entity_id, url, storage_path, mime_type, file_size,
                   width, height, display_order, is_featured)
SELECT
    'property',
    p.id,
    'https://example.supabase.co/storage/v1/object/public/property-media/property/' || p.id || '/' || m || '.jpg',
    'property/' || p.id || '/' || m || '.jpg',
    'image/jpeg',
    200000 + m * 1000,
    1600, 1200,
    m,
    m = 0
FROM properties p
CROSS JOIN LATERAL generate_series(0, ('x' || substr(md5(p.id::TEXT), 5, 4))::BIT(16)::INT % 20) m
WHERE p.slug LIKE 'load-%';

INSERT INTO media (entity_type, entity_id, url, storage_path, mime_type, file_size,
                   width, height, display_order, is_featured)
SELECT
    'room', r.id,
    'https://example.supabase.co/storage/v1/object/public/property-media/property/' || r.property_id || '/r' || r.id || '.jpg',
    'property/' || r.property_id || '/r' || r.id || '.jpg',
    'image/jpeg', 180000, 1200, 900, 0, TRUE
FROM rooms r
JOIN properties p ON p.id = r.property_id AND p.slug LIKE 'load-%'
WHERE ('x' || substr(md5(r.id::TEXT), 1, 2))::BIT(8)::INT % 3 = 0;

\echo '→ students, bookings, payments, ledger'

INSERT INTO auth.users (id, email)
SELECT uuid_generate_v4(), 'loadstudent' || i || '@example.test'
FROM generate_series(1, 5000) i;

INSERT INTO profiles (id, role, full_name, email)
SELECT u.id, 'student', 'Load Student', u.email
FROM auth.users u
WHERE u.email LIKE 'loadstudent%'
ON CONFLICT (id) DO NOTHING;

-- Bookings spread over a year, weighted toward recent, which is what the
-- dashboards actually sort by.
--
-- Rooms are walked in order rather than picked at random, because
-- `bookings_no_overlapping_active` (002) is a real exclusion constraint:
-- two active bookings whose year-long ranges overlap on one room is
-- exactly what it exists to prevent, and random room selection collides
-- almost immediately. Each room gets at most one ACTIVE booking; the
-- historical ones are completed or cancelled, which the constraint's
-- WHERE clause excludes, so they can stack freely.
WITH numbered_rooms AS (
    SELECT r.id, r.property_id, r.annual_rent, r.agency_fee, r.caution_fee,
           ROW_NUMBER() OVER (ORDER BY r.id) AS rn
    FROM rooms r
    JOIN properties p ON p.id = r.property_id AND p.slug LIKE 'load-%'
),
students AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
    FROM profiles WHERE role = 'student'
),
student_count AS (SELECT COUNT(*)::INT AS n FROM students)
INSERT INTO bookings (
    student_id, room_id, property_id, status, check_in_date, check_out_date,
    total_months, annual_rent, agency_fee, caution_fee, total_amount, currency, created_at
)
SELECT
    s.id, r.id, r.property_id,
    -- The first pass over each room is its live booking; later passes are
    -- history, and history cannot overlap by definition.
    CASE
        WHEN gen = 0 THEN (ARRAY['pending', 'confirmed', 'confirmed'])[1 + r.rn % 3]
        ELSE (ARRAY['completed', 'completed', 'cancelled'])[1 + (r.rn + gen) % 3]
    END,
    (CURRENT_DATE - ((gen * 400) + (r.rn % 250) || ' days')::INTERVAL)::DATE,
    (CURRENT_DATE - ((gen * 400) + (r.rn % 250) || ' days')::INTERVAL + INTERVAL '1 year')::DATE,
    12, r.annual_rent, r.agency_fee, r.caution_fee,
    r.annual_rent + r.agency_fee + r.caution_fee, 'NGN',
    NOW() - ((gen * 400) + (r.rn % 250) || ' days')::INTERVAL
FROM numbered_rooms r
CROSS JOIN generate_series(0, 1) gen
CROSS JOIN student_count sc
JOIN students s ON s.rn = 1 + ((r.rn * 7 + gen) % sc.n);

-- One settling payment for roughly 60% of bookings, plus a realistic
-- sprinkle of the anomalies the finance queue exists for.
INSERT INTO payments (
    booking_id, provider, amount, expected_amount, gateway_fee, currency,
    payment_method, status, anomaly, reconciliation_status, settles_booking,
    transaction_reference, paid_at, created_at
)
SELECT
    b.id, 'paystack',
    CASE
        WHEN rn % 50 = 0 THEN b.total_amount + 50000   -- overpaid
        WHEN rn % 71 = 0 THEN b.total_amount - 20000   -- underpaid
        ELSE b.total_amount
    END,
    b.total_amount,
    ROUND(b.total_amount * 0.015, 2),
    'NGN',
    (ARRAY['card', 'bank_transfer', 'mobile_money'])[1 + rn % 3],
    CASE
        WHEN rn % 50 = 0 THEN 'overpaid'
        WHEN rn % 71 = 0 THEN 'underpaid'
        ELSE 'success'
    END,
    CASE
        WHEN rn % 50 = 0 THEN 'overpayment'
        WHEN rn % 71 = 0 THEN 'underpayment'
        ELSE NULL
    END,
    CASE
        WHEN rn % 50 = 0 THEN 'pending_refund'
        WHEN rn % 71 = 0 THEN 'pending_review'
        ELSE 'not_required'
    END,
    rn % 71 <> 0,
    'LOAD-' || b.id,
    b.created_at + INTERVAL '2 hours',
    b.created_at + INTERVAL '2 hours'
FROM (
    SELECT b.*, ROW_NUMBER() OVER (ORDER BY b.created_at) AS rn
    FROM bookings b
    JOIN properties p ON p.id = b.property_id AND p.slug LIKE 'load-%'
    WHERE b.status IN ('confirmed', 'completed')
      -- The flow tests may have left settled bookings behind, and
      -- uq_payments_booking_settled means exactly one per booking.
      AND NOT EXISTS (
          SELECT 1 FROM payments pay
          WHERE pay.booking_id = b.id AND pay.settles_booking
      )
) b
WHERE rn % 5 <> 0;

\echo '→ reviews'

INSERT INTO reviews (
    student_id, booking_id, property_id, overall_rating, cleanliness_rating,
    location_rating, value_rating, management_rating, comment, is_approved, created_at
)
SELECT
    b.student_id, b.id, b.property_id,
    3 + (('x' || substr(md5(b.id::TEXT), 1, 2))::BIT(8)::INT % 3),
    3 + (('x' || substr(md5(b.id::TEXT), 3, 2))::BIT(8)::INT % 3),
    3 + (('x' || substr(md5(b.id::TEXT), 5, 2))::BIT(8)::INT % 3),
    3 + (('x' || substr(md5(b.id::TEXT), 7, 2))::BIT(8)::INT % 3),
    3 + (('x' || substr(md5(b.id::TEXT), 9, 2))::BIT(8)::INT % 3),
    'Comfortable and close to campus. Power was steady most nights.',
    TRUE,
    b.created_at + INTERVAL '200 days'
FROM bookings b
WHERE b.status = 'completed'
ON CONFLICT DO NOTHING;

\echo '→ re-enabling triggers and recomputing aggregates'

ALTER TABLE rooms ENABLE TRIGGER rooms_update_property_counts;
ALTER TABLE rooms ENABLE TRIGGER rooms_log_availability;
ALTER TABLE reviews ENABLE TRIGGER reviews_sync_rating;
ALTER TABLE properties ENABLE TRIGGER properties_log_status;

UPDATE properties p SET
    total_rooms = sub.total_rooms,
    available_rooms = sub.available_rooms,
    min_price = sub.min_price,
    max_price = sub.max_price
FROM (
    SELECT property_id,
        COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_rooms,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND status = 'available' AND is_available) AS available_rooms,
        MIN(annual_rent) AS min_price,
        MAX(annual_rent) AS max_price
    FROM rooms GROUP BY property_id
) sub
WHERE p.id = sub.property_id;

UPDATE properties p SET
    avg_rating = sub.avg_rating,
    review_count = sub.review_count
FROM (
    SELECT property_id, ROUND(AVG(overall_rating), 1) AS avg_rating,
           COUNT(*)::INTEGER AS review_count
    FROM reviews WHERE is_approved AND deleted_at IS NULL
    GROUP BY property_id
) sub
WHERE p.id = sub.property_id;

\echo '→ ANALYZE'

ANALYZE properties;
ANALYZE rooms;
ANALYZE media;
ANALYZE bookings;
ANALYZE payments;
ANALYZE reviews;

\echo ''
SELECT 'properties' AS table, COUNT(*) FROM properties
UNION ALL SELECT 'rooms', COUNT(*) FROM rooms
UNION ALL SELECT 'media', COUNT(*) FROM media
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'reviews', COUNT(*) FROM reviews;
