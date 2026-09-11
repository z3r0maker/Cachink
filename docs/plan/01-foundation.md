# Track F — Foundation (shared, do first, one session)

> Everything here lands on `main` **before** Track A and Track B/P branch. It is sequential.
> Read `00-README.md` §4 and §6 first. ADRs: ADR-053, ADR-054.
>
> Goal: a repo where identifiers already say Xangarro, dead platforms are archived, the shared
> types both tracks need exist, and CI gates every PR.

---

### F-01 Change the mobile identifiers to Xangarro

- [x] Status
  - Done: 2026-09-11 · track/foundation · app.json name/slug/scheme/bundle/package → Xangarro; new EAS project `@z3r0makers-organization/xangarro` (ID `819fa99a-ea6b-44f8-ab3f-c3d168504967`, old `dece170a…` left in place) and `updates.url` repointed; 366 Maestro flows/scripts/build docs switched to `mx.xangarro.mobile` (machine-read, so done here not A-15). Deviations: Android prebuild was already broken (`assets/adaptive-icon.png` missing) — pointed at `icon.png` until X-07; removed deprecated `edgeToEdgeEnabled`. Verified: prebuild green, dev client installed on iPad Pro 13" beside the old Cachink app. Follow-up (landed with F-03): the dev-client deep-link scheme `exp+cachink://` / `cachink://` in Maestro scripts and 4 flows was missed by the bundle-id grep — switched to `xangarro`.
- **Blocked by:** — · **Blocks:** L-01, X-05, A-15
- **Context:** Bundle IDs are immutable once published. The app is unpublished (`eas.json` has no `ascAppId`; `docs/landing/index.html:114` still links `id0000000000`). Per ADR-054 §1–2 identifiers change now; display name keeps the `!`.
- **Files:** `apps/mobile/app.json`, `apps/mobile/eas.json`, `apps/mobile/ios/`, `apps/mobile/android/` (regenerated), `README.md`, `SETUP.md` (any prebuild notes).
- **Steps:**
  1. In `apps/mobile/app.json`: `name` → `Xangarro!`, `slug` → `xangarro`, `scheme` → `xangarro`, `ios.bundleIdentifier` → `mx.xangarro.mobile`, `android.package` → `mx.xangarro.mobile`. Leave `updates.url` / EAS project ID as-is unless EAS requires a new project for the new slug (check `eas project:info`; if a new project is created, record the new ID in the Done line).
  2. Run `pnpm --filter @cachink/mobile exec expo prebuild --clean` with `LANG=en_US.UTF-8` (CocoaPods locale gotcha, F0-T02). Confirm `ios/` and `android/` regenerate with the new identifier.
  3. `grep -rn "mx.cachink.mobile\|\"cachink\"" apps/mobile --include=*.json --include=*.plist --include=*.gradle --include=*.xml -l` → must be empty except inside `node_modules`.
  4. Do **not** touch `apps/desktop` (archived in F-02, never renamed).
- **Acceptance criteria:**
  - `apps/mobile/app.json` carries the values above; `expo prebuild --clean` succeeds; a dev-client build installs on a simulator as a **separate app** alongside the old Cachink install.
  - No `mx.cachink.mobile` string remains under `apps/mobile` outside `node_modules`.
- **How to test:** `cd apps/mobile && LANG=en_US.UTF-8 npx expo prebuild --clean && npx expo run:ios --device "<sim name>"`; on the simulator confirm both "Cachink!" and "Xangarro!" icons exist.
- **Done when:** the build installs under the new identifier and the old app is untouched.

---

### F-02 Archive the desktop (Tauri) app

- [x] Status
  - Done: 2026-09-11 · track/foundation · `apps/desktop` → `archive/apps/desktop` (91 files), tag `archive/desktop-2026-09`, `archive/README.md` added; `pnpm-workspace.yaml` excludes `archive/**`; `scripts/build-all.sh` Tauri step removed (checksums now over mobile artifacts); `scripts/design-lint` ROOTS drops desktop. Deviations: no root scripts or committed `packages/ui/dist` existed, and Storybook only mentions desktop in comments — nothing else to edit. Verified: `pnpm install` (workspace no longer lists desktop), typecheck 9/9, all tests green.
- **Blocked by:** — · **Blocks:** F-04
- **Context:** Q8 decision — desktop is removed from the active tree but preserved. Same treatment as F-03.
- **Files:** `apps/desktop/` → `archive/apps/desktop/`, `pnpm-workspace.yaml`, `turbo.json`, root `package.json` scripts, `.github/workflows/*` (F-08), `packages/ui/.storybook/main.ts`, `scripts/*` referencing desktop, `playwright.config.*` if root-level.
- **Steps:**
  1. `git tag archive/desktop-2026-09 HEAD` (tag the last commit where it built).
  2. `git mv apps/desktop archive/apps/desktop`. Add `archive/README.md` explaining: "Not built. Not in the workspace. Recover with `git mv archive/apps/desktop apps/desktop` and re-add to `pnpm-workspace.yaml`."
  3. Ensure `pnpm-workspace.yaml` globs (`apps/*`, `packages/*`) do **not** include `archive/**`. Add an explicit exclusion `- '!archive/**'`.
  4. Remove desktop-only root scripts (`release:build` desktop steps, `store:screenshots` desktop variants, any `tauri` script). Remove `packages/ui/.storybook/main.ts` references to `apps/desktop`.
  5. Delete `packages/ui/dist/` if it is committed (it contains stale `.d.ts` importers); confirm `dist` is gitignored.
  6. `pnpm install` must succeed with no workspace warnings; `pnpm typecheck` green.
- **Acceptance criteria:** `pnpm install && pnpm typecheck && pnpm test` pass; `git ls-files apps/desktop` is empty; `git ls-files archive/apps/desktop | wc -l` > 0; tag exists.
- **How to test:** commands above, plus `pnpm -r ls --depth -1 | grep -i desktop` → empty.
- **Done when:** the workspace no longer knows the desktop app exists and the tag points at the last building commit.

---

### F-03 Archive `packages/sync-cloud` (PowerSync) and unmount it

- [x] Status
  - Done: 2026-09-11 · track/foundation · `packages/sync-cloud` → `archive/packages/sync-cloud` (tag `archive/sync-cloud-2026-09`). Deviation: the cloud surface was wider than listed — `screens/CloudOnboarding` (→ `archive/ui-screens/`), `sync/{cloud-bridge,cloud-handle-registry,cloud-inner-screen-host,use-byo-backend,use-cloud-bridges}`, `hooks/use-cloud-session`, `app/cloud-gate`, `database/cloud-database-provider`, mobile `shell/{cloud-navigation,load-cloud-db,use-cloud-bridges,use-cloud-handle}` and 8 tests of that code were removed (they import PowerSync directly; stubbing them for A-01 to delete again made no sense). `mode==='cloud'` now falls through to local in `gated-navigation.tsx`; `AppProviders` lost `useCloud`/`useCloudHandle`; `@powersync/*` + `EXPO_PUBLIC_POWERSYNC_URL` dropped; `settings/sistema.tsx` hook split to satisfy the 40-line rule. Verified: typecheck 8/8, 2,908 tests green, no `sync-cloud|powersync` reference outside `archive/`. App boot verified visually on the iPad dev client (wizard → business → director setup → Director Home, all tabs). **Maestro `smoke-launch`/`ipad-smoke` did not complete on this fresh install for environmental reasons** — see the A-16 note in `05-app.md` — not app failures.
- **Blocked by:** — · **Blocks:** F-04, A-06
- **Context:** ADR-053 §6 parks PowerSync. Importers to unmount: `packages/ui/src/database/cloud-database-provider.tsx`, `packages/ui/src/sync/cloud-bridge.ts`, `packages/ui/src/sync/use-cloud-bridges.ts`, `apps/mobile/src/shell/load-cloud-db.ts`, `apps/mobile/src/shell/use-cloud-bridges.ts`, `apps/mobile/src/shell/use-cloud-handle.ts`, `packages/ui/src/app/cloud-gate.tsx`, tests under `packages/ui/tests/sync/cloud-*.test.ts*`, `apps/mobile/tests/shell/use-cloud-handle.test.ts`. Screen `CloudOnboarding` is deleted by A-01; here only make the build not depend on sync-cloud.
- **Steps:**
  1. `git tag archive/sync-cloud-2026-09 HEAD`; `git mv packages/sync-cloud archive/packages/sync-cloud`.
  2. Replace each importer with the smallest stub that keeps the app booting in **local mode**: `cloud-gate.tsx` becomes a pass-through; the cloud providers/bridges are removed and their call sites in `app-providers.tsx` / `app-provider-bridges.tsx` drop the cloud branch. Delete the tests that only tested PowerSync wiring (list them in the Done line).
  3. Remove `EXPO_PUBLIC_POWERSYNC_URL` from `apps/mobile/eas.json` env blocks.
  4. Remove `powersync` publication from `supabase/migrations/0001_schema.sql`? **No** — B-03 replaces that file entirely. Leave it.
- **Acceptance criteria:** `grep -rn "sync-cloud\|powersync" --include=*.ts --include=*.tsx --include=*.json packages apps` → no hits outside `archive/`; app boots to the Login screen on a simulator; `pnpm typecheck && pnpm test` green.
- **How to test:** commands above; `apps/mobile/maestro/scripts/run-flow.sh smoke-launch.yaml --device "<sim>"` passes.
- **Done when:** the app has no runtime path to PowerSync and the package is recoverable from `archive/`.

---

### F-04 Rename the workspace scope `@cachink/*` → `@xangarro/*`

- [ ] Status
- **Blocked by:** F-02, F-03 · **Blocks:** every later task (all tracks import the new scope)
- **Context:** ADR-054 §1 — scope is an identifier, so it changes now. This is **only** package names and import specifiers. Copy, i18n, testIDs, file names like `use-cachink-player.ts`, and the `__cachink_change_log` table name are **A-15**, not here (renaming the SQLite table is a migration and belongs with A-17).
- **Files:** every `package.json` `name` + `dependencies` under `packages/*`, `apps/mobile`, root; every `import … from '@cachink/…'`; `tsconfig*.json` `paths`; `eslint.config.js`; `turbo.json` filters; `vitest.config.*` aliases; `.storybook/main.ts`; docs that show commands (`README.md`, `SETUP.md`, `docs/e2e-HANDOFF.md`).
- **Steps:**
  1. `grep -rl "@cachink/" --exclude-dir={node_modules,.git,archive,dist,ios,android} . | xargs sed -i '' 's#@cachink/#@xangarro/#g'`.
  2. Also rename `CachinkDatabase` type? **No** — type/identifier sweep is A-15. Only the scope.
  3. `rm -rf node_modules **/node_modules && pnpm install`. `pnpm typecheck && pnpm lint && pnpm test`.
  4. Metro cache: `cd apps/mobile && npx expo start -c` once to confirm the bundler resolves the new scope.
- **Acceptance criteria:** `grep -rn "@cachink/" --exclude-dir={node_modules,.git,archive,dist} .` → 0 hits; all checks green; smoke-launch Maestro flow passes.
- **How to test:** as above.
- **Done when:** the scope is `@xangarro/*` everywhere outside `archive/`.

---

### F-05 Create `packages/contracts` (shared zod schemas for the API and wire format)

- [ ] Status
- **Blocked by:** F-04 · **Blocks:** C-01…C-10, A-04, A-06, B-07…B-09
- **Context:** Both tracks need the same request/response shapes. `packages/domain` must stay free of transport concerns (CLAUDE.md §2.5), so the API/wire types get their own package. The **content** of the schemas is specified in `02-contracts.md`; this task creates the package and the skeleton.
- **Files:** `packages/contracts/{package.json,tsconfig.json,src/index.ts,src/activate.ts,src/sync.ts,src/entitlement.ts,src/errors.ts,tests/}`.
- **Steps:**
  1. Scaffold with the same `package.json` shape as `packages/domain` (name `@xangarro/contracts`, `type: module`, exports `.`, scripts `build/typecheck/test/lint`). Dependencies: `zod` (check latest on npm first — CLAUDE.md §2.7), `@xangarro/domain` (for `PlanId`, `FeatureFlagKey`, branded IDs).
  2. Add to root `tsconfig.json` references and to `turbo.json` if per-package filters exist.
  3. Empty schema files with `TODO(C-0n)` markers are **not** acceptable (CLAUDE.md §11: no TODO). Instead, land each file with its real schema in the corresponding `C-` task; this task lands `index.ts` + `errors.ts` (error envelope is C-07 but is tiny — land it here) + one placeholder test asserting the package builds.
- **Acceptance criteria:** `pnpm --filter @xangarro/contracts typecheck test` green; `@xangarro/contracts` importable from `packages/ui` and from a scratch file in `apps/mobile`.
- **How to test:** commands above.
- **Done when:** the package exists in the workspace and C-tasks can add schemas to it.

---

### F-06 Domain: plans, plan limits, three-level flags, entitlement type

- [ ] Status
- **Blocked by:** F-04 · **Blocks:** A-10, A-14, B-06, P-10, P-15
- **Context:** Q10 + Q14. Today `packages/domain/src/entities/feature-flags.ts` has `DEFAULT_FEATURE_FLAGS` and a hardcoded `MVP_HIDDEN_FLAGS` clamp inside `parseFeatureFlags`. The new model is `effective = platformAvailable[key] && planIncludes[plan][key] && tenantEnabled[key]`. Plans: `freelancer | emprendedor | mipyme_pro`. Limits per plan: `operators`, `devices` (= operators), `recordsPerMonth` (`50 | null`), and feature keys included.
- **Files:** `packages/domain/src/entities/plan.ts` (new), `packages/domain/src/entities/feature-flags.ts` (extend), `packages/domain/src/entities/entitlement.ts` (new), `packages/domain/src/entities/index.ts`, tests in `packages/domain/tests/entities/`.
- **Steps:**
  1. `plan.ts`: `PlanId` zod enum; `PLAN_LIMITS: Record<PlanId, {operators:number; devices:number; recordsPerMonth:number|null; features: readonly FeatureFlagKey[]}>` as `as const`. Values from the pricing card: freelancer `{1,1,50,[]}`, emprendedor `{2,2,null,['stock','barcode']}`, mipyme_pro `{5,5,null,['stock','barcode', …]}`. Add `barcode` as a new `FeatureFlagKey` (today scanning is unconditional; it becomes plan-gated).
  2. `feature-flags.ts`: add `PLATFORM_AVAILABLE: Record<FeatureFlagKey, boolean>` (replaces `MVP_HIDDEN_FLAGS`: hidden keys are `false`), and `resolveEffectiveFlags({platform, plan, tenant})`. Keep `parseFeatureFlags` for the tenant layer only (it stops clamping). Keep `FEATURE_FLAG_DEPENDENCIES` applied after resolution.
  3. `entitlement.ts`: zod schema `Entitlement = {businessId, plan, limits, features, validUntil, graceUntil, issuedAt, serverTime}` (ISO strings) + `entitlementState(ent, nowServerAnchored) → 'active' | 'grace' | 'lapsed'` pure function. **No crypto here** — signature verification is in the app (A-10) and signing in the backend (B-06).
  4. Tests: 1 happy + 3 unhappy for `resolveEffectiveFlags` (platform off wins; plan excludes wins; tenant off wins; dependency parent off wins) and for `entitlementState` (active; inside grace; past grace; malformed dates).
- **Acceptance criteria:** `MVP_HIDDEN_FLAGS` no longer exported (grep = 0 outside tests/archive); callers compile against `resolveEffectiveFlags`; new tests green; `pnpm --filter @xangarro/domain test` green.
- **How to test:** `pnpm --filter @xangarro/domain test -- entities/plan entities/feature-flags entities/entitlement`.
- **Done when:** the domain expresses plans and effective flags with no clamp constant.

---

### F-07 Domain: `User` becomes an Operator (drop `role`, drop `mustChangePin`)

- [ ] Status
- **Blocked by:** F-04 · **Blocks:** A-03, A-17, B-02, B-13, P-05
- **Context:** Q1/Q2. The domain `User` entity (`packages/domain/src/entities/user*.ts`) carries `role: 'operativo'|'director'` and `mustChangePin`. Both go. `permissions` stays (Pro feature later). Add `active: boolean` (portal deactivation) if absent. Data-layer migrations are per-store: SQLite in A-17, Postgres in B-02 — **this task is domain + application only.**
- **Files:** `packages/domain/src/entities/user*.ts`, `packages/application/src/**` use cases touching role (`crear-usuario`, `autenticar-usuario`, `cambiar-pin`, role guards), `packages/testing/src/fixtures/*user*`, tests.
- **Steps:**
  1. Remove `role` and `mustChangePin` from the zod schema and type. Add `active` default `true`.
  2. Delete role-based branching in application use cases (search `role ===`, `'director'`, `UserRole`). Where a use case only made sense for a Director on-device (create user, change another user's PIN, director setup), **delete the use case and its test** and list them in the Done line — those operations now happen in the portal (B-13).
  3. `cambiar-pin-use-case` — delete (PIN is set in portal only, Q2). `autenticar-usuario-use-case` stays (PIN check against synced hash); add an unhappy path: inactive operator cannot authenticate.
  4. Fixtures + in-memory repos in `packages/testing` updated.
- **Acceptance criteria:** `grep -rn "'director'\|UserRole\|mustChangePin" packages/domain packages/application packages/testing` → 0; `pnpm --filter @xangarro/domain --filter @xangarro/application --filter @xangarro/testing test typecheck` green. `packages/ui` may be **red** after this task — that is expected and fixed by A-03; note it in the Done line.
- **How to test:** commands above.
- **Done when:** the domain has no concept of a Director.

---

### F-08 CI: GitHub Actions gate on every PR

- [ ] Status
- **Blocked by:** F-04 · **Blocks:** (gates all PRs)
- **Context:** `.github/workflows/` does not exist. Q17: typecheck + lint + unit + drift test per PR; Maestro nightly/on-demand only.
- **Files:** `.github/workflows/ci.yml`, `.github/workflows/maestro-nightly.yml`.
- **Steps:**
  1. `ci.yml`: on `pull_request` + `push` to `main`. Steps: checkout, pnpm (pin version from `packageManager`), Node 22, `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm test`. Cache pnpm store. Concurrency group per branch.
  2. Add a job `drift` that runs `pnpm --filter @xangarro/data-pg test` — it will be skipped via `if: hashFiles('packages/data-pg/package.json') != ''` until B-02 creates the package.
  3. `maestro-nightly.yml`: `schedule: cron '0 7 * * *'` + `workflow_dispatch`; macOS runner; documents that it is best-effort and non-blocking. If a macOS runner is not available on the plan, land the file with `workflow_dispatch` only and say so.
  4. Branch protection on `main`: require `ci` to pass (manual GitHub setting — note in Done line whether it was applied).
- **Acceptance criteria:** a PR touching any package shows the `ci` check; a deliberate type error in a scratch PR fails it.
- **How to test:** open a draft PR from the F branch; observe the check.
- **Done when:** `main` cannot receive a PR with red typecheck/lint/tests.
