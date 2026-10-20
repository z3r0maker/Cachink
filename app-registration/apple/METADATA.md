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
- Demo credentials: **TODO — seed a demo business + operator NIP on the
  production cloud and pin them here before the first submission.** The
  reviewer needs: activation email + code (or a pre-linked build), operator
  NIP, and a business with catalogue + an open turno so the app is alive.

## Review-safety checklist

- [ ] Demo tenant seeded and stable (credential rotation breaks review)
- [ ] Privacy policy URL live (landing site, Spanish)
- [ ] App Privacy label filled: crash reporting OFF by default (ADR-027),
      sync data to our own cloud, no ads, no tracking, no third-party sharing
- [ ] iPad screenshots included (`supportsTablet: true` makes them mandatory)
- [ ] Export compliance already answered in the binary
      (`ITSAppUsesNonExemptEncryption: false`)
- [ ] Production build verified on an iOS 27 device/sim (the scene-lifecycle
      crash we saw is dev-client-only, but verify once with a real store build)
- [ ] **The sale sound's replay bug** (found capturing these shots, with
      `EXPO_PUBLIC_E2E` off): the second sale's `seekTo(0)+play()` on the
      expo-audio player throws `Uncaught (in promise): The 1st argument
cannot be cast to type SharedObject<AudioPlayer>` — the try/catch in
      `use-sale-sound` cannot see it (the rejection is emitted past the call
      site). It took the app down on the simulator during capture; verify
      behavior on a production build and harden the replay path before
      submission (a user rings many sales in a row).
