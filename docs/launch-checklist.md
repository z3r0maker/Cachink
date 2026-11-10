# Xangarro — launch checklist

_Last updated 2026-07-09 (MVP iOS prep)._

This is the human-execution checklist for launching Xangarro to the public.
The agent has delivered every prerequisite (configs, scripts, docs); the
steps below are the gated actions that need a real account, a physical
certificate, or a submission to a human-operated review queue.

> **MVP scope:** The first release targets **iOS only (iPhone + iPad)**.
> Android, macOS, and Windows distributions are deferred post-MVP. All
> items are tagged **[MVP]** or **[Deferred]** accordingly.

---

## MVP (iOS)

### ✅ 1. EAS account + project (done)

- [x] EAS account created + project linked.
- [x] First production build deployed via `eas build -p ios --profile production`.

### ☐ 2. Domains + web presence

- [ ] Purchase `cachink.mx` (~MXN $250/year via MXDomains or similar).
- [ ] Configure DNS:
  - `A    @ →  <landing server IP>`
  - `MX   @ →  <email provider>`
  - `TXT  @ →  v=spf1 …` + DKIM + DMARC.
- [ ] Deploy `docs/landing/index.html` to Cloudflare Pages / Netlify /
      Vercel. Point `cachink.mx` at it.

### ☐ 3. Apple Developer account

- [ ] **Apple Developer** — $99/year. Enrol `mx.xangarro` team.
- [ ] Run `eas credentials` once per team to set up provisioning.

### ☑ 4. Bug reports (nothing to provision)

The phone's «Reportar un problema» goes to the portal
(`POST /api/v1/support/bug-report`, device token) and lands in the staff
inbox; crash telemetry is Sentry's (step 5). The Supabase `bug-report` edge
function and its tables were retired by N-81 (ADR-140): there is no function
to deploy and no Supabase key in the app. The portal needs `ADMIN_INGEST_URL`
and `ADMIN_INGEST_SECRET` (`docs/ops/provisioning.md`) for reports to reach
the console.

### ☐ 5. Sentry (optional)

- [ ] Create a Sentry project for `mx.xangarro.mobile`.
- [ ] Grab the DSN — it goes into `PRODUCTION_SENTRY_DSN` (step 6).

### ☐ 6. EAS secrets

Set these via `eas secret:create` (one-time per environment):

| Secret                          | Value                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `PRODUCTION_API_BASE`           | The portal's origin, `https://…`. The release gate refuses anything else (ADR-139).  |
| `PRODUCTION_ENTITLEMENT_PUBKEY` | The entitlement public key, 64 hex (`docs/ops/provisioning.md` §2). Never a dev key. |
| `PRODUCTION_SENTRY_DSN`         | Sentry DSN (optional — omit if no Sentry account yet).                               |

The app reads no Supabase URL or key since N-81; `PRODUCTION_CLOUD_*` and
`PRODUCTION_BUG_INGEST_URL` can be deleted from EAS. `apps/mobile/eas.json`
passes these as literal `$PRODUCTION_*` strings, which EAS may not
substitute: confirm the first production build reads real values (the
release gate fails it if not).

Preview variants (`PREVIEW_*`) follow the same pattern if needed.

> **Important:** After creating/changing secrets, rebuild the binary
> (`eas build -p ios`) — env vars are compile-time in Expo.

### ☐ 7. Build + distribute (iOS)

- [ ] `eas build -p ios --profile production` — produces signed `.ipa`.
- [ ] Upload the GitHub Release; include `dist/CHECKSUMS.txt` + `dist/sbom.json`.

### ☐ 8. Beta (TestFlight)

- [ ] Invite 5–10 emprendedoras via TestFlight.
      Invitee template: `docs/beta/invitees.csv`.
- [ ] Weekly 30-minute video call with each. Log feedback in GitHub
      Issues with `beta-feedback` label.
- [ ] Triage severity; fix P1 bugs in a `1.0.0-rc.N` cycle.

### ☐ 9. App Store submission

- [ ] `eas submit -p ios --latest`. Expect 1–3 business days for review.

### ☐ 10. Launch

- [ ] Flip DNS / deploy landing page.
- [ ] Post the announcement (`docs/launch/announcement.md`) on
      Twitter / LinkedIn / tech-mx Slack groups.
- [ ] Publish GitHub Release `v0.1.0`.
- [ ] Monitor Sentry + bug-ingest DB for the first 48 hours. Have a
      rollback build ready (`expo-updates` can ship hotfixes without a
      full resubmission).

### ☐ 11. Tag

Once the public build is live in the App Store, tag the repo:

```sh
git tag -a v0.1.0 -m "MVP iOS public beta"
git push --tags
```

---

## Deferred (post-MVP)

These items are **not blocking** the iOS launch. The code is already
cross-platform; these steps unlock additional distribution channels.

### Android

- [ ] **Google Play Developer** — one-time $25.
- [ ] EAS Build generates the keystore (or upload existing).
- [ ] Re-add `submit.production.android` to `eas.json` with the Play
      service-account JSON.
- [ ] `eas build -p android --profile production` → `.aab`.
- [ ] `eas submit -p android --latest` → promote from internal track.

### Desktop (macOS + Windows)

- [ ] **macOS:** Developer ID cert, set `XANGARRO_APPLE_SIGNING_IDENTITY`.
- [ ] **Windows:** code-signing cert (DigiCert/Sectigo OV/EV),
      set `XANGARRO_WINDOWS_CERT_THUMBPRINT`.
- [ ] **Tauri updater keypair:**
      `cargo install tauri-cli && tauri signer generate -w ~/.xangarro/updater.key`.
      Copy public key into `tauri.conf.json`'s `plugins.updater.pubkey`.
      Private key → `XANGARRO_UPDATER_PRIVATE_KEY` env.
- [ ] `./scripts/build-all.sh` — produces signed `.dmg` + `.msi`.

### Cloud sync (PowerSync)

- [ ] **PowerSync** — create the Xangarro tenant; point at Supabase Postgres.
- [ ] Set `PRODUCTION_POWERSYNC_URL` to a real endpoint.
- [ ] Push `0001_schema.sql` tables + RLS + publication if not already done.

> The agent did **not** tag automatically — tagging is coupled to the
> store-submission moment, which is a human action.
