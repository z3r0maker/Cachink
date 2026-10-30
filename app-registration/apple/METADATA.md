# App Store metadata draft

Nothing here is submitted yet — this is the draft the App Store Connect record
gets filled from.

## Identity

| Field            | Value                                                                            |
| ---------------- | -------------------------------------------------------------------------------- |
| Name             | `Xangarro` (check availability of `Xangarro!` — punctuation allowed, first-come) |
| Subtitle         | `La terminal de venta de tu negocio` (draft — es-MX)                             |
| Primary language | Spanish (Mexico)                                                                 |
| Category         | Business (primary); Finance (secondary, optional)                                |
| Bundle ID        | `mx.xangarro.mobile` (explicit App ID under team `25T7H2DCB3`)                   |
| Price            | Free — no in-app purchases                                                       |

## Description skeleton (draft)

Opens with the terminal framing: la terminal operativa de Xangarro para
registrar ventas, gastos y movimientos de caja desde el mostrario. Requiere
una cuenta de Xangarro vinculada desde el portal del dueño. Then the feature
blocks (capture offline, caja y turnos, inventario, avisos). No pricing, no
plan mention, no «descarga» marketing.

## App Review notes (the 2.1 defense)

- What it is: the operations terminal included with a Xangarro business
  subscription; the subscription is sold on the web portal; the app has no
  purchases.
- How to get in: use the manual code path («Escribir código» on the first
  screen) with the demo credentials below — the QR path requires a second
  screen.
- Demo credentials: **seeded and verified (2026-10-20)** — the App Review
  tenant is `packages/data-pg/scripts/seed-demo.ts` («Tacos La Esquina»):
  the reviewer types `demo@xangarro.mx` + code **`DEMXK7M3`** on the
  activation screen («Escribir código»), then signs the register in as
  **Lupita, NIP 1234** (Chuy, 5678, is the second). The code is minted
  for a year and re-minted (and un-redeemed) by re-running the seed —
  **run it against the hosted DB before each submission**:
  `DATABASE_URL=… BILLING_DATABASE_URL=… DEMO_OWNER_PASSWORD=… pnpm
--filter @xangarro/data-pg exec tsx scripts/seed-demo.ts`. The owner's
  portal password is set on the first run only (stable for review).
  Verified locally against the real stack (portal + Postgres, no mock):
  typed activation → bootstrap → Lupita's login → turno → one cash sale
  → the ticket landed in `tickets`. The seed also fixes two contract
  violations that 500'd the reviewer's activation before this: operator
  ids with a non-ULID `U`, and an entrada `motivo` outside
  `EntryReasonEnum`.

## Review-safety checklist

- [x] Demo tenant seeded and verified — `seed-demo.ts`, credentials above; re-run before each submission to re-mint the code
- [ ] Privacy policy URL live (landing site, Spanish)
- [ ] App Privacy label filled: crash reporting OFF by default (ADR-027),
      sync data to our own cloud, no ads, no tracking, no third-party sharing
- [ ] iPad screenshots included (`supportsTablet: true` makes them mandatory)
- [ ] Export compliance already answered in the binary
      (`ITSAppUsesNonExemptEncryption: false`)
- [ ] Production build verified on an iOS 27 device/sim (the scene-lifecycle
      crash we saw is dev-client-only, but verify once with a real store build)
- [x] ~~The sale sound's replay bug~~ — resolved by removal: the sale sound
      (a Cachink-era artifact) is gone wholesale — player, hook, toggle,
      setting, asset and the expo-audio dependency (`feat/remove-sale-sound`).
