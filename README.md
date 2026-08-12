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

1. Run the migrations in `src/db/migrations/` in numeric order (001 through 019) via the Supabase SQL Editor. All of them are required — 003 and 004 contain security-critical policies and triggers, 005 sets up automatic profile creation on signup, 006 creates the photo storage bucket and admin booking functions, 007 adds payment integrity constraints, 008 adds denormalized rating/price columns, a trigram search index, and audit logging, 013 moves pricing to the annual model, 014 adds the payment ledger and
   reconciliation, 015 gives bookings a reservation clock, 016 turns
   verification into a state machine, 017 fixes cover-photo atomicity and
   scopes storage to the property, 018 adds the remaining indexes and the
   security log, and 019 repairs the `property_listings` view (run each
   once; they backfill existing rows).

   To check a migration set before it touches a real project:

   ```bash
   bash scripts/verify-migrations.sh   # applies all of them, runs the flow tests
   ```

   It stands up the Supabase objects the migrations assume (`auth.uid()`,
   `storage.objects`, the anon/authenticated roles) against a throwaway
   Postgres, then exercises the money, booking and verification paths —
   overpayment, duplicate payment, refunds, expiry, publish guards.
2. Seed data for FUNAAB is included in the migration.
3. Enable email provider in Supabase Auth settings.
4. (Optional) Configure Google OAuth provider.

### Pricing model

Haloft lets on the Nigerian annual model. A room carries three figures —
`annual_rent`, `agency_fee` and `caution_fee` — and the student pays their sum
once, up front, for a tenancy of exactly one year. There is no monthly rate and
no instalment support.

The student picks only a move-in date; `create_booking` derives the move-out
date a year later, so neither the term nor the total can be moved by the
client. `tenancyTotal()` in `src/lib/payments-logic.ts` is the one place the
sum is computed — every screen that quotes a price goes through it, so a quote
can never disagree with the Paystack charge.

Properties declare a `letting_mode`: `rooms` (several students each rent a room
and each pay their own year) or `whole` (one tenant takes the place, so the
property carries a single bookable unit priced for the whole apartment).

### Payments (Paystack)

Students pay for **confirmed** bookings from their dashboard; the amount charged is always the booking's `total_amount`, computed server-side.

1. Create a [Paystack](https://paystack.com) account and grab your secret key (`sk_test_...` for testing).
2. Set `PAYSTACK_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (and in your hosting provider's environment for production).
3. In the Paystack dashboard under **Settings → API Keys & Webhooks**, set the webhook URL to `https://<your-domain>/api/paystack/webhook`. The webhook is the source of truth; the browser callback (`/payment/callback`) is a verify-and-redirect fallback.
4. Payment flow: booking request → admin confirms → student pays → webhook records the payment. Paid bookings show a "Paid" badge in both dashboards, and students can no longer self-cancel them — refunds go through the team.

#### Every charge gets a row

The recording path used to accept anything at or above the booking total
and write it down as a success. Overpayment vanished, a duplicate charge
was caught by a unique index and dropped, and an underpaid or
wrong-currency charge was refused without a record — while the money sat
at Paystack either way.

`record_gateway_charge` (migration 014) now classifies every confirmed
charge in ONE transaction and always writes it down:

| What arrived | `payments.status` | Settles the booking? | Then what |
| --- | --- | --- | --- |
| Exact amount, NGN | `success` | yes | nothing to do |
| More than the total | `overpaid` | yes | surplus booked as owed back, queued for refund |
| Less than the total | `underpaid` | **no** | held, queued for review |
| Booking already paid | `duplicate` | **no** | recorded in full, queued for refund |
| Wrong currency | `failed` | **no** | queued for review |
| No booking in the metadata | — | — | parked in `payment_exceptions` |

`settles_booking` is the column that means "this is the payment that paid
for the booking", and a partial unique index allows exactly one per
booking. Ask that, not `status === 'success'` — an overpaid booking is a
paid booking. `isBookingPaid()` in `src/types/database.ts` is the helper.

Anything with an anomaly lands in **/admin/finance**, which is where a
person refunds it, resolves it, or writes it off.

#### The ledger

`payments` is no longer the whole financial model. Every charge
decomposes into `ledger_entries`:

```
gateway_charge   +A   money in
gateway_fee      −F   Paystack's cut, taken from the platform share
landlord_payable −L   accrued on the BOOKING, never on an overpayment
refund_due       −S   the student's surplus, or a duplicate in full
platform_commission −(A−F−L−S)   the residual
                 ────
                    0
```

The entries for a payment always sum to zero, because commission is
computed as the residual. `ledger_imbalances` should therefore always be
empty; a row in it means money was recorded and not accounted for, and it
is the first thing /admin/finance shows. Commission going negative is not
an error — it is a small booking whose gateway fee exceeded the platform's
share, which is a real loss and should be visible as one.

Commission is `platform_settings.platform_commission_bps` (default 5%),
overridable per property with `properties.commission_bps`.

#### Payment intents

A student who opens the checkout, leaves, and comes back used to create a
new Paystack reference every time — several abandoned transactions per
booking, all needing reconciliation later. `create_payment_intent` holds
at most one live intent per booking behind a partial unique index and
reuses its authorization URL. This is also required rather than merely
tidy: Paystack refuses to initialize a reference it has already seen.

### Rooms come back

A booking reserved its room and nothing ever released it, so an abandoned
tab took a bed off the market permanently.

- pending bookings hold a room for `booking_reservation_minutes` (30)
- confirmed bookings hold it for `payment_window_hours` (48)
- a settled payment clears the clock entirely

`expire_stale_bookings()` sweeps them, releases the rooms, and is safe to
run every minute concurrently with itself.

**pg_cron is the primary scheduler** — migration 015 registers the sweep
to run every five minutes inside the database, which is the cadence a
30-minute reservation window needs. Enable it under Supabase → Database →
Extensions; 015 does the rest.

`/api/cron/expire-bookings` is the backstop for a database without
pg_cron. `vercel.json` schedules it **daily**, because Vercel's Hobby plan
allows only daily crons — too coarse to be the primary mechanism for
releasing rooms, which is why pg_cron carries it. On Pro, change both
schedules to `*/5 * * * *` and `*/2 * * * *`. Running both is harmless:
the sweep is idempotent. The same route also drains the notification
outbox, so a deployment with one daily job still gets both swept.

### Verification is a state machine

`is_verified` was a boolean anybody with admin rights could flip, with no
record of who or on what evidence — for a product whose whole proposition
is that someone visited the building.

```
property   draft → submitted → under_review → verified → suspended → archived
landlord   unverified → identity_verified → documents_verified → approved
```

A trigger enforces the rule that matters: **`status = 'published'`
requires the property verified AND its landlord approved.** Only a super
admin may sign off either. `is_verified` is now derived from the state
rather than set by hand, suspending a landlord unpublishes their
listings, and every transition is audited with the actor who made it.

### Email is off the critical path

Booking creation and payment recording used to `await` an HTTPS call to
Resend before returning, which put the mail provider's worst minute
inside checkout — and meant a mail failure could make a recorded payment
look like a failed one.

Events are now enqueued in `notification_outbox` in the SAME transaction
that records the money, and delivered afterwards: `after()` drains within
a second of the response, and `/api/cron/notifications` sweeps whatever
that misses. Claiming uses `FOR UPDATE SKIP LOCKED`, so the two never
send twice. Failures back off; a row that exhausts its attempts is marked
`dead` and stays visible.

### Rate limiting

The old limiter counted in a module-level `Map`. On a serverless platform
that is per-instance state: three warm instances each granted the full
allowance and a cold start reset the count, so "10 per minute" was not 10
per minute.

Counters now live in Upstash Redis over its REST API — no client library,
nothing to keep warm. **Set `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` in production**; without them it falls back to
the in-memory counter and says so loudly in the log.

Calls are limited on every dimension they have — user id, the thing being
attacked (the email on a sign-in), and IP — and the strictest verdict
wins. IP alone is not enough: a university NAT puts a whole campus behind
one address, so the IP bucket is widened when a user id is also being
counted. The limits are in one table at the bottom of
`src/lib/rate-limit.ts`.

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

## Performance model

The scalability property of this app is one invariant:

> **A public page must never touch the cookie-bound Supabase client.**

Public reads go through `src/lib/data/campus.ts`, which uses the anon key
with no cookies and wraps every query in `unstable_cache`. That does two
things at once: a page view costs **zero** Postgres queries once the cache
entry is warm, and — because no dynamic request API is touched — Next can
serve `/[campus]` and `/[campus]/property/[slug]` from the ISR cache
instead of rendering per visitor. One campus can then serve a whole
intake off a handful of origin renders.

Importing `@/lib/supabase/server` into one of those pages silently
reverts both properties: the route becomes `ƒ` (server-rendered on
demand) and every visitor hits the database again. If you need the signed-in
user on a page, that page belongs in the dynamic set below.

| Route | Rendering | Why |
| --- | --- | --- |
| `/`, `/[campus]`, `/[campus]/property/[slug]` | ISR, cached | Public, identical for everyone |
| `/[campus]/search` | Per request | Output depends on the query string — but its data is still cached per filter set |
| `/[campus]/dashboard`, `/…/booking`, `/admin/*` | `force-dynamic` | User-specific; must never be shared from a cache |

Cache TTLs live at the top of `campus.ts`. They are generous because admin
writes call `revalidateTag(CACHE_TAGS.properties)`, so a publish shows up
immediately rather than waiting out the TTL.

Other decisions that hold the line:

- **Middleware runs on five paths, not all of them.** Session refresh is
  needed for admin, auth, payment, the dashboard and booking. Putting it
  in front of public browsing would add an auth round-trip to every page
  view and stop those routes being cacheable. The header's signed-in state
  comes from the browser client instead.
- **No JS animation library.** Entrances are `opacity`/`transform` under a
  `.js-reveal` class with one shared IntersectionObserver, so they run on
  the compositor. The hidden state is scoped to a class set by an inline
  script, so content is never hidden behind a bundle that failed to load.
- **Toasts mount per route.** Nothing on the browsing path raises one.
- Run `009_search_indexes.sql`: amenity filters and description search
  had no index, and the landing page sends students straight into both.
- Run `010_rls_initplan.sql`: RLS policies wrote `auth.uid()` bare, so
  Postgres re-evaluated it for every candidate row. Wrapped in
  `(select auth.uid())` the planner hoists it to an InitPlan and calls it
  once per statement. **Write new policies that way** — a bare
  `auth.uid()` or `public.is_admin()` in a policy is a per-row call, and
  the Supabase linter will flag it. The exception is a helper that takes
  a column (`is_campus_admin(campus_id)`): its result varies per row, so
  wrapping it only builds a correlated subquery that cannot be hoisted.
- Run `011_view_security_invoker.sql`: Postgres creates views SECURITY
  DEFINER, so `property_listings` ran as its owner and skipped RLS
  entirely. It filters `deleted_at` but never `status`, which left every
  draft listing readable straight off the REST endpoint with the public
  anon key. **New views need `WITH (security_invoker = on)`** unless they
  exist specifically to cross an RLS boundary — `public_profiles` is the
  one that does, and the migration explains why it must stay a definer.
- Run `012_media_visibility.sql`: `media` is polymorphic and its read
  policy was `deleted_at IS NULL` and nothing else, so photos of
  unpublished properties — and of admin-only inspections — were public.
  The policy now follows the entity each row hangs off, and the
  `property-media` bucket no longer lets anyone enumerate it. The bucket
  stays public: URLs still work for whoever holds one, they are just no
  longer discoverable.

### Caching tiers

Every cached read picks one of five tiers rather than inventing a TTL.
They are named in `CACHE_TTL` at the top of `src/lib/data/campus.ts`.

| Tier | TTL | What |
| --- | --- | --- |
| 1 Reference | 60 min | campuses, universities, neighbourhoods |
| 2 Catalogue | 10 min | listing pages, search results, reviews |
| 3 Detail | 5 min | one property — where the price is read |
| 4 Availability | 60 s | which rooms are bookable |
| 5 Never | — | bookings, payments, dashboards, all of `/admin` |

Tier 5 is enforced twice: those routes use the cookie-bound server client
(request-scoped by construction) and `next.config.ts` sends `no-store` on
`/admin/*`, `/api/*`, `/payment/*`, `/auth/*`, the dashboard and booking.

The tags are what let the TTLs be generous: an admin write calls
`revalidateTag`, so a publish appears immediately and the TTL is only the
ceiling on how long a change made outside the app can go unnoticed.

## Measuring the database

Indexes existing and indexes being *used* are different facts. The
repository can build a catalogue large enough for the difference to show:

```bash
bash scripts/verify-migrations.sh                          # schema + flow tests
psql -d haloft_test -f scripts/test-db/02_load_dataset.sql # 10k properties, 50k rooms…
psql -d haloft_test -f scripts/test-db/03_explain_queries.sql
```

`02_load_dataset.sql` seeds with realistic skew — a few neighbourhoods
hold most of the stock, prices cluster, 70% of properties are published —
because uniform random data makes every index look good.
`03_explain_queries.sql` runs `EXPLAIN (ANALYZE, BUFFERS)` over the
seventeen query shapes the app actually issues, then prints index scan
counts so an index nobody uses is visible as one. Plan *shape* transfers
from a laptop; the milliseconds do not.

## Security

Every mutation follows the same order, and RLS is the backstop rather
than the gate:

```
authenticate → authorize → validate → mutate
```

- **Errors do not leak the schema.** Server actions used to return
  `error.message` straight from PostgREST, which hands a stranger your
  constraint names. `src/lib/errors.ts` logs the real failure under a
  correlation id and returns one sentence plus that id.
- **Security events are queryable.** `audit_logs` says what changed;
  `security_events` says who tried, from where, and whether they were
  refused — including the refusals, which a diff-based audit table can
  never capture. Writes go through the service role, so a compromised
  admin session cannot edit its own trail.
- **Uploads are checked as bytes, not as a Content-Type.** `file.type` is
  a claim. `src/lib/images.ts` reads the actual signature, walks the
  container to prove it parses, and strips EXIF/XMP/text chunks — a
  listing photo published with the building's GPS coordinates on it is a
  privacy problem nobody notices until it is one.
- **Storage authorisation follows the property.** The `property-media`
  policies asked only `is_admin()`, so any admin could write objects for
  any campus. Objects live at `property/<property_id>/…` and the policies
  now parse that path and ask `is_property_admin()`.
- **Bulk actions are bounded** (100 ids), ids are validated as UUIDs
  before they reach a query, and `duplicateProperty` neither copies a
  deleted property nor carries its verification across.
- **HTTP headers**: CSP, HSTS, COOP, CORP, `X-Permitted-Cross-Domain-Policies`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. The
  CSP keeps `'unsafe-inline'` for scripts, deliberately — Next inlines its
  bootstrap, and the alternative is a per-request nonce that would make
  the whole public catalogue dynamic. `next.config.ts` explains the trade
  and what to change if that stops being true.

### Imagery

Listing photography is real and comes from the catalogue. Where a listing has
no photo yet, `components/haloft/elevation.tsx` draws a façade study in the
brand tones rather than substituting a stock photo, and the card says the
photo arrives after the visit. Sample data is always badged as sample.

### The share card

`public/og-image.png` is what a link renders as in WhatsApp, which is how
most students will meet Haloft. It is not hand-drawn: `scripts/og-image.html`
is a real 1200×630 page using the site's fonts, palette and façade study, and
`scripts/build-og-image.mjs` screenshots it. Edit the HTML, re-run the script,
commit the PNG — see the script header for the one-off install it needs.

## License

Private — All rights reserved.
