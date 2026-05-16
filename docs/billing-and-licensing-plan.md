# Billing & Licensing Plan — Cachink!

> **Status:** DRAFT — Pending business model decisions.
> **Created:** 2026-05-15
> **Last updated:** 2026-05-15
> **Authors:** Eduardo Torres, build.unosquare
>
> This document captures the billing architecture discussed but NOT yet
> approved for implementation. Revisit when the business model, pricing,
> and distribution strategy are finalized.
>
> **See also:** `billing-stripe-only-plan.md` — an alternative plan that
> bypasses store billing entirely, using Stripe for all platforms via
> External Purchase Links. Lower fees (~3% vs 15%), simpler architecture,
> but slightly more purchase friction.

---

## Table of Contents

1. [Decisions Made](#1-decisions-made)
2. [The Three App States](#2-the-three-app-states)
3. [Freemium Limits](#3-freemium-limits)
4. [Offline Abuse Prevention](#4-offline-abuse-prevention)
5. [Cross-Platform Billing via RevenueCat](#5-cross-platform-billing-via-revenuecat)
6. [Data Portability — .cachink Backup](#6-data-portability--cachink-backup)
7. [Device Limits](#7-device-limits)
8. [New Package Structure](#8-new-package-structure)
9. [Implementation Phases](#9-implementation-phases)
10. [Cost Summary](#10-cost-summary)
11. [Key Risks](#11-key-risks)
12. [Open Questions](#12-open-questions)
13. [Research Sources](#13-research-sources)

---

## 1. Decisions Made

These were discussed and agreed during the May 15, 2026 planning session:

| Decision | Answer |
|---|---|
| Pricing model | **Subscription** (recurring) |
| Cross-platform | **Buy once, use everywhere** |
| Desktop scope | **Mac + Windows** both at launch |
| After subscription expires (offline) | **Read-only mode** (view data, can't create) |
| First-time experience | **Freemium with limits** (e.g., 30 ventas/month) |

---

## 2. The Three App States

The entire billing system reduces to three states. Every screen checks which
state it's in.

### State machine

```
                    ┌──────────────────┐
    First install   │                  │  User subscribes
  ─────────────────>│      FREE        │─────────────────────┐
                    │  (with limits)   │                     │
                    │                  │<───────┐            │
                    └────────┬─────────┘        │            v
                             │            Cancels +    ┌───────────┐
                             │            online       │           │
                             │            (verified)   │ SUBSCRIBED│
                             │                         │  (full)   │
                             │                         │           │
                             │                         └─────┬─────┘
                             │                               │
                             │                    Offline + token
                             │                    nearing expiry
                             │                               │
                             │                               v
                             │                         ┌───────────┐
                             │    Comes online +       │  WARNING   │
                             │    doesn't renew        │ (countdown │
                             │<────────────────────────│  banner)   │
                             │                         └─────┬─────┘
                             │                               │
                             │                     Grace period
                             │                     expires (5 days)
                             │                               │
                             │                               v
                             │                         ┌───────────┐
                             │    Comes online +       │ READ_ONLY  │
                             │    doesn't renew        │ (view only │
                             │<────────────────────────│  + export) │
                             │                         └───────────┘
```

### State definitions (proposed types)

```ts
type AppTier = 'free' | 'subscribed' | 'read_only';

interface Entitlement {
  readonly tier: AppTier;
  readonly currentPeriodEnd: string | null;   // ISO timestamp
  readonly gracePeriodEnd: string | null;      // ISO timestamp
  readonly source: 'app_store' | 'google_play' | 'stripe' | null;
  readonly isInGracePeriod: boolean;
  readonly daysUntilLockout: number | null;
}
```

### What each state allows

| Action | `free` | `subscribed` | `read_only` |
|---|---|---|---|
| View ventas, egresos, productos | Yes | Yes | Yes |
| View Estados Financieros, Indicadores | Yes | Yes | Yes |
| Register new venta | Yes (up to limit) | Yes | **No** |
| Register new egreso | Yes (up to limit) | Yes | **No** |
| Create/edit producto | Yes (up to limit) | Yes | **No** |
| Register inventory movement | Yes | Yes | **No** |
| Corte de dia | Yes | Yes | **No** |
| Export data (Excel/PDF) | Yes | Yes | **Yes (always)** |
| Generate comprobante | Yes | Yes | **No** |
| Multi-device sync | No | Yes | No |
| Backup and restore (.cachink) | Yes | Yes | **Yes (always)** |

**Key principle:** Data export and backup are ALWAYS available in every state.
The user's data is never held hostage.

---

## 3. Freemium Limits

The free tier is genuinely useful — a real micro-business can operate on it.
The limits create natural upgrade pressure as the business grows.

### Recommended limits (adjustable via remote config)

| Resource | Free limit | Subscribed |
|---|---|---|
| Ventas per month | 30 | Unlimited |
| Egresos per month | 20 | Unlimited |
| Products in catalogue | 15 | Unlimited |
| Devices | 1 | Up to 5 |
| LAN sync | No | Yes |
| Informe mensual PDF | No | Yes |

> **Note:** These numbers are starting points. They should be stored as
> remote config so they can be adjusted without an app update. 30 ventas/month
> is roughly 1/day — even a tiny taco stand would hit this in the first week
> of real use, creating natural upgrade pressure.

### UX when a limit is hit

The user sees a modal:

```
  Llegaste al limite del mes

  Has registrado 30/30 ventas este mes.
  Suscribete para ventas ilimitadas.

  [Suscribirme — $XX/mes]

  Siguiente mes: 1 jun 2026 (16 dias)
```

A soft counter ("12/30 ventas este mes") should appear in the app shell
throughout the month so users see it coming and are never surprised.

### Proposed types

```ts
interface UsageLimits {
  readonly ventasPerMonth: number | null;    // null = unlimited
  readonly egresosPerMonth: number | null;
  readonly maxProductos: number | null;
  readonly maxDevices: number;
  readonly lanSyncEnabled: boolean;
  readonly informeMensualEnabled: boolean;
}
```

---

## 4. Offline Abuse Prevention

### The problem

If a user cancels their subscription and immediately disconnects from the
internet, the cached entitlement would let them keep using the app
indefinitely. How do we prevent this?

### The honest reality

You cannot make it 100% bulletproof. Even Netflix, Spotify, and Adobe accept
some offline grace period. The target market (Mexican emprendedores running a
real business) won't realistically set their phone to airplane mode permanently
to save a subscription fee — they need internet for WhatsApp, banking, card
terminals, and suppliers.

### The mechanism: signed expiration token

RevenueCat returns an entitlement with a hard expiration date baked in:

```
{
  tier: "subscribed",
  currentPeriodEnd: "2026-06-15T00:00:00Z",   <-- key field
  graceDays: 5
}

Cached locally in SQLite with computed:
  gracePeriodEnd: "2026-06-20T00:00:00Z"  (period + 5 days)
```

### Timeline for the "cancel + go offline" scenario

```
Jun 1    User cancels subscription (expires Jun 15)
Jun 1    User disconnects from internet

Jun 1-15   App checks cached token. currentPeriodEnd in the future.
           Status: SUBSCRIBED (legitimately still paid through Jun 15)

Jun 15     currentPeriodEnd passes.
           Status: WARNING
           Banner: "Tu suscripcion vencio. Conectate para renovar.
                    La app pasara a modo lectura en 5 dias."

Jun 16     Banner: "4 dias para modo lectura"
Jun 17     Banner: "3 dias para modo lectura"
Jun 18     Banner: "2 dias para modo lectura"
Jun 19     Banner: "MANANA la app pasara a modo lectura" (red, prominent)

Jun 20     gracePeriodEnd passes.
           Status: READ_ONLY
           Lock screen: "Suscripcion expirada"
           Can view all data, can export data.
           Cannot register ventas, egresos, or any write operation.
           Two buttons: [Renovar]  [Exportar mis datos]

           If user connects to internet:
             App calls RevenueCat.
             If renewed  -> back to SUBSCRIBED
             If not      -> falls to FREE (30 ventas/month)
```

### Why this can't be easily cheated

1. **Hard expiration date** baked in at purchase time. No server call needed —
   the app just checks `Date.now() > gracePeriodEnd`.

2. **No renewal = no new token.** The `currentPeriodEnd` can only be extended
   by RevenueCat when a real payment processes. Must go online once per
   billing cycle.

3. **System clock manipulation is impractical.** Setting the phone to last
   month breaks WhatsApp, banking, card terminals, and every other app.

4. **Generous but finite grace.** 5 days covers legitimate scenarios
   (traveling, internet outage, bank holds) without enabling permanent
   freeloading.

---

## 5. Cross-Platform Billing via RevenueCat

### Why RevenueCat?

| Criteria | RevenueCat | Keygen.sh | LemonSqueezy | Roll your own |
|---|---|---|---|---|
| iOS + Android native billing | Yes (SDK) | No | No | You build it |
| Cross-platform entitlements | Yes (built-in) | No | No | You build it |
| Web/desktop billing | Yes (via Stripe) | Yes (license keys) | Yes (license keys) | You build it |
| Subscription lifecycle | Yes (automatic) | No (manual) | Partial | You build it |
| React Native SDK | Yes | No | No | — |
| Free tier | Up to $2,500 MTR/mo | Limited | Limited | $0 + your time |
| Tauri-specific SDK | No (use web SDK) | Yes (keygen-rs) | No | — |

### How each platform pays

| Platform | Billing method | SDK | Store fee |
|---|---|---|---|
| iOS | App Store (StoreKit 2) | `react-native-purchases` | 15% |
| macOS | App Store via Universal Purchase | Tauri plugin + REST API | 15% |
| Android | Google Play Billing | `react-native-purchases` | 15% |
| Windows | RevenueCat Web Billing (Stripe) | `@revenuecat/purchases-js` | ~3% |

### How "buy once, use everywhere" works

The stores never talk to each other. RevenueCat is the single source of truth:

```
Day 1 — User subscribes on iPhone:
  iPhone -> App Store handles payment
  iPhone -> sends receipt to RevenueCat (app_user_id = maria@correo.com)
  RevenueCat -> records: maria@ has active subscription from App Store

Day 30 — User downloads on Windows (FREE from website):
  Windows app -> "Enter your email to restore subscription"
  User types -> maria@correo.com
  Windows app -> calls RevenueCat: getCustomerInfo("maria@correo.com")
  RevenueCat -> responds: Active subscription (source: App Store, expires: Jul 15)
  Windows app -> caches token locally, unlocks full app
  No second payment needed.
```

### Apple Universal Purchase

Apple's Universal Purchase lets you bundle the iOS and macOS apps under the
same App Store Connect record. A user who subscribes on iPhone automatically
has the subscription on Mac, and vice versa.

Requirements:
- Same Apple Developer account for both apps
- Same bundle ID prefix (e.g., mx.cachink.app)
- macOS build uploaded from a separate Xcode target with matching bundle ID
- Tauri 2.0 supports Mac App Store distribution (App Sandbox required)

### Identity: email-only (no password)

```
To subscribe or restore on a new device, the user enters their email.

- No password
- No account creation
- No OAuth / social login
- Email = RevenueCat app_user_id

The store receipt IS the proof of purchase. RevenueCat maps it to the
email. That's the entire auth system.
```

This is the same approach used by Bear, Ulysses, and Day One.

### How Google Play knows about an Apple purchase (it doesn't)

Google Play has no knowledge of Apple purchases. The flow is:

1. User subscribes on iOS -> Apple bills them -> RevenueCat records entitlement
2. User downloads on Android (listed as FREE on Google Play)
3. User opens app, enters same email
4. App calls RevenueCat -> returns "active subscription from App Store"
5. App unlocks full features. No Google Play billing triggered.

The Android app never goes through Google Play billing for this user. It just
asks RevenueCat "does this email have an active subscription?"

### Store listing: "Free" is not misleading

Subscription apps are listed as "Free" on all stores. This is required by
Apple and Google — the subscription IS the in-app purchase, not a download
fee. Both stores automatically show:

- "Offers In-App Purchases" badge on the listing
- Subscription details section (price, duration, free trial)
- Subscription terms before the user confirms

---

## 6. Data Portability — .cachink Backup

When a user moves from Mac to Windows (or any platform change):

- **Subscription:** Transfers automatically via RevenueCat (same email)
- **Data:** Requires manual transfer via .cachink backup file

### How it works

```
Source device (Mac):
  Settings -> "Exportar respaldo completo"
  -> Generates: Cachink-2026-05-15.cachink
  -> User shares via AirDrop / USB / email / cloud drive

Target device (Windows):
  First-run wizard -> "Tienes datos de otro dispositivo?"
  -> "Importar respaldo" -> select .cachink file
  -> All data restored into local SQLite
```

### File format

```
.cachink file = ZIP archive containing:
  manifest.json       <- version, date, device info
  database.sqlite     <- full SQLite database dump
  checksum.sha256     <- integrity verification
```

- Optionally encrypted with a user-chosen PIN (same PIN system in the app)
- Works cross-platform (SQLite is platform-independent)
- The ExportarDatosAction component already exists in the codebase at
  packages/ui/src/screens/Settings/exportar-datos-action.tsx — the .cachink
  backup extends this with a full SQLite export + import flow

### Always available

Data export works in ALL states — free, subscribed, and read-only.

---

## 7. Device Limits

One subscription allows up to **5 active devices**. Enforced by tracking
device registrations in RevenueCat subscriber attributes.

| Event | Behavior |
|---|---|
| Activate device 1-5 | Allowed |
| Activate device 6 | Blocked: "Ya tienes 5 dispositivos. Desactiva uno desde Configuracion." |
| Deactivate a device | Settings -> "Mis dispositivos" -> tap to remove |

---

## 8. New Package Structure

```
packages/
  entitlement/                      <- NEW
    src/
      entitlement.ts                <- AppTier, Entitlement types
      usage-limits.ts               <- FREE_LIMITS, SUBSCRIBED_LIMITS
      entitlement-provider.ts       <- EntitlementProvider interface
      token-cache.ts                <- Local token storage + expiry check
      index.ts
    tests/
      usage-limits.test.ts
      token-cache.test.ts

  domain/                           (existing - add UsageCounter entity)
  data/                             (existing - add usage_counts table)

  ui/src/
    entitlement/                    <- NEW UI integration
      entitlement-context.tsx
      use-entitlement.ts
      use-usage-counter.ts
      upgrade-prompt.tsx
      limit-reached-modal.tsx
      subscription-screen.tsx
      grace-period-banner.tsx
      read-only-lock-screen.tsx
      usage-counter-badge.tsx
    backup/                         <- NEW
      export-backup.ts
      import-backup.ts
```

---

## 9. Implementation Phases

### Phase E1 — Entitlement Foundation (no real billing)

Wire up the three states so all screens respect them. MockEntitlementProvider
always returns `subscribed` so existing behavior doesn't change.

1. Create `packages/entitlement` with types, interfaces, limits
2. Add MockEntitlementProvider to packages/testing
3. Add EntitlementContext + useEntitlement() + useIsFree() hooks
4. Add UsageCounter entity (ventas_count, egresos_count, month)
5. Build UpgradePrompt, LimitReachedModal, UsageCounterBadge components
6. Build GracePeriodBanner and ReadOnlyLockScreen components
7. Gate write-mutations behind entitlement checks
8. ADR documenting the billing model and the three states
9. Tests: mock all three states, verify correct gating per screen

### Phase E2 — Mobile Billing (iOS + Android)

1. Add react-native-purchases to apps/mobile
2. Create RevenueCatMobileProvider implementing EntitlementProvider
3. Configure RevenueCat project + App Store Connect subscription
4. Configure Google Play Console subscription
5. Build SubscriptionScreen with native store purchase flow
6. Implement signed token caching in SQLite (offline validation)
7. Implement grace period countdown logic + banner
8. E2E tests with sandbox accounts

### Phase E3 — Apple Universal Purchase (Mac)

1. Configure Tauri Mac build for Mac App Store (App Sandbox, provisioning)
2. Set up Universal Purchase in App Store Connect (same bundle ID family)
3. Build Tauri plugin (Rust -> Swift bridge) for StoreKit 2 receipts
4. Create RevenueCatMacProvider using REST API + StoreKit receipts
5. Test: subscribe on iPhone -> open on Mac -> full access

### Phase E4 — Windows Billing (Stripe)

1. Add @revenuecat/purchases-js to apps/desktop
2. Create RevenueCatWebProvider implementing EntitlementProvider
3. Configure RevenueCat Web Billing + connect Stripe account
4. Build checkout flow (Stripe-hosted page in Tauri webview)
5. Test: subscribe on Windows -> verify on iOS/Android/Mac

### Phase E5 — Data Portability (.cachink backup)

1. Build exportBackup() — dumps SQLite to .cachink zip
2. Build importBackup() — reads .cachink, restores into local SQLite
3. Add "Exportar respaldo" and "Importar respaldo" to Settings
4. Add import option to first-run Wizard
5. Add "Exportar mis datos" button to ReadOnlyLockScreen
6. Tests: export -> import round-trip preserves all entities

### Phase E6 — Polish

1. Device registry + "Mis dispositivos" management screen
2. Subscription management (cancel, change plan links)
3. Remote config for usage limits (adjust without app update)
4. Analytics: RevenueCat dashboard for MRR, churn, trial conversions
5. Promotional codes for beta testers

---

## 10. Cost Summary

| Component | At launch | At $10K MRR |
|---|---|---|
| RevenueCat | Free (< $2,500 MTR) | ~$100/mo (1% of MTR) |
| Apple (iOS + Mac) | 15% commission | 15% |
| Google Play | 15% commission | 15% |
| Stripe (Windows) | ~3% per transaction | ~3% |
| Apple Developer Account | $99/year | $99/year |
| Google Developer Account | $25 one-time | $0 |

Net revenue per $99/year subscription:
- iOS/Mac (Apple): $99 x 85% = $84.15 (Apple takes 15%)
- Android (Google): $99 x 85% = $84.15 (Google takes 15%)
- Windows (Stripe): $99 x 97.1% - $0.30 = $95.73 (Stripe takes ~3%)

---

## 11. Key Risks

| Risk | Mitigation |
|---|---|
| RevenueCat web SDK doesn't work in Tauri webview | Test early in Phase E4. Fallback: open Stripe checkout in system browser, poll for completion. |
| Mac App Store rejects Tauri app | Tauri 2.0 has official MAS docs. Test submission early. Fallback: distribute Mac via DMG + Stripe (same as Windows). |
| Free tier too generous -> low conversion | Limits stored as remote config, adjustable without app update. |
| Free tier too restrictive -> bad reviews | 30 ventas/month ~= 1/day. Even a tiny business exceeds this quickly. |
| Read-only mode feels punitive | Always allow export. Empathetic copy: "Tus datos estan seguros." |
| Apple rejects full lockout | Read-only mode (not full lockout) + always-available export should satisfy App Store guidelines. |

---

## 12. Open Questions

These need answers before implementation begins:

- [ ] **Pricing:** What is the monthly/yearly subscription price?
- [ ] **Trial:** Should there be a free trial period (7 or 14 days) before
      the freemium limits kick in?
- [ ] **Exact free limits:** Are 30 ventas/month, 20 egresos/month, 15
      products the right numbers? Need market research.
- [ ] **Annual vs monthly:** Offer both? Annual discount percentage?
- [ ] **Grace period length:** 5 days, 7 days, or configurable?
- [ ] **Mac distribution:** Mac App Store (Universal Purchase) or direct
      DMG download with Stripe billing? MAS has approval risk.
- [ ] **Promo codes:** Needed for launch? How many? Duration?
- [ ] **Family/team plan:** Is the per-user model sufficient, or will
      businesses want a team subscription covering multiple employees?
- [ ] **Existing users:** If the app launches initially without billing and
      adds it later, how do we handle the transition for existing users?

---

## 13. Research Sources

- RevenueCat Pricing: https://www.revenuecat.com/pricing
- RevenueCat Cross-Platform Subscriptions: https://www.revenuecat.com/blog/engineering/cross-platform-subscriptions-ios-android-web/
- RevenueCat Web Billing Overview: https://www.revenuecat.com/docs/web/web-billing/overview
- RevenueCat Web SDK: https://www.revenuecat.com/docs/web/web-billing/web-sdk
- RevenueCat + Expo (React Native): https://www.revenuecat.com/blog/engineering/build-a-single-expo-app-with-subscriptions-on-ios-android-and-web-using-revenuecat/
- RevenueCat Community — Tauri Compatibility: https://community.revenuecat.com/sdks-51/compatibility-with-tauri-v2-4494
- Apple Universal Purchase: https://developer.apple.com/news/?id=03232020b
- Tauri Mac App Store Distribution: https://v2.tauri.app/distribute/app-store/
- Tauri Distribution Targets: https://v2.tauri.app/distribute/
- Keygen for Tauri Apps: https://keygen.sh/for-tauri-apps/
- Lemon Squeezy License Key API: https://docs.lemonsqueezy.com/guides/tutorials/license-keys
