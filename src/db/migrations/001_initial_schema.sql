-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CORE: COUNTRIES, UNIVERSITIES, CAMPUSES, NEIGHBOURHOODS
-- ============================================

CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code CHAR(2) NOT NULL UNIQUE,
    currency_code TEXT NOT NULL DEFAULT 'NGN',
    currency_symbol TEXT NOT NULL DEFAULT '₦',
    timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
    locale TEXT NOT NULL DEFAULT 'en-NG',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_countries_code ON countries(code);

CREATE TABLE universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    logo_url TEXT,
    website TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(slug, country_id)
);

CREATE INDEX idx_universities_slug ON universities(slug);
CREATE INDEX idx_universities_country ON universities(country_id);
CREATE INDEX idx_universities_active ON universities(is_active) WHERE deleted_at IS NULL;

CREATE TABLE campuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(slug, university_id)
);

CREATE INDEX idx_campuses_slug ON campuses(slug);
CREATE INDEX idx_campuses_university ON campuses(university_id);
CREATE INDEX idx_campuses_active ON campuses(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_campuses_location ON campuses(latitude, longitude);

CREATE TABLE neighbourhoods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(slug, campus_id)
);

CREATE INDEX idx_neighbourhoods_campus ON neighbourhoods(campus_id);
CREATE INDEX idx_neighbourhoods_slug ON neighbourhoods(slug);
CREATE INDEX idx_neighbourhoods_active ON neighbourhoods(is_active) WHERE deleted_at IS NULL;

-- ============================================
-- 2. LANDLORDS (non-user attribution)
-- ============================================

CREATE TABLE landlords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company_name TEXT,
    tax_id TEXT,
    bank_account TEXT,
    bank_name TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_landlords_email ON landlords(email) WHERE email IS NOT NULL;
CREATE INDEX idx_landlords_verified ON landlords(is_verified) WHERE deleted_at IS NULL;

-- ============================================
-- 3. PROPERTIES + BUILDINGS + ROOMS
-- ============================================

CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    neighbourhood_id UUID NOT NULL REFERENCES neighbourhoods(id) ON DELETE CASCADE,
    landlord_id UUID REFERENCES landlords(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    property_type TEXT NOT NULL CHECK (property_type IN ('hostel', 'apartment', 'shared_house', 'single_room', 'self_contained', 'studio')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'unpublished', 'archived')),
    total_rooms INTEGER NOT NULL DEFAULT 0,
    available_rooms INTEGER NOT NULL DEFAULT 0,
    min_price DECIMAL(12, 2),
    max_price DECIMAL(12, 2),
    currency TEXT NOT NULL DEFAULT 'NGN',
    amenities TEXT[] DEFAULT '{}',
    rules TEXT[],
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_notes TEXT,
    featured_order INTEGER,
    meta_title TEXT,
    meta_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(slug, campus_id)
);

CREATE INDEX idx_properties_campus ON properties(campus_id);
CREATE INDEX idx_properties_neighbourhood ON properties(neighbourhood_id);
CREATE INDEX idx_properties_status ON properties(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_type ON properties(property_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_verified ON properties(is_verified) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_price ON properties(min_price, max_price) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_featured ON properties(featured_order) WHERE featured_order IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_properties_location ON properties(latitude, longitude) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_slug ON properties(slug) WHERE deleted_at IS NULL;

CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    floor_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_buildings_property ON buildings(property_id) WHERE deleted_at IS NULL;

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    room_type TEXT NOT NULL CHECK (room_type IN ('single', 'double', 'triple', 'quad', 'suite', 'shared')),
    floor INTEGER,
    size_sqm DECIMAL(5, 2),
    max_occupancy INTEGER NOT NULL DEFAULT 1,
    price_per_month DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    deposit_months INTEGER NOT NULL DEFAULT 1,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    amenities TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_rooms_property ON rooms(property_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_building ON rooms(building_id) WHERE building_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_rooms_status ON rooms(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_price ON rooms(price_per_month) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_available ON rooms(is_available, status) WHERE deleted_at IS NULL;

-- ============================================
-- 4. MEDIA (polymorphic)
-- ============================================

CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('property', 'room', 'university', 'campus', 'inspection')),
    entity_id UUID NOT NULL,
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_media_entity ON media(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_media_featured ON media(is_featured) WHERE is_featured = TRUE AND deleted_at IS NULL;

-- ============================================
-- 5. AUTH PROFILES + ADMIN ASSIGNMENTS
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'super_admin')),
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_profiles_role ON profiles(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_active ON profiles(is_active) WHERE deleted_at IS NULL;

CREATE TABLE admin_campus_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(admin_id, campus_id)
);

CREATE INDEX idx_admin_campus_admin ON admin_campus_assignments(admin_id);
CREATE INDEX idx_admin_campus_campus ON admin_campus_assignments(campus_id);

-- ============================================
-- 6. BOOKINGS + PAYMENTS
-- ============================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'refunded')),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    total_months INTEGER NOT NULL,
    monthly_price DECIMAL(12, 2) NOT NULL,
    deposit_amount DECIMAL(12, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    special_requests TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_bookings_student ON bookings(student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_room ON bookings(room_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_property ON bookings(property_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_status ON bookings(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date) WHERE deleted_at IS NULL;

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'card', 'cash', 'mobile_money')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    transaction_reference TEXT,
    paid_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_reference ON payments(transaction_reference) WHERE transaction_reference IS NOT NULL;

-- ============================================
-- 7. REVIEWS + FAVORITES
-- ============================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    cleanliness_rating INTEGER NOT NULL CHECK (cleanliness_rating BETWEEN 1 AND 5),
    location_rating INTEGER NOT NULL CHECK (location_rating BETWEEN 1 AND 5),
    value_rating INTEGER NOT NULL CHECK (value_rating BETWEEN 1 AND 5),
    management_rating INTEGER NOT NULL CHECK (management_rating BETWEEN 1 AND 5),
    comment TEXT,
    admin_reply TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(student_id, booking_id)
);

CREATE INDEX idx_reviews_property ON reviews(property_id) WHERE is_approved = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_reviews_student ON reviews(student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_booking ON reviews(booking_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_rating ON reviews(overall_rating) WHERE is_approved = TRUE AND deleted_at IS NULL;

CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, property_id)
);

CREATE INDEX idx_favorites_student ON favorites(student_id);
CREATE INDEX idx_favorites_property ON favorites(property_id);

-- ============================================
-- 8. INSPECTIONS
-- ============================================

CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    inspector_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    findings TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    photos TEXT[] DEFAULT '{}',
    recommendations TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_inspections_property ON inspections(property_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inspections_inspector ON inspections(inspector_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inspections_status ON inspections(status) WHERE deleted_at IS NULL;

-- ============================================
-- 9. NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('booking', 'payment', 'inspection', 'review', 'system', 'promotion')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- 10. AUDIT LOGS
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- 11. LISTING VIEWS (denormalized for fast reads)
-- ============================================

CREATE VIEW property_listings AS
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
    p.total_rooms,
    p.available_rooms,
    p.min_price,
    p.max_price,
    p.currency,
    p.amenities,
    p.is_verified,
    p.featured_order,
    p.rules,
    p.created_at,
    p.updated_at,
    (
        SELECT m.url
        FROM media m
        WHERE m.entity_type = 'property' AND m.entity_id = p.id AND m.deleted_at IS NULL
        ORDER BY m.is_featured DESC, m.display_order ASC
        LIMIT 1
    ) AS media_url,
    (
        SELECT COUNT(*)::INTEGER
        FROM media m
        WHERE m.entity_type = 'property' AND m.entity_id = p.id AND m.deleted_at IS NULL
    ) AS media_count,
    (
        SELECT ROUND(AVG(r.overall_rating), 1)
        FROM reviews r
        WHERE r.property_id = p.id AND r.is_approved = TRUE AND r.deleted_at IS NULL
    ) AS avg_rating,
    (
        SELECT COUNT(*)::INTEGER
        FROM reviews r
        WHERE r.property_id = p.id AND r.is_approved = TRUE AND r.deleted_at IS NULL
    ) AS review_count
FROM properties p
LEFT JOIN neighbourhoods n ON n.id = p.neighbourhood_id
WHERE p.deleted_at IS NULL;

CREATE VIEW room_listings AS
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
LEFT JOIN properties p ON p.id = r.property_id
LEFT JOIN buildings b ON b.id = r.building_id
WHERE r.deleted_at IS NULL;

-- ============================================
-- 12. RLS POLICIES
-- ============================================

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighbourhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlords ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_campus_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read policies (for anonymous browsing)
CREATE POLICY "countries_public_read" ON countries FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "universities_public_read" ON universities FOR SELECT TO anon, authenticated USING (is_active = TRUE AND deleted_at IS NULL);
CREATE POLICY "campuses_public_read" ON campuses FOR SELECT TO anon, authenticated USING (is_active = TRUE AND deleted_at IS NULL);
CREATE POLICY "neighbourhoods_public_read" ON neighbourhoods FOR SELECT TO anon, authenticated USING (is_active = TRUE AND deleted_at IS NULL);
CREATE POLICY "landlords_public_read" ON landlords FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
CREATE POLICY "properties_public_read" ON properties FOR SELECT TO anon, authenticated USING (status = 'published' AND deleted_at IS NULL);
CREATE POLICY "buildings_public_read" ON buildings FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
CREATE POLICY "rooms_public_read" ON rooms FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
CREATE POLICY "media_public_read" ON media FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT TO anon, authenticated USING (is_approved = TRUE AND deleted_at IS NULL);

-- Profile policies
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT TO anon, authenticated USING (is_active = TRUE AND deleted_at IS NULL);
CREATE POLICY "profiles_self_write" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_self_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_super_admin_all" ON profiles FOR ALL TO authenticated USING (role = 'super_admin') WITH CHECK (role = 'super_admin');

-- Admin campus assignments (admin only)
CREATE POLICY "admin_assignments_read" ON admin_campus_assignments FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "admin_assignments_super_admin_write" ON admin_campus_assignments FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Bookings: students own their own; admins see campus-scoped
CREATE POLICY "bookings_student_read" ON bookings FOR SELECT TO authenticated USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);
CREATE POLICY "bookings_student_write" ON bookings FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "bookings_student_update" ON bookings FOR UPDATE TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "bookings_admin_campus_read" ON bookings FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN admin_campus_assignments aca ON aca.admin_id = p.id
        JOIN properties pr ON pr.campus_id = aca.campus_id
        WHERE p.id = auth.uid() AND p.role = 'admin' AND pr.id = bookings.property_id
    )
);
CREATE POLICY "bookings_admin_campus_write" ON bookings FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN admin_campus_assignments aca ON aca.admin_id = p.id
        JOIN properties pr ON pr.campus_id = aca.campus_id
        WHERE p.id = auth.uid() AND p.role = 'admin' AND pr.id = bookings.property_id
    )
);

-- Payments: linked to bookings
CREATE POLICY "payments_student_read" ON payments FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM bookings WHERE id = payments.booking_id AND student_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "payments_admin_read" ON payments FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "payments_admin_write" ON payments FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Reviews: students own their own; public sees approved
CREATE POLICY "reviews_student_read" ON reviews FOR SELECT TO authenticated USING (
    student_id = auth.uid() OR is_approved = TRUE
);
CREATE POLICY "reviews_student_write" ON reviews FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "reviews_student_update" ON reviews FOR UPDATE TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "reviews_admin_moderate" ON reviews FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Favorites: students own their own
CREATE POLICY "favorites_student_read" ON favorites FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "favorites_student_write" ON favorites FOR ALL TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

-- Inspections: admin only (read/write)
CREATE POLICY "inspections_admin_read" ON inspections FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "inspections_admin_write" ON inspections FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Notifications: own notifications only
CREATE POLICY "notifications_user_read" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_user_update" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_system_write" ON notifications FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Audit logs: admin read only
CREATE POLICY "audit_logs_admin_read" ON audit_logs FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Admin write policies for properties/buildings/rooms/media/landlords
CREATE POLICY "properties_admin_write" ON properties FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p JOIN admin_campus_assignments aca ON aca.admin_id = p.id WHERE p.id = auth.uid() AND p.role = 'admin' AND aca.campus_id = properties.campus_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "buildings_admin_write" ON buildings FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN admin_campus_assignments aca ON aca.admin_id = p.id
        JOIN properties pr ON pr.campus_id = aca.campus_id
        WHERE p.id = auth.uid() AND p.role = 'admin' AND pr.id = buildings.property_id
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "rooms_admin_write" ON rooms FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN admin_campus_assignments aca ON aca.admin_id = p.id
        JOIN properties pr ON pr.campus_id = aca.campus_id
        WHERE p.id = auth.uid() AND p.role = 'admin' AND pr.id = rooms.property_id
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "media_admin_write" ON media FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "landlords_admin_write" ON landlords FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ============================================
-- 13. TRIGGER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_updated_at_triggers()
RETURNS void AS $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'countries', 'universities', 'campuses', 'neighbourhoods',
        'landlords', 'properties', 'buildings', 'rooms', 'media',
        'profiles', 'bookings', 'payments', 'reviews', 'inspections'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        EXECUTE format(
            'CREATE TRIGGER %I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
            tbl, tbl
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT set_updated_at_triggers();

-- Auto-update property room counts
CREATE OR REPLACE FUNCTION update_property_room_counts()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE properties
    SET
        total_rooms = (SELECT COUNT(*) FROM rooms WHERE property_id = COALESCE(NEW.property_id, OLD.property_id) AND deleted_at IS NULL),
        available_rooms = (SELECT COUNT(*) FROM rooms WHERE property_id = COALESCE(NEW.property_id, OLD.property_id) AND deleted_at IS NULL AND status = 'available' AND is_available = TRUE)
    WHERE id = COALESCE(NEW.property_id, OLD.property_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rooms_update_property_counts
AFTER INSERT OR UPDATE OR DELETE ON rooms
FOR EACH ROW
EXECUTE FUNCTION update_property_room_counts();

-- ============================================
-- 14. SEED DATA: FUNAAB (Nigeria)
-- ============================================

-- Nigeria country
INSERT INTO countries (id, name, code, currency_code, currency_symbol, timezone, locale)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Nigeria',
    'NG',
    'NGN',
    '₦',
    'Africa/Lagos',
    'en-NG'
);

-- FUNAAB University
INSERT INTO universities (id, name, slug, country_id, logo_url, website, is_active)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'Federal University of Agriculture, Abeokuta',
    'funaab',
    '550e8400-e29b-41d4-a716-446655440000',
    NULL,
    'https://funaab.edu.ng',
    TRUE
);

-- FUNAAB Main Campus
INSERT INTO campuses (id, university_id, name, slug, city, state, latitude, longitude, address, is_active)
VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'Alabata Main Campus',
    'funaab',
    'Abeokuta',
    'Ogun',
    7.250000,
    3.450000,
    'Alabata Road, Abeokuta, Ogun State, Nigeria',
    TRUE
);

-- Neighbourhoods
INSERT INTO neighbourhoods (id, campus_id, name, slug, description, latitude, longitude, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Campus Gate', 'campus-gate', 'Properties directly at the main university gate. High demand, close to lecture halls.', 7.251500, 3.451000, TRUE),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Campus Axis', 'campus-axis', 'The main student hub with shops, food vendors, and high-density hostels.', 7.252000, 3.452500, TRUE),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Famous Market', 'famous-market', 'Near the popular student market. Affordable options with good transport links.', 7.253500, 3.454000, TRUE),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Damico', 'damico', 'Quiet residential area popular with final-year students and postgraduates.', 7.248000, 3.448000, TRUE),
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'Osiele', 'osiele', 'Budget-friendly area with shared housing and community atmosphere.', 7.255000, 3.456000, TRUE);

-- Sample landlords
INSERT INTO landlords (id, full_name, email, phone, company_name, is_verified, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440008', 'Adeyemi Properties Ltd', 'contact@adeyemiprop.ng', '+2348012345678', 'Adeyemi Properties Ltd', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440009', 'Blessed Heights Hostel', 'info@blessedheights.ng', '+2348023456789', 'Blessed Heights Hostel', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440010', 'Alabata Student Homes', 'alabatahomes@gmail.com', '+2348034567890', NULL, TRUE, NOW(), NOW());

-- Sample properties (published)
INSERT INTO properties (id, campus_id, neighbourhood_id, landlord_id, title, slug, description, address, latitude, longitude, property_type, status, total_rooms, available_rooms, min_price, max_price, currency, amenities, is_verified, featured_order, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', 'Adeyemi Heights', 'adeyemi-heights', 'Premium hostel with 24/7 power, security, and modern facilities. Located right at the campus gate with a 2-minute walk to lecture halls. Features spacious rooms, study areas, and common kitchen.', '15 Campus Gate Road, Alabata, Abeokuta', 7.251500, 3.451000, 'hostel', 'published', 40, 12, 150000, 250000, 'NGN', ARRAY['wifi', '24_7_power', 'security', 'kitchen', 'laundry', 'parking', 'study_room', 'water_heater'], TRUE, 1, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440009', 'Blessed Heights', 'blessed-heights', 'Well-maintained hostel on Campus Axis with vibrant student community. Close to food vendors, shops, and photocopy services. All rooms come with wardrobes and reading tables.', '42 Campus Axis Street, Alabata, Abeokuta', 7.252000, 3.452500, 'hostel', 'published', 60, 8, 120000, 200000, 'NGN', ARRAY['wifi', 'generator', 'security', 'kitchen', 'laundry', 'parking'], TRUE, 2, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440010', 'Famous Court Apartments', 'famous-court-apartments', 'Modern self-contained apartments near Famous Market. Perfect for students who want independence and privacy. Each unit has its own kitchen and bathroom.', '8 Famous Market Road, Alabata, Abeokuta', 7.253500, 3.454000, 'self_contained', 'published', 20, 5, 250000, 350000, 'NGN', ARRAY['wifi', '24_7_power', 'security', 'kitchen', 'water_heater', 'ac'], TRUE, 3, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440008', 'Damico Serenity Hostel', 'damico-serenity-hostel', 'Quiet and peaceful hostel in Damico area ideal for serious students and postgraduates. Generators run 12 hours daily. Serene environment with minimal distractions.', '22 Damico Road, Alabata, Abeokuta', 7.248000, 3.448000, 'hostel', 'published', 30, 15, 100000, 180000, 'NGN', ARRAY['wifi', 'generator', 'security', 'kitchen', 'laundry', 'study_room'], TRUE, NULL, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440010', 'Osiele Budget Homes', 'osiele-budget-homes', 'Affordable shared housing in Osiele. Community-driven living with shared kitchens and bathrooms. Great for students on a tight budget.', '55 Osiele Street, Alabata, Abeokuta', 7.255000, 3.456000, 'shared_house', 'published', 25, 20, 60000, 120000, 'NGN', ARRAY['wifi', 'generator', 'kitchen', 'parking'], TRUE, NULL, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440009', 'Campus Axis Studios', 'campus-axis-studios', 'Compact studio apartments ideal for independent students. Each unit includes a private kitchenette and bathroom. Walking distance to all campus facilities.', '17 Campus Axis Close, Alabata, Abeokuta', 7.252200, 3.452800, 'studio', 'published', 15, 3, 200000, 280000, 'NGN', ARRAY['wifi', '24_7_power', 'security', 'kitchen', 'water_heater', 'ac', 'parking'], TRUE, 4, NOW(), NOW());

-- Sample rooms for Adeyemi Heights
INSERT INTO rooms (id, property_id, name, description, room_type, floor, size_sqm, max_occupancy, price_per_month, currency, deposit_months, is_available, amenities, status, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440011', 'Deluxe Single Room (1A)', 'Spacious single room with en-suite bathroom, reading table, and wardrobe. Ground floor.', 'single', 1, 18.0, 1, 180000, 'NGN', 2, TRUE, ARRAY['en_suite', 'wardrobe', 'reading_table', 'fan'], 'available', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440011', 'Premium Single Room (2B)', 'Premium single room on first floor with balcony view and extra study space.', 'single', 2, 20.0, 1, 220000, 'NGN', 2, TRUE, ARRAY['en_suite', 'wardrobe', 'reading_table', 'fan', 'balcony'], 'available', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440011', 'Shared Room (3A)', 'Double occupancy room with shared bathroom. Budget-friendly with all essentials.', 'double', 3, 25.0, 2, 120000, 'NGN', 2, TRUE, ARRAY['wardrobe', 'reading_table', 'fan'], 'available', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440011', 'Deluxe Single Room (1B)', 'Another ground floor single room with en-suite facilities.', 'single', 1, 18.0, 1, 180000, 'NGN', 2, FALSE, ARRAY['en_suite', 'wardrobe', 'reading_table', 'fan'], 'occupied', NOW(), NOW());

-- Sample rooms for Blessed Heights
INSERT INTO rooms (id, property_id, name, description, room_type, floor, size_sqm, max_occupancy, price_per_month, currency, deposit_months, is_available, amenities, status, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440012', 'Standard Room (101)', 'Standard room with shared bathroom on first floor. Good natural light.', 'single', 1, 15.0, 1, 140000, 'NGN', 2, TRUE, ARRAY['wardrobe', 'reading_table', 'fan'], 'available', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440012', 'Twin Room (102)', 'Double room perfect for friends who want to share. Two beds, two wardrobes.', 'double', 1, 28.0, 2, 100000, 'NGN', 2, TRUE, ARRAY['wardrobe', 'reading_table', 'fan', 'tv'], 'available', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440012', 'Executive Suite (201)', 'Top-floor executive suite with private bathroom and air conditioning.', 'suite', 2, 32.0, 1, 250000, 'NGN', 2, FALSE, ARRAY['en_suite', 'wardrobe', 'reading_table', 'ac', 'tv', 'mini_fridge'], 'occupied', NOW(), NOW());

-- Update property counts after room insert
-- (trigger handles this, but we ensure consistency)
UPDATE properties SET total_rooms = 4, available_rooms = 2 WHERE id = '550e8400-e29b-41d4-a716-446655440011';
UPDATE properties SET total_rooms = 3, available_rooms = 2 WHERE id = '550e8400-e29b-41d4-a716-446655440012';
UPDATE properties SET total_rooms = 0, available_rooms = 0 WHERE id = '550e8400-e29b-41d4-a716-446655440013';
UPDATE properties SET total_rooms = 0, available_rooms = 0 WHERE id = '550e8400-e29b-41d4-a716-446655440014';
UPDATE properties SET total_rooms = 0, available_rooms = 0 WHERE id = '550e8400-e29b-41d4-a716-446655440015';
UPDATE properties SET total_rooms = 0, available_rooms = 0 WHERE id = '550e8400-e29b-41d4-a716-446655440016';
