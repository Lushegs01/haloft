# Haloft operations & hardening checklist

What's wired in code vs. what still needs a dashboard toggle or account.

## Done in code

- **Security headers** — `next.config.ts` (HSTS, X-Frame-Options, nosniff, Permissions-Policy).
- **Rate limiting** — `src/lib/rate-limit.ts`, applied to booking creation and payment initialization. In-memory per instance (see "Upstash" below to make it distributed).
- **Transactional email** — `src/lib/email.ts` via Resend, fires on booking received / confirmed / paid / cancelled.
- **Error boundaries** — `src/app/error.tsx`, `src/app/global-error.tsx` (Sentry hook point is marked in `error.tsx`).
- **Legal pages** — `/legal/terms`, `/legal/privacy`, `/legal/refunds` (linked in the footer). Good-faith drafts — have a Nigerian lawyer review before relying on them.
- **CI** — `.github/workflows/ci.yml` runs type-check, lint, build on every push/PR.

## Needs a dashboard toggle (no code)

### Bot protection on auth — Cloudflare Turnstile
Supabase supports Turnstile natively for signup/signin. Enable it:
1. Create a free Turnstile widget at Cloudflare → copy site key + secret.
2. Supabase Dashboard → Authentication → **Attack Protection** → enable CAPTCHA → provider Turnstile → paste the secret.
3. If you later move auth to fully custom forms, add the widget's site key to the sign-in/sign-up pages. (Supabase's hosted flows need no code.)

### Leaked-password protection
Supabase Dashboard → Authentication → **Policies / Password** → enable "Check against HaveIBeenPwned". One toggle, free.

### Admin MFA
Supabase Dashboard → Authentication → **MFA** → enable TOTP. Enroll the super_admin account.

### Point-in-time backups
Supabase free tier has minimal backups. Before real payment volume, upgrade the project to **Pro** for daily backups / PITR.

## Needs an account + small code addition

### Error monitoring — Sentry
1. Create a Sentry project (Next.js), run `npx @sentry/wizard@latest -i nextjs`, or install `@sentry/nextjs` manually.
2. Set `NEXT_PUBLIC_SENTRY_DSN` (and `SENTRY_AUTH_TOKEN` for source maps) in Vercel.
3. In `src/app/error.tsx`, replace the `console.error(error)` line with `Sentry.captureException(error)`.

### Distributed rate limiting — Upstash (optional, recommended at scale)
The in-memory limiter resets per cold start and isn't shared across instances. To make limits global:
1. Create a free Upstash Redis DB, set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel.
2. `npm i @upstash/ratelimit @upstash/redis`, then swap the store inside `src/lib/rate-limit.ts` (call sites don't change).

### Uptime monitoring
Add `https://haloft.homes` to UptimeRobot (free) or Better Stack for downtime alerts.

### Analytics / performance
Enable **Vercel Analytics + Speed Insights** in the Vercel dashboard (two toggles) to see real Nigerian-user page-load numbers.

## Environment variables (production, in Vercel)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `NEXT_PUBLIC_SITE_URL` | canonical URL (`https://haloft.homes`) |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only; payments + email lookups |
| `PAYSTACK_SECRET_KEY` | payments |
| `RESEND_API_KEY` / `EMAIL_FROM` | transactional email |
| `NEXT_PUBLIC_SENTRY_DSN` | error monitoring (when added) |
