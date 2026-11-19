# App Store metadata draft

Nothing here is submitted yet — this is the draft the App Store Connect record
gets filled from.

## Identity

| Field            | Value                                                           |
| ---------------- | --------------------------------------------------------------- |
| Name             | `Xangarro!` (first-come; fallback `Xangarro: caja del negocio`) |
| Subtitle         | `Ventas y caja de tu negocio` (27 of 30)                        |
| Primary language | Spanish (Mexico)                                                |
| Category         | Business                                                        |
| Bundle ID        | `mx.xangarro.mobile` (explicit App ID under team `25T7H2DCB3`)  |
| Apple ID         | `6836591900` (`ascAppId` in `apps/mobile/eas.json`)             |
| Version          | `1.0.0`                                                         |
| Availability     | Mexico only                                                     |
| Seller           | The owner's Individual account, publishing for MEXIA, S.A.S.    |
| Price            | Free, no in-app purchases                                       |

The paste-ready text for every listing field (name, subtitle, promotional
text, description, keywords, URLs) is
[`docs/store/listing-app-store.md`](../../docs/store/listing-app-store.md).

## App Review notes (the 2.1 defense)

The paste-ready notes, the sign-in fields and the pre-submission steps are in
[REVIEW-NOTES.md](./REVIEW-NOTES.md). The demo tenant is
`packages/data-pg/scripts/seed-demo.ts` («Tacos La Esquina»): owner email
`demo@xangarro.mx`, codes **`DEMXK7M3`** and **`DEMXPAD2`** (one per device
slot of the Xangarro plan; each links one device, once), operators Lupita
(NIP 1234) and Chuy (NIP 5678). Re-running the seed re-mints both codes and
revokes the last review's devices, so it runs before every submission.

Verified 2026-10-20 locally against the real stack (portal + Postgres, no
mock): typed activation → bootstrap → Lupita's login → turno → one cash sale
→ the ticket landed in `tickets`.

## Age rating answers

Checked 2026-11-18 against Apple's
[definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/).
Answer **No / None** to every content question, and to these:

| Question                       | Answer  | Why                                                                     |
| ------------------------------ | ------- | ----------------------------------------------------------------------- |
| Messaging and Chat             | **Yes** | Avisos: the owner writes to employees, who can reply                    |
| User-Generated Content         | No      | Nothing is broadly distributed; records and photos stay in the business |
| Social Media                   | No      | No profiles, feed or followers                                          |
| Shared Location                | No      | The app has no location permission                                      |
| Dating and Relationships       | No      |                                                                         |
| Unrestricted Web Access        | No      | Links open in the system browser                                        |
| Advertising                    | No      |                                                                         |
| Gambling, contests, loot boxes | No      |                                                                         |

Apple's reference lists messaging and chat at 4+, the expected result. Accept
what App Store Connect calculates.

## Review-safety checklist

- [ ] The Account Holder has accepted the current Apple Developer Program
      License Agreement (version of 2026-10-29)

- [x] Demo tenant seeded and verified: `seed-demo.ts`, two codes; re-run before each submission (it frees the device slots too)
- [ ] Privacy policy and support URLs live **with no placeholders** (guideline 2.1(a)): on 2026-11-18 `/soporte/` is ready, while `/privacidad/` and `/terminos/` still show `[CORREO PRIVACIDAD]`-style gaps until the landing is redeployed
- [ ] App Privacy label filled in App Store Connect from
      [PRIVACY-LABEL.md](./PRIVACY-LABEL.md)
- [ ] iPad screenshots uploaded (captured in `screenshots/ipad-13/`; `supportsTablet: true` makes them mandatory)
- [ ] Export compliance already answered in the binary
      (`ITSAppUsesNonExemptEncryption: false`)
- [ ] Production build verified on an iOS 27 device/sim (the scene-lifecycle
      crash we saw is dev-client-only, but verify once with a real store build)
- [x] ~~The sale sound's replay bug~~ — resolved by removal: the sale sound
      (a Cachink-era artifact) is gone wholesale — player, hook, toggle,
      setting, asset and the expo-audio dependency (`feat/remove-sale-sound`).
