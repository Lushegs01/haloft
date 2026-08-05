-- ============================================================
-- 009: Indexes for the two filters that had none
-- ============================================================
-- 008 indexed the default catalog sort and trigram search on title and
-- address. Two query shapes the search page actually issues were still
-- unindexed:
--
--   1. Amenity filters use array containment (`amenities @> ARRAY[...]`).
--      The landing page's filter panel sends students straight into these,
--      so it is a hot path, and without a GIN index every amenity search
--      is a sequential scan.
--
--   2. Free-text search ORs over title, address AND description. The first
--      two have trigram indexes; description did not, so that branch of
--      the OR forced a scan regardless of the other two.
--
-- On a large properties table, run these with CREATE INDEX CONCURRENTLY
-- instead (outside a transaction) so writes are not blocked while they
-- build. At current catalogue sizes the plain form takes milliseconds.

CREATE INDEX IF NOT EXISTS idx_properties_amenities
    ON properties USING gin (amenities)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_properties_description_trgm
    ON properties USING gin (description gin_trgm_ops)
    WHERE deleted_at IS NULL;

-- The listing page reads rooms by property, filtered to what is bookable.
-- idx_rooms_property and idx_rooms_available exist separately; the planner
-- does better with the combination it is actually given.
CREATE INDEX IF NOT EXISTS idx_rooms_property_available
    ON rooms (property_id, is_available, status)
    WHERE deleted_at IS NULL;

-- Reviews are always read newest-first for one property.
CREATE INDEX IF NOT EXISTS idx_reviews_property_recent
    ON reviews (property_id, created_at DESC)
    WHERE is_approved = TRUE AND deleted_at IS NULL;

ANALYZE properties;
ANALYZE rooms;
ANALYZE reviews;
