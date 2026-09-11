# Xangarro! — Pivot Plan (README)

> **Start here.** This directory is the executable plan for turning Cachink (standalone app) into
> Xangarro (capture app + web portal + centralized cloud DB). It is written so that a fresh LLM
> session with **no conversation context** can pick up one file and work it.
>
> Decisions behind this plan are recorded in `ARCHITECTURE.md` — **ADR-053** (capture client pivot)
> and **ADR-054** (rename). Read both before touching anything. The interview decisions that refined
> them are summarised in §4 below.

---

## 1. Tracks — who works on what

Work is split into **tracks**. Each track is one file, meant for one session. Task IDs are prefixed
by track so a task is identifiable anywhere (commit messages, PR titles, chat).

| Track                          | File                | Prefix | Owner session            | Can start when                      |
| ------------------------------ | ------------------- | ------ | ------------------------ | ----------------------------------- |
| **Foundation** (shared)        | `01-foundation.md`  | `F-`   | one session, first       | now                                 |
| **Contracts** (shared, frozen) | `02-contracts.md`   | `C-`   | same session as F        | after F-05                          |
| **Backend / Supabase**         | `03-backend.md`     | `B-`   | session "Backend+Portal" | after F + C                         |
| **Portal** (admin web)         | `04-portal.md`      | `P-`   | session "Backend+Portal" | after B-01..B-05                    |
| **App** (mobile)               | `05-app.md`         | `A-`   | session "App"            | after F + C (uses mock server C-09) |
| **Landing**                    | `06-landing.md`     | `L-`   | anyone, small            | after F-01                          |
| **Launch** (integration)       | `07-launch.md`      | `X-`   | one session              | after A, B, P, L                    |
| **Post-launch**                | `08-post-launch.md` | `Z-`   | later                    | after X                             |

**Parallelism rule:** Track A and Track B/P run in parallel **only after F and C are merged to
`main`.** They meet at the API contract in `02-contracts.md`. Neither track may change the contract
unilaterally — a contract change is a `C-` task, lands on `main` first, and both tracks rebase.

**Branching:** one branch per track (`track/foundation`, `track/backend-portal`, `track/app`,
`track/landing`). Merge F and C to `main` before branching A and B/P. Small PRs per task or task
group; PR title starts with the task ID(s).

---

## 2. Execution order (the short version)

```
F-01 … F-08   Foundation (identifiers, archives, contracts package, CI)      ← sequential, first
C-01 … C-10   Contracts (API + wire + entitlement + mock server)             ← sequential, second
      ┌──────────────────────────────┬─────────────────────────────────┐
      │ B-01 … B-18  Backend         │ A-01 … A-18  App                │  ← parallel
      │ P-01 … P-17  Portal          │ (A uses C-09 mock until B-09)   │
      └──────────────────────────────┴─────────────────────────────────┘
L-01 … L-05   Landing                                                     ← any time after F-01
X-01 … X-10   Launch / integration                                        ← after all of the above
Z-*           Post-launch                                                 ← later
```

Cross-track dependencies are listed on each task as **Blocked by** / **Blocks** with the foreign
task ID. The README dependency graph in §5 is the authoritative cross-track list.

---

## 3. Status rules

- `- [ ]` not started · `- [~]` in progress · `- [x]` done · `- [!]` blocked (say why on the line).
- When you finish a task, tick it **and** append a line under it: `Done: YYYY-MM-DD · <short-sha> · <one line of what actually landed>`.
- If you deviate from the task's Steps, say so in the Done line. The Acceptance criteria are the
  contract; Steps are the suggested route.
- Never delete or renumber a task. If a task is dropped, mark `[x]` with `Done: dropped — <why>`.
- If you discover a needed task that isn't here, add it at the **end** of the track with the next
  number and note which task surfaced it.
- Contract changes: update `02-contracts.md` first, then the tasks that depend on it.

---

## 4. Decision summary (what the interview settled)

These are binding unless a new ADR changes them. Where an item says _(ADR-053 §n)_ the full reasoning is there.

**Product shape**

- The app is a **capture client**: Ventas, Caja (turnos, movimientos, cancelaciones), Gastos, Productos (stock + movimientos + quick-add), Corte de día, Checkout. Everything else is the portal. _(ADR-053 §3)_
- App is **strictly single-role**. Portal user = **Director**. App user = **Operator** (name + PIN, no email). Roles exist only in the portal. _(Q1)_
- Operators are **created and PIN-set in the portal only**; `users` syncs web → device and the device never writes it. `must_change_pin` is dropped. _(Q2)_
- v1 keeps the **same MVP clamp** (`stock` on; merma/conversion/auditoría/ventasCredito off). `ventasCredito` is the named first post-launch feature. _(Q10)_
- Flags become **three levels**: platform availability × plan entitlement × tenant toggle. _(Q10, Q14)_
- **Desktop (Tauri) app is archived**, not built, not renamed. `sync-cloud` (PowerSync) archived the same way. `sync-lan` stays in place (its change-log + push queue are reused). _(Q8)_

**Identity, devices, tenancy**

- `business_members (user_id, business_id, role ∈ owner|admin|viewer)`. Many-to-many. Contador = viewer. Owner = billing contact. _(Q11)_
- **Device slots** per plan; "Agregar dispositivo" issues a **single-use 8-char code (no 0/O/1/I), 48 h**; portal can **revoke** a device. _(Q5)_
- Activation = email + code → device token + `business_id` + entitlement + initial reference data. No wizard on the phone. _(ADR-053 §2)_
- Prebeta devices **start fresh** (bundle ID change makes it a new app); partners export from the old app first. _(Q7)_

**Sync**

- **Hand-rolled outbox.** Up (device→cloud): sales, expenses, inventory*movements, caja_turnos, caja_movimientos, cancelacion_logs, day_closes, client_payments (+ dormant tables). Down (cloud→device): businesses, products, clients, users (operators), employees, recurring_expenses, feature flags, entitlement. **Hybrid:** products, clients — up on insert only; all edits are portal-only. **No conflict class exists.** *(Q6, ADR-053 §6)\_
- Triggers: **push-on-write** (2 s debounce, batched), **pull on foreground/resume + every 15 min**, manual **"Actualizar"** does both and reports. Background sync is opportunistic only. _(Q3)_
- **Rejected rows are never dropped**: per-row status, server reason stored, retried with backoff, visible in the app ("no enviados") and the portal (Sync health). Server returns per-row outcomes, never fails a whole batch for one row. Batches coalesce per row; batched reads (no N+1); drain cap per trigger. _(Q4)_
- **Retention:** phone purges transactional rows older than 90 days **only if server-acknowledged**; "now" = server time at last sync, never device clock. Portal keeps everything forever. Data is never deleted in any abuse scenario. _(Q9)_

**Billing & entitlement**

- Tiers: **Freelancer $0 / Emprendedor $199 / MiPyME Pro $399 MXN·mes** (not final). "Usuario" = **Operator**; device slots = operator count; portal members unlimited. _(Q14)_
- Adjustments to the pricing card: raw **export is on every tier** (Pro gates _formatted_ reports); "roles" line becomes "hasta N operadores"; **lapsed paid → falls to Freelancer** (no read-only mode); **50 records/month enforced on the phone**, server always accepts. _(Q14)_
- Entitlement = **signed token** (Ed25519) `{business_id, plan, limits, features, valid_until, grace_until, server_time}`; two clocks: **payment grace 7 d**, **offline staleness 30 d** → both fall to Freelancer limits, never lock. _(ADR-053 §5, Q9)_
- **Stripe** (cards + OXXO + SPEI), hosted Checkout, 14-day trial on Pro via `trial_period_days`. _(Q13, Q18)_
- **CFDI:** collect RFC/razón social/régimen/uso/CP from day one; "Solicitar factura" creates a request; issue manually; automate with a PAC at ~50 paying customers. _(Q15)_
- **Back-office = Supabase Studio + Stripe Dashboard.** No staff area in the portal. Xangarro is **tenant #1** for its own books. _(Q16)_

**Stack & infra**

- Portal: **Next.js App Router** in `apps/portal`, Tailwind + shadcn/ui, Drizzle **pg-core** in new `packages/data-pg` (+ drift test vs SQLite schema), Supabase Auth, Recharts, Vercel, `app.xangarro.mx`. Mobile API = route handlers under `/api/v1/*`, thin adapters over `packages/application`. _(Q13)_
- Shared API/wire schemas live in a new **`packages/contracts`** (zod). _(F-05)_
- **Environments:** local (Docker `supabase start`) + **one hosted project now**; staging is created **before the first paying customer** (X-01). Region `us-east-1`, Vercel functions pinned to the same. _(Q17)_
- Landing stays a **separate Vite repo**, marketing only; CTAs link to `app.xangarro.mx/signup?plan=…`. _(Q18)_
- CI: GitHub Actions — typecheck + lint + unit + drift test per PR; Maestro nightly/on-demand. _(F-08)_

**Rename** _(ADR-054)_

- `Xangarro` (no `!`) in anything a machine reads; `Xangarro!` in anything a human reads. Identifiers change in F-01/F-04; the copy/i18n/testID sweep is A-15 (after teardown). Never put `!` in a path.

---

## 5. Cross-track dependency graph

```
F-01 bundle ids ─────────────────────────────────────────► L-01, X-05
F-02 archive desktop ──► F-04
F-03 archive sync-cloud ──► F-04, A-06
F-04 scope rename @xangarro ──► everything after F
F-05 packages/contracts ──► C-*
F-06 domain: plans/flags/entitlement types ──► A-10, A-14, B-06, P-10, P-15
F-07 domain: User drops role ──► A-03, A-17, B-02, B-13, P-05
F-08 CI ──► (gates all PRs)

C-01..C-08 contract spec ──► B-07, B-08, B-09, A-04, A-06
C-09 mock server ──► A-04, A-06, A-07, A-16 (until B-09 is live)
C-10 contract tests ──► B-07..B-09 (must pass against real handlers)

B-01 supabase project ──► B-03, P-01
B-02 data-pg schema ──► B-03, B-08, B-09, P-*
B-03 migrations + RLS ──► B-05, B-08, B-09, P-02
B-05 auth + device JWT ──► B-07, P-02
B-06 entitlement signer ──► B-07, B-09, A-10 (public key)
B-07 /activate ──► A-04 (real), X-02
B-08 /sync/push ──► A-06 (real), P-11, X-02
B-09 /sync/pull ──► A-06 (real), X-02
B-10 stripe ──► P-03, P-10, X-02
B-11 code issuance ──► P-06, B-07
B-13 operator writes ──► P-05
B-14 email ──► P-03, P-06

A-01 teardown ──► A-03, A-09, A-12, A-15
A-02 consolidate Inventario/Productos ──► A-09
A-04 activation ──► A-05, A-10, A-16
A-06 sync engine ──► A-07, A-08, A-11, A-16
A-15 rename sweep ──► X-05

P-03 signup ──► X-02
P-04 onboarding ──► X-02
P-06 devices ──► X-02

L-03 CTAs ──► X-02 (needs P-03 URL)
X-01 staging ──► X-02
X-06 CLAUDE.md amendments ──► (human)
```

---

## 6. Environment facts (so nobody rediscovers them)

- Repo: `~/Downloads/Cachink` (directory keeps this name until X-08; **never** rename it to anything containing `!`). Default branch `main`. Remote `z3r0maker/Cachink` (rename tracked in X-08).
- Node ≥ 22 (machine has v25.9), pnpm workspaces (`apps/*`, `packages/*`), Turborepo tasks: `build test typecheck lint lint:design bundle:check clean`.
- Root commands: `pnpm build · pnpm test · pnpm typecheck · pnpm lint · pnpm e2e:report`. Per-package: `pnpm --filter @xangarro/<pkg> test`.
- Tests: Vitest + `node:assert/strict`. No Jest/Mocha. Minimum 1 happy + 3 unhappy paths per use case (CLAUDE.md §6).
- Files ≤ 200 lines, functions ≤ 40 lines, components ≤ 150 lines (CLAUDE.md §2.6). Money = integer centavos. IDs = ULIDs (ADR-010).
- Mobile: Expo (dev-client), Expo Router, expo-sqlite, Drizzle sqlite-core. Maestro flows in `apps/mobile/maestro/flows/` (142 flows; shared subflows in `flows/shared/`). Run one flow: `apps/mobile/maestro/scripts/run-flow.sh <flow>`; regression: `full-regression.sh`. See `docs/e2e-HANDOFF.md`. **With 2+ booted simulators always pass `--device`** (a prompt loop otherwise spews GB of output).
- Cloud (existing): `supabase/migrations/0001_schema.sql` (hand-written, 10 tables, RLS on `business_id` JWT claim), `supabase/functions/bug-report`. **No hosted project exists yet.**
- Sync (existing, reused): `packages/data/src/sync-state.ts` (`__cachink_change_log`, `readHwm/writeHwm`), `packages/sync-lan/src/client/push-queue.ts` (batch 500, HWM cursor, **advances past rejected rows — the bug A-06 fixes**).
- Known duplication: `packages/ui/src/screens/Inventario/` and `Productos/` share 10 files (8 identical, 2 diverged; app runs the `Inventario/` copies). Fixed by A-02.
- Brand: `assets/brand/README.md` documents 5 masters; only `icon-padded.png` exists. Hero yellow `#FFD60A` (`packages/ui/src/theme.ts:16`).
