// The campus new visitors and fresh sign-ins land on. Campuses are data
// (see db/migrations/001_initial_schema.sql), so this must match a
// campuses.slug row in the database.
export const DEFAULT_CAMPUS_SLUG = "funaab";

// Single support address, used by the legal pages and every "talk to a
// human" affordance in the product.
export const CONTACT_EMAIL = "support@haloft.homes";

/**
 * Social profiles rendered in the footer.
 *
 * Deliberately empty: shipping links to accounts that may not exist (or
 * that belong to somebody else) is worse than shipping none. Add the real
 * handles here — e.g. { label: "Instagram", href: "https://instagram.com/…" }
 * — and the footer row appears automatically.
 */
export const SOCIAL_LINKS: ReadonlyArray<{ label: string; href: string }> = [];
