# Cachink! — launch checklist

_Last updated 2026-04-24 (Phase 1F close)._

This is the human-execution checklist for launching Cachink to the public.
The agent has delivered every prerequisite (configs, scripts, docs); the
steps below are the gated actions that need a real account, a physical
certificate, or a submission to a human-operated review queue.

## ☐ 1. Domains + web presence

- [ ] Purchase `cachink.mx` (~MXN $250/year via MXDomains or similar).
- [ ] Configure DNS:
  - `A    @ →  <landing server IP>`
  - `MX   @ →  <email provider>`
  - `TXT  @ →  v=spf1 …` + DKIM + DMARC.
- [ ] Deploy `docs/landing/index.html` to Cloudflare Pages / Netlify /
      Vercel. Point `cachink.mx` at it.

## ☐ 2. Platform developer accounts

- [ ] **Apple Developer** — $99/year. Enrol `mx.cachink` team.
- [ ] **Google Play Developer** — one-time $25.
- [ ] **Supabase** — free tier is fine for hosted default; upgrade
      later if traffic warrants.
- [ ] **PowerSync** — create the Cachink tenant; point it at the
      Supabase Postgres.
- [ ] **Windows code-signing certificate** — DigiCert or Sectigo
      OV/EV cert for MSI installers.

## ☐ 3. Signing material (never commit)

- [ ] Apple: EAS Build handles certs automatically. Run `eas
  credentials` once per team.
- [ ] Android: EAS Build generates the keystore (or upload existing).
- [ ] macOS desktop: install Developer ID cert locally, note the
      identity name, set `CACHINK_APPLE_SIGNING_IDENTITY`.
- [ ] Windows desktop: install the code-signing cert, note the
      thumbprint, set `CACHINK_WINDOWS_CERT_THUMBPRINT`.
- [ ] Tauri updater keypair: `cargo install tauri-cli`, then
      `tauri signer generate -w ~/.cachink/updater.key`. Copy the
      public key into `tauri.conf.json`'s `plugins.updater.pubkey`.
      Private key goes into `CACHINK_UPDATER_PRIVATE_KEY` env.

## ☐ 4. Env vars + secrets

- [ ] EAS secrets (via `eas secret:create`):
      `PREVIEW_CLOUD_API_URL`, `PREVIEW_CLOUD_ANON_KEY`,
      `PREVIEW_POWERSYNC_URL`, + production variants.
- [ ] Local `.env.local` matches for dev builds.

## ☐ 5. Build + distribute

- [ ] `./scripts/build-all.sh --dry-run` — sanity check.
- [ ] `./scripts/build-all.sh` — produces signed `.ipa`, `.aab`,
      `.dmg`, `.msi` + `dist/CHECKSUMS.txt` + `dist/sbom.json`.
- [ ] Upload the GitHub Release; include the SBOM + checksums.

## ☐ 6. Beta

- [ ] Invite 5–10 emprendedoras via TestFlight + Play internal track.
      Invitee template: `docs/beta/invitees.csv`.
- [ ] Weekly 30-minute video call with each. Log feedback in GitHub
      Issues with `beta-feedback` label.
- [ ] Triage severity; fix P1 bugs in a `1.0.0-rc.N` cycle.

## ☐ 7. Public submission

- [ ] App Store: `eas submit -p ios --latest`. Expect 1–3 business
      days for review.
- [ ] Play Store: `eas submit -p android --latest` → promote to
      Production once internal testing is clean.

## ☐ 8. Launch

- [ ] Flip DNS / deploy landing page.
- [ ] Post the announcement (`docs/launch/announcement.md`) on
      Twitter / LinkedIn / tech-mx Slack groups.
- [ ] Publish GitHub Release `v0.1.0`.
- [ ] Monitor Sentry for the first 48 hours. Have a rollback build
      ready (`expo-updates` can ship hotfixes without a full
      resubmission).

## ☐ 9. Tag

Once the public builds are live in both stores, tag the repo:

```sh
git tag -a v0.1.0 -m "Phase 1 public beta"
git push --tags
```

> The agent did **not** tag automatically — tagging is coupled to the
> store-submission moment, which is a human action.
