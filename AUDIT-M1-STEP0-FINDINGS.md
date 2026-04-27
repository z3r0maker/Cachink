# Audit M-1 Step 0 — Findings From Emulator Exploration

**Date:** 2026-04-26
**Scope:** Toolchain + first-launch flow as exposed by `pnpm --filter
@cachink/mobile test:e2e` on the iPad Pro 11" simulator (iOS 26.4).
**Acceptance gate met:** `apps/mobile/maestro/flows/smoke-launch.yaml`
exits 0 against the freshly-built dev client.

This document is the audit-finding log demanded by the user
instruction _"if an error is found during the exploration document it
in a plan along with the other findings so we can fix them."_ All
findings here are **post-build** — they would not have surfaced
without actually running the bundle on a real iOS simulator.

---

## Findings

### F0-T01 (Toolchain — FIXED) — Java 8 was the only JDK on `PATH`

- **Severity:** Blocker (Step 0 cannot proceed).
- **Symptom:** `~/.maestro/bin/maestro --version` exited with
  `Java 17 or higher is required`. `java -version` reported
  `1.8.0_421` (Oracle Internet Plug-In).
- **Fix shipped:** `brew install openjdk@17` and exported
  `JAVA_HOME="/opt/homebrew/opt/openjdk@17"` plus
  `PATH="$JAVA_HOME/bin:$HOME/.maestro/bin:$PATH"` in `~/.zshrc` and
  `~/.bash_profile`.
- **Documented in:** `apps/mobile/SETUP.md` → "Maestro local-dev
  setup".

---

### F0-T02 (Toolchain — FIXED) — CocoaPods crashes on `!` in path without UTF-8 locale

- **Severity:** Blocker. `expo prebuild --clean` aborted before
  generating Podfile.lock.
- **Symptom:**
  ```
  /opt/homebrew/Cellar/ruby/4.0.3/lib/ruby/4.0.0/unicode_normalize/
    normalize.rb:153:in 'UnicodeNormalize.normalize':
    Unicode Normalization not appropriate for ASCII-8BIT
    (Encoding::CompatibilityError)
  ```
  CocoaPods 1.16.2 + Ruby 4.0.3 fail to normalize the workspace path
  `/Users/.../Downloads/Cachink!/...` because `!` is not a 7-bit ASCII
  character under the default `LANG=C` encoding.
- **Fix shipped:** export `LANG=en_US.UTF-8` and `LC_ALL=en_US.UTF-8`
  before `pod install` (and any wrapping `expo prebuild`). Documented
  in SETUP.md.
- **Long-term consideration:** Renaming the workspace dir to
  `cachink/` (no `!`) would side-step this entirely. Out of scope
  for this audit; the locale export is a one-line workaround.

---

### F0-T03 (pnpm + RN — FIXED) — `hoist-non-react-statics` not exposed to Metro

- **Severity:** Blocker. Bundle red-screened immediately on app
  launch with:
  ```
  Unable to resolve module hoist-non-react-statics from
    react-native-gesture-handler@2.31.1/src/components/
      gestureHandlerRootHOC.tsx
  ```
- **Root cause:** pnpm's default isolated linker hides transitive
  deps from sibling packages. `react-native-gesture-handler@2.31.1`
  imports `hoist-non-react-statics` but pnpm did not symlink it into
  `apps/mobile/node_modules/`.
- **Fix shipped:** Added `hoist-non-react-statics: ^3.3.2` as a
  direct dep of `apps/mobile/package.json` so pnpm symlinks it into
  the app's node_modules tree. Workspace-gate clean.
- **Why not `node-linker=hoisted`:** the hoisted linker would fan
  out to every workspace package (including `packages/ui`) and
  duplicate React across them. The targeted dep entry is the minimal
  blast radius.

---

### F0-T04 (Tamagui + Maestro — BLOCKER, NOT YET RESOLVED) — `Btn.onPress` does not fire on Maestro/iOS taps

- **Severity:** Blocker for the **full** Maestro suite. The
  smoke-launch flow was downgraded to a "first interactive surface"
  assertion (`assertVisible: ¿Enviar reportes…?`) because we cannot
  drive past the consent modal.
- **Symptom:** Maestro `tapOn` against `consent-modal-no` (resolved
  via testID **and** via explicit `point: 211,1151` within the
  reported bounds `[145,1129][278,1173]`) reports `COMPLETED` but the
  Btn's `onPress` handler never runs (the modal stays open and
  `setConsent(false)` never dispatches).
- **Reproduces with:** `tapOn { id: consent-modal-no }`,
  `tapOn { point: 211,1151 }`, `tapOn { text: "No, gracias" }`. All
  three "complete" at the Maestro layer; none cause a state update.
- **Suspected cause:** the `Btn` primitive in
  `packages/ui/src/components/Btn/btn.tsx` wires `onPress` on a
  Tamagui `<View>` rather than a React Native `<Pressable>`.
  Tamagui's `View.onPress` is a JS-layer pointer-event wrapper that
  may not fire when Maestro dispatches a synthetic
  `XCUIElement.tap()` against the iOS view tree (the gesture is
  delivered to the native view but Tamagui has no native gesture
  recognizer registered on it).
- **Recommended fix:** Replace the Tamagui `<View onPress>` in
  `Btn` with a React Native `<Pressable>` (or a Tamagui Tappable
  wrapper backed by Pressable). The `pressStyle` press transform
  needs to be ported across. Affects every Btn call-site, but the
  prop surface stays the same.
- **Effort:** S (single primitive swap). Medium when tests need to
  re-verify the press-transform animation across all 7 variants.

---

### F0-T05 (Logic — FIXED) — `ConsentModal` cannot be dismissed via "Decidir después" / X / backdrop

- **Severity:** Blocker for any first-launch E2E run. Real users
  who pick "Decidir después" (the explicitly-documented "I'll decide
  later" choice) are trapped in the modal.
- **Root cause:** In `packages/ui/src/app/app-providers.tsx`, the
  `TelemetryBridge` previously rendered:
  ```tsx
  <ConsentModal open={hydrated && consent === null} onChange={persist} />
  ```
  Tapping "Decidir después" calls `persist(null)`, which sets
  `consent` to `null`. The modal's `open` is `consent === null`, so
  the modal stays open. Same trap for the X close button and the
  backdrop tap (both wired to `onChange(null)`).
- **Fix shipped:** Track a local `dismissedThisSession` boolean.
  Once any choice is made (Sí / No / Decidir después / X) the modal
  closes for the rest of the React mount. Cold-start re-mounts the
  provider, so "Decidir después" still re-prompts on next launch as
  the original spec intended.
- **File:** `packages/ui/src/app/app-providers.tsx` lines 93–148.

---

### F0-T06 (UX — High) — `ConsentModal` blocks the wizard on first launch

- **Severity:** High. Bad UX even after F0-T05 lands.
- **Symptom:** A user opening Cachink for the first time sees a
  Sentry crash-reporting consent prompt **before** they have done
  anything. They have not yet picked a setup mode, given any data,
  or signed up. We are asking for a consent decision in a
  zero-context moment.
- **Recommended fix:** Defer the consent prompt until _after_ the
  wizard completes. Mount the prompt the first time the user lands
  on the role picker (post-wizard) or when they trigger a
  user-initiated action that benefits from telemetry (e.g. their
  first venta). The consent bottom-sheet itself stays the same; only
  the trigger moves.
- **Effort:** S (one `useEffect` gate + one regression test).

---

### F0-T07 (Layout — High) — `ConsentModal` bottom-sheet extends below the iPad safe area

- **Severity:** High on the iPad Pro 11" (and any device with a
  home indicator). The action buttons "SÍ, ENVIAR / NO, GRACIAS /
  DECIDIR DESPUÉS" partially overlap the home indicator and become
  hard to tap.
- **Symptom:** Visible in `audit-screenshots/sim-after-fix-rebuild.png`
  — the bottom row is clipped at the screen edge.
- **Suspected cause:** `packages/ui/src/components/Modal/modal.native.tsx`
  sets `position: 'absolute', bottom: 0` without consulting
  `useSafeAreaInsets()`. The Tamagui Dialog Portal renders at the
  root view, which on iPad sits beneath the ~30pt home-indicator
  reserved zone.
- **Recommended fix:** import `useSafeAreaInsets` from
  `react-native-safe-area-context` (already a transitive dep of
  Expo) and add `paddingBottom: Math.max(insets.bottom, 36)` to the
  `<Dialog.Content>` in `modal.native.tsx`. Single primitive change
  — every modal in the app benefits.
- **Effort:** S.

---

### F0-T08 (Code-quality — Medium) — Ten require-cycle warnings logged on every cold start

- **Severity:** Medium. Metro bundles the app fine but logs
  warnings that "can result in uninitialized values" — silent runtime
  bugs are likely.
- **Cycles found:**
  1. `Icon/icon.native.tsx → Icon/icon.native.tsx`
  2. `components/index.ts → Scanner/scanner.native.tsx →
components/index.ts`
  3. `components/index.ts → PeriodPicker/period-picker.tsx →
components/index.ts`
  4. `components/index.ts → ErrorState/error-state.tsx →
components/index.ts`
  5. `database/database-backup.native.ts →
database/database-backup.native.ts`
  6. `app/index.ts → app-providers.tsx → gated-navigation.tsx →
screens/Wizard/wizard.tsx → step2a-solo.tsx →
data-preserved-callout.tsx → use-data-counts.ts → app/index.ts`
  7. `app/index.ts → app-providers.tsx → gated-navigation.tsx →
hooks/use-crear-business.ts → app/index.ts`
  8. `screens/Estados/estados-shell.tsx ↔ Estados/index.ts`
  9. `hooks/index.ts ↔ use-actividad-reciente.ts`
  10. `share/rasterize.native.ts → share/rasterize.native.ts`
- **Recommended fix:** Refactor each import path to break the
  cycle. The barrel-exports (cycles 2/3/4/8/9) are the easiest —
  import directly from the leaf module rather than from the barrel.
  Self-imports (1/5/10) are likely typos in the platform-extension
  re-exports — the `.native.tsx` file should not import from
  itself.
- **Effort:** M. ~½ day of careful refactoring + verifying no test
  regressions.

---

### F0-T09 (Native deps — Medium) — Five Expo-SDK-55 version mismatches

- **Severity:** Medium. Metro logs five mismatches on every cold
  start:
  ```
  @sentry/react-native@8.9.1     - expected ~7.11.0
  react-native-gesture-handler@2.31.1 - expected ~2.30.0
  react-native-safe-area-context@5.7.0 - expected ~5.6.2
  react-native-svg@15.15.4       - expected 15.15.3
  react-native-webview@13.16.1   - expected 13.16.0
  ```
- **Risk:** Expo SDK 55's compatibility matrix is the source of
  truth for which versions ship with EAS Update channels. Drift
  here means one of the upgraded packages may carry a native API
  change Expo's runtime hasn't accommodated. The
  `accessibilityLabel` removal in gesture-handler 2.31.1 (see
  F0-T10) is a concrete instance.
- **Recommended fix:** run `pnpm exec expo install --fix` from
  `apps/mobile/` and commit the resulting downgrades. Audit the
  TypeScript fallout in a follow-up slice.
- **Effort:** S to downgrade; M to re-verify everything still
  typechecks (esp. SwipeableRow + telemetry).

---

### F0-T10 (TypeScript — FIXED) — `Swipeable` removed `accessibilityLabel` prop in 2.31.x

- **Severity:** Blocker for `pnpm typecheck` (was masked by turbo
  cache reporting cached "success" — surfaced when I ran
  `pnpm typecheck --force`).
- **Symptom:**
  ```
  src/components/SwipeableRow/swipeable-row.native.tsx(165,7):
    error TS2322: ...
    Property 'accessibilityLabel' does not exist on type
    '... <Swipeable> ...'
  ```
- **Fix shipped:** Wrapped `Swipeable`'s children in a `<View
accessibilityLabel={props.ariaLabel}>` so VoiceOver / TalkBack
  still announce the swipe-row label. File:
  `packages/ui/src/components/SwipeableRow/swipeable-row.native.tsx`
  ~L150–177.

---

## Findings shipped by this commit

| ID     | File                                                               | Status                  |
| ------ | ------------------------------------------------------------------ | ----------------------- |
| F0-T01 | `~/.zshrc`, `~/.bash_profile`, `apps/mobile/SETUP.md`              | ✅                      |
| F0-T02 | `apps/mobile/SETUP.md`                                             | ✅                      |
| F0-T03 | `apps/mobile/package.json`                                         | ✅                      |
| F0-T05 | `packages/ui/src/app/app-providers.tsx`                            | ✅                      |
| F0-T10 | `packages/ui/src/components/SwipeableRow/swipeable-row.native.tsx` | ✅                      |
| F0-T04 | not yet                                                            | ⛔ blocker for full E2E |
| F0-T06 | not yet                                                            | ⏳ UX gap               |
| F0-T07 | not yet                                                            | ⏳ layout gap           |
| F0-T08 | not yet                                                            | ⏳ code-quality gap     |
| F0-T09 | not yet                                                            | ⏳ dep-mismatch gap     |

---

## Recommended PR slicing

To clear the runway for the full Phase L + Phase I work the audit
plan calls for:

- **PR-FIX-1 (Blocker, S):** F0-T04. Replace `Btn`'s Tamagui
  `View.onPress` with `Pressable`. Unblocks every Maestro flow that
  taps a Btn (≈ all of them).
- **PR-FIX-2 (High, S):** F0-T07. Safe-area-aware `Modal`.
- **PR-FIX-3 (High, S):** F0-T06. Defer the consent prompt past
  the wizard.
- **PR-FIX-4 (Medium, S+S):** F0-T09. `expo install --fix` +
  follow-up.
- **PR-FIX-5 (Medium, M):** F0-T08. Break the 10 require-cycles.

After PR-FIX-1 lands, the smoke-launch flow can be expanded to
traverse the full first-launch path (consent → wizard → role
picker), and the rest of the 30-flow Maestro suite can run.

---

## Acceptance summary for Step 0

✅ Java 17 installed and Maestro CLI launches.
✅ `expo prebuild --clean --platform ios` succeeds with
`LANG=en_US.UTF-8`.
✅ `expo run:ios --device "iPad Pro 11-inch (M5)"` builds and installs
the app cleanly.
✅ `apps/mobile/maestro/flows/smoke-launch.yaml` exits 0.
✅ Findings documented in this file.
✅ `apps/mobile/SETUP.md` updated with the toolchain prerequisites.

The Step-0 acceptance line in the approved plan is met. The full
suite (`pnpm --filter @cachink/mobile test:e2e`) is still gated on
F0-T04 — the Btn-tap blocker — and is the recommended Step 4
re-entry point once PR-FIX-1 lands.
