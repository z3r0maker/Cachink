# Track X — Launch / integration (one session, after A, B, P, L)

> Puts the pieces together against real infrastructure, migrates partners, sets Xangarro up as its
> own first customer, and hands the human the CLAUDE.md edit. Nothing here is parallel with A/B/P.

---

### X-01 Staging environment (Q17 "A later")

- [ ] Status · **Blocked by:** B-01…B-10 · **Blocks:** X-02
      **Remaining (2026-09-23, verified against the code):** the repo is ready (`eas.json` splits preview/production env and entitlement keys; both `vercel.json` pin `pdx1`) but `docs/ops/provisioning.md` has no staging section and `scripts/hosted/*` targets one database; the `xangarro-staging` Supabase project, the Vercel Preview env, the Stripe test binding and the separate keypair are all outside the repo.
- **Context:** Must exist **before the first paying customer**. Second Supabase project `xangarro-staging` (same region), Vercel preview env pointing at it, Stripe **test mode** bound to staging and **live mode** bound to prod, EAS `preview` channel → staging, `production` → prod.
- **Steps:** create project; run migrations; seed (B-04); Vercel env vars per environment; `apps/mobile/eas.json` `preview.env.EXPO_PUBLIC_API_BASE` → staging URL, `production` → prod; rotate the entitlement keypair so staging and prod use **different** keys (prod public key baked only in production builds).
- **Acceptance:** a preview build activates against staging with a staging-issued code; a production build refuses a staging entitlement (signature mismatch → freelancer limits, banner) — proves keys are separate.

### X-02 End-to-end integration run (real app ↔ real backend)

- [ ] Status · **Blocked by:** X-01, P-03, P-04, P-05, P-06, P-11, A-04…A-10, L-03 · **Blocks:** X-03, X-05
- **Steps (script it in `docs/plan/x02-runbook.md` as you go):** landing → "Empezar ahora" → signup Emprendedor with Stripe test card → onboarding → create 2 operators → import 3 products → add device → code arrives by email → **fresh install** preview build → activate → operator PIN → open caja → quick-sell 3 products → cancel one → gasto → corte de día → close caja → pull on portal: ventas/gastos/caja visible; Sync health clean → deactivate a product in portal → app pull hides it → ring a sale offline with a product then archive it in portal → go online → rejection visible on **both** sides → resolve. Then: Stripe `invoice.payment_failed` → grace banner on phone within one pull → `lapsed` → freelancer limits enforced (51st record blocked) → `invoice.paid` → back to Emprendedor. Then revoke device → phone returns to activation, data intact.
- **Acceptance:** every step observed; any defect becomes a task in the owning track (append, don't fix ad hoc); runbook committed.

### X-03 Partner migration

- [ ] Status · **Blocked by:** X-02
- **Steps:** message to prebeta partners (Spanish) explaining: new app, old app stays, export first (`Settings → Exportar datos`), Director account on `app.xangarro.mx`, code by email; schedule a call per partner; import their products from the export via P-07; confirm the old app is uninstalled only after they say so. Record each partner's business_id + date in `docs/ops/partners.md` (no personal data).
- **Acceptance:** every partner activated; zero "I lost my data" reports.

### X-04 Xangarro as tenant #1 (dogfooding)

- [ ] Status · **Blocked by:** X-02
- **Steps:** create business "Xangarro" on prod with a **paid** Emprendedor subscription (pay it — it exercises Stripe live + CFDI request); operators = the founders; record OpEx/CapEx as gastos with categories; monthly procedure in `docs/ops/finance.md`: Stripe payout report → one venta per payout (or per invoice if few) under categoría "Suscripciones" until Z-05 automates it; request your own factura via P-10 to rehearse the manual CFDI path (B-15/Q15).
- **Acceptance:** first month closed in Xangarro; Estados Financieros (P-14) show real numbers.

### X-05 Store listings + review readiness

> **Amended 2026-09-17 by Track N:** submit under the business-employee framing of ADR-069 (3.1.3(c)); blocked by N-32 (store-compliance sweep); send an external TestFlight build early for a review signal (OQ-6).

- [ ] Status · **Blocked by:** F-01, A-15, X-07, B-04 · **Blocks:** L-05
      **Remaining (2026-09-23, verified against the code):** `app.json` is renamed (Xangarro!, `mx.xangarro.mobile`) and `store:screenshots` exists, but `docs/store/listing-*.md` still points support/privacy/terms at `cachink.mx`, the copy is pre-pivot (modo local, Director, LAN sync), there are no review notes (demo account, «no purchase flow»), and `eas.json` `submit.production` has no `ascAppId`.
- **Steps:** App Store Connect + Play Console apps under `mx.xangarro.mobile`, name "Xangarro!"; update `docs/store/listing-*.md`; screenshots via `pnpm store:screenshots` after X-07; **review notes** with the demo account (B-04: `demo@xangarro.mx` + the password given to `seed-demo.ts`, operator PINs 1234/5678, activation code **`DEMXK7M3`** — re-run the seed against hosted before each submission so the code is live) and a sentence: "Xangarro is a business tool; subscriptions are purchased by business owners on our website; the app contains no purchase flow." `eas submit` profiles get `ascAppId`. Privacy nutrition labels updated (data now leaves the device). Confirm the current external-purchase/steering rules for the **Mexican** storefront before submission and record the source + date in the Done line (ADR-053 consequence).
- **Acceptance:** both listings in review with the demo account working from a fresh install.

### X-06 CLAUDE.md amendments (human applies)

- [ ] Status · **Blocked by:** — (can be prepared any time; apply at launch)
- **Context:** CLAUDE.md is humans-only; ADR-053/054 authorise. Prepare the exact diff in `docs/plan/x06-claude-md.diff` and the human applies it.
- **Diff to prepare:**
  - §1 Project Overview: app = capture client; portal owns Estados/Indicadores/Director Home/config; roles paragraph → Director (portal) / Operator (app).
  - §1 Modules list: remove Estados Financieros, Indicadores, Director Home; add "Activation" and "Sync status"; note portal modules live in `apps/web`.
  - §2.2 Local-first: amend per ADR-053 consequences (one activation round-trip; two-clock entitlement; fully offline in between).
  - §3/§4: add `apps/web`, `packages/contracts`, `packages/data-pg`, `packages/sync`; mark `archive/` as not-built; remove `apps/desktop` and Tauri mentions; remove PowerSync from `sync-cloud` line (archived).
  - §5 commands: add `pnpm mock:api`, `pnpm --filter @xangarro/web dev`, `supabase start`.
  - §6: Maestro rule unchanged; add "Portal screens ship with a Playwright smoke step"; add "No hand-written SQL — Postgres schema lives in `packages/data-pg`".
  - §7: remove "Playwright E2E for desktop (Tauri)".
  - §9 (entity fields): `Venta.producto_id` note stays; add `server_seq` audit column note.
  - §11 checklist: Data Layer gains "Mirror in `packages/data-pg` + drift test green"; App Shell Layer loses the desktop route line, gains "Contracts: add to §8 scope table if synced"; add "Portal: screen or N/A".
  - Rename: `Cachink!` → `Xangarro!` in the title and prose (identifiers in examples → `@xangarro/…`).
- **Acceptance:** diff applies cleanly on `main`; human commits it.

### X-07 Brand masters + derivatives (ADR-054 §6)

- [ ] Status · **Blocked by:** logo work (external) · **Blocks:** X-05
- **Steps:** land `assets/brand/{icon.png,icon-padded.png,logo.png,splash-mobile.png}` at the sizes `assets/brand/README.md` specifies (drop `splash-desktop.png` from the README — desktop archived); regenerate `apps/mobile/assets/*` and `packages/ui/src/assets/logo.png`; rewrite the README to match reality; delete the four `role-*.png`.
- **Acceptance:** README lists only files that exist; app shows the new icon/splash on a fresh install.

### X-08 Repo + directory rename (optional, coordinate)

- [ ] Status · **Blocked by:** A-15
- **Steps:** GitHub rename `z3r0maker/Cachink` → `Xangarro` (GitHub redirects the old URL); local `mv ~/Downloads/Cachink! ~/Downloads/Cachink` **without `!`** (the directory is already `Cachink`; a stray `~/Downloads/Cachink!` sits beside it); update `~/.claude/projects/*` memory pointers if any; same for `CachinkLanding` → `XangarroLanding`. Do it when no track branch is mid-flight.
- **Acceptance:** `git remote -v` shows the new name; CI still runs.

### X-09 ROADMAP.md reset

- [ ] Status · **Blocked by:** X-02
- **Steps:** collapse everything before this pivot into `ROADMAP-archive.md` (pattern in CLAUDE.md §12); ROADMAP.md becomes: current phase = Xangarro launch, pointer to `docs/plan/`, "last updated" truthful.
- **Acceptance:** ROADMAP.md < 200 lines and accurate.

### X-10 Launch checklist gate

- [ ] Status · **Blocked by:** X-01…X-09 (except X-08)
- **Steps:** IMPI trademark result recorded; domain live; DMARC passing; Sentry receiving from app + portal; backups: Supabase PITR enabled on prod; Stripe live keys; `docs/launch-checklist.md` rewritten for Xangarro; on-call: who watches Sync health + Stripe failures the first week.
- **Acceptance:** every line checked by a human.
