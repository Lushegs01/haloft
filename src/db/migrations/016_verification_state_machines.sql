-- ============================================================
-- 016: VERIFICATION AS A STATE MACHINE
-- Run after 015_booking_expiry.sql. Idempotent.
-- ============================================================
-- "Verified" was a boolean an admin could flip on any row at any time,
-- with nothing recorded about who flipped it, when, or on what evidence.
-- For a product whose whole proposition is that somebody went and looked
-- at the building, that is the weakest part of the schema.
--
-- Two machines, because they answer different questions:
--
--   PROPERTY — has this building been seen and signed off?
--
--       draft ──▶ submitted ──▶ under_review ──▶ verified
--         ▲            │              │             │
--         └────────────┴──────────────┘             ▼
--                   (rejected back to draft)    suspended ──▶ archived
--
--   LANDLORD — do we know who we are paying, and are they allowed to let?
--
--       unverified ──▶ identity_verified ──▶ documents_verified ──▶ approved
--                                                                     │
--                                                             suspended ◀┘
--
-- `properties.status` keeps meaning what it always meant — where the
-- listing is in the publishing workflow (draft / published / unpublished
-- / archived). Verification is orthogonal to it, and that separation is
-- deliberate: a verified property can be unpublished for the summer
-- without losing its verification, and re-publishing it must not silently
-- re-assert a claim nobody re-checked.
--
-- What binds them is one rule, enforced by a trigger rather than by
-- remembering:
--
--       status = 'published'  REQUIRES  property verified
--                             AND       landlord approved (if there is one)
--
-- so the trust badge on the site cannot get ahead of the work behind it.

-- ============================================================
-- 1. PROPERTIES
-- ============================================================

ALTER TABLE properties ADD COLUMN IF NOT EXISTS verification_state TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS review_started_at TIMESTAMPTZ;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Carry the boolean across: anything already flagged verified stays
-- verified, everything else starts where its publishing status implies.
UPDATE properties
SET verification_state = CASE
        WHEN is_verified THEN 'verified'
        WHEN status = 'archived' THEN 'archived'
        ELSE 'draft'
    END,
    verified_at = CASE WHEN is_verified THEN COALESCE(verified_at, updated_at) END
WHERE verification_state = 'draft';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'properties_verification_state_check'
    ) THEN
        ALTER TABLE properties ADD CONSTRAINT properties_verification_state_check
            CHECK (verification_state IN (
                'draft', 'submitted', 'under_review', 'verified', 'suspended', 'archived'
            ));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_properties_verification_state
    ON properties(verification_state) WHERE deleted_at IS NULL;

-- ============================================================
-- 2. LANDLORDS
-- ============================================================

ALTER TABLE landlords ADD COLUMN IF NOT EXISTS verification_state TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS documents_verified_at TIMESTAMPTZ;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

UPDATE landlords
SET verification_state = CASE WHEN is_verified THEN 'approved' ELSE 'unverified' END,
    approved_at = CASE WHEN is_verified THEN COALESCE(approved_at, updated_at) END
WHERE verification_state = 'unverified';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'landlords_verification_state_check'
    ) THEN
        ALTER TABLE landlords ADD CONSTRAINT landlords_verification_state_check
            CHECK (verification_state IN (
                'unverified', 'identity_verified', 'documents_verified', 'approved', 'suspended'
            ));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_landlords_verification_state
    ON landlords(verification_state) WHERE deleted_at IS NULL;

-- ============================================================
-- 3. THE PUBLISH GUARD
-- ============================================================
-- The one rule the whole file exists for. A property may only be
-- published when it has been verified and its landlord approved.
--
-- Exempt: rows written with no JWT (service_role, the seed data in 001,
-- a migration). Those are not somebody clicking "publish" in the CMS.

CREATE OR REPLACE FUNCTION public.enforce_publish_requires_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_landlord_state TEXT;
BEGIN
    IF NEW.status <> 'published' THEN
        RETURN NEW;
    END IF;

    -- Already published and staying published: not a new claim.
    IF TG_OP = 'UPDATE' AND OLD.status = 'published' THEN
        RETURN NEW;
    END IF;

    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.verification_state <> 'verified' THEN
        RAISE EXCEPTION 'PROPERTY_NOT_VERIFIED';
    END IF;

    IF NEW.landlord_id IS NOT NULL THEN
        SELECT verification_state INTO v_landlord_state
        FROM landlords WHERE id = NEW.landlord_id;

        IF v_landlord_state IS DISTINCT FROM 'approved' THEN
            RAISE EXCEPTION 'LANDLORD_NOT_APPROVED';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_publish_guard ON properties;
CREATE TRIGGER properties_publish_guard
BEFORE INSERT OR UPDATE OF status, verification_state, landlord_id ON properties
FOR EACH ROW
EXECUTE FUNCTION public.enforce_publish_requires_verification();

-- `is_verified` stays as the column the listing UI reads, but it is now
-- derived rather than set by hand — one fact, one place.
CREATE OR REPLACE FUNCTION public.sync_property_is_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.is_verified := (NEW.verification_state = 'verified');
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_sync_is_verified ON properties;
CREATE TRIGGER properties_sync_is_verified
BEFORE INSERT OR UPDATE OF verification_state ON properties
FOR EACH ROW
EXECUTE FUNCTION public.sync_property_is_verified();

CREATE OR REPLACE FUNCTION public.sync_landlord_is_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.is_verified := (NEW.verification_state = 'approved');
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS landlords_sync_is_verified ON landlords;
CREATE TRIGGER landlords_sync_is_verified
BEFORE INSERT OR UPDATE OF verification_state ON landlords
FOR EACH ROW
EXECUTE FUNCTION public.sync_landlord_is_verified();

-- ============================================================
-- 4. TRANSITIONS
-- ============================================================
-- Every move goes through these, so the legal-transition table lives in
-- one place and every move is audited with the actor who made it.

CREATE OR REPLACE FUNCTION public.set_property_verification_state(
    p_property_id UUID,
    p_state TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS public.properties
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_property properties%ROWTYPE;
    v_old TEXT;
    v_allowed TEXT[];
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;

    SELECT * INTO v_property FROM properties
    WHERE id = p_property_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'PROPERTY_NOT_FOUND';
    END IF;

    IF NOT public.is_campus_admin(v_property.campus_id) THEN
        RAISE EXCEPTION 'ADMIN_ONLY';
    END IF;

    v_old := v_property.verification_state;

    v_allowed := CASE v_old
        WHEN 'draft'        THEN ARRAY['submitted', 'archived']
        WHEN 'submitted'    THEN ARRAY['under_review', 'draft', 'archived']
        WHEN 'under_review' THEN ARRAY['verified', 'draft', 'suspended', 'archived']
        WHEN 'verified'     THEN ARRAY['suspended', 'under_review', 'archived']
        WHEN 'suspended'    THEN ARRAY['under_review', 'draft', 'archived']
        WHEN 'archived'     THEN ARRAY['draft']
        ELSE ARRAY[]::TEXT[]
    END;

    IF NOT (p_state = ANY (v_allowed)) THEN
        RAISE EXCEPTION 'INVALID_VERIFICATION_TRANSITION';
    END IF;

    -- Only a super admin may verify. Campus admins prepare the case;
    -- signing the trust claim is a separate pair of hands.
    IF p_state = 'verified' AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'SUPER_ADMIN_ONLY';
    END IF;

    UPDATE properties SET
        verification_state = p_state,
        submitted_at = CASE WHEN p_state = 'submitted' THEN NOW() ELSE submitted_at END,
        review_started_at = CASE WHEN p_state = 'under_review' THEN NOW() ELSE review_started_at END,
        verified_at = CASE WHEN p_state = 'verified' THEN NOW()
                           WHEN p_state IN ('draft', 'archived') THEN NULL
                           ELSE verified_at END,
        verified_by = CASE WHEN p_state = 'verified' THEN auth.uid()
                           WHEN p_state IN ('draft', 'archived') THEN NULL
                           ELSE verified_by END,
        suspended_at = CASE WHEN p_state = 'suspended' THEN NOW() ELSE NULL END,
        suspension_reason = CASE WHEN p_state = 'suspended' THEN p_notes ELSE NULL END,
        verification_notes = COALESCE(p_notes, verification_notes),
        -- Losing verification takes the listing off the site with it.
        status = CASE WHEN p_state IN ('suspended', 'archived') AND status = 'published'
                      THEN 'unpublished' ELSE status END
    WHERE id = p_property_id
    RETURNING * INTO v_property;

    INSERT INTO audit_logs (user_id, table_name, record_id, action, old_data, new_data)
    VALUES (
        auth.uid(), 'properties', p_property_id::TEXT, 'UPDATE',
        jsonb_build_object('verification_state', v_old),
        jsonb_build_object('verification_state', p_state, 'notes', p_notes,
                           'via', 'set_property_verification_state')
    );

    RETURN v_property;
END;
$$;

REVOKE ALL ON FUNCTION public.set_property_verification_state(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_property_verification_state(UUID, TEXT, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_landlord_verification_state(
    p_landlord_id UUID,
    p_state TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS public.landlords
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_landlord landlords%ROWTYPE;
    v_old TEXT;
    v_allowed TEXT[];
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'ADMIN_ONLY';
    END IF;

    SELECT * INTO v_landlord FROM landlords
    WHERE id = p_landlord_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'LANDLORD_NOT_FOUND';
    END IF;

    v_old := v_landlord.verification_state;

    v_allowed := CASE v_old
        WHEN 'unverified'         THEN ARRAY['identity_verified', 'suspended']
        WHEN 'identity_verified'  THEN ARRAY['documents_verified', 'unverified', 'suspended']
        WHEN 'documents_verified' THEN ARRAY['approved', 'identity_verified', 'suspended']
        WHEN 'approved'           THEN ARRAY['suspended', 'documents_verified']
        WHEN 'suspended'          THEN ARRAY['unverified', 'documents_verified', 'approved']
        ELSE ARRAY[]::TEXT[]
    END;

    IF NOT (p_state = ANY (v_allowed)) THEN
        RAISE EXCEPTION 'INVALID_VERIFICATION_TRANSITION';
    END IF;

    IF p_state = 'approved' AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'SUPER_ADMIN_ONLY';
    END IF;

    UPDATE landlords SET
        verification_state = p_state,
        identity_verified_at = CASE WHEN p_state = 'identity_verified' THEN NOW() ELSE identity_verified_at END,
        documents_verified_at = CASE WHEN p_state = 'documents_verified' THEN NOW() ELSE documents_verified_at END,
        approved_at = CASE WHEN p_state = 'approved' THEN NOW()
                           WHEN p_state = 'unverified' THEN NULL ELSE approved_at END,
        approved_by = CASE WHEN p_state = 'approved' THEN auth.uid()
                           WHEN p_state = 'unverified' THEN NULL ELSE approved_by END,
        suspended_at = CASE WHEN p_state = 'suspended' THEN NOW() ELSE NULL END,
        suspension_reason = CASE WHEN p_state = 'suspended' THEN p_notes ELSE NULL END,
        notes = COALESCE(p_notes, notes)
    WHERE id = p_landlord_id
    RETURNING * INTO v_landlord;

    -- Suspending a landlord pulls their listings down with them. This is
    -- the transition that matters most and the one most easily forgotten.
    IF p_state = 'suspended' THEN
        UPDATE properties
        SET status = 'unpublished'
        WHERE landlord_id = p_landlord_id AND status = 'published' AND deleted_at IS NULL;
    END IF;

    INSERT INTO audit_logs (user_id, table_name, record_id, action, old_data, new_data)
    VALUES (
        auth.uid(), 'landlords', p_landlord_id::TEXT, 'UPDATE',
        jsonb_build_object('verification_state', v_old),
        jsonb_build_object('verification_state', p_state, 'notes', p_notes,
                           'via', 'set_landlord_verification_state')
    );

    RETURN v_landlord;
END;
$$;

REVOKE ALL ON FUNCTION public.set_landlord_verification_state(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_landlord_verification_state(UUID, TEXT, TEXT) TO authenticated, service_role;

-- ============================================================
-- 5. THE SEED DATA
-- ============================================================
-- 001 ships six published FUNAAB properties with is_verified = TRUE. They
-- pre-date the machine, so state them explicitly rather than leaving them
-- in a state the publish guard would now refuse.

UPDATE landlords SET verification_state = 'approved', approved_at = COALESCE(approved_at, NOW())
WHERE is_verified AND verification_state <> 'approved';

UPDATE properties SET verification_state = 'verified', verified_at = COALESCE(verified_at, NOW())
WHERE status = 'published' AND verification_state <> 'verified' AND deleted_at IS NULL;
