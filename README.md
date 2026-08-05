# Haloft

The trusted accommodation marketplace for university students. Built with Next.js, Supabase, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth, PostgreSQL, Storage, RLS)
- **Maps:** Google Maps (configurable via env)
- **Validation:** Zod at every boundary

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project
- (Optional) Google Maps API key

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon/public key
- `NEXT_PUBLIC_SITE_URL` — your deployed site URL (for auth redirects)

### Database Setup

1. Run the migrations in `src/db/migrations/` in numeric order (001 through 008) via the Supabase SQL Editor. All of them are required — 003 and 004 contain security-critical policies and triggers, 005 sets up automatic profile creation on signup, 006 creates the photo storage bucket and admin booking functions, 007 adds payment integrity constraints, and 008 adds denormalized rating/price columns, a trigram search index, and audit logging (run it once; it backfills existing rows).
2. Seed data for FUNAAB is included in the migration.
3. Enable email provider in Supabase Auth settings.
4. (Optional) Configure Google OAuth provider.

### Payments (Paystack)

Students pay for **confirmed** bookings from their dashboard; the amount charged is always the booking's `total_amount`, computed server-side.

1. Create a [Paystack](https://paystack.com) account and grab your secret key (`sk_test_...` for testing).
2. Set `PAYSTACK_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (and in your hosting provider's environment for production).
3. In the Paystack dashboard under **Settings → API Keys & Webhooks**, set the webhook URL to `https://<your-domain>/api/paystack/webhook`. The webhook is the source of truth; the browser callback (`/payment/callback`) is a verify-and-redirect fallback.
4. Payment flow: booking request → admin confirms → student pays → webhook records the payment (idempotent, amount-validated). Paid bookings show a "Paid" badge in both dashboards, and students can no longer self-cancel them — refunds go through the team.

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

### Multi-tenant by design

- Universities, campuses, and neighbourhoods are **data**, not code.
- Every tenant-scoped query carries the campus lineage.
- RLS enforces tenant isolation at the database level.
- Adding a new campus = inserting rows + uploading media + flipping a flag. No code changes.

### Routing

- Public: `/[campus]/...` — path-based campus routing
- Admin: `/admin/...` — protected CMS
- Auth: `/auth/...` — sign-in, sign-up, callback

### Key decisions

- **Property → Building → Room hierarchy**: Property is the listing entity. Buildings are optional physical structures. Rooms are the bookable units.
- **No public listing creation**: All properties are sourced and managed by the Haloft operations team via the Admin CMS.
- **No landlord self-service**: Landlords exist in the data model for attribution and payouts only.

## Project Structure

```
src/
  app/               Next.js App Router routes
    [campus]/        Campus-scoped public pages
    admin/           Admin CMS (protected)
    auth/            Authentication pages
    globals.css      Design tokens + the whole utility layer
  components/
    haloft/          Landing-page sections and marketplace primitives
    layout/          Header, Footer, auth shell
    property/        Property detail + the shared listing tile
    search/          Search filters & results
    ui/              shadcn/ui components
  hooks/             React hooks (useAuth)
  lib/
    data/            Supabase data access layer
    supabase/        Client & server Supabase clients
  types/             TypeScript database types
  db/migrations/     SQL schema & seed data
```

## Design system

Tokens live in `src/app/globals.css` and nothing outside it should invent a
colour, radius or shadow.

- **Canvas** limestone `#f7f7f2`, with `--paper-warm` and `--paper-sage` marking
  chapter changes, and `--night` for dark sections.
- **Ink** `#101820` for text, `--ink-soft` for secondary copy, `--muted-foreground`
  for metadata.
- **Navy** `#1a2a44` is the primary action colour. **Teal** `#2a9d8f` (use
  `--teal-deep` for text — it passes AA) signals verification and trust.
  **Sand** `#f4a261` (`--sand-deep` for text) belongs to the property-owner
  chapter and to warm highlights.
- Type is Geist throughout, with Instrument Serif reserved for single
  emphasised phrases (`.editorial`). Scale: `.display-1` → `.display-4`,
  `.lede`, `.label`.
- Layout: `.shell` (1400px max, responsive gutters) and three vertical
  rhythms — `.chapter`, `.chapter-tight`.

### Imagery

Listing photography is real and comes from the catalogue. Where a listing has
no photo yet, `components/haloft/elevation.tsx` draws a façade study in the
brand tones rather than substituting a stock photo, and the card says the
photo arrives after the visit. Sample data is always badged as sample.

## License

Private — All rights reserved.
