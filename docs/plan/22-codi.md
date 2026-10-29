# Track K — CoDi, de vuelta y de verdad

CoDi comes back (ADR-129, superseding ADR-108) as a real cobro. The **bridge** ships first, in
time for El Buen Fin (2026-11-13): the shop's own bank QR shown at the counter, with manual
confirmation. The **certified** flow follows once Banxico certifies MEXIA as a tercero
desarrollador: a live QR with the amount and automatic confirmation. Screens come from the canvas
first (ADR-117). The brief to paste into Claude Design is `23-codi-design.md`.

## 1. Owner decisions (2026-10-08)

1. **Route:** certify with Banxico _and_ ship an honest manual bridge now. ~~A certified partner
   behind the `PaymentProvider` port is the fallback if certification stalls.~~ Dropped
   2026-10-08 (ADR-130): there is no paid gateway or partner for CoDi, and automatic confirmation
   waits for MEXIA's certification.
2. **Plans:** CoDi on every plan, Xangarrito included, with its own capability `codi` and kill
   switch. `cobrosIntegrados` stays card terminals only.
3. **Bridge setup:** the owner scans or uploads their bank's static CoDi QR in the portal once.
   We decode it, check it, store the payload and redraw it.
4. **Certified flow:** a live QR with the amount; the screen turns to «Pago recibido» on its own.
   Offline, a timeout or an expired code fall back to the bridge QR with «Ya me llegó». No push
   to the customer's phone.
5. **Scope:** portal setup, phone Cobrar, web caja, a printable counter sign, a Nivel 2 Bis
   meter on Inicio, a landing section.

## 2. What we know (2026-10-08)

- **The law:** Ley de Economía Digital, approved by the Diputados on 2026-10-06, now in the Senado.
  It does not oblige small shops to drop cash. Hacienda will name the sectors where digital
  payment can be the only one. Banks have until December to ship CoDi in their apps, several
  before El Buen Fin.
- **Banxico's terms** (Guía de participación, 2023-05-02):
  - the 7-step registration in ADR-129;
  - no fee per cobro or by amount, and no surcharge;
  - money paid straight to the shop's account, never through a concentrating account;
  - extra services optional.
- **Paid services** (evaluated 2026-10-08, ADR-130):
  - no provider publishes a CoDi price or a CoDi API for platforms, and STP's «Contratar CoDi»
    page returns 404;
  - the nearest thing is a gateway confirming a SPEI transfer:
    - Conekta charges $12.50 + IVA ($14.50), which is 9.1% of a $160 ticket and more than a card
      (3.4% + $3 + IVA);
    - Stripe is reported at about 1.8%, unverified;
    - Openpay publishes no price;
  - the money settles to the gateway and is paid out to the shop later;
  - if MEXIA contracted the service, MEXIA would be holding shops' money (ADR-066, Ley Fintech);
  - CoDi itself is free: the fees are for the gateway's own service, not for CoDi.
- **How the file is delivered** (asked 2026-10-08):
  - the 2023 guide asks for the carta de intención and Anexo 1 on paper at Banxico, and does not
    say the representative must attend;
  - the owner saw online that email may work, which is not confirmed;
  - codi.org.mx lists `codi@banxico.org.mx` and 800 226 9426, option 3, for questions;
  - K-01 starts by asking that address.
- **Cobro mechanics** (from Banxico's material and an open-source integration, to verify in the
  sandbox, K-20):
  - every request is signed with the developer's certificate, per environment;
  - a QR cobro returns a `folio` plus the QR;
  - Banxico posts a signed result notification that is checked against its public certificate;
  - a status query by folio is the poll and the reconciliation path.
  - Still unknown: the expiry window, the maximum amount per cobro (it was $8,000 in 2019), and
    the merchant-enrolment and CLABE-titularity checks.
- **In the repo:**
  - `QR/CoDi` is still in `PaymentMethodEnum` and both `CHECK`s;
  - `RETIRED_PAYMENT_METHODS` hides it;
  - `PlanCapabilities.cobrosIntegrados`'s JSDoc still says «QR/CoDi» (fix in K-10);
  - no `payment_ref` exists on the venta yet.

## 3. Constraints for every task

- The device writes the venta, never the server (ADR-066, ADR-058 §2).
- A cobro is never blocked: every CoDi screen has a way out to another method.
- Money in centavos, parsed at every boundary (§2.8). The QR's amount is formatted from
  centavos, never from a float.
- The bridge's copy never implies confirmation. Before K-24 ships, no surface says «se confirma
  solo» or «automático».
- The CLABE is shown masked everywhere except the setup screen and the printed sign.
- Banxico certificates and keys stay server-side and encrypted. Nothing reaches a device.

## 4. Tasks

**Phase 0 — the Banxico file (owner actions, start now)**

### K-01 Registro de MEXIA como tercero desarrollador CoDi

- [~] Status · **Blocked by:** MEXIA incorporated and up to date with the SAT (acta, RFC, the company's e.firma, a positive 32-D) (ADR-125)
  **Remaining (2026-10-08):** el dueño revisa el expediente. Investigación completa en
  `docs/plan/22-codi.md` K-01 (la carta y sus 8 anexos). Primero, confirmar que MEXIA está
  constituida y al corriente. Después, escribir a `codi@banxico.org.mx` (ADR-130) con cuatro
  preguntas: ¿se acepta en digital con e.firma?, ¿puede entregarlo un tercero?, ¿hay una guía más
  nueva que la de 2023?, ¿qué aceptan de una S.A.S. sin escritura ni poder notarial? No hay
  servicio de pago: la confirmación automática espera esta certificación.
- **What** (from Banxico's carta de intención format, which numbers the annexes 1–8 and
  supersedes the guide's a–h):
  - **Step 0 · MEXIA exists.** The acta constitutiva, the RFC, the company's e.firma and a
    positive opinión de cumplimiento (32-D). The 32-D needs every RESICO PM and IVA return filed
    since incorporation. Check that neither MEXIA nor the partners appear in the federal directory
    of sanctioned suppliers and contractors: the carta swears to it.
  - **Step 1 · ask Banxico.** Write to `codi@banxico.org.mx` (phone 800 226 9426, option 3):
    - digital filing with an e.firma, or paper?
    - can a third party or a courier deliver it?
    - is there a guide newer than 2023-05-02?
    - **for an S.A.S.** (electronic bylaws registered by the Secretaría de Economía, with no
      notarial deed), what replaces the certified copy of the deed and the notarised power of
      attorney (paragraphs a and e)?

    Deliver on paper only if they say so: Gerencia de Continuidad, Control y Soporte de Sistemas
    de Pagos e Infraestructuras de Mercados, Av. 5 de Mayo 6, piso 7, Centro, CDMX, ext. 8632,
    Monday–Friday 10:00–13:00 or 15:00–18:00.

  - **The carta de intención:** Banxico's format,
    https://www.banxico.org.mx/sistemas-de-pago/d/%7B730C923A-3C7C-A313-E482-74D793867C35%7D.pdf.
    - It goes on MEXIA letterhead and is signed by the apoderado legal.
    - **Contacts:** one project lead, and up to 2 each for operations, legal and technical. Give
      the name, role, phone, email and the **20-digit serial of their own e.firma** for each.
      Every contact needs a valid e.firma.
    - It ends with a sworn declaration (bajo protesta de decir verdad) that MEXIA has no
      impediment to contract with the federal government.
  - **The annexes.** Each has a maximum age at filing:
    - 1. certified copy of the acta constitutiva with every amendment, or the latest compulsa,
         with registration data (≤ 6 months). **S.A.S.: ask Banxico (step 1).**
    - 2. constancia de situación fiscal covering the business activity, and a copy of the RFC
         (≤ 15 business days; SAT portal, free).
    - 3. opinión de cumplimiento de obligaciones fiscales, which must be positive (≤ 15
         business days; SAT portal, free).
    - 4. Reporte de Crédito Especial of the company, from Buró de Crédito or Círculo de Crédito
         (≤ 15 business days). Free once every 12 months; it needs the request form, the power of
         attorney and an ID, and takes up to 5 business days.
    - 5. certified copy of the first testimonio of the representative's power of attorney, with
         copies of their INE, CURP and RFC (the guide says ≤ 20 business days). **S.A.S.: ask
         Banxico (step 1).**
    - 6. proof of address for anything about CoDi (≤ 3 months).
    - 7. company CV: the partners, Xangarro, its users, the team, and the security work already
         done (the SEC-\* audits).
    - 8. caso de negocio and implementation routes (below).
  - **Annex 8, the caso de negocio.** The five points of the guide's Anexo 2:
    - i. giro: software for micro and small businesses (Xangarro);
    - ii. how we use CoDi: QR cobro at the counter (static from the shop's bank, then
      dynamic with the amount), recorded as a venta;
    - iii. features: QR now, «vía internet» later if ever (ADR-129 skips push), plus our own
      extras (bookkeeping, reports);
    - iv. sold to comercios (micro-businesses), with no price tied to the number or amount of
      cobros, and how we identify clients dealing in virtual assets (we do not serve them);
    - v. pricing: CoDi included on every plan, no CoDi charge, no surcharge to the buyer. The
      money goes straight to the shop's account with no concentrating account, and extra
      services are optional.

    Also the **implementation routes**: the bridge first, then the certified dynamic QR with
    Banxico's notification, then the pre-check and production.

  - **Order:**
    - while Banxico answers: contacts' e.firmas, CV, caso de negocio, proof of address, a notary
      quote;
    - with their answer: the notary and Buró;
    - in the last week: the SAT constancia and 32-D, then sign and file.
  - **After filing:**
    - the confidentiality agreement, then the technical documentation and the security
      requirements;
    - the trademark licence;
    - sandbox access (K-20), the pre-check and certification (K-25).
  - Write the date of each step here.
  - The regulatory basis is Circular 13/2017, rule 12a. Bis: registration and prior
    certification, added by Circular 11/2019. Rule 18a. covers revocation. Circular 1/2025 does
    not touch developers.

- **Acceptance:** Banxico's production certification letter, filed in the Expediente (E-05).

### K-02 Opinión legal sobre CoDi

- [ ] Status · **Blocked by:** —
- **What:** a written opinion from Mexican counsel (it can share the engagement with O-18) on:
  - whether a plan price while CoDi is on every plan is compliant;
  - whether showing a shop's own bank QR needs any Banxico registration (the bridge);
  - storing the CLABE and the titular's name, and the privacy notice change;
  - the «sin comisiones» claim on the landing.
  - using the word «CoDi» and Banxico's CoDi® mark before the trademark licence (K-01 step 4) is signed.
- **Acceptance:** the opinion is filed. Any change it asks for becomes a task in this track.

**Phase 1 — the bridge (target: live before 2026-11-13)**

### K-10 Dominio: CoDi vuelve como método

- [ ] Status · **Blocked by:** —
- **What:**
  - drop `QR/CoDi` from `RETIRED_PAYMENT_METHODS`, and return it to `METODOS_CONFIGURABLES` only
    for a business with CoDi set up;
  - one label function that gives «CoDi» everywhere, replacing ADR-117's «Transferencia» mapping;
  - `PlanCapabilities.codi: true` on every plan, its kill switch in `KILL_SWITCH_KEYS`, and the
    stale JSDoc on `cobrosIntegrados` fixed;
  - `parseCodiQr(payload)` in `@xangarro/domain`, which accepts a CoDi payload and refuses a URL,
    an SPEI CLABE text or another wallet's QR, with typed errors.
- **Acceptance:**
  - TDD: a happy path plus at least 3 unhappy paths per function;
  - `parseCodiQr` is tested on real samples from at least 4 bank apps (the owner collects them
    once the banks ship).

### K-11 Datos: la configuración CoDi del negocio

- [ ] Status · **Blocked by:** K-10
- **What:**
  - `business_codi {business_id PK, modo puente|certificado, qr_payload, titular, clabe_last4,
banco, activado_at, activado_por}` in `data-pg` with RLS, and a migration with its test;
  - the reference data a device pulls carries it (a C-task: the contract change plus the mock
    server);
  - the SQLite mirror on the device, with its migration test.
- **Acceptance:**
  - an integration test builds a business with and without CoDi and reads both through
    `withTenant`;
  - an old device that ignores the field keeps syncing.

### K-12 Portal: Negocio → Cobros → CoDi

- [ ] Status · **Blocked by:** K-11, boards KD-01 … KD-03
- **What:**
  - the setup (upload, scan or paste; decode; preview; titular and banco; activate; replace;
    deactivate);
  - the printable sign (letter size and sticker size, as a PDF);
  - the audit log entry on every change.
- **Acceptance:**
  - Playwright `@serial` spec: upload a fixture QR, check the redrawn preview, activate, then
    assert the phone's reference data carries it;
  - a wrong image shows the refusal state.

### K-13 Teléfono: cobrar con CoDi (puente)

- [ ] Status · **Blocked by:** K-11, board KD-04
- **What:**
  - CoDi as the fifth method in Cobrar, shown only once the shop has set it up;
  - the bridge screen (QR, the total in large digits, «Ya me llegó», «Cambiar método»);
  - the venta written with `QR/CoDi`, confirmed in caja;
  - the comprobante says «Pagado con CoDi».
- **Acceptance:** a Maestro flow `cobrar-codi-puente.yaml` that uses the shared subflows.

### K-14 Caja web: cobrar con CoDi (puente)

- [ ] Status · **Blocked by:** K-13
- **What:** the same screen through `@xangarro/caja` (ADR-118), at the web caja's size.
- **Acceptance:** a Playwright spec that charges with CoDi and sees the venta in Ventas y gastos.

### K-15 Reportes: CoDi en su propia línea

- [ ] Status · **Blocked by:** K-10, board KD-06
- **What:** CoDi as its own line in cierre, Mi turno, flujo de efectivo, Ventas y gastos (a
  filter chip) and the sale detail, with how it was confirmed.
- **Acceptance:** an integration test with ventas in each method, and a historical `QR/CoDi`
  row, that totals and labels them correctly.

**Phase 2 — certified**

### K-20 Spike: el sandbox de Banxico

- [ ] Status · **Blocked by:** K-01 (the technical documentation and sandbox)
- **What:**
  - a runnable `scripts/spikes/codi-banxico.ts` that does signing, QR cobro, the status query and
    the signed notification;
  - record the expiry window, the amount cap, the error codes and the enrolment and titularity
    checks in `docs/spikes/codi-banxico.md`.
- **Acceptance:** a sandbox cobro goes from created to paid, and both a forged and a replayed
  notification are refused.

### K-21 Contrato: la intención de cobro CoDi

- [ ] Status · **Blocked by:** K-20
- **What:**
  - C-task: `POST /codi/cobros` (amount in centavos, concepto, idempotency key) → `{folio, qr,
expira_at}`, and `GET /codi/cobros/:folio` → `pendiente|pagado|expirado|rechazado`;
  - `payment_ref` on the venta (sync schema, migration tests on both databases);
  - the mock server.
- **Acceptance:** contract tests, and an old → new sync test for `payment_ref`.

### K-22 Backend: adaptador CoDi

- [ ] Status · **Blocked by:** K-21
- **What:**
  - the adapter behind ADR-066's `PaymentProvider` port (mode `codi-qr`);
  - MEXIA's certificates in the secrets store;
  - the notification endpoint (signature and serial checked, idempotent);
  - merchant enrolment and the CLABE titularity check per K-20;
  - a nightly reconciliation that raises an aviso for any paid cobro with no venta;
  - rate limits, and an audit row per cobro.
- **Acceptance:**
  - integration tests for paid, expired, duplicate notification and forged notification;
  - reconciliation finds an orphan.

### K-23 Portal: pasar a confirmación automática

- [ ] Status · **Blocked by:** K-22, board KD-02 (certified state)
- **What:** the setup gains «Confirmación automática»: enrol the shop with Banxico through
  Xangarro, check the CLABE belongs to the business, and keep the bridge QR as the fallback.
- **Acceptance:** a Playwright spec through the enrolment states against the mock.

### K-24 Teléfono y caja: QR en vivo

- [ ] Status · **Blocked by:** K-22, board KD-05
- **What:** the live flow (create cobro → QR with the amount → wait → «Pago recibido», then the
  venta with `payment_ref`), and its fallback states (sin internet, Banxico no responde, código
  vencido, rechazado), each dropping to the bridge.
- **Acceptance:** Maestro and Playwright flows for paid, expired→bridge and offline→bridge
  against the mock.

### K-25 Pentest y certificación final

- [ ] Status · **Blocked by:** K-24
- **What:** the external pentest covers the CoDi endpoints (with N-45's), then Banxico's
  pre-check and certification, then the kill switch is turned off per environment.
- **Acceptance:** certification letter, and the pentest's findings closed.

**Phase 3 — around it**

### K-30 Portal: medidor Nivel 2 Bis

- [ ] Status · **Blocked by:** the final rules for the Cuenta Nivel 2 Bis (Ley de Economía Digital, Senado), board KD-07
- **What:**
  - on Inicio, «Cobros digitales este mes» (CoDi + Transferencia) against the limit in UDIs;
  - the UDI value pulled daily from Banxico's SIE;
  - a pure function in `@xangarro/domain` for the conversion and the thresholds.
- **Acceptance:** domain tests at the edges, and Playwright on seeded data.

### K-31 Landing: «Cobra con CoDi»

- [ ] Status · **Blocked by:** K-02 (the claims), K-13
- **What:** a section on xangarro.mx (board KD-08): free CoDi cobros, no terminal, on every plan.
  It says «confirmación automática» only after K-24.
- **Acceptance:** prerendered, and the claims match K-02's opinion.
