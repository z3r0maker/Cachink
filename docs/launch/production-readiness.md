# Production readiness — legal, privacy and consent

> **Living document.** Started 2026-09-22 from `docs/audits/privacidad-2026-09-22.md` and the N-34 drafts.
> The owner adds findings here as they appear; nothing ships to production while a **BLOCKER** is open.
> Legend: **BLOCKER** = cannot go live · **BEFORE-STORES** = needed for App Store / Play submission ·
> **SOON** = first weeks after launch · `[x]` done · `[ ]` open · `[~]` drafted, pending review.

## 0. The one thing everything waits on

- [ ] **BLOCKER — Legal entity named.** `[RAZÓN SOCIAL]`, `[DOMICILIO]`, `[RFC]`, `[TELÉFONO]`,
      `[CORREO SOPORTE]`, `[CORREO PRIVACIDAD]`, `[NOMBRE O ÁREA]` (art. 29). Required by LFPDPPP
      art. 15 I and LFPC 76 Bis III; it is also who signs every DPA. A domicilio convencional is fine.
      When it lands: replace the brackets in `apps/web/src/legal/aviso-simplificado.ts`, bump
      `AVISO_VERSION`, and delete the placeholder assertion in `apps/web/tests/legal-aviso.test.ts`.

## 1. Legal texts

- [~] Aviso de privacidad integral — `docs/legal/aviso/aviso-integral.md` (generic, category-based).
- [~] Aviso simplificado (3 variantes) — `docs/legal/aviso/aviso-simplificado.md`.
- [~] Términos y Condiciones — `docs/legal/aviso/terminos-borrador.md` (replaces `docs/legal/terms.md`).
- [~] Anexo de encargado — `docs/legal/aviso/encargado-clausulas.md`.
- [~] Procedimiento ARCO — `docs/legal/aviso/arco-procedimiento.md`.
- [ ] **BLOCKER — Lawyer's review** of the five texts + the five confirmations in
      `docs/legal/aviso/respuestas-oq-borrador.md` §0.
- [ ] Plantilla de aviso for the negocio's own customers (OQ-L16).
- [ ] Retire `docs/legal/privacy.md` and `docs/legal/terms.md` once the above are approved.
- [ ] Fill the three `[PAÍS]` cells in aviso §6.1 (error monitoring, mail, messaging) and the
      `[PLAZO]`s once OQ-L13 is confirmed.

## 2. Consent capture (PRIV-REG-01) — implemented 2026-09-22

- [x] Aviso simplificado rendered on `/signup` above the button (`signup/consent.tsx`).
- [x] One affirmative act (unticked checkbox) for aviso + términos + express patrimonial consent;
      novedades pre-ticked (tacit); no analytics box.
- [x] `RegistrarCuentaUseCase` refuses without `acepto: true` (`CONSENT_REQUIRED`); grants built by
      `consentimientosDeRegistro` (domain) and written by the store **in the signup transaction**.
- [x] Ledger `xangarro.privacy_consents` — append-only, hash-chained, definer-only writes
      (`packages/data-pg/drizzle/0034_privacy_consents.sql`).
- [x] Hash of the exact text (`avisoVigente()`), IP stored only as SHA-256, user agent kept.
- [ ] **BLOCKER — Apply migration 0034** to hosted (`pnpm --filter @xangarro/data-pg db:migrate:hosted`);
      confirm `xangarro_app` can EXECUTE `privacy_consent_record` and nothing can UPDATE/DELETE.
- [ ] Run the Playwright onboarding spec against a database (`apps/web/e2e/onboarding.spec.ts` gained
      the acepto step and a refusal test) — not run in the session that wrote it.
- [ ] **SOON — Nightly seal job:** call `xangarro.privacy_consents_day_root(day)` and obtain a
      NOM-151 constancia (PSC) or an RFC 3161 timestamp; archive it with the day. Decide the PSC.
- [ ] Archive the full text of every `AVISO_VERSION` (a hash without its text proves nothing) —
      simplest: a `consent_versions` table or a versioned file kept forever.
- [ ] Configuración → Privacidad: show accepted version, toggle novedades (writes a
      `surface='configuracion'` row), link to ARCO.
- [ ] Re-consent gate on login when a version adds a finalidad (art. 11); banner otherwise.
- [ ] Decide checkbox vs. button-as-consent with the lawyer (OQ-N7); today: checkbox.

## 3. Rights the aviso promises (must exist before the aviso is public)

- [ ] **BLOCKER — Self-service account deletion in the portal** (export → confirm → cancel Stripe →
      delete; LFPDPPP arts. 21–24, LFPC 76 Bis IX). Not required in the mobile app (no in-app account
      creation) — see OQ-N4.
- [ ] In-app **"Desvincular y borrar los datos de este dispositivo"** (aviso §7 currently admits
      unlinking does not wipe).
- [ ] ARCO intake without a session (`/privacidad/solicitud`) + console handling with business-day
      clock (LFPA art. 28 calendar) and acuse.
- [ ] Retention calendar implemented per table (OQ-L13 numbers once confirmed); 72-month rule for
      payment-default data (art. 10).
- [ ] Breach protocol with the Reglamento art. 65 field list, a named person, and the 72 h clause to
      negocios; `security.txt` + vulnerability-disclosure page.
- [ ] Verify Sentry server-side captures no PII before the aviso says so.

## 4. Subscriptions (LFPC art. 76 Bis VIII–IX, in force 2025-12-13)

- [ ] **BLOCKER — Cancel in one click** from Configuración → Suscripción.
- [ ] **BLOCKER — Renewal reminder e-mail ≥ 5 business days before each charge**, with a one-click
      cancel link (tokenised).
- [ ] Recurring-charge consent screen at checkout: frequency, amount, date, express acceptance.
- [ ] Price increases: 30-day notice + express re-acceptance flow.
- [ ] Address, phone and complaint channel visible **before** contracting (landing + checkout).
- [ ] Legal links (aviso, términos) in the landing footer, the portal footer, e-mail footers.

## 5. Stores

- [ ] **BEFORE-STORES — Apple Privacy Nutrition Label + privacy manifest**; Play Data Safety form —
      both derived from aviso §3 so they cannot disagree.
- [ ] **BEFORE-STORES — Terms and privacy URLs live** (`xangarro.mx/privacidad`, `/terminos`) and
      linked inside the app binary + App Store Connect (Guideline 3.1.2).
- [ ] **BEFORE-STORES — Reviewer notes** explaining the device + NIP model (no in-app account, no
      Sign in with Apple/Google, deletion via the portal).
- [ ] Open-source licence notices screen generated from `pnpm licenses list --prod` (1,184 pkgs, no
      copyleft; resolve the 2 `Unknown`: `@tamagui/native`, `buffers`).
- [ ] Never add Sign in with Apple/Google to the mobile app (would trigger 5.1.1(v)).

## 6. Third parties and contracts

- [ ] Signed DPAs: Supabase, Vercel, Sentry, Stripe, mail provider, PAC, **Microsoft (Foundry)**,
      **Anthropic**. Named list delivered to negocios via the Anexo, and on request.
- [ ] Foundry hosting option decided and configured (**Hosted on Azure, US DataZone** recommended);
      written confirmation of the retention figure before the IA section publishes a number.
- [ ] `ASESOR_LLM_*` never pointed at a personal proxy with real tenant data (add a guard).
- [ ] Rule: the Asesor's model boundary stays the only module that knows a model exists; the IA
      section's negative list (no client names/phones/RFC, no free text, no credentials) is enforced
      at that boundary.

## 7. Product hygiene with legal weight

- [ ] Receipt (`comprobante`) carries **"Este comprobante no es un CFDI"** and the negocio's name as
      issuer (one i18n string + template line).
- [ ] Attribution retention rule for `signup_attribution` (geo has 400 days; propose the same).
- [ ] Landing beacon disclosed in the aviso (done) and a footer link on `xangarro.mx` (open).
- [ ] Marketing e-mail: opt-out honoured within the 5-day window; REPEP if phone/SMS ever used.
- [ ] Advertising claims on the landing are demonstrable (LFPC art. 32).

## 8. Intellectual property and governance

- [ ] **BLOCKER — IMPI trademark search and filing for "Xangarro"** (classes 9, 35, 36, 42) before
      public launch; ADR-054 is still "pending clearance".
- [ ] Licences recorded for hero images/illustrations/fonts (assets beyond sounds and map data).
- [ ] Cyber-liability insurance — business decision.
- [ ] INDAUTOR software registration — optional.

## 9. Deferred by decision (do not reopen without a reason)

- Credit / financing features: **not in v1.** When they come: opt-in addendum in the app, medium-not-
  offeror model, filtering only after the user's "sí" — full brief in `respuestas-oq-borrador.md` OQ-N2.
- In-house SOFOM: would enter as one more entity under the same model; never underwrites from the books.
- Providers named publicly: **no** — category + country in the aviso, names in the Anexo.

## Findings log (append here)

| Date       | Finding                                  | Severity | Owner | Status                   |
| ---------- | ---------------------------------------- | -------- | ----- | ------------------------ |
| 2026-09-22 | Signup captured no consent (PRIV-REG-01) | high     | eng   | fixed, migration pending |
| 2026-09-22 | Receipt lacks "no es CFDI" legend        | medium   | eng   | open                     |
| 2026-09-22 | Landing/portal have no legal links       | medium   | eng   | open                     |
