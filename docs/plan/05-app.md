# Track A — Mobile App (session "App")

> `apps/mobile` + `packages/ui` + `packages/data` + a new `packages/sync`. Turns the Cachink prebeta
> into the Xangarro capture client: teardown → single role → activation → cloud outbox → plan limits →
> retention → rename sweep → Maestro.
>
> Prereqs: Track F and Track C on `main`. Until B-07/B-08/B-09 are live, run against the mock
> server: `pnpm mock:api` (C-09) with `EXPO_PUBLIC_API_BASE=http://localhost:3000` and the mock's dev
> public key. Every task that touches a screen must update the affected Maestro flows (CLAUDE.md §6).
> With 2+ booted simulators always pass `--device` to Maestro scripts.

---

### A-01 Screen teardown (ADR-053 §3)

> **Amended 2026-09-17 by Track N:** blocked additionally by N-11 (portal settings parity). _(The N-24 dependency was dropped 2026-09-17: A-01 was already built; N-24 now restyles the torn-down screens to the Track O design.)_

- [ ] Status · **Blocked by:** F-04, F-07 · **Blocks:** A-03, A-09, A-12, A-15
- **Context:** 33 screen folders in `packages/ui/src/screens`. Leaving the app: `Estados, DirectorHome, Wizard, CloudOnboarding, Telemetria, BusinessForm, Otros, UserManagement, FuncionesNegocio, CajaReportes, DirectorSetup, MermaReportes, Notificaciones, RolePicker, LanPairing`. Their **domain** logic stays (portal reuses it); only UI + routes go. Per the user's preference for recoverability, move rather than delete.
- **Files:** the folders above; `packages/ui/src/screens/index.ts`; `apps/mobile/src/app/{wizard.tsx,wizard/,role-picker.tsx,telemetria.tsx,usuarios.tsx,funciones.tsx,caja-reportes.tsx,merma-reportes.tsx,notificaciones.tsx,indicadores.tsx,empleados.tsx,productos-otros.tsx}` (+ any route whose screen is gone); `apps/mobile/src/app/_layout.tsx` (Stack.Screen entries); `packages/ui/src/app/{cloud-gate,lan-gate,feature-discovery-gate,change-pin-gate}.tsx`; `packages/ui/src/i18n/locales/es-mx.ts` (leave keys; A-15 prunes); Maestro flows that reference these screens.
- **Steps:**
  1. `git mv packages/ui/src/screens/<X> archive/ui-screens/<X>` for each; remove from the barrel; delete the routes; delete `Stack.Screen` entries.
  2. Gates: `cloud-gate`, `lan-gate` → delete (F-03 already stubbed cloud); `change-pin-gate` → delete (Q2); `feature-discovery-gate` → keep only if it doesn't depend on the wizard, else delete.
  3. `Settings`: keep the folder; **remove** `settings-empleados.tsx`, `edit-empleado-modal.tsx`, `empleado-*`, `settings-negocio.tsx`, `settings-tasas-isr.tsx`, `isr-defaults-card.tsx`, `tipos-de-pago-screen.tsx`, `settings-indicadores.tsx`, `lan-details-card.tsx`, `edit-business-modal.tsx` (→ archive). What remains is device-only (A-12 finishes it).
  4. Delete Maestro flows for removed screens (list them in Done) — do **not** touch ventas/caja/gastos/productos flows here.
  5. `pnpm typecheck` will be red until A-03; that's expected — land A-01 + A-03 in the same PR if needed.
- **Acceptance:** `ls packages/ui/src/screens` shows only: `AppShell Caja Cancelaciones Checkout ConsentModal CorteDeDia Egresos Login Productos Inventario Settings Ventas Clientes CuentasPorCobrar VentasCredito Merma Conversion Auditoria DemoSeeding` (Clientes/CxC/VentasCredito/Merma/Conversion/Auditoria stay: flag-gated). Removed screens exist under `archive/ui-screens/`.
- **How to test:** `pnpm typecheck` (after A-03), `run-flow.sh smoke-launch.yaml`.

### A-02 Consolidate `Inventario/` ↔ `Productos/` duplication

- [ ] Status · **Blocked by:** F-04 · **Blocks:** A-09
- **Context:** 10 duplicated files; 8 identical, 2 diverged (`producto-detail-popover.tsx`, `producto-detail-route.tsx`); the app runs the `Inventario/` copies because `screens/index.ts:17-18` exports `Inventario` wholesale and only new names from `Productos`. CLAUDE.md §2.3 violation.
- **Steps:** diff the two diverged files; keep the **behaviour the app currently runs** (`Inventario/` versions) but move everything into `Productos/`; delete `Inventario/`; fix the barrel and the stale comment; keep `apps/mobile/src/app/inventario.tsx` redirect one more release.
- **Acceptance:** `packages/ui/src/screens/Inventario` gone; all 10 productos Maestro flows green (`run-flow.sh` each, or `full-regression.sh --filter productos` if supported); `pnpm --filter @xangarro/ui test` green.

### A-03 Single role: remove role branching everywhere

- [ ] Status · **Blocked by:** F-07, A-01 · **Blocks:** A-05, A-16
- **Files:** `packages/ui/src/screens/AppShell/tab-definitions.ts` (drop `DIRECTOR_TABS`, `tabsForRole`; export one `TABS`), `AppShell/*` (top bar cog → device settings only), `Otros/*` (archived in A-01; move `operativoCajaToolItems` into `Caja/` since Caja renders it), `Login/*` (no role picker, no director path), `packages/ui/src/app/auth-gates.tsx`, `quick-switch-gate.tsx`, `use-quick-switch-auth.ts`, `query-keys-auth.ts`, repository-provider (no role), `packages/data/src/schema/users.ts` (**do not** migrate here — A-17), i18n keys untouched (A-15).
- **Steps:** grep `role`, `director`, `Director`, `isDirector`, `tabsForRole` across `packages/ui/src` and `apps/mobile/src`; remove each branch keeping the Operativo path. `users.role` column stays in SQLite until A-17 but the domain no longer reads it.
- **Moved here from F-07 (2026-09-11, to keep `main` green for parallel tracks):** the _domain/application/testing/data-interface_ removals — delete `UserRoleEnum`/`UserRole`, `User.role`, `User.mustChangePin`, `User.recoveryPasswordHash`, `User.email`, `NewUserSchema.{role,mustChangePin,recoveryPassword}`; `AuthResult.{role,mustChangePin}` in `packages/domain/src/auth`; `canUserCancelSales(role, perms)` → `(perms)`; `UsersRepository.countDirectors` + `CreateUserInput.{role,mustChangePin,recoveryPasswordHash,email}` + the matching `UserPatch` keys; use cases `crear-usuario`, `cambiar-pin`, `recuperar-pin`, `eliminar-usuario` and their tests (all portal-side now, B-13); `packages/testing` fixtures/in-memory/contract updates. Land these in the same PR as the UI branch removal so typecheck never goes red on `main`.
- **Acceptance:** `grep -rn "director" -i packages/ui/src apps/mobile/src --include=*.ts --include=*.tsx | grep -v i18n | grep -v archive` → 0; typecheck green; smoke-launch + `select-operativo` flows adjusted and green.

### A-04 Activation screen (email + code) + device identity storage

> **Amended 2026-09-17 by Track N:** the activation screen opens on the camera (QR), email + code is the fallback — N-25, C-14.

- [ ] Status · **Blocked by:** C-02, C-09 · **Blocks:** A-05, A-10, A-16
- **Context:** Replaces the wizard as the first-run gate. `02-contracts.md` §3.
- **Files:** new `packages/ui/src/screens/Activation/{activation-screen.tsx,use-activate.ts,code-input.tsx,index.ts}`; `packages/ui/src/app/activation-gate.tsx`; `apps/mobile/src/app/activate.tsx`; `apps/mobile/src/shell/device-identity.ts` (SecureStore); `packages/ui/src/api/client.ts` (fetch wrapper with headers from contracts).
- **Steps:**
  1. Add `expo-secure-store` (latest). Store `{device_token, device_id, business_id}`; entitlement + `last_server_time` + `last_pull_at` in `app_config` (SQLite).
  2. Screen: email field, 8-char code input (auto-uppercase, reject ambiguous chars, paste-friendly), "Activar" CTA above the fold on small phones (same rule as the Login fix `03785f3`), inline errors per §3 codes (i18n keys), link "¿No tienes código? Crea tu cuenta en xangarro.mx" — **plain text, not a purchase link** (ADR-053 consequences, app-store steering).
  3. On success: persist identity, write bootstrap tables into SQLite through the repositories (products, clients, users, businesses, employees, recurring_expenses; feature flags into `app_config`), store entitlement, set `sync_state.pullSeq = bootstrap.server_seq`, navigate to Login.
  4. Gate: no identity → `/activate`; identity present → Login. `DEVICE_REVOKED` from any later call → clear token only (keep data), back to `/activate` with message.
- **Acceptance:** unit tests for `use-activate` reducer (happy; each error code; network failure keeps the form); Maestro `activation.yaml` against the mock (`VALID001` → Login screen shows the 2 fixture operators); `USED0002` shows the "código ya usado" copy.

### A-05 Login = operator list + PIN (no create, no change PIN)

- [ ] Status · **Blocked by:** A-03, A-04 · **Blocks:** A-16
- **Files:** `packages/ui/src/screens/Login/*` (1 011 LOC today — simplify), `packages/application` `autenticar-usuario` (already updated in F-07).
- **Steps:** list operators from the synced `users` table where `active = 1`; tap → PIN numpad (keep the above-the-fold layout); wrong PIN → error + counter (5 tries → 30 s cooldown, local); no "crear usuario", no "cambiar PIN", no recovery password path (delete UI + `recoveryPasswordHash` usage; column stays until A-17). Empty operator list (Director hasn't created one) → screen explains "Crea un operador en app.xangarro.mx" + Actualizar button (pull).
- **Acceptance:** `shared/authenticate.yaml` rewritten (select operator + PIN) and used by every flow; `login-*` flows green; unit test for lockout.

### A-06 Cloud outbox: `packages/sync` (retarget the change-log + push queue)

- [ ] Status · **Blocked by:** F-03, C-03, C-04, C-06, C-09 · **Blocks:** A-07, A-08, A-11, A-16
- **Context:** Reuse `packages/data/src/sync-state.ts` (`__cachink_change_log`, HWM) and the design of `packages/sync-lan/src/client/push-queue.ts`, fixing its defects (README §6). New package so `sync-lan` stays untouched.
- **Files:** `packages/sync/{package.json,src/push.ts,src/pull.ts,src/coalesce.ts,src/status.ts,src/backoff.ts,src/orchestrator.ts,src/index.ts,tests/*}`; `packages/data/src/schema/sync-row-status.ts` (new table `__sync_row_status {table_name, row_id, status pending|accepted|rejected, server_seq, code, message, retryable, attempts, last_attempt_at, PK(table_name,row_id)}` — migration in A-17); `packages/data` triggers unchanged.
- **Steps:**
  1. `push.ts`: read change-log batch (500) → **coalesce** by `(table,row_id)` keeping the last op → **batched read** per table (`WHERE id IN (...)`) → filter with `isPushable` → POST per contracts → for each `accepted` write status + `server_seq`; for each `rejected` write status/code/retryable (never advance past silently) → advance HWM to batch max **only after** statuses are written. Retryable rejections re-enter the queue via a `retry_after` on the status row (exponential backoff 1 m → 2 h, capped). Non-retryable stay `rejected` until manual retry (A-08).
  2. `pull.ts`: GET since `sync_state.pullSeq` → upsert DOWN/HYBRID rows (LWW by `updated_at` is unnecessary — server is authoritative; just upsert), apply tombstones (`deleted_at`) → store entitlement + `server_time` (`app_config.last_server_time`, `last_pull_at`) + `acknowledged_through` → advance `pullSeq`. Page while `server_seq` advances.
  3. `orchestrator.ts`: `drain({maxBatches: 10})`, `pull()`, `syncNow()` (push then pull), connectivity check (`@react-native-community/netinfo` — check version), single-flight lock, runs off the UI thread (async, yields between batches).
  4. Error mapping via `ERROR_CATALOG`; auth errors → surface `DEVICE_REVOKED` to the gate.
- **Acceptance:** unit tests with an in-memory SQLite (`better-sqlite3` like `sync-lan/tests`) + msw mock: 1 200 rows offline → 3 batches, HWM correct; a `flaky` scenario leaves retryable rows pending with backoff; a hybrid update never leaves the phone (filtered); rejected row is present in `__sync_row_status` with code; pull applies a tombstone; `acknowledged_through` stored. Coverage on `packages/sync` ≥ 90 %.
- **How to test:** `pnpm --filter @xangarro/sync test`; manual: mock server `flaky`, ring 30 sales in airplane mode, go online, watch statuses.

### A-07 Sync triggers, "Actualizar", status pill

> **Amended 2026-09-17 by Track N:** conditional banners are added on top of the pill — N-22.

- [ ] Status · **Blocked by:** A-06 · **Blocks:** A-16
- **Files:** `packages/ui/src/sync/{use-sync-orchestrator.ts,sync-status-pill.tsx}`, `AppShell` top bar, Settings "Sincronización" row, `apps/mobile/src/shell/*` (AppState listener).
- **Steps:** push trigger: subscribe to change-log inserts (SQLite update hook or after each repository write) → debounce 2 s → `drain`. Pull: on `AppState` active + every 15 min while active (`setInterval`, cleared on background) + after activation + after a push that had rejections (so fixes flow down). "Actualizar" button (Settings + pill tap): runs `syncNow`, toast "12 ventas enviadas · 3 productos nuevos · 1 no enviado". Pill states: `Sincronizado hh:mm` / `N pendientes` / `N no enviados` (tap → A-08) / `Sin conexión`.
- **Acceptance:** unit tests for the debounce/interval logic (fake timers); Maestro `sync-actualizar.yaml` against mock: ring a sale → pill shows 1 pendiente → Actualizar → Sincronizado.

### A-08 "No enviados" screen (rejected rows) + manual retry

- [ ] Status · **Blocked by:** A-06, A-07
- **Files:** `packages/ui/src/screens/SyncRejected/*`, route `apps/mobile/src/app/no-enviados.tsx`.
- **Steps:** list from `__sync_row_status WHERE status='rejected'`: entity summary (e.g. "Venta $120 · 14:32"), human reason from `ERROR_CATALOG` i18n key, "Reintentar" (resets to pending; if the cause was `FK_PRODUCT_MISSING` show hint "el producto fue eliminado — regístrala con otro producto" and allow opening the record if editable). Never a delete button.
- **Acceptance:** Maestro with mock scenario producing `FK_PRODUCT_MISSING` → row visible with reason; retry → pending.

### A-09 Products/clients are create-only on the device

- [ ] Status · **Blocked by:** A-01, A-02 · **Blocks:** A-16
- **Files:** `packages/ui/src/screens/Productos/*` (remove `editar-producto-modal.tsx`, `producto-detail-form-body.tsx`, pricing edit, archive/delete actions; keep detail **read-only** + stock card + movimientos + "Agregar movimiento"), `nuevo-producto-*` becomes **quick-add** (nombre, precio venta, categoría, seguirStock; everything else defaults); `Clientes/*` → picker + quick-create (nombre, teléfono) only; `packages/application` delete `editar-producto-use-case` (+ test) and any client edit use case; `packages/data` repositories keep `update` methods (used by pull) but UI never calls them.
- **Steps:** as above; barcode scan stays on quick-add and on stock lookup; icon defaults by categoría (the icon picker moves to the portal — keep `ICON_CATEGORIES` data in the shared location P-07 chooses).
- **Acceptance:** no UI path calls `update` on products/clients (grep test); productos flows updated: `producto-via-fab` = quick-add; `editar-producto*` flows deleted; detail screen flow asserts read-only.

### A-10 Entitlement: verify, two clocks, plan limits, upsell surfaces

> **Amended 2026-09-17 by Track N:** no transaction is ever blocked; the free-tier limit is a 50-product cap and usage warnings — N-03, N-04, C-12 (ADR-065).

- [ ] Status · **Blocked by:** F-06, C-05, A-04, A-06 · **Blocks:** A-16
- **Files:** `packages/ui/src/entitlement/{verify.ts,use-entitlement.ts,limit-gate.tsx,upsell-sheet.tsx}`, `apps/mobile` env `EXPO_PUBLIC_ENTITLEMENT_PUBKEY`; `packages/application/src/use-cases/registrar-venta`, `registrar-egreso`, `registrar-movimiento` (limit check hook).
- **Steps:**
  1. `verify.ts`: Ed25519 verify with `tweetnacl` (or `@noble/ed25519`, check versions + RN compatibility) over `canonicalize(payload)`; invalid signature → treat as **no entitlement** → freelancer limits (never crash, never lock).
  2. `nowAnchored = max(Date.now(), app_config.last_server_time)`; state via domain `entitlementState`; `staleness` from `last_pull_at`.
  3. Limits: `records_per_month` counted locally: `COUNT(sales)+COUNT(expenses)+COUNT(inventory_movements WHERE tipo≠'venta-auto')` for the month of `nowAnchored` (server-anchored month); at limit → creation use cases throw `PLAN_LIMIT_RECORDS` → UI upsell sheet ("Llegaste a 50 registros este mes · Emprendedor: ilimitado · en app.xangarro.mx" — informational, **no purchase button/link**). `operators` limit is enforced server-side (B-13) — the app only hides inactive ones. Features: `barcode`, `stock` gates via `resolveEffectiveFlags`.
  4. Grace banner (`grace`): "Tu pago está pendiente — tienes hasta <fecha>"; lapsed: silent switch to freelancer limits + banner "Plan Freelancer".
- **Acceptance:** unit tests: signature valid/invalid/tampered payload; state transitions with fake clocks incl. device clock set back/forward (anchored time wins); 50th record ok, 51st blocked, next server month resets; grace → lapsed after 7 d; staleness 30 d → lapsed, fresh pull → active. Maestro `entitlement-freelancer-limit.yaml` with mock scenario `freelancer`.

### A-11 Retention purge (90 d, acknowledged only, server-anchored)

- [ ] Status · **Blocked by:** A-06
- **Files:** `packages/sync/src/retention.ts`, run from orchestrator on app start (after a successful pull) and daily.
- **Steps:** for each UP table: `DELETE WHERE server_seq IS NOT NULL AND server_seq ≤ acknowledged_through AND created_at < nowAnchored − 90 d`; also delete their `__sync_row_status` + change-log rows. Never touch rows without `server_seq`. Skip entirely if `last_pull_at` is null. Log counts.
- **Acceptance:** tests: unsynced 200-day-old row survives; acknowledged 91-day-old row deleted; device clock +2 years with no server contact → nothing deleted; `VACUUM` not run automatically (document).

### A-12 Settings becomes device-only + "Cuenta"

- [ ] Status · **Blocked by:** A-01, A-04, A-07
- **Files:** `packages/ui/src/screens/Settings/*`.
- **Steps:** sections: **Cuenta** (business name read-only, plan badge, "Administra tu negocio en app.xangarro.mx" text, device name, "Desvincular este dispositivo" → clears identity, keeps data, back to activation), **Sincronización** (status, Actualizar, No enviados), **Dispositivo** (sonido, notificaciones, crash reporting, reportar un problema), **Datos** (Exportar datos — keep `exportar-datos-action.tsx`; note it covers the last 90 days). Remove everything else (already archived in A-01).
- **Acceptance:** `Settings` folder ≤ 12 files; each file ≤ 200 lines; `settings-*` Maestro flows updated.

### A-13 Stock-low local notification survives without a Director

- [ ] Status · **Blocked by:** A-03
- **Steps:** locate the 19:00 scheduler (search `19:00`, `stock-low`, `expo-notifications`); it was Director-gated — make it unconditional per device (respecting the Dispositivo toggle); copy addressed to the Operator.
- **Acceptance:** unit test for the scheduler predicate; manual: set a product stock ≤ threshold, trigger the scheduled notification (dev helper).

### A-14 Feature flags from sync (three levels)

- [ ] Status · **Blocked by:** F-06, A-06
- **Steps:** tenant flags from pull → `app_config.feature_flags`; `useFeatureFlags()` returns `resolveEffectiveFlags({platform: PLATFORM_AVAILABLE, plan: entitlement.plan, tenant})`; replace every `parseFeatureFlags`/`MVP_HIDDEN_FLAGS` call site.
- **Acceptance:** with mock scenario `freelancer`, `stock` is off → Productos tab hides stock UI; `emprendedor` → on. Unit tests on the hook.

### A-15 Rename sweep (copy, i18n, testIDs, file names, sound)

- [ ] Status · **Blocked by:** A-01, A-03, A-09, A-12 · **Blocks:** X-05
- **Context:** ADR-054 §1, §4, §7. Identifiers were done in F-01/F-04. This is everything human-facing plus leftover identifiers in the surviving app surface.
- **Steps:**
  1. `es-mx.ts`: `Cachink!` → `Xangarro!`; prune keys only used by archived screens (find with a script that greps each key).
  2. testIDs containing `cachink` → `xangarro`, **atomically** with the Maestro flows that reference them (single commit).
  3. `use-cachink-player.ts` → `use-sale-sound-player.ts`; `cachink-sound-toggle.tsx` → `sale-sound-toggle.tsx`; `assets/sounds/cachink.mp3` → `sale-confirm.mp3` (same audio for now).
  4. `CachinkDatabase` type → `XangarroDatabase`; `__cachink_change_log` **stays** (renaming a live table = migration; do it in A-17 if cheap, else leave and note).
  5. `docs/`, `README.md`, `SETUP.md` product name; ADRs and `ROADMAP-archive.md` **untouched** (ADR-054 §3).
  6. Placeholder icon/splash: keep current artwork until X-07; only text changes here.
- **Acceptance:** `grep -rni "cachink" packages apps --include=*.ts --include=*.tsx --include=*.json --include=*.yaml -l | grep -v archive` → only the change-log table name (if kept) and nothing user-visible; full Maestro regression green.

### A-16 Maestro suite for the new app

- [ ] Status · **Blocked by:** A-04…A-10, A-15
- **Context:** 142 flows today. Shared subflows to rewrite: `authenticate*.yaml` (→ activation + operator PIN), delete `authenticate-director.yaml`, `authenticate-wizard.yaml`, `complete-first-run.yaml`, `first-run-onboarding.yaml`, `director-setup.yaml`, `open-director-tools.yaml`, `open-sync-wizard.yaml`, `select-operativo.yaml`. Ventas flows still test the removed SessionStrip→TotalBar UI (known) — **re-scope them to the inline POS** (tap product card → VentaConfirmSheet → submit), do not drop them.
- **Harness gotcha (found in F-03, 2026-09-11):** on a _fresh_ SDK-55 dev-client install the Expo dev menu breaks flows three ways: (1) a one-time "developer menu" welcome sheet appears _after_ `dismiss-modals` already ran its optional `Continue` tap; (2) the floating **"Tools button"** sits over `top-bar-open-settings` on iPad and swallows the tap, opening the dev menu instead; (3) `dismiss-modals` taps `close` but the sheet's button is `Close`. Fix in `fresh-install.sh`: after install, launch once, tap `Continue`, open the dev menu, toggle "Tools button" off, `Close` — and make the `close` selector case-insensitive. Also: `smoke-launch.yaml` is iPhone-scoped (the wizard card is below the discovery carousel's fold on iPad); use `ipad-smoke.yaml` on iPads.
- **Steps:** new flows: `activation.yaml`, `activation-errors.yaml`, `login-operator-pin.yaml`, `sync-actualizar.yaml`, `sync-rejected.yaml`, `entitlement-freelancer-limit.yaml`, `settings-desvincular.yaml`. All run against `pnpm mock:api` with `fresh-install.sh` (ADR-048 finding 1). Update `full-regression.sh` entry bucketing; update `docs/e2e-HANDOFF.md`.
- **Acceptance:** `full-regression.sh --device <sim>` green on iPhone + iPad sims; flow count and list documented in the Done line.

### A-17 SQLite migrations for the new shape + migration test

- [ ] Status · **Blocked by:** F-07, A-06
- **Files:** `packages/data/drizzle/migrations/000N_*.sql`, `meta/_journal.json`, `migrations/index.ts`, `packages/data/tests/migrations/*.test.ts`.
- **Steps:** one migration: `users` drop `role`, `must_change_pin`, `recovery_password_hash`, `email`; add `active INTEGER NOT NULL DEFAULT 1` (then replace the typed-error guard for `patch.active` in `packages/data/src/repositories/drizzle/users-repository.ts` with a real `set['active']`, and map the column in `#mapRow` instead of the hardcoded `true` — both left by F-07); new `__sync_row_status`; `app_config` rows for entitlement/server time; add `server_seq INTEGER NULL` to every UP/HYBRID table (set from push responses; used by A-11); optionally rename `__cachink_change_log` → `__sync_change_log` (update triggers + `sync-state.ts`). Migration test: build a DB at the previous version with fixture rows (incl. a director user) → migrate → users kept with `active=1`, director row still present (portal will have deactivated it server-side anyway), no data loss (CLAUDE.md §2.9).
- **Acceptance:** `pnpm --filter @xangarro/data test -- migrations` green; fresh install and upgraded install both boot.

### A-18 Remove LAN mount points (keep `packages/sync-lan` on disk)

- [ ] Status · **Blocked by:** A-01
- **Files:** `packages/ui/src/sync/{lan-bridge.ts,lan-sync-context.tsx,use-lan-handle.ts}`, `apps/mobile/src/shell/use-lan-bridges.ts`, `packages/ui/tests/sync/lan-*.test.ts`, Settings `lan-details-card.tsx` (archived in A-01), `.storybook/main.ts`.
- **Steps:** delete the UI/shell bridges (they're thin); `packages/sync-lan` stays in the workspace with its own tests green (it must not rot — CLAUDE.md consequence in ADR-053); nothing imports it from `ui`/`mobile`.
- **Acceptance:** `grep -rn "@xangarro/sync-lan" packages/ui apps/mobile` → 0; `pnpm --filter @xangarro/sync-lan test` still green.
