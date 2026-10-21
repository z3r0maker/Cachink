# App Registration — Apple (App Store)

The App Store presence for the phone app. Sibling folders (`google-play/`)
will follow when the Android listing starts; everything here is Apple-only.

## Positioning (the load-bearing decision)

**The app is the terminal; the portal is the product.**

The phone app is an operational add-on for an existing Xangarro business: the
owner runs the negocio from the web portal (identity, roles, catalogue,
billing), and this app is the capture surface their operators use on the shop
floor. Nobody buys anything in the app — no price, no plan, no purchase link,
no in-app purchases. Category **Business**, price **free**.

This maps to the Shopify-POS / Clover shape of the store, which Apple reviews
without friction provided two things hold:

1. **No steering** (Guideline 3.1.1): nothing in the binary points to buying
   Xangarro. Account-administration pointers ("se edita desde la cuenta del
   negocio") are fine; checkout/pricing/upsell is not. See
   [AUDIT-steering.md](./AUDIT-steering.md).
2. **The reviewer can get in** (Guideline 2.1): the app is inert without a
   linked business, so the App Review notes must carry demo credentials — a
   seeded demo business, an operator NIP, and the manual code path
   (`vincular-escribir`: email + código) rather than the QR.

## What lives here

| File                | What it is                                                     |
| ------------------- | -------------------------------------------------------------- |
| `README.md`         | This positioning note                                          |
| `AUDIT-steering.md` | The no-steering audit of the app's user-facing copy            |
| `SCREENSHOTS.md`    | Manifest of `screenshots/` (device, screen, capture)           |
| `METADATA.md`       | Listing draft: name, subtitle, review notes, demo account TODO |
| `screenshots/`      | PNG captures at Apple's required device sizes                  |

## Sizes captured

| Device class | Simulator                       | Resolution  | Apple requirement         |
| ------------ | ------------------------------- | ----------- | ------------------------- |
| iPhone 6.9"  | iPhone 17 Pro Max (iOS 26.5)    | 1320 × 2868 | required set              |
| iPad 13"     | iPad Pro 13-inch (M5, iOS 26.5) | 2064 × 2796 | required (supportsTablet) |

Captures are honest app states driven by the Maestro harness against the
contracts mock (no compositing, no fixture screens).
