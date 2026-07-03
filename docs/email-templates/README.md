# Haloft auth email templates

Branded replacements for Supabase's default auth emails. Paste each file's
full HTML into the Supabase dashboard:

**Dashboard → Authentication → Email Templates** → pick the template →
replace the message body → set the subject → Save.

| Template in dashboard | File                  | Subject to set                    |
| --------------------- | --------------------- | --------------------------------- |
| Confirm signup        | `confirm-signup.html` | Confirm your email — Haloft       |
| Magic Link            | `magic-link.html`     | Your sign-in link — Haloft        |
| Reset Password        | `reset-password.html` | Reset your Haloft password        |

Notes:

- `{{ .ConfirmationURL }}` and `{{ .SiteURL }}` are Supabase template
  variables — leave them exactly as they are.
- The logo is loaded from `{{ .SiteURL }}/logo-mark.png`, so it follows the
  Site URL configured in Authentication → URL Configuration (works on
  haloft.vercel.app today and on a custom domain later, no edits needed).
- The **sender** stays "Supabase Auth" until custom SMTP is configured:
  Project Settings → Authentication → SMTP Settings. Requires a domain you
  own, verified with an email provider (e.g. Resend). Supabase's built-in
  sender is dev-only and heavily rate-limited — set up SMTP before launch.
- The "Change Email Address" and "Invite user" templates can reuse this
  shell: copy any file and adjust the heading/body copy.
