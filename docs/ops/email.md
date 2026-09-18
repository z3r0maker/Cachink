# Transactional email (B-14)

Xangarro sends email through **Resend**, from `Xangarro <hola@xangarro.mx>`.
Two Vercel projects send: the **portal** (trial reminders, usage alerts,
sign-in and reset links) and the **admin console** (the 08:00 staff digest).

| Piece                                  | Where                                                             |
| -------------------------------------- | ----------------------------------------------------------------- |
| `EmailSender` port, retries, use cases | `packages/application/src/email/` (`@xangarro/application/email`) |
| Templates (React Email) and adapters   | `packages/email/` (`@xangarro/email`)                             |
| Portal helpers and trial cron          | `apps/portal/src/server/email/`, `GET /api/cron/trial-emails`     |
| Staff digest                           | `apps/admin/src/server/alerts/email.ts`, `GET /api/cron/digest`   |

## 1. Domain setup in Resend (once, owner)

1. Resend → **Domains → Add domain** → `xangarro.mx`, region **us-east-1**
   (next to Vercel `iad1`).
2. Add the DNS records Resend shows at the DNS host of `xangarro.mx`. They
   have this shape; **copy the exact values from the dashboard** (the DKIM key
   is unique to the account):

   | Type | Name                            | Value                                                 | Why     |
   | ---- | ------------------------------- | ----------------------------------------------------- | ------- |
   | MX   | `send.xangarro.mx`              | `feedback-smtp.us-east-1.amazonses.com` (priority 10) | bounces |
   | TXT  | `send.xangarro.mx`              | `v=spf1 include:amazonses.com ~all`                   | SPF     |
   | TXT  | `resend._domainkey.xangarro.mx` | `p=MIGfMA0…` (from the dashboard)                     | DKIM    |
   | TXT  | `_dmarc.xangarro.mx`            | `v=DMARC1; p=none; rua=mailto:dmarc@xangarro.mx`      | DMARC   |

   SPF and the bounce MX sit on the `send.` subdomain, so they do not touch the
   root domain's own MX (the mailbox that receives replies). Start DMARC at
   `p=none`; after two weeks of clean reports move to `p=quarantine`.

3. Wait for **Verified** on every record, then send a test from the dashboard.
4. **API keys → Create**: one key per Vercel project, permission **Sending
   access**, domain `xangarro.mx` only. Paste each straight into Vercel; never
   into chat, tickets or the repo.
5. `hola@xangarro.mx` (or `EMAIL_REPLY_TO`) must be a real mailbox: every
   email says «Responde a este correo».

## 2. Environment per Vercel project

| Variable                                    | Portal | Admin | Notes                                                                                                           |
| ------------------------------------------- | :----: | :---: | --------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`                            |   ✓    |   ✓   | Sending-only key. Unset on Vercel → every send is refused and reported (no silent loss).                        |
| `EMAIL_FROM`                                |  opt.  | opt.  | Default `Xangarro <hola@xangarro.mx>`; must be on the verified domain.                                          |
| `EMAIL_REPLY_TO`                            |  opt.  | opt.  | e.g. `soporte@xangarro.mx`.                                                                                     |
| `CRON_SECRET`                               | ✓ new  |   ✓   | Vercel sends it as `Authorization: Bearer …`; unset closes the cron route (503).                                |
| `PORTAL_URL`                                |   ✓    |       | Links in emails (`/suscripcion`); falls back to the request origin.                                             |
| `STRIPE_SECRET_KEY`, `BILLING_DATABASE_URL` |   ✓    |       | Already set for billing (B-10); the trial cron reads `subscriptions` and the Stripe customer's email with them. |
| `DIGEST_TO`                                 |        | opt.  | Default `soporte@xangarro.mx`.                                                                                  |

Crons (`vercel.json`): portal `/api/cron/trial-emails` at `0 15 * * *`
(09:00 Mexico City); admin `/api/cron/digest` at `0 14 * * *` (08:00).

## 3. Local testing with the outbox

Without `RESEND_API_KEY` (and outside Vercel), nothing is sent: each email is
written to `<app>/.email-outbox/` (gitignored) as

- `…-outbox_<hash>.eml` — open with Mail/Outlook/Thunderbird to see both parts;
- `…-outbox_<hash>.html` — open in a browser.

Try the crons locally:

```bash
# admin digest
CRON_SECRET=dev pnpm --filter @xangarro/admin dev
curl -H 'Authorization: Bearer dev' http://localhost:3200/api/cron/digest

# portal trial emails (needs the local DB and Stripe test env from B-10)
CRON_SECRET=dev pnpm --filter @xangarro/portal dev
curl -H 'Authorization: Bearer dev' http://localhost:3100/api/cron/trial-emails
ls apps/portal/.email-outbox/
```

To send for real from a laptop, export a **test** Resend key in your shell
(not a file in the repo) and send only to your own address, or to Resend's
`delivered@resend.dev` test inbox.

## 4. Behaviour worth knowing

- **Idempotency.** Every message carries a key, sent as Resend's
  `Idempotency-Key` (kept 24 h): `trial-ending:<business>:<date>`,
  `trial-ended:…`, `usage-threshold:<business>:<period>:<metric>:<threshold>`,
  `staff-digest:<window>`, `password-reset:<sha256(url)>`. A retried or re-run
  cron sends once; the trial windows (48–72 h ahead, last 24 h) do not overlap
  between daily runs.
- **Retries.** 429 and 5xx get up to 3 attempts, waiting 0.5 s then 1.5 s; other
  4xx fail at once. Portal failures go to `reportError` (Sentry + one JSON
  line, ids only); the digest cron answers 502.
- **Copy.** Emails may carry plan names and prices («+ IVA»); the app may not
  (ADR-069). Usage emails are never punitive.

## 5. Seams for other tracks

- **ADR-080 reset / magic link** (portal auth owner): call
  `sendPasswordReset(email, url)` / `sendMagicLink(email, url)` from
  `apps/portal/src/server/email/auth-links.ts` after minting the token.
- **N-03 owner emails** (N-02 wiring): call `notifyUsageThreshold(notice)` from
  `apps/portal/src/server/email/usage.ts` for each owner crossing.
- **N-34 / N-48** (ARCO, dormancy): `renderGenericNoticeEmail` until they get
  their own templates.

## 6. Open items

- **Owner address for businesses without a Stripe customer.** The owner's
  email is in `auth.users`, readable by no portal role outside a session. The
  trial and usage emails therefore use the Stripe customer's email, which a
  business has once it starts a trial. A free-from-day-one business gets no
  usage email until a `xangarro.owner_email(business_id)` security-definer
  function (granted to `xangarro_billing`) exists — a data-pg migration.
- **Logo.** The layout shows a text wordmark; swap in the hosted logo when it
  exists (`packages/email/src/templates/layout.tsx`).
- **B-14's original templates** `activation-code`, `welcome`, `payment-failed`,
  `factura-issued` are not written yet; the layout and `renderEmail` make each
  one small.
