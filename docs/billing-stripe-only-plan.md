# Billing Plan B: Stripe-Only (No Store Billing)

> **Status:** DRAFT — Alternative to `billing-and-licensing-plan.md`.
> **Created:** 2026-05-15
> **Last updated:** 2026-05-15
> **Authors:** Eduardo Torres, build.unosquare
>
> This plan explores distributing through App Store and Google Play for
> free, but handling ALL billing through Stripe via External Purchase
> Links. This avoids the 15% store commission entirely.
>
> **See also:** `billing-and-licensing-plan.md` for the RevenueCat +
> in-store billing alternative.

---

## Table of Contents

1. [Why This Plan Exists](#1-why-this-plan-exists)
2. [How It Works](#2-how-it-works)
3. [Legal Basis](#3-legal-basis)
4. [Platform Distribution Matrix](#4-platform-distribution-matrix)
5. [Revenue Comparison](#5-revenue-comparison)
6. [Architecture](#6-architecture)
7. [The Three App States](#7-the-three-app-states)
8. [Freemium Limits](#8-freemium-limits)
9. [Offline Abuse Prevention](#9-offline-abuse-prevention)
10. [Data Portability](#10-data-portability)
11. [Implementation Phases](#11-implementation-phases)
12. [Trade-offs vs Plan A](#12-trade-offs-vs-plan-a)
13. [Key Risks](#13-key-risks)
14. [Open Questions](#14-open-questions)
15. [Research Sources](#15-research-sources)

---

## 1. Why This Plan Exists

Plan A (billing-and-licensing-plan.md) uses RevenueCat to integrate with
four different billing systems: Apple App Store IAP, Google Play Billing,
RevenueCat Web Billing, and Stripe. Each store takes a 15% commission.

This plan simplifies everything to a single billing provider (Stripe) for
ALL platforms. The stores are used only as free download hosts.

Key advantages:
- **One billing integration** instead of four
- **~3% fees** instead of 15% (saves ~$12/subscriber/year on a $99/yr plan)
- **No RevenueCat dependency** (and its 1% fee above $2,500 MTR)
- **Unified subscription management** via Stripe Dashboard
- **Simpler codebase** — no platform-specific billing SDKs

---

## 2. How It Works

The app is listed as FREE on all stores. When the user wants to subscribe,
the app opens the system browser to a Stripe-hosted checkout page on your
domain (e.g., pay.cachink.mx). After payment, the app detects the active
subscription and unlocks full features.

```
User downloads Cachink! (FREE)
        |
        v
Uses the app with freemium limits (30 ventas/month)
        |
        v
Hits a limit or taps "Suscribirme"
        |
        v
App opens system browser -> pay.cachink.mx
        |
        v
Stripe Checkout page (your branding)
  - Email (becomes their identity)
  - Card / OXXO / SPEI (Mexican payment methods)
  - $XX/mes or $XX/ano
        |
        v
Payment succeeds -> Stripe webhook fires
        |
        v
User returns to app -> app calls your API
  GET /api/entitlement?email=maria@correo.com
        |
        v
API checks Stripe -> active subscription found
        |
        v
App caches signed entitlement token locally
        |
        v
Full access unlocked. Works offline.
```

### On a new device (cross-platform restore)

```
User installs Cachink! on a second device
        |
        v
"Ya tienes suscripcion? Ingresa tu email"
        |
        v
maria@correo.com
        |
        v
App calls: GET /api/entitlement?email=maria@correo.com
        |
        v
Stripe confirms active subscription
        |
        v
Full access unlocked. No second payment.
```

---

## 3. Legal Basis

### United States (and countries following US App Store policies, including Mexico)

The Epic v. Apple ruling (finalized December 2025) established that:

1. Apps CAN include **External Purchase Links** — buttons or links that
   send users to an external website for payment
2. Apple currently **cannot charge commission** on these external payments
   (the court is still determining whether Apple may charge a reduced fee)
3. Stripe launched specific tooling (May 2025) for iOS developers to
   build commission-free checkouts

### Key legal references

- Epic Games v. Apple — US Court of Appeals, December 2025 ruling
- Apple's "StoreKit External Purchase Link Entitlement" (US)
- Google Play's alternative billing program (available worldwide)

### Regulatory trajectory

Alternative distribution is expanding country by country:
- EU: Full alternative marketplaces + web distribution (iOS 17.4+)
- Japan: Alternative marketplaces (December 2025)
- Brazil: Apple agreed to allow alternatives (December 2025)
- Mexico: Not yet, but follows US App Store policy for billing rules

### Important caveat

Apple may eventually be allowed to charge a reduced commission (possibly
5-10%) on external payments. The court has not yet determined this amount.
Budget for this possibility.

---

## 4. Platform Distribution Matrix

| Platform | Distribution | Billing | Store fee | Notes |
|---|---|---|---|---|
| iOS / iPad | App Store (free) | External Link -> Stripe | 0% (+ Stripe 3%) | Epic v. Apple ruling |
| Android | Google Play (free) | External Link -> Stripe | 0% (+ Stripe 3%) | Or direct APK from website |
| macOS | .dmg from cachink.mx | Stripe | 0% (+ Stripe 3%) | Notarized, no MAS needed |
| Windows | .msi from cachink.mx | Stripe | 0% (+ Stripe 3%) | Tauri native installer |

### Why not sideload on Android?

Sideloading (direct APK download) is technically possible but requires
users to enable "Install from unknown sources," which is intimidating for
the target market (Mexican emprendedores, often non-technical). Google Play
distribution with external billing is a better user experience.

### Why not Mac App Store?

The Mac App Store adds complexity (App Sandbox, provisioning profiles,
review process) for no benefit when billing goes through Stripe anyway.
Direct .dmg distribution with Apple notarization is simpler and gives
users the same trust signal ("Apple verified this app").

---

## 5. Revenue Comparison

### Per subscriber, on a $99/year plan

| Channel | Gross | Fees | Net to you |
|---|---|---|---|
| App Store IAP (15%) | $99 | $14.85 | $84.15 |
| Google Play (15%) | $99 | $14.85 | $84.15 |
| RevenueCat (1% MTR) | — | ~$1.00 | — |
| **Plan A total** | $99 | **$15.85** | **$83.15** |
| | | | |
| Stripe (2.9% + $0.30) | $99 | $3.17 | $95.83 |
| **Plan B total** | $99 | **$3.17** | **$95.83** |
| | | | |
| **Savings per subscriber** | | | **$12.68/yr** |

### At scale

| Subscribers | Plan A annual revenue | Plan B annual revenue | Difference |
|---|---|---|---|
| 100 | $8,315 | $9,583 | +$1,268 |
| 500 | $41,575 | $47,915 | +$6,340 |
| 1,000 | $83,150 | $95,830 | +$12,680 |
| 5,000 | $415,750 | $479,150 | +$63,400 |

---

## 6. Architecture

### What you need to build (that Plan A doesn't require)

Plan A offloads subscription management to RevenueCat + store billing
systems. Plan B requires you to build a lightweight backend.

```
Your infrastructure:

  ┌──────────────────────────────────────────────┐
  |            pay.cachink.mx                    |
  |                                              |
  |  Stripe Checkout (hosted)                    |
  |    - Subscription creation                   |
  |    - Mexican payment methods                 |
  |      (card, OXXO, SPEI, transferencia)       |
  |    - Customer portal (manage/cancel)         |
  └──────────────┬───────────────────────────────┘
                 |
                 | Webhook events
                 v
  ┌──────────────────────────────────────────────┐
  |            api.cachink.mx                    |
  |                                              |
  |  Lightweight API (serverless or edge)         |
  |                                              |
  |  POST /webhook/stripe                        |
  |    - Receives subscription events            |
  |    - Updates entitlement state               |
  |    - Signs entitlement tokens                |
  |                                              |
  |  GET  /api/entitlement?email=X               |
  |    - Returns signed entitlement token        |
  |    - App caches locally for offline use      |
  |                                              |
  |  POST /api/devices/register                  |
  |    - Tracks active devices (max 5)           |
  |                                              |
  └──────────────────────────────────────────────┘
```

### Technology options for the API

| Option | Pros | Cons |
|---|---|---|
| Cloudflare Workers | Edge-fast, free tier generous, D1 for SQLite | Vendor lock-in |
| Vercel Edge Functions | Easy deployment, works with Stripe | Cold starts |
| Supabase Edge Functions | Already in the stack (sync-cloud) | Adds dependency |
| Fly.io | Full control, global regions | More ops work |

The API is extremely simple — two endpoints + a webhook handler. Total
code is likely under 200 lines. Any serverless platform works.

### Signed entitlement token

The API returns a signed JWT that the app caches locally:

```json
{
  "sub": "maria@correo.com",
  "tier": "subscribed",
  "currentPeriodEnd": "2026-07-15T00:00:00Z",
  "gracePeriodEnd": "2026-07-20T00:00:00Z",
  "deviceLimit": 5,
  "iat": 1718400000,
  "exp": 1721078400
}
```

The app validates the JWT signature locally (no network needed) and checks
the expiration dates. This is the same offline mechanism described in
Plan A, but the token comes from your own API instead of RevenueCat.

### Mexican payment methods

Stripe supports these payment methods in Mexico:
- Credit/debit card (Visa, Mastercard, Amex)
- OXXO (cash payment at convenience stores — huge in Mexico)
- SPEI (bank transfer)
- Transferencia bancaria

OXXO is particularly important for the target market. Many small business
owners in Mexico don't have credit cards but regularly pay for services
at OXXO.

---

## 7. The Three App States

Identical to Plan A. See billing-and-licensing-plan.md Section 2 for full
details. Summary:

| State | When | What works |
|---|---|---|
| `free` | Never subscribed, or subscription expired + online | Everything with usage limits |
| `subscribed` | Active subscription (online or cached token valid) | Everything, unlimited |
| `read_only` | Subscription expired + offline + grace period over | View and export only |

---

## 8. Freemium Limits

Identical to Plan A. See billing-and-licensing-plan.md Section 3.

| Resource | Free | Subscribed |
|---|---|---|
| Ventas per month | 30 | Unlimited |
| Egresos per month | 20 | Unlimited |
| Products in catalogue | 15 | Unlimited |
| Devices | 1 | Up to 5 |
| LAN sync | No | Yes |
| Informe mensual PDF | No | Yes |

---

## 9. Offline Abuse Prevention

Same mechanism as Plan A (signed expiration token + grace period), but the
token comes from your own API (api.cachink.mx) instead of RevenueCat.

The key fields are baked into the JWT at subscription time:
- `currentPeriodEnd` — when the billing period ends
- `gracePeriodEnd` — 5 days after period end

The app checks these dates locally. No network call needed. See Plan A
Section 4 for the full day-by-day timeline.

One difference: since Stripe sends webhook events for subscription
renewals, your API automatically generates new tokens with extended dates
each billing cycle. The app fetches the new token when it comes online.

---

## 10. Data Portability

Identical to Plan A. See billing-and-licensing-plan.md Section 6.

The .cachink backup file works the same regardless of billing provider:
- Export: Settings -> "Exportar respaldo completo" -> .cachink file
- Import: First-run wizard or Settings -> "Importar respaldo"
- Always available in all states (free, subscribed, read_only)

---

## 11. Implementation Phases

### Phase S1 — Stripe Backend + Entitlement Foundation

Build the billing backend and wire up entitlement states in the app.

1. Create the lightweight API (api.cachink.mx):
   - POST /webhook/stripe — handle subscription events
   - GET /api/entitlement — return signed JWT
   - POST /api/devices/register — track active devices
2. Set up Stripe:
   - Create Stripe account
   - Configure subscription product + pricing
   - Enable Mexican payment methods (card, OXXO, SPEI)
   - Set up Stripe Checkout with your branding
   - Configure webhook endpoints
3. Build Stripe Customer Portal page (pay.cachink.mx):
   - Subscription management (cancel, update card)
   - Invoice history
4. Create `packages/entitlement` with types and interfaces
5. Add MockEntitlementProvider to packages/testing
6. Add EntitlementContext + useEntitlement() + useIsFree() hooks
7. Add UsageCounter entity to domain + data layers
8. ADR documenting the Stripe-only billing model

### Phase S2 — App Integration (all platforms)

Wire up the subscription flow in the app.

1. Build SubscriptionScreen with "external purchase link" UX:
   - Opens system browser to pay.cachink.mx/checkout
   - On return, app calls /api/entitlement to get token
2. Build "Restore subscription" flow (enter email -> verify)
3. Implement signed JWT caching in SQLite
4. Implement grace period countdown + banner
5. Build ReadOnlyLockScreen
6. Build LimitReachedModal + UsageCounterBadge
7. Gate write-mutations behind entitlement checks
8. Build UpgradePrompt component

### Phase S3 — Free Limits Enforcement

1. Add usage_counts table (ventas_count, egresos_count per month)
2. Wire useRegistrarVenta / useRegistrarEgreso to check limits
3. Build soft counter badge in app shell ("12/30 ventas este mes")
4. Build limit-reached modal with subscription CTA
5. Tests: verify all three states gate correctly

### Phase S4 — Desktop Distribution

1. macOS: Configure Tauri .dmg build + Apple notarization
2. Windows: Configure Tauri .msi build + code signing
3. Set up download page on cachink.mx
4. Auto-updater via Tauri's built-in updater (checks your server)
5. Test: download from website -> subscribe via Stripe -> full access

### Phase S5 — Data Portability (.cachink backup)

Same as Plan A Phase E5:
1. Build exportBackup() and importBackup()
2. Add to Settings screen and first-run Wizard
3. Add to ReadOnlyLockScreen
4. Tests: round-trip export/import

### Phase S6 — Polish

1. Device registry + "Mis dispositivos" screen
2. OXXO payment flow testing (async — takes 24-48h to confirm)
3. Remote config for usage limits
4. Subscription analytics (Stripe Dashboard + custom metrics)
5. Promotional codes via Stripe Coupons
6. Auto-updater for desktop apps

---

## 12. Trade-offs vs Plan A

### What Plan B does better

| Aspect | Plan A (RevenueCat) | Plan B (Stripe-only) |
|---|---|---|
| Commission | 15% + 1% | ~3% |
| Billing integrations | 4 (iOS, Android, Mac, Stripe) | 1 (Stripe only) |
| SDKs | react-native-purchases + purchases-js | None (HTTPS calls) |
| Mexican payment methods | Card only (store limitation) | Card + OXXO + SPEI |
| Subscription management | RevenueCat dashboard | Stripe Dashboard |
| Vendor dependencies | RevenueCat + Apple + Google + Stripe | Stripe only |
| Backend required | No (RevenueCat is the backend) | Yes (lightweight API) |

### What Plan B does worse

| Aspect | Plan A (RevenueCat) | Plan B (Stripe-only) |
|---|---|---|
| Purchase friction | Native store UX (Face ID, 1-tap) | Opens browser, manual card entry |
| User trust | "Pay via App Store" feels safe | "Pay on website" may feel less safe |
| Backend ops | None (RevenueCat manages) | You host + maintain a small API |
| OXXO async payments | N/A | Need to handle 24-48h confirmation delay |
| Apple compliance risk | Zero (using their system) | Low but nonzero (external link rules may change) |
| Auto-renew UX | Store handles silently | Stripe handles, but no "Manage Subscriptions" in iOS Settings |
| Refund handling | Store handles | You handle via Stripe |
| Tax compliance | Store handles | Stripe Tax or you handle |

### The biggest trade-off: purchase friction

Native store billing (Plan A):
```
User taps "Subscribe" -> Face ID -> Done. 2 seconds.
```

External billing (Plan B):
```
User taps "Subscribe" -> Safari opens -> Enter email ->
Enter card (or choose OXXO) -> Confirm -> Return to app.
30-60 seconds.
```

This friction WILL reduce conversion rates. Industry data suggests
external billing converts 20-40% lower than native store billing.
However, the higher revenue per subscriber may offset this, especially
at smaller scale.

---

## 13. Key Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Apple changes external payment rules | Medium | Monitor legal developments. Keep Plan A as fallback. Both plans share the same entitlement architecture — switching billing provider doesn't require UI changes. |
| Apple charges reduced commission on external payments | Medium | Budget for up to 10% Apple fee. Even at 10%, you'd still save vs 15% store fee. |
| Lower conversion rate from browser checkout | High | Optimize checkout page for speed. Support OXXO (huge in Mexico). A/B test against in-store billing if needed. |
| OXXO payments are async (24-48h) | Low | Show "Pago pendiente" state in app. Stripe webhook fires when OXXO payment clears. App unlocks on next online check. |
| API downtime blocks new subscriptions | Low | Serverless/edge deployment with 99.9%+ uptime. Cached tokens keep existing subscribers working offline. |
| Tax compliance in Mexico | Medium | Use Stripe Tax for automatic tax calculation and invoicing. Mexico requires RFC-based invoicing for some business expenses. |

---

## 14. Open Questions

These need answers before implementation (shared with Plan A):

- [ ] **Pricing:** Monthly and/or yearly? Price point?
- [ ] **OXXO flow:** How to handle the 24-48h confirmation gap? Show a
      "pending" state or block until confirmed?
- [ ] **Tax invoicing:** Do Mexican businesses need a factura (CFDI) for
      the subscription? If so, Stripe may not cover this natively.
- [ ] **API hosting:** Which platform? (Cloudflare Workers, Vercel,
      Supabase Edge, Fly.io)
- [ ] **Domain:** pay.cachink.mx and api.cachink.mx — or different naming?
- [ ] **Conversion risk:** Is the team comfortable with potentially lower
      conversion rates in exchange for higher per-subscriber revenue?
- [ ] **Hybrid approach:** Could you offer BOTH in-store billing AND
      external billing, letting users choose? (More complex but maximizes
      conversion + revenue)
- [ ] **Grace period:** 5 days or 7 days?

---

## 15. Research Sources

- Epic v. Apple External Payments Guide (Paddle):
  https://www.paddle.com/resources/external-payments-guide-ios-app-developers
- Stripe iOS Commission-Free Checkouts (TechCrunch, May 2025):
  https://techcrunch.com/2025/05/01/stripe-shows-ios-developers-how-to-avoid-apples-app-store-commission/
- Can You Use Stripe for In-App Purchases in 2026 (Adapty):
  https://adapty.io/blog/can-you-use-stripe-for-in-app-purchases/
- App-to-Web Purchase Guidelines (RevenueCat):
  https://www.revenuecat.com/blog/engineering/app-to-web-purchase-guidelines/
- New US Ruling on External iOS Payments (Adapty):
  https://adapty.io/blog/new-us-ruling-on-external-ios-payments/
- Build Commission-Free iOS Checkouts (Vercel + Paddle):
  https://vercel.com/kb/guide/build-commission-free-ios-checkouts-with-vercel-and-paddle
- How to Avoid Apple 30% Fee (PaynoPain):
  https://paynopain.com/en/blog/avoid-apple-in-app-fee-ios-payment-gateway/
- Apple Alternative App Distribution:
  https://support.apple.com/en-us/118110
- Apple Agrees to Third-Party Stores in Brazil (AppleInsider):
  https://appleinsider.com/articles/25/12/23/apple-agrees-to-third-party-app-store-alternatives-in-brazil
- Alternative App Stores Beyond Google Play (Newly):
  https://newly.app/alternative-app-stores
- Tauri Distribution:
  https://v2.tauri.app/distribute/
- Tauri DMG Distribution:
  https://v2.tauri.app/distribute/dmg/
- SQLite Wasm + OPFS (Chrome Developers):
  https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system
- SQLite in 2026:
  https://alexishope.dev/posts/sqlite-in-2026/
- Stripe Mexico Payment Methods:
  https://stripe.com/mx/payments
