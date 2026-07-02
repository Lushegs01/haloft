-- ============================================
-- 004: REVIEW INTEGRITY
-- Run after 003_security_fixes.sql (uses public.is_admin()).
-- Idempotent — safe to re-run.
--
-- Fixes:
--   - Students could set is_approved / is_featured / admin_reply on their
--     own reviews via the REST API (self-approval, self-featuring, forged
--     admin replies) — the reviews_student_write/update policies from 001
--     put no restrictions on columns
--   - Nothing verified that a review's booking belongs to the reviewer,
--     is completed, and is for the reviewed property
--   - Editing an approved review kept its approved status, so a student
--     could get an innocuous review approved and then rewrite it
-- ============================================

CREATE OR REPLACE FUNCTION public.protect_review_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Requests without a JWT (service_role, direct SQL) and admins are exempt
    IF auth.uid() IS NULL OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        -- Moderation fields are never caller-controlled
        NEW.is_approved := FALSE;
        NEW.is_featured := FALSE;
        NEW.admin_reply := NULL;
        NEW.deleted_at := NULL;

        -- A student may only review a property they stayed at: the booking
        -- must be their own completed booking for this property
        IF NOT EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = NEW.booking_id
              AND b.student_id = auth.uid()
              AND b.property_id = NEW.property_id
              AND b.status = 'completed'
              AND b.deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'REVIEW_BOOKING_INVALID';
        END IF;
    ELSE
        IF NEW.is_approved IS DISTINCT FROM OLD.is_approved
            OR NEW.is_featured IS DISTINCT FROM OLD.is_featured
            OR NEW.admin_reply IS DISTINCT FROM OLD.admin_reply
            OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
            OR NEW.student_id IS DISTINCT FROM OLD.student_id
            OR NEW.booking_id IS DISTINCT FROM OLD.booking_id
            OR NEW.property_id IS DISTINCT FROM OLD.property_id THEN
            RAISE EXCEPTION 'REVIEW_PRIVILEGED_COLUMNS';
        END IF;

        -- Content edits send the review back through moderation
        IF NEW.comment IS DISTINCT FROM OLD.comment
            OR NEW.overall_rating IS DISTINCT FROM OLD.overall_rating
            OR NEW.cleanliness_rating IS DISTINCT FROM OLD.cleanliness_rating
            OR NEW.location_rating IS DISTINCT FROM OLD.location_rating
            OR NEW.value_rating IS DISTINCT FROM OLD.value_rating
            OR NEW.management_rating IS DISTINCT FROM OLD.management_rating THEN
            NEW.is_approved := FALSE;
            NEW.is_featured := FALSE;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_protect_integrity ON reviews;
CREATE TRIGGER reviews_protect_integrity
BEFORE INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION public.protect_review_integrity();
