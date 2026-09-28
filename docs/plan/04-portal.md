# Track P — Admin Portal (session "Backend+Portal", part 2)

> `apps/web` — Next.js App Router, **Radix primitives + vanilla-extract over
> `@xangarro/tokens`** (ADR-057; _not_ Tailwind, _not_ shadcn/ui), Drizzle `pg-core`
> (`@xangarro/data-pg`), Supabase Auth, Recharts, Vercel. Responsive to a 768 px tablet.
> Spanish (es-MX). Reuses `@xangarro/domain` for every calculation; imports **`@xangarro/tokens`
> only** — never `@xangarro/ui` (phone-shaped Tamagui, and a heavy dependency tree).
>
> **The design is the specification.** Twelve screens and a design system live in the Claude Design
> project, mirrored read-only at `/design-reference/`. Where the design contradicted ADR-053, the
> nine reconciliations in **ADR-058** apply and the design files are amended upstream first. Related:
> **ADR-056** (Asesor runtime), **ADR-057** (styling stack), **ADR-059** (plans, capabilities, the
> «Próximamente» gate), **ADR-060** (entity classes, `notices`).
>
> Prereqs: B-01…B-05 and **C-11**. Tests: Vitest for server actions and pure code; Playwright for
> states, roles, axe and the smoke E2E; `design-lint` for token adherence.

---

## How this track is organised

Work runs in the design plan's **ten fases**. Each fase ends in a **compuerta**; no task in fase
N+1 starts until fase N's gate is closed. Task IDs are stable and never renumbered
(`00-README.md` §3) — P-01…P-17 keep their identities and are amended in place; P-18+ are new.

| Fase | Name                         | Tasks                                          |
| ---- | ---------------------------- | ---------------------------------------------- |
| 0    | Contrato y andamio           | P-18, P-20, P-01, P-19, P-21                   |
| 1    | Tokens y primitivas          | P-22, P-23                                     |
| 2    | Cascarón de la aplicación    | P-24, P-02, P-03, P-04                         |
| 3    | Datos, roles y estados       | P-25                                           |
| 4    | Operación diaria             | P-13, P-09, P-07                               |
| 5    | Números y administración     | P-14, P-12, P-05, P-06, P-11, P-08, P-10, P-15 |
| 6    | Asesor                       | P-26, P-27, P-28, P-29, P-30                   |
| 7    | Avisos y compartir           | P-31, P-32                                     |
| 8    | Celebración y sellos         | P-33                                           |
| 9    | Impresión, exportes y cierre | P-16, P-17, P-34                               |

**The eight conditions of réplica** (design plan §1) apply to every screen task and are the
standing definition of done: structure, measurement, colour, typography, copy, interaction,
states, accessibility.

**Three verification checks** (design plan §5): (1) side-by-side comparison — a **review**, run
with `pnpm design:compare`, never a CI gate; (2) value audit — `pnpm lint:design`, a CI gate;
(3) states and roles sweep — Playwright, a CI gate.

---

## Fase 0 — Contrato y andamio

**Compuerta:** the agent opens any design screen in a browser and restates the eight conditions of
réplica in its own words.

### P-18 Land the ADR-058 amendments upstream, then mirror `/design-reference/`

- [x] Status · **Blocked by:** — · **Blocks:** P-19, P-21, every screen task
  - Done (the mirror half): 2026-09-20 · `design-reference/portal/` (13 Director screens +
    the design-system pages + runtime) and `design-reference/comprobantes/` landed from the
    owner's export, every file verified serving 200. **Open remainder, tracked here:** the
    ADR-058 amendments inside the design project itself (step 1), the design-system README
    refresh (step 2), and `scripts/design-pull.ts` (step 3) so future refreshes are a
    reviewable diff — the 2026-09-20 mirror was a hand copy because the design MCP
    authorisation (O-23's original blocker) still does not exist.
  - 2026-09-20 · **The mirror is complete:** `design-reference/portal/` (13 Director screens,
    the design-system pages, `_ds/` runtime, `assets/hero-taqueria.png`) and
    `design-reference/comprobantes/` (the four receipt templates N-20 waits on) landed from the
    owner's export — every file verified serving 200 from a static server. **Still open:** the
    ADR-058 amendments in the design project itself (step 1), the design-system README refresh
    (step 2), and `scripts/design-pull.ts` so refreshes are a reviewable diff (step 3).
- **Context:** ADR-058 resolves nine design/architecture conflicts. The plan's rule is «cualquier
  cambio visual se hace primero en el archivo de diseño y después en el código», so all of them
  land in the Claude Design project **before** any screen is built.
- **Steps:**
  1. In the design project, amend: Sincronización (drop the four mode cards, the derived
     suppression logic and the "Conflictos por resolver" tile); Acceso y onboarding (wizard 5 → 4
     steps, drop the hero image block); Ventas y gastos (drop "Nueva venta"/"Nuevo gasto" and the
     drawer's "Cancelar"); Productos (drop "Ajustar inventario" and "Registrar movimiento");
     Empleados (drop the Asistencia tab and "Registrar nómina"; keep Personas + Nómina);
     Operadores (drop the role label and the "Escritorio" state pill; keep permission pills);
     Estados financieros (add the fifth `locked` state); Suscripción (already correct).
  2. Refresh the design-system README, which is stale on platforms, sync, roles and icons.
  3. Mirror to `/design-reference/` at the repo root: the twelve `.dc.html`, `_ds/`,
     `assets/hero-taqueria.png`, and the runtime (`support.js`, `doc-page.js`, `image-slot.js`,
     `_ds_bundle.js`). Add `scripts/design-pull.ts` + `pnpm design:pull` so refreshes are a
     reviewable diff, never a hand edit.
  4. Exclusions, all four: `.prettierignore`, the ESLint ignores, `design-lint`'s `ROOTS` in
     `scripts/design-lint/index.ts`, and confirm Next never compiles it (root, not `apps/web`).
  5. `/design-reference/README.md` stating the folder is read-only, refreshed by `design:pull`,
     and that the runtime files are vendored for rendering only and never imported.
- **Acceptance:** every `.dc.html` opens and renders locally; `pnpm lint`, `pnpm format:check` and
  `pnpm lint:design` are unaffected by the new files (`.design-lint-baseline.json` still `total: 0`).

### P-01 Scaffold `apps/web`

- [x] Status · **Blocked by:** F-04, P-20 · **Blocks:** P-24, P-02…P-17
  - Done: 2026-09-17 · `apps/web` on Next 16.3.5 · `pnpm --filter @xangarro/web dev` serves
    `/` at :3100 (HTTP 200, vanilla-extract classes applied as `page_scaffoldCard__100es8i0`) and
    `build` compiles and prerenders clean. The emitted `:root` carries all 29 colour tokens
    including the eight `colors_and_type.css` is missing. `@xangarro/ui` is **not** in the
    dependency closure; the portal takes `@xangarro/tokens` and `@xangarro/domain` only.
  - **Unblocked from B-01.** The original `Blocked by` listed it for a pooled `DATABASE_URL`, but a
    scaffold needs no live database — that was the artificial serialisation Q1 set out to remove.
    The Drizzle client and `@xangarro/data-pg` join at P-25, which genuinely needs B-02.
  - **Two things future sessions must not rediscover:**
  - (a) Every `next` invocation passes **`--webpack`** (see P-20). The scripts already do; do not
    "modernise" them to Turbopack without replacing vanilla-extract first.
  - (b) `next.config.mjs` sets `resolve.extensionAlias = { '.js': ['.ts', '.tsx', '.js'] }`. The
    workspace packages are ESM TypeScript importing siblings as `./colors.js` while the file on
    disk is `colors.ts`; TypeScript resolves that, webpack does not, and without the alias every
    `@xangarro/*` import fails with `Module not found: Can't resolve './colors.js'`.
  - Root `.gitignore` and `.prettierignore` gained `.next/`, `next-env.d.ts` (and
    `design-reference/` ahead of P-18) — Prettier's `--ignore-path` reads only the root files, so
    `apps/web/.gitignore` alone left 80 generated files failing `format:check`.
- **Amended 2026-09-17 (ADR-057):** no Tailwind, no shadcn/ui. The layout moves to P-24.
- **Moved to Fase 0 on 2026-09-17:** the design plan's Fase 0 delivers «Repositorio, stack», and
  Fase 1's primitives (P-23) need an app to live in. Building them before the scaffold is not
  possible; the fase table is corrected to match.
- **Steps:** `next@16` App Router + TS + `src/`, named `@xangarro/web`. Add `@vanilla-extract/css`
  - its Next plugin (or the P-20 fallback), the Radix primitives P-23 needs, `@supabase/ssr`, the
    Drizzle client (`postgres` driver, pooled `DATABASE_URL`), Recharts, `zod`. **Check every version
    on npm first.** `vercel.json` with `regions: ["iad1"]` — the same file ADR-056's cron entry lands
    in. Add to Turbo (`build`, `typecheck`, `lint`, `test`). Import `@xangarro/tokens` and
    `@xangarro/data-pg`; do **not** add `@xangarro/ui`.
- **Acceptance:** `pnpm --filter @xangarro/web dev` serves `/`; typecheck and lint green;
  `@xangarro/ui` absent from the portal's dependency closure.

### P-19 `DESIGN_CONTRACT.md` with a generated token table

- [x] Status · **Blocked by:** P-18 · **Blocks:** P-22
  - Done: 2026-09-17 · `DESIGN_CONTRACT.md` at the repo root, generated by
    `pnpm design:contract` from `@xangarro/tokens`. `--check` fails when it is stale, so CI can
    gate on it.
  - **Nothing in the token tables is typed by hand.** All 29 colours with their CSS custom
    properties, the radius ladder and the off-ladder shapes, both border widths, the four shadows,
    both type ramps, the emoji sizes and the tracking scale are read from the source. A
    hand-maintained copy is precisely how `colors_and_type.css` came to be missing eight tokens.
  - The prose — the eight conditions of réplica and the prohibitions — is transcribed from the
    design plan §1 and §2b, with the stack-specific bans (no styled component library, no
    Tailwind, no inline literal) traced to ADR-057.
  - Added to `.prettierignore` beside `ARCHITECTURE.md`: a generated file that Prettier reflowing
    would make permanently "stale" against its own generator.
  - Delivered ahead of P-18 rather than after it, since the token table does not depend on the
    design-reference mirror. The `--check` run is what keeps it honest either way.
- **Steps:** Write `DESIGN_CONTRACT.md` at the repo root: §1 of the design plan verbatim (the eight
  conditions), the prohibitions (no styled component library, no Tailwind, no icons outside Lucide,
  no emoji in the UI except an empty-state glyph, no hex literal in a component), and the token
  table **generated** from `@xangarro/tokens` (P-22) rather than typed, so the contract cannot drift
  from the code. Until P-22 lands, generate from `packages/ui/src/theme.ts`.
- **Acceptance:** regenerating produces no diff; every value in the table resolves to a token.

### P-20 Stack spike — Next 16 + vanilla-extract

- [x] Status · **Blocked by:** — · **Blocks:** P-01, P-22, P-23
  - Done: 2026-09-17 · spike only, nothing committed · **vanilla-extract is viable on Next 16.3.5,
    but only with `--webpack` passed explicitly to both `build` and `dev`.** Turbopack (the Next 16
    default) fails with `ERROR: This build is using Turbopack, with a webpack config and no
turbopack config` → `WorkerError: Call retries were exceeded`, because the plugin injects a
    webpack config. With `--webpack`: build compiles and prerenders clean, `dev` serves HTTP 200,
    and the emitted CSS is exactly right —
    `._1o6ma9g0{background:#FFD60A;border:2.5px solid #0d0d0d;border-radius:18px;box-shadow:4px 4px 0 #0D0D0D;padding:28px}`
    — with the class applied as `page_card__1o6ma9g0`. **Decision: take vanilla-extract on Next 16
    with the `--webpack` flag**; the CSS-Modules fallback is not needed.
  - **Three environment findings that cost an hour and must not be rediscovered:**
  - (a) **`NODE_ENV=development` was exported in the shell**, which corrupts every Next production
    build. It surfaced as `TypeError: Cannot read properties of null (reading 'useContext')` while
    prerendering `/_global-error` (Next 16), or `<Html> should not be imported outside of
pages/_document` on `/404` (Next 15). A pristine `create-next-app@16` failed the same way.
    **Always run `next build` with `NODE_ENV=production`.** Neither symptom has anything to do with
    vanilla-extract, the React version, or Node 22 vs 26 — all of which were ruled out first.
  - (b) **The repo is on TypeScript 6.0.3**, not the "≥ 5.7" CLAUDE.md §3 claims; that line is stale
    (flag for X-06). Next 15 **rejects** TypeScript 7 — "the TypeScript 7 native compiler does not
    provide the JavaScript compiler API that Next.js requires" — while Next 16.2.11+ supports it.
    A second reason to be on 16.
  - (c) `esbuild` and `@swc/core` postinstall scripts are blocked by default under pnpm 10.
    vanilla-extract needs `esbuild`, so `pnpm.onlyBuiltDependencies` must list it.
- **Context:** ADR-057. `@vanilla-extract/next-plugin@2.5.2` is webpack-shaped (last published
  2026-04-12; latest prerelease tagged `fix-broken-webpack-externals`) while `next@16` defaults to
  Turbopack. Its peer range is `>=12.1.7`, so npm will not warn — a mismatch appears at build.
- **Steps:** Throwaway scaffold; confirm `next build` **and** `next dev` with a `.css.ts` file that
  imports a token. Check every version on npm first (CLAUDE.md §2.7). Record the result here.
- **Acceptance:** a `Done:` line stating which path was taken. **If it fails** and `--webpack` is not
  acceptable: fall back to CSS Modules, and add a task for a CSS-parsing value auditor — do not
  defer that discovery to Fase 5.

### P-21 `pnpm design:compare` capture harness `[deuda]`

- [ ] Status · **Blocked by:** P-18 · **Blocks:** every screen task's check 1
  - **Remaining (2026-09-23, verified against the code):** the whole harness. The one verified in
    `83ec5840` (2026-09-21) was never committed: the unanchored `.gitignore` pattern
    `design-compare/` also matched `scripts/design-compare/`, so the commit carried only the
    `package.json` script and the ignore line. The sources are on no disk (worktree and main
    checkout checked) and in no commit. Same day: the pattern is now `/design-compare/` and the
    dangling `design:compare` script is removed, so the Steps below are a rewrite, not a recovery.
    Restore the script entry when the harness lands.
- **Context:** ADR-058. Check 1 is a review, not an assertion — the design plan itself lists browser
  width, text reflow and real-vs-sample data as acceptable differences, and the `.dc.html` files
  render through a vendored runtime that fetches fonts over the network. This never runs in CI.
- **Steps:** A Playwright script that serves `/design-reference/` (use `http-server`, per the note in
  `packages/ui/playwright.config.ts` about `serve` 301-stripping `.html`) and the portal dev server,
  screenshots a named screen from both at the same width, and writes a stacked side-by-side PNG to
  `design-compare/`. Support `--width` (default 1440, plus 768) and `--state`.
- **Acceptance:** `pnpm design:compare inicio` produces a PNG in which bar heights, card paddings,
  title sizes and button positions are directly comparable. `/design-compare/` (repo root) is
  gitignored with that anchored pattern, and `git check-ignore -v scripts/design-compare/*` matches nothing.

---

## Fase 1 — Tokens y primitivas

**Compuerta:** an inventory page in the app is identical to the design system side by side,
including the press stamp.

### P-22 Extract `@xangarro/tokens`; emit CSS; extend `design-lint`

- [x] Status · **Blocked by:** P-20 · **Blocks:** P-23, P-19 (final generation)
  - Done: 2026-09-17 · `packages/tokens` created · `theme.ts` is now a 34-line re-export and **not one
    call site changed** — `pnpm typecheck` 19/19 and `pnpm test` 10/10 (437 test files) both green.
    Split into `colors.ts` (88) / `type.ts` (83) / `shape.ts` (76) / `layout.ts` (50) / `index.ts`
    (39) / `css.ts` (64), every file under the §2.6 ceiling the 275-line original had blown.
    `tests/theme.test.ts` moved with the tokens (17 contrast assertions) and `tests/css.test.ts`
    adds 10 more for the emitter. `design-lint` now imports from `@xangarro/tokens` directly, its
    `ROOTS` include `apps/web/src`, and it gained CSS-shaped rules for the `border` shorthand and
    `boxShadow`; 27 linter tests pass and the ratchet still reads `total: 0`.
  - **One bug found and fixed while writing those tests:** the first `boxShadow` rule matched
    lengths with `/(-?[\d.]+)px/g`, so a CSS shadow with unitless zeros — `0 0 8px #0D0D0D` —
    mis-indexed the blur and the blurred layer passed. It now reads the leading numeric tokens and
    treats a missing unit as a length. Pinned by the multi-layer test case.
  - **Follow-up, not done:** `scripts/design-lint/scan.ts` is 290 lines. It was already 265 (over
    the §2.6 ceiling of 200) before this task; these rules added 25. It wants splitting into
    `rules/token.ts` + `rules/a11y.ts`, which is linter work, not portal work.
- **Context:** ADR-057. `theme.ts` is 275 lines against the §2.6 ceiling of 200, and lives in a
  package that pulls `drizzle-orm`, `exceljs`, `jspdf`, `@react-pdf/renderer`, `html2canvas`,
  `bcryptjs` and `@sentry/browser`.
- **Steps:**
  1. New zero-dependency `packages/tokens`. Move `colors`, `fontSizes`, `emojiSizes`, `typography`,
     `radii`, `shapeRadii`, `borders`, `shadows`, `pressTransform`, `breakpoints`, `theme` — split
     across `colors.ts` / `type.ts` / `shape.ts` so each file is under 200 lines.
  2. `packages/ui/src/theme.ts` becomes `export * from '@xangarro/tokens'`. **No call site
     changes** — all fifteen consumers keep their imports.
  3. Move `packages/ui/tests/theme.test.ts` to `packages/tokens`; it now guards both consumers.
  4. Add a `@xangarro/tokens/css` entry emitting `:root { --yellow: …; }` for every token,
     **including** `textMuted`, `greenText`, `redText`, `blueText`, `warningText`, `purple`, `cyan`
     and `scrim` — the eight that `colors_and_type.css` is missing.
  5. `scripts/design-lint/index.ts`: add `apps/web/src` to `ROOTS`. `scripts/design-lint/scan.ts`:
     add rules for the CSS-shaped `border` shorthand and `boxShadow` (blur ≠ 0 is a soft shadow).
  6. Add `packages/tokens` to `tsconfig.json` references and Turbo.
- **Acceptance:** `pnpm typecheck` and `pnpm test` green across the workspace with no call-site
  edits outside `theme.ts`; the contrast test runs from its new home; `pnpm lint:design` still
  reports `total: 0`; the emitted CSS contains every token in `colors`.

### P-23 Primitives + Storybook inventory + visual-regression baselines `[deuda]`

- [~] Status · **Blocked by:** P-22 · **Blocks:** P-24 and every screen task
  - **Remaining (2026-09-23, verified against the code):** the `design:compare` acceptance clause waits on P-21, reopened the same day (the harness was never committed and exists on no disk; see P-21). No Storybook page in `apps/web`; Toast, gauge, nav item, switcher and user menu are unharnessed.
  - 2026-09-22 doc audit: shipped except the `design:compare` gate in its Acceptance.
  - In progress: 2026-09-17 · **core vocabulary built and rendering**, gate not yet closed.
  - **Done:** the press stamp and card lift (`styles/press.css.ts`, every value read from
    `pressTransform`); Button (6 fills × 3 sizes, disabled, hover-to-`yellowDeep`); Card
    (8 tones × 3 emphases, interactive lift); Tag and StatusPill (9 tones, bordered dot);
    Input (visible label, hint, error, `aria-invalid`/`aria-describedby`, numeric/tabular);
    KpiCard, Delta, Verdict; SegmentedTabs and FilterChip (Radix Tabs); DataTable (52 px header,
    56 px rows, scrolls inside its card); Banner; Drawer (Radix Dialog — backdrop, close button
    and Escape all come from the primitive, not hand-rolled); EmptyState, ErrorState, LoadingState
    (static grey blocks, never a shimmer); `srOnly`. Barrel at `components/index.ts`.
  - `/inventario` renders every one of them in every variant and is the artifact the Fase 1
    compuerta compares against the design system. Verified at HTTP 200 in dev.
  - 2026-09-19 · **Inventory extended + baselines committed** (deviation from the letter:
    the ADR-017 _harness_ — Playwright `toHaveScreenshot`, `maxDiffPixelRatio: 0.01` — runs
    against the in-app `/inventario` page, not Storybook; vanilla-extract requires the
    `--webpack` Next build Storybook would fight). New section: Switch, OptionCards,
    UsageBar, ConfirmDialog, Seal/Celebration, aviso row, money field. Like
    `design:compare`, the baselines are a local review (darwin), skipped in CI. **Still
    open:** the `design:compare` acceptance clause, which waits on O-23; Toast, gauge and
    the shell-only pieces (nav item, switcher, user menu) remain unharnessed.
  - Two of my own violations were caught by the repo's own gates and fixed rather than
    suppressed: `design-lint` flagged a hardcoded `#FFD60A` in `layout.tsx` (now `colors.yellow`),
    and ESLint's 40-line function budget rejected three components until they were split.

- **Steps:** Build the closed vocabulary the design plan §6 names, in `.css.ts` + Radix:
  button (primary yellow / secondary white / dark / danger / small — `height: 48`, `radius: 16`,
  `border: 2.5px`, `shadow: 4px 4px 0`, label 13px/700/`0.08em`/uppercase, hover to `--yellow-deep`,
  press to `translate(2px,2px)` + `1px 1px 0` over 100 ms `cubic-bezier(0.2,0.8,0.2,1)`), card,
  hero card, KPI card, input, money input, tag/pill, status pill, list row, table, segmented tab
  bar, drawer, dialog, toast, banner, progress/usage bar, option cards, gauge, delta indicator,
  health verdict, empty state, error state, loading blocks (static `--gray-100`, **never** shimmer),
  sidebar nav item, business switcher, user menu, «Asesor» strip, locked row, aviso row.
  Encode the scales as types via `recipes`: radius from `8|10|12|14|16|18|20|22`, border from
  `2|2.5`. Focus rings: `3px --yellow` + `inset 0 0 0 2px --black`, inverted on yellow surfaces.
  Wrap all motion in `@media (prefers-reduced-motion: reduce)`. Add a Storybook inventory page and a
  Playwright visual-regression suite reusing the ADR-017 harness (committed baselines,
  `maxDiffPixelRatio: 0.01`).
- **Acceptance:** `pnpm design:compare` on the inventory page versus the design system shows no
  structural difference; the press stamp matches; `pnpm lint:design` reports `total: 0`; baselines
  committed.

---

## Fase 2 — Cascarón de la aplicación

**Compuerta:** navigating between empty screens preserves the active nav state, and the shell does
not move a pixel between routes.

### P-24 App shell — sidebar, header, bell, sync pill

- [x] Status · **Blocked by:** P-01, P-23 · **Blocks:** P-02 and every screen task
  - Verified done by the 2026-09-22 doc audit (evidence, not authorship): `src/app/(portal)/layout.tsx`, `e2e/shell.spec.ts`, `e2e/sidebar-rail.spec.ts`.
  - In progress: 2026-09-17 · the shell renders at `/` with all twelve destinations.
  - **Done:** sidebar (248 px, 84 px rail below 1024 px, 76 px brand block whose bottom border
    lines up with the header's), the brand coin as inline SVG and the wordmark in self-hosted
    Anton, nav items as real `<a href>` with `aria-current="page"`, the "Configuración" divider
    after Dispositivos, header (76 px, content capped at 1760 px), business switcher, bell with
    unread badge linking to `/avisos`, plan chip, sync pill and avatar. `next/font` self-hosts
    both faces, so production never calls `fonts.googleapis.com` the way the prototypes do.
  - **All twelve nav labels, hrefs and icon paths are copied verbatim** from the design files'
    `navDefs`, per the plan's instruction to take each value from the file rather than from
    memory. Ventas/Gastos and Operadores/Dispositivos are two entries each onto one screen.
  - **The sync pill tells the truth.** `syncPillState()` is a pure function so the rule is
    testable without a DOM: "Sincronizado" only at zero, the real count otherwise, singular at
    one, and never a false all-clear from a negative or `NaN`. Four tests (1 happy + 3 unhappy).
  - `brand` tokens added to `@xangarro/tokens` for the lockup's off-ramp measurements (wordmark
    23 px, coin 38 px, X stroke 4.6). They are deliberately not on the type scale — Anton is a
    display face for the mark only — and naming them stopped `design-lint` flagging a literal.
  - 2026-09-18 · The business-switcher dropdown (320 px, P-02) and the user menu (272 px) are real
    popovers; the session values come from the server session (P-02). **The rail is togglable**:
    «Contraer menú» folds the sidebar to 84 px at any width, remembered per browser (storage may be
    missing — it then starts expanded), and navigation keeps it; below 1024 px the rail stays forced
    and the toggle is hidden. e2e: fold, reload, navigate, unfold.
- **Steps:** Build once, per the handoff's measurements. **Sidebar:** sticky, `100vh`, white,
  `border-right: 2.5px`, **248 px expanded / 84 px icon rail**, rail engaging below 1024 px and also
  togglable. Brand block `min-height: 76px` with a `2.5px` bottom border — **this must equal the
  header height exactly** so the two borders form one line. Coin is inline SVG (yellow, `2.5px`
  border, `3px 3px 0`, black X at `stroke-width: 4.6`, 60% of a 38×38 coin); wordmark is live text
  in self-hosted **Anton**, hidden in rail mode. Nav items are real `<a href>`, `height: 46`,
  `radius: 14`, active = `--yellow` + `2px` border + `3px 3px 0` + weight 800.
  **Twelve destinations in this order:** Inicio · Asesor · Ventas · Gastos · Estados financieros ·
  Productos · Operadores · Empleados · Dispositivos — **divider "Configuración"** — Sincronización ·
  Negocio · Suscripción. Ventas/Gastos and Operadores/Dispositivos are two entries each pointing at
  one screen with a different tab preselected.
  **Header:** sticky, `height: 76px`, `padding: 0 32px`, `--gray-200`, `border-bottom: 2.5px`, inner
  row capped at **1760 px**. Left: business switcher (30×30 yellow initials tile, name 15px/800,
  plan pill, uppercase role label) opening a 320 px dropdown. Right: **bell with unread badge**
  linking to Avisos, plan chip, sync status pill, 34×34 avatar opening a 272 px menu.
  **The sync pill must tell the truth** — `"{n} registros no enviados"` on `--warning-soft` when a
  queue exists, "Sincronizado" only at zero. Never a hardcoded label.
  **Main:** `padding: 28px 32px 96px`, inner column `max-width: 1760px`, `gap: 20px`, page ground
  `--gray-200`. Page title `36px/800/-0.03em`, subtitle `15px/600 --gray-600` 6 px below.
  **Self-host Anton and Plus Jakarta Sans** (both SIL OFL); **800 is the maximum weight** (ADR-058).
- **Acceptance:** the sidebar and header borders form one continuous line at every width; navigating
  between routes moves nothing; rail engages below 1024 px; `design:compare` at 1440 and 768 matches.

### P-02 Auth pages + membership guard + business switcher wiring

- 2026-09-21 · **The four-scene login animation landed** (its spec, `Acceso y
onboarding.dc.html`, entered `design-reference/portal/` with the O-23 mirror).
  Transcribed from the file: the 460×170 stage (ResizeObserver uniform scale,
  0.45–1.7), scenes of 6/3.5/5/5.5 s over 20 s with 360 ms cross-fades, the three
  money counters written from **one rAF loop** straight to the DOM (`animation-clock.ts`
  is the pure arithmetic, unit-tested; the loop pauses while any input is focused, and
  under reduced motion scene four holds). Every keyframe is the design file's own.
  The two-column login layout (yellow sticky panel, headline pinned at the bottom) folds
  below 1024 px. e2e: four scenes seen, focus pauses the clock, reduced motion holds
  scene 4, the panel folds at 768.

> **Amended 2026-09-18 (ADR-080):** the provider is decided — our own login (ADR-079) plus emailed
> sign-in/reset links (B-14). No GoTrue.

- [x] Status · **Blocked by:** P-01, P-24, B-05 · **Blocks:** all other P
  - Verified done by the 2026-09-22 doc audit (evidence, not authorship): `src/app/login/` (animation + escenas), `e2e/switcher.sync.spec.ts`, `e2e/auth-links.sync.spec.ts`.
  - 2026-09-17 · Sign-in/out, signed session, membership guard, 11 routes gated, forged cookie refused, identical message for wrong password and unknown address. `SESSION` fixture replaced in 19 files by a provider seeded from the server. **Still to do:** magic link, business switcher, the four-scene login animation, and the provider decision (ADR-061).
  - 2026-09-18 · **Emailed links (ADR-080).** «¿Olvidaste tu contraseña?» (`/login/recuperar` → `/login/restablecer`) and «Entrar con un enlace por correo» (`/login/enlace` → `/login/entrar`). Links are 256-bit, stored hashed in `xangarro.auth_links` (data-pg `0015_auth_links.sql`, SECURITY DEFINER only), single-use, 30/15 min, and a new link retires the account's earlier ones. A reset sets the bcrypt hash and ends every portal session in the same function. The request answers the same for unknown addresses and is throttled per address (3) and IP (10) per 15 min; the landing pages spend the token only on a tap, so mail scanners spend nothing. Sign-in after any credential goes through one `signInUser`. Tests: 5 DB integration (single use, expiry, newest wins, kinds don't mix, reset revokes sessions) and 3 e2e via the dev outbox. **Still to do:** the four-scene login animation.
  - 2026-09-18 · **Business switcher.** The header chip lists every business the account belongs to (`memberships_for_user`, archived ones skipped; each name read inside its own tenant) with the role there; picking one ends this session and opens one on the other, after re-checking the membership server-side. One business: a plain label, not a button. e2e on two throwaway tenants (owner in one, viewer in the other).
- **Amended 2026-09-17:** copy and layout now come from _Acceso y onboarding_.
- **Steps:** `/login` per the design — two-column grid `minmax(420px, 1fr)`, left flat-yellow panel
  (sticky, `100vh`, `border-right: 2.5px`) with wordmark row, the **four-scene looping animation**
  (460×200 fixed canvas uniformly scaled with a `ResizeObserver`; 6 s / 3.5 s / 5 s / 5.5 s, 20 s
  total; 360 ms cross-fades; counters written from one `requestAnimationFrame` loop, not per-frame
  state; **pauses while an input is focused**; holds scene 4 under `prefers-reduced-motion`), and the
  headline pinned with `margin-top: auto`. **No hero image** (ADR-058). Right: 460 px form card with
  the five variants — _Entra a tu portal_, _Crea tu negocio_, _Recupera tu acceso_, _Escribe tu
  código_ (six 64 px digit boxes), and the onboarding wizard. `/auth/callback`, `/reset`, `/logout`.
  Middleware: unauthenticated → `/login`; authenticated with zero memberships → `/signup/business`.
  Active business in cookie `xg_business`, validated against the memberships claim on every server
  action (`requireMember`). `viewer` sees no create/edit/delete affordances — **hidden, not
  disabled**; the server rejects regardless.
- **Acceptance:** Playwright — magic-link flow against the local Inbucket (`:54324`); viewer cannot
  see "Nuevo producto"; switching business changes the data; the error state shows the `--red-soft`
  alert and a `2.5px --red` password border.

### P-03 Signup (`/signup?plan=xangarrito|xangarro|xangarrote`)

> **Amended 2026-09-17 by Track N:** signup now goes to the wizard first; Checkout comes after "Tu plan ideal" — see N-13 (ADR-067).

- [x] Status · **Blocked by:** P-02, C-11, B-10, B-14 · **Blocks:** X-02, L-03
  - Done via N-13 (`360678a`, merged 2026-09-18, Track N): `/signup` with `?plan=`, our own auth
    (ADR-080: bcrypt + `startSession`), throttled per address and IP; then the wizard. Checkout is
    B-10's.
- **Amended 2026-09-17 (ADR-059):** plan slugs renamed. Invalid → `xangarrito`.
- **Steps:** Step 1 cuenta (email + password, or magic link). Step 2 negocio — name + the four
  tipo-de-negocio option cards with their verbatim descriptions → `tenant.businesses` +
  `business_members(owner)` + `billing.subscriptions`. Step 3 plan → Stripe Checkout for paid plans;
  Xangarrito skips payment. Return `/onboarding?session_id=` → verify server-side; if the webhook
  has not arrived, show "Confirmando tu pago…" with polling capped at 60 s, then proceed (grace
  covers OXXO/SPEI). **Stripe lookup keys are `plan_`-prefixed** (ADR-059).
- **Acceptance:** Playwright — free signup reaches onboarding with the checklist; paid signup with
  `4242…` reaches onboarding with the "Xangarro" plan badge; the OXXO flow shows the confirming state.

### P-04 Onboarding — wizard + "¿Cómo empiezo?" checklist

> **Amended 2026-09-17 by Track N:** the four steps are replaced by the 8-step "Platícanos de ti" wizard (N-12); the checklist stays (N-14); re-runnable (N-15). ADR-067.

- [x] Status · **Blocked by:** P-02 · **Blocks:** X-02
  - Done via N-12/N-13/N-14 (merged 2026-09-18, Track N): the 8-step «Platícanos de ti» wizard, the
    «¿Cómo empiezo?» checklist, and the re-run from Negocio («Volver a configurar mi negocio» →
    `/bienvenida/revisar`, 2026-09-18).
- **Amended 2026-09-17 (ADR-058):** the wizard is **four steps, not five** — the Sincronización step
  is removed.
- **Steps:** Wizard: 1 Negocio (nombre, giro, ciudad) · 2 Datos fiscales (RFC, régimen, inicio del
  ejercicio) · 3 Dispositivo (the pairing code in six 52×66 yellow boxes + a numbered explainer) ·
  4 Listo. A four-segment progress bar (`14px`, `2px` border, `radius 8`), "Atrás" hidden on the
  first and last steps, and a "Configurar después" link below the card.
  Checklist, persisted in `tenant.businesses.onboarding` JSONB and surfaced as a page, an Inicio
  card and a sidebar chip: datos fiscales · primer operador · primer producto (or import) · código de
  dispositivo generado (**shows the code inline** plus the three phone steps) · dispositivo activado
  (auto) · primera venta sincronizada (auto, set by push). Progress bar; small confetti on completion.
- **Acceptance:** each real action flips its item; deep links work; state survives logout.

---

## Fase 3 — Datos, roles y estados

**Compuerta:** changing role hides buttons rather than disabling them, and every state can be forced
without touching code.

### P-25 Container/presentational split, the four states, role gating

- [x] Status · **Blocked by:** P-24 · **Blocks:** every screen task
  - Verified done by the 2026-09-22 doc audit (evidence, not authorship): `src/session/gating.ts`, `src/components/gated-states.tsx`, `tests/gating.test.ts`.
  - In progress: 2026-09-17 · the pattern and the states exist; applying them to screens is the
    remaining half.
  - **Done:** `session/types.ts` (Role, Capabilities, Session, and `ScreenState` as a closed
    union) and `session/gating.ts` as **pure functions**, so the rules are testable without a DOM
    — 11 tests covering role gating, owner-only surfaces, export staying open to every role
    including the contador, and the plan capabilities.
  - `ScreenState` carries **six** members, not four: `locked` (plan gating, ADR-059) and
    `proximamente` (the production LLM gate) swap the content area exactly as the other four do,
    so they belong in the same union rather than in parallel booleans.
  - `resolveScreenState()` fixes the precedence, and the tests pin it: an unentitled screen shows
    the upsell **even mid-load and mid-error**, so it can never flash content it does not include;
    «Próximamente» outranks loading; error outranks loading; loading outranks empty.
  - `ScreenBody` swaps the content area only — the shell, page title and filters stay put, which
    is what lets Fase 5's 4-states × 3-roles sweep be a loop over props (ADR-058 §9).
  - `LockedState` reuses the empty-state card shape deliberately: nothing is broken and nothing
    is missing, the feature simply is not included yet. `ProximamenteState` has **no** call to
    action, because it is not something a customer can unlock.
  - 2026-09-19 · The screen fixtures are gone: the Asesor fixtures left with P-26/P-27, and
    `planes.ts` / `negocio.ts` moved to `src/data/` — verbatim design copy in a home whose
    name says what it is. What remains under `src/fixtures` is test input only.
- **Context:** ADR-058 §9. The prototype's state-switching FAB and `panelOpen` are deleted; forcing
  happens through props instead.
- **Steps:** Establish the pattern once: a server component resolves the request lifecycle and
  renders a **pure** screen component taking `{ state, role, permissions, capabilities, data }`.
  Build the four states as reusable primitives — `happy`; `loading` (static `--gray-100` blocks at
  content size with the real borders and shadows, plus an uppercase "Cargando…" line, **never a
  shimmer or spinner**); `empty` (centred card, `2.5px`, `radius 18`, `5px 5px 0`, `padding
64px 24px`, a 76×76 `--yellow-soft` tile, `24px/800` title, `46ch` body, one CTA hidden for
  read-only); `error` (same shape, `--red-soft` tile, dark "Reintentar", and copy that reassures
  nothing was lost — offline capture is a core promise). Add `locked` for plan-gated content
  (ADR-059) and «Próximamente» for LLM-backed surfaces. Role helpers: `owner | admin | viewer`,
  gating by **hiding**; owner-only on Suscripción and Negocio. Money via `Intl` es-MX from
  `@xangarro/domain` formatters; dates es-MX with lowercase months.
- **Acceptance:** Storybook renders any screen in any state × role from props alone; no `?state=`
  parsing and no FAB exist in a production build; Playwright sweeps 4 states × 3 roles.

---

## Fase 4 — Operación diaria

**Compuerta:** the three screens pass all three checks in all four states.

### P-13 Inicio

> **Wired to Postgres 2026-09-17.** Inicio no longer reads fixtures: `page.tsx` is an async server
> component that calls `loadInicio()` inside `withTenant()`, and `InicioScreen` is a pure component
> over the result. Rendered from the seeded database: utilidad del mes **−$16,065.00** (645.00
> ventas − 16,710.00 gastos, summed in SQL), ventas hoy **$195.00 / 3 ventas**, caja **Falta
> $6.00**, and stock bajo derived from movements — _Agua de horchata quedan 0_. The verdict reads
> "Tu negocio operó a pérdida este periodo", because it is one.
>
> `server/db.ts` is marked `server-only`, so importing it from a client component is a **build
> error** rather than a runtime leak of the connection string. Every read runs inside a transaction
> that sets the tenant claim locally, so a pooled connection cannot carry one tenant's claim into
> the next request.
>
> The remaining screens follow the same shape — container queries, screen stays pure — and are the
> mechanical half of this work.

- [x] Status · **Blocked by:** P-25 · **Blocks:** —
  - Verified done by the 2026-09-22 doc audit (evidence, not authorship): `src/app/(portal)/_inicio/`, `e2e/inicio.spec.ts`.
  - In progress: 2026-09-17 · renders at `/` against fixtures; HTTP 200 verified.
  - Rejection banner, greeting with the es-MX long date ("martes, 12 de mayo de 2026"), the yellow
    hero (56 px tabular figure, period range, green-dot verdict, "Ver estados"), Resumen de hoy as
    three KPI cards, Caja per device with turno pills and the corte result, Stock bajo, and
    Actividad reciente with signed amounts. Export is shown to writers only.
  - **Money is `bigint` centavos end to end** and formatted only at the boundary through
    `@xangarro/domain`'s `formatMoney` — `$15,197.62` and `$4,850.00` verified in the rendered
    HTML. No float touches a peso.
  - **`portalFontSizes` added to `@xangarro/tokens`.** The portal's type scale is richer than the
    phone's: the handoff specifies 56/44/40/36/34/30/26/24/22/20/19/17/16/15/14/13/12 and seven of
    those are absent from `fontSizes`, which was derived from what the mobile app actually used.
    Kept as its own scale rather than merged — a 56 px figure is right on a 1760 px dashboard and
    wrong on a phone — with the 12 px floor holding for both.
  - 2026-09-18 · **«Últimos 30 días»**: a Recharts line of ventas vs gastos from `serieDiaria` (one
    point per day, zeros included; its sum is asserted equal to the hero's totals), plotted as
    integer centavos and formatted back through `formatMoney`; the SVG is labelled and the totals
    are also stated in text. The heading's date now comes from the business clock (it was pinned
    to 12 May 2026). `sumarDias` / `ultimosDias` in the domain. e2e: date, totals, two lines, axe.
  - 2026-09-19 · **Done**: the «¿Cómo empiezo?» card joins the hero row (every item detected
    from `business_onboarding`'s signals, the same items `/como-empiezo` renders); «Hola,
    {nombre}» reads `auth.users.nombre` through the session (0020 / ADR-087 — signup collects
    an optional «Tu nombre»; a nameless account greets bare «Hola»); the hero's range is the
    business clock's month, no longer the pinned May literal; the low-stock banner's «Ver
    productos» links to `/productos?filtro=bajo`, where the catalogue preselects «Stock
    bajo». e2e: greeting, 5 de 6, the deep link.
- **Amended 2026-09-17:** built from _Inicio_, not ported from `DirectorHome`.
- **Steps:** Rejection banner (`--red-soft`, happy only) → title "Hola, {nombre}" with the full
  es-MX date → hero row `minmax(340px, 1fr)`: **Utilidad del mes** on flat `--yellow`
  (`56px/800/-0.04em` tabular figure, period range, a green-dot verdict line, a dark "Ver estados"
  link, and the delta with an arrow) beside the **¿Cómo empiezo?** checklist → **Resumen de hoy**
  (three KPI cards at 36 px: Ventas `--green-text`, Gastos `--red-text`, Utilidad black, each with a
  hint and an underlined blue link) → **Últimos 30 días** (Recharts line, ventas vs gastos) →
  **Caja** (per-device shift cards with state pill, operator, last corte and its result) →
  **Stock bajo** (40 px `--red-text` count, three product rows with `--red-soft` pills) →
  **Actividad reciente** (six rows, 36×36 `$`/`−` badges, signed amounts).
  The hero figure stays on **every** plan — it is arithmetic, not a NIF statement — and "Ver estados"
  lands on the `locked` state for Xangarrito (ADR-059).
- **Acceptance:** figures match P-09 totals for "hoy"; renders at 768 px with no horizontal page
  scroll; all four states; `design:compare` matches.

### P-09 Ventas y gastos

> **Wired to Postgres 2026-09-17.** The container/screen split is real, not
> aspirational: `page.tsx` is an async server component that queries inside
> `withTenant()`, and the screen is a pure component over the result — so Fase 5's
> state-and-role sweep still works from props, and the error state is what renders
> when a read throws.

- [x] Status · **Blocked by:** P-25 · **Blocks:** P-13, P-14
  - Verified done by the 2026-09-22 doc audit (evidence, not authorship): `src/app/(portal)/movimientos/`, `e2e/ventas.sync.spec.ts`, `e2e/gastos.sync.spec.ts`.
  - In progress: 2026-09-17 · `/movimientos` and `/movimientos?tab=gastos` both serve HTTP 200.
  - One screen, two tabs, **read-only** as ADR-058 §2 requires — no "Nueva venta", no "Nuevo
    gasto", and the drawer's only footer action is "Compartir comprobante". Four KPIs per tab,
    search, four range chips, category chips, the ledger table, and the detail drawer with its
    header tinted by record type.
  - **The filters actually filter.** `useFilteredRows` narrows by kind, category and free text,
    and the footer counter reads from the filtered length — "a chip that only highlights is a
    bug". Switching tabs resets the filter because the keys are not shared.
  - Cancelled rows strike the amount and carry a red "Cancelada · {motivo}" tag; queued rows carry
    "Sin enviar"; the drawer's sync block says "nada se pierde" rather than implying loss.
  - 2026-09-18 · **Range chips filter now, and pagination.** The chips were decoration («Mayo 2026»
    hard-coded, rows unfiltered). Now Hoy / Semana (Mon–Sun) / {current month by name} /
    Personalizado (Desde–Hasta) each narrow the rows, relative to the business's today; the table
    pages at 10 with «Mostrando 11–20 de 23» and Anterior/Siguiente (`Pager`/`usePagina` in the
    component barrel), and any filter returns to page 1.
  - 2026-09-18 · **One business clock.** Inicio, Estados and Movimientos had `2026-05-12` pinned in
    code, so production would always show May 2026. `server/clock.ts` `hoy()` is today in
    America/Mexico_City (`hoyEn`, `rangoDelMes`, `rangoDeSemana`, `nombreDelMes`, `enRango` in
    `@xangarro/domain`, 5 tests); `PORTAL_TODAY` pins it for the E2E suite to the seed's day.
  - **Still to do:** folio and turno fields (they need real records).
- **Amended 2026-09-17 (ADR-058 §2):** **read-only.** No "Nueva venta", no "Nuevo gasto", no
  "Cancelar" in the drawer. One screen, two tabs.
- **Steps:** Title "Movimientos" / "Todas las ventas y gastos capturados en tus dispositivos".
  Segmented tabs Ventas / Gastos with count pills. **Four KPIs per tab** — Ventas: Ventas del
  periodo, Ticket promedio, Efectivo en caja, Cuentas por cobrar (`--warning-text`); Gastos: Gastos
  del periodo, Mayor categoría, Nómina, Sin factura. Filter bar: search (46 px, `radius 12`,
  `--offwhite`), four range chips (Hoy / Semana / {Mes} / Personalizado; selected `--yellow` +
  `3px 3px 0`), and a "Filtros" toggle revealing chip groups. **Filters must actually filter and
  update the row counters — a chip that only highlights is a bug.** Table: Fecha (date over time),
  Concepto (circular `$`/`−` badge + "Sin enviar" `--warning-soft` pill when queued), Método/
  Categoría pill, Operador, Dispositivo, Monto (right, signed, coloured, tabular). Cancelled rows:
  struck amount, muted row, red "Cancelada · {motivo}" tag. 10 rows per page + "Mostrando 10 de N".
  Drawer: header tinted by type, a big amount block, the field list (Método, Operador, Dispositivo,
  Folio, Turno, Comprobante), line items, a sync-status block, and footer action **"Compartir
  comprobante"** only. **Exportar** (CSV + XLSX) for the current filter, on every plan and every
  role. Use `@xangarro/domain` formatters for centavos → MXN.
- **Acceptance:** totals equal a SQL sum for the same filter (unit test); export opens in Excel with
  correct types; viewer can export; drawer closes on backdrop, button and **Escape**; four states.

### P-07 Productos + Excel import

> **Amended 2026-09-18 (ADR-080):** the portal may create products («Nuevo producto» and the Excel
> import); they reach phones through `sync_log`. Phones still only insert them (HYBRID).

> **Amended 2026-09-18 (ADR-081):** products created in the portal start at **zero stock** — no
> `stock_inicial` in the create sheet or the import template. Stock is added with a movement:
> «Movimiento» on each catalogue row records an entrada/salida (done 2026-09-18, reaches every phone;
> Movimientos is no longer read-only).

> **Amended 2026-09-17 by Track N:** the import steps are generalised into a template registry with Clientes and Saldos iniciales (N-16, N-17) and a free-tier 50-product cap (N-04).

> **Wired to Postgres 2026-09-17.** The container/screen split is real, not
> aspirational: `page.tsx` is an async server component that queries inside
> `withTenant()`, and the screen is a pure component over the result — so Fase 5's
> state-and-role sweep still works from props, and the error state is what renders
> when a read throws.

- [x] Status · **Blocked by:** P-25 · **Blocks:** X-02
  - 2026-09-17 · Product **edit** works end to end through the reused `EditarProductoUseCase` (ADR-062), appending `sync_log`. "Nuevo producto" is labelled «próximamente»: `products` is HYBRID and the button contradicts the contract — **needs a product decision**. Excel import not started.
  - In progress: 2026-09-17 · `/productos` serves HTTP 200.
  - Catálogo / Movimientos tabs with counts; the low-stock banner whose "Ver stock bajo"
    **applies the filter** rather than only highlighting; four KPIs; the catalogue table with
    category-coloured initial tiles, SKU, the 12 px existence bar (green above the threshold, red
    below) and "{stock} · umbral {n}"; the movements table with type pills and signed changes.
  - **Movimientos is read-only** — "Ajustar inventario" and "Registrar movimiento" are gone,
    because `inventory_movements` is an UP table with no down path (ADR-058 §2).
  - 2026-09-18 · **«Nuevo producto» works end to end**: the sheet's five sections (Básico, Uso,
    Precio with a live margin chip, Inventario, Apariencia with 8 tints, the 66-icon picker in 7 tabs
    and a live tile preview) run `CrearProductoUseCase` — lifted out of the phone's UI hook so both
    clients share it. The product reaches every phone at zero stock (e2e). `ICON_CATEGORIES` moved to
    `@xangarro/domain` (a test pins 66 icons / 7 tabs / each once) and the tints to
    `@xangarro/tokens`, each checked against the domain enum at compile time.
  - 2026-09-18 · **Excel import works end to end**: template download (headers are the parser's
    own `TEMPLATE_HEADERS`; no `stock_inicial`), dry-run preview (Nuevo / Actualizar / Sin cambios /
    Error with reasons, "Mostrar solo errores", "Descargar errores" as CSV), and a commit that
    re-reads the file on the server and applies every valid row in one transaction through the same
    create/edit use cases. An update may not change cost (ADR-023) or stock tracking
    (`ProductPatch`), so those differences are row errors, never silently dropped. Parser and planner
    are pure and unit-tested (valid, missing header, bad number, duplicate SKU, > 5 000 rows,
    unchanged row); e2e imports 3 → 3 products, a one-price re-import previews exactly 1 update, and
    the contador (viewer) sees no create, import, edit or movement control.
  - 2026-09-18 · **Edit and archive**: «Editar» opens the same five-section sheet, prefilled, with
    tipo, cost (ADR-023) and stock tracking read-only — the fields `EditarProductoUseCase` does not
    change. «Archivar» is a logged soft delete, portal-only (owner decision); the rule that used to
    live in the phone's UI hook — units left → confirm, naming how many — is now
    `ArchivarProductoUseCase`, shared by both clients. e2e: an archived product with stock asks
    again, then drops off every phone.
  - Nothing left in P-07 itself; the phone's delete button goes with A-12.
- **Amended 2026-09-17 (ADR-058 §2):** tabs are **Catálogo / Movimientos**; no "Ajustar inventario",
  no "Registrar movimiento". Movimientos is read-only.
- **Steps:** Low-stock banner (`--red-soft`) whose "Ver stock bajo" **applies the filter**. KPIs —
  Catálogo: Productos activos, Valor del inventario, Stock bajo (`--red-text`), Margen promedio
  (`--green-text`); Movimientos: Movimientos del mes, Entradas, Mermas, Ajustes. Functional filter
  chips; switching tabs resets to "Todos". Catálogo table: Producto (category-coloured initial tile,
  name, SKU, "Inactivo" pill), Categoría pill, Precio, **Existencias** (12 px mini bar, green above
  threshold / red below, plus "{stock} · umbral {n}"), Vendidos, Margen. Movimientos table: Fecha,
  Producto, Tipo pill, Operador, Dispositivo, Cambio (signed). Create/edit sheet with the sections
  from the brief (Básico, Uso, Precio with a live margin chip, Inventario, Apariencia with the
  8 swatches and the 66-icon Lucide picker in 7 tabs + a live phone-tile preview). **Move
  `ICON_CATEGORIES` out of `packages/ui/src/screens/Productos/icon-picker-data.ts` into
  `@xangarro/domain` or `@xangarro/contracts` so both clients consume one list** (§2.3). Archive
  confirm with its verbatim copy. Every write appends `sync_log` through a `@xangarro/data-pg`
  repository that does both. **Excel import** in three steps: template download (headers `sku,
nombre, categoria, unidad, costo_unitario, precio_venta, seguir_stock, umbral_stock_bajo,
stock_inicial, icono`) → dry-run preview (chips "N nuevos · N actualizados · N con error", status
  column Nuevo/Actualizar/Error with reasons, "Mostrar solo errores", "Descargar errores") → commit
  in one transaction, max 5 000 rows, `stock_inicial` creating an `inventory_movements` entrada.
- **Acceptance:** parser unit tests (valid, missing header, bad number, duplicate SKU in file,
  > 5 000 rows); Playwright — import 3 rows → 3 products; re-import with one price changed → preview
  > says 1 update; viewer sees no create/edit affordances.

---

## Fase 5 — Números y administración

**Compuerta:** tables replicate alignment, tabular numerals and repeated headers; the plans show
Xangarrito, Xangarro and Xangarrote with their verbatim pitches.

### P-14 Estados financieros

> **Wired to Postgres 2026-09-17.** The container/screen split is real, not
> aspirational: `page.tsx` is an async server component that queries inside
> `withTenant()`, and the screen is a pure component over the result — so Fase 5's
> state-and-role sweep still works from props, and the error state is what renders
> when a read throws.

- [x] Status · **Blocked by:** P-25, C-11 · **Blocks:** P-34
  - Verified done by the 2026-09-22 doc audit (evidence, not authorship): `src/app/(portal)/estados/statement.tsx`, `e2e/estados.sync.spec.ts`.
  - In progress: 2026-09-17 · `/estados` serves HTTP 200 with four tabs.
  - **The existing domain functions are used, not reimplemented** — the instruction this task
    carries. `calculateEstadoDeResultados`, `calculateBalanceGeneral`, `calculateFlujoDeEfectivo`,
    `calculateIndicadores` and `evaluateHealth` against `DEFAULT_HEALTH_THRESHOLDS`, all from
    `@xangarro/financials`, the same code the phone runs.
  - **`tests/estados.test.ts` makes that checkable, not merely claimed**: it recomputes from the
    same inputs and asserts identity, so a reimplementation inside a component fails CI. It also
    pins the NIF B-3 identities (bruta = ingresos − costo; operativa = bruta − merma − gastos;
    neta = operativa − ISR), that a loss-making period owes **no** estimated ISR, that an ISR rate
    outside [0, 10 000] bps throws, and that B-6's activo total is the sum of its three parts.
  - The fixtures are **real `Sale` and `Expense` values**, and the balance takes the real inputs
    the domain expects — cortes, stock at cost, credit sales, their payments — rather than
    pre-summed totals, which would have meant reimplementing the aggregation the domain owns.
  - Rendered: ingresos `$68,420.00`, gastado `$55,790.00`, utilidad neta `$12,472.13`.
  - **The ISR disclaimer survives into production**, verbatim: "La cifra de ISR es orientativa.
    Consulta a tu contador antes de declarar."
  - Xangarrito renders the `locked` state; "Exportar Excel" stays open to every plan and role.
  - 2026-09-18 · **Period switcher**: Mensual / Trimestral / Anual / Personalizado (Desde–Hasta,
    Aplicar), carried in the URL so the server recomputes and a period can be linked; relative to
    the business clock (`rangoDelTrimestre`, `rangoDelAnio` in the domain). **Fixed:** the statements
    used a constant 1.25% ISR whatever the owner set in Negocio — they now read `isr_tasa`, and the
    notice shows that rate, with the no-utilidad variant; `periodoDiasVenta` was 31 for any period
    and is now the period's days; `periodLedger` loaded every sale and filtered in JS by string
    (dropping timestamped `fecha` on the last day) — it now filters by day in SQL (2 DB tests).
  - 2026-09-18 · **Disclosure rows**: Ingresos (by payment method), Costo de ventas and Gastos
    operativos (by category) carry a 23×23 toggle (`aria-expanded`) that lists their parts, largest
    first. `desgloseDeResultados` in the domain classifies with the statement's own
    `esCostoDeVentas` (now exported, the one copy of the rule); a test holds every breakdown equal
    to its line. e2e expands Gastos operativos against the seed.
  - 2026-09-19 · **F-1 fixed**: Balance, Flujo and Indicadores read real rows —
    `periodBalanceInputs` (data-pg) supplies the period's cortes, client payments, the
    stock snapshot at cost and the merma salidas, mirroring the phone's composition; 4 DB
    tests. `pasivosManuales` stays 0 until N-17's saldos iniciales.
  - 2026-09-19 · **Waterfall and donuts** (provisional — the Estados design file is not
    mirrored, O-23, so the shapes come from the statement's own numbers; `design:compare`
    reconciles when it lands): `charts-data.ts` is pure and unit-tested against the B-3
    identities; zero steps are omitted, so a no-merma month draws no merma bar.
  - **Still to do:** nothing in P-14 itself beyond the O-23 reconciliation.
- **Amended 2026-09-17 (ADR-059):** adds the fifth `locked` state; Xangarrito has no NIF statements.
- **Steps:** Period switcher (Mensual / Trimestral / Anual / Personalizado, `height 44`,
  `radius 14`, `3px 3px 0`) and statement tabs (Resultados / Posición / Flujo / Indicadores,
  `height 52`, same bordered segmented style — **deliberately not folder tabs**). **The ISR notice
  must survive into production**: "ISR referencial (1.25%)" / "La cifra de ISR es orientativa.
  Consulta a tu contador antes de declarar." plus the loss variant. Expandable statement lines with
  a 23×23 disclosure toggle; totals heavier and ruled off; collapsible Flujo groups.
  **Locate and reuse the existing `@xangarro/domain` NIF functions that
  `packages/ui/src/screens/Estados` calls — do not reimplement them.** "Exportar Excel" on every
  plan and role. "Informe mensual PDF" gated by `capabilities.informeMensual`.
  Xangarrito renders the `locked` state using the Asesor's teaser treatment.
- **Acceptance:** a seeded fixture business produces the same figures as the domain unit tests;
  print preview is one page per statement; Xangarrito sees `locked`; Xangarro sees the statements.

### P-12 Empleados

> **Wired to Postgres 2026-09-17.** The container/screen split is real, not
> aspirational: `page.tsx` is an async server component that queries inside
> `withTenant()`, and the screen is a pure component over the result — so Fase 5's
> state-and-role sweep still works from props, and the error state is what renders
> when a read throws.

- [x] Status · **Blocked by:** P-25 · **Blocks:** —
  - Verified done by the 2026-09-22 doc audit (evidence, not authorship): `src/app/(portal)/empleados/`, `e2e/empleados.sync.spec.ts`.
  - 2026-09-17 · "Nuevo empleado" works; salary parsed pesos→centavos at the boundary and the E2E asserts the **stored** value (`187550`), not the rendered one.
  - In progress: 2026-09-17 · `/empleados` serves HTTP 200.
  - **Two tabs, and Asistencia is verified absent from the rendered HTML.** Personas (avatar-less
    name + puesto, contrato pill, ingreso, "Acceso a la app", sueldo semanal) and Nómina (periodo,
    empleados, registrado por, total, estado) with the pending run leading the list.
  - **The header chip is derived, not stored**: "Nómina de la semana por pagar · $8,150.00" comes
    from the pending run, so it cannot contradict the rows beneath it.
  - Nómina's footer states the relationship plainly — "Cada pago de nómina se registra también como
    un gasto, capturado en el teléfono" — which is why there is no "Registrar nómina" button.
  - 2026-09-18 · **Create/edit sheet.** One Drawer for «Nuevo empleado» and «Editar»: nombre,
    puesto, salario and the periodo as three option cards (Quincenal by default), plus «Dar de baja»
    (soft delete). `GuardarEmpleadoUseCase` / `DarDeBajaEmpleadoUseCase` hold the rules (7 tests);
    `pgEmployeesRepository` logs every write for the phones. The pesos parser moved to
    `@xangarro/domain` (one copy). **Fixed:** «Nómina de la semana» summed salaries regardless of
    period — it now uses each one's weekly equivalent (`salarioSemanal`, integer maths). e2e:
    create → edit → baja, stored centavos, periodo and `sync_log` checked in Postgres.
  - 2026-09-20 · **The drawer landed (O-26 approved):** `expenses.empleado_id` (data-pg 0027,
    SQLite 0010, SCHEMA_VERSION 11 — drift green) is the data link, and «Ver pagos» on each
    Personas row opens the drawer with the payments found **through the link**, never by
    matching «Nómina {nombre}». Historical gastos carry no link, so the drawer's empty state is
    the honest one until the phone writes it (Track A's writer follow-up). The phone's
    «Tipos de pago» editor is already gone from main — the read-only half of F-3 resolved
    itself in Track A's teardown. **Still to do:** a contrato field (needs a column).
- **Amended 2026-09-17 (ADR-058 §3, §5):** **two tabs — Personas and Nómina.** Asistencia is cut.
  Nómina is a read-only grouping; no "Registrar nómina".
- **Steps:** Title "Empleados" / "Quién trabaja contigo y cuánto le pagas". Header chip "Nómina de la
  semana por pagar" **derived** as expected (sum of salaries) versus recorded (nómina-category
  gastos) — it must agree with the rows, not contradict them. Personas: CRUD on `employees` (nombre,
  puesto, salario, periodo as option cards Semanal/Quincenal-default/Mensual, contrato), table with
  avatar, contrato pill, ingreso, "Acceso a la app", sueldo semanal, estado pill; writes append
  `sync_log` (the phone's Gastos → Nómina reads this list). Nómina: periods **newest first with the
  pending run leading**, `--yellow-soft` row tint; columns Periodo, Empleados, Registrado por, Total
  (`--red-text`), Estado; a footer noting each payment is also a gasto, linking to P-09.
- **Acceptance:** create → visible on device after pull; the header chip equals the pending row;
  four states.

### P-05 Operadores

> **Stray from an earlier reorganisation (2026-09-22 audit):** the Steps and Acceptance lines
> below belong to **P-13 Inicio** (done, see its section); P-05's own status is the `- [~]` line
> further down. Kept because P-13's section does not carry these Steps anywhere else.

- **Steps:** port `DirectorHome` intent, not code (reference: `archive/ui-screens/DirectorHome/`, `archive/ui-screens/CajaReportes/compute-report-kpis.ts`): today's ventas/gastos/utilidad tiles, 30-day sparkline (Recharts), caja status per device (open turno?), stock bajo list, cuentas por cobrar placeholder (hidden until Z-01), unresolved rejections banner, onboarding progress if incomplete. Read via `@xangarro/domain` KPI functions where they exist (`packages/domain/src/**/kpi*`).
- **Acceptance:** numbers match P-09 totals for "hoy"; renders at 768 px width without horizontal scroll.

> **Wired to Postgres 2026-09-17.** The container/screen split is real, not
> aspirational: `page.tsx` is an async server component that queries inside
> `withTenant()`, and the screen is a pure component over the result — so Fase 5's
> state-and-role sweep still works from props, and the error state is what renders
> when a read throws.

- [x] Status · **Blocked by:** P-25 · **Blocks:** X-02
  - Verified done by the 2026-09-22 doc audit (evidence, not authorship): `src/app/(portal)/equipo/`, `e2e/operators.spec.ts`, `e2e/permisos.sync.spec.ts`.
  - In progress: 2026-09-17 · `/equipo` serves HTTP 200. One screen with Dispositivos (P-06);
    the sidebar's two entries preselect a tab.
  - Operator cards with a 48 px avatar, turno state pill, two inset stat boxes (Capturó hoy,
    Cobrado hoy) and a device/last-seen footer. Usage counter "2 de 2 operadores" with a bar, and
    "Nuevo operador" **disabled with a tooltip** when full — one of the few places a disabled
    state carries meaning, because the limit is the message.
  - **No role label and no "Escritorio" pill** (ADR-058 §4): the first has nothing left to show
    under a single-role app, the second presumes a desktop client F-02 archived. Permission pills
    and "Editar permisos" render only when `capabilities.permisosPorUsuario` is true.
  - **Done 2026-09-17 (B-13):** «Nuevo operador» (nombre + NIP), «Reiniciar NIP» and «Desactivar»
    per card, the counter counting **active** operators against `PLAN_LIMITS` (no local constant),
    an «Inactivo» pill, and the last-active warning. `e2e/operators.spec.ts` frees a full allowance
    by deactivating, creates into the slot, and checks the bcrypt hash and `sync_log` in Postgres.
  - 2026-09-18 · **NIP masked** (`type=password`, numeric keypad, 4 digits, non-digits dropped) with
    a **confirm field** on create and reset. **Permissions editor:** «Editar permisos» → «Puede
    cancelar ventas», only where `capabilities.permisosPorUsuario` (Xangarrote);
    `CambiarPermisosOperadorUseCase` refuses below that plan and for another business's operator (4
    tests); stored as the JSON phones parse (`UserPatch.permissions`, SQLite and Postgres repos), and
    logged. e2e: mismatch refused and field masked; on a throwaway Xangarrote tenant the permission
    saves and is logged; absent on Xangarro.
  - 2026-09-18 · **Operator drawer**: «Ver detalle» shows their last five shifts on the business
    clock — «Turno abierto», or when it closed and whether the count cuadró, sobró or faltó
    (`turnosDeOperador`, DB test). Any member may look. e2e on a throwaway tenant.
- **Amended 2026-09-17 (ADR-058 §4):** no role label, no "Escritorio" state pill; **permissions are
  kept** and gated by `capabilities.permisosPorUsuario`.
- **Amended 2026-09-17 (ADR-072):** the NIP is **exactly four digits**, set and reset only here; where
  the steps below say "PIN 4–6", read "NIP, 4 digits".
- **Steps:** Operator cards (`minmax(360px, 1fr)`): 48×48 circular avatar, name, state pill (Turno
  abierto `--green-soft` / Turno cerrado `--gray-100` / Sin vincular `--warning-soft`), two inset
  stat boxes (Capturó hoy, Cobró hoy), footer with device and last-seen. Usage counter "2 de 2
  operadores" with a bar; "Nuevo operador" disabled when full with the upsell link. Explainer card:
  "Tus operadores entran a la app con su nombre y su PIN. No necesitan correo." Create dialog
  (nombre, PIN 4–6 digits masked, confirm). Drawer: fields, recent shifts, **permission pills and
  "Editar permisos"** — `canCancelSales` is the v1 permission; hidden entirely when the plan lacks
  the capability. No email field anywhere.
- **Acceptance:** server-action tests via B-13; Playwright — create → appears; limit reached → button
  disabled with tooltip; viewer read-only; permissions editor absent below Xangarrote.

  > **Stray from an earlier reorganisation (2026-09-22 audit):** the Steps and Acceptance lines
  > below belong to **P-14 Estados financieros** (done, see its section); P-06's own status is the
  > `- [~]` line further down.

- **Steps:** (the archived app UI in `archive/ui-screens/Estados/` holds `health-verdicts.ts` and `estado-resultados-mappers.ts` — port their logic into `@xangarro/domain` rather than rewriting it) period picker (mes/trimestre/año/custom); NIF B-3 Estado de Resultados, B-6 Balance, B-2 Flujo de Efectivo computed with the **existing** `@xangarro/domain` functions used by `packages/ui/src/screens/Estados` (locate them; do not reimplement); print stylesheet; "Exportar Excel" (all plans). "Informe mensual PDF" button visible but gated to Pro → Z-06.
- **Acceptance:** a fixture business (seed) produces the same numbers as the domain unit tests' expectations; print preview is one page per statement.

### P-06 Dispositivos

> **Amended 2026-09-17 by Track N:** the pairing panel also shows a QR / https app link (N-25, C-14).

> **Wired to Postgres 2026-09-17.** The container/screen split is real, not
> aspirational: `page.tsx` is an async server component that queries inside
> `withTenant()`, and the screen is a pure component over the result — so Fase 5's
> state-and-role sweep still works from props, and the error state is what renders
> when a read throws.

- [x] Status · **Blocked by:** P-25 · **Blocks:** X-02
  - Done: 2026-09-23 · «Mostrar QR» on the pairing panel (`equipo/pairing-qr.tsx`, action `server/actions/pairing-qr.ts`): mints a 15-minute token on the live code, renders the QR as an SVG data URI on the server (no third-party QR service sees the link), with «Copiar enlace» and «Compartir por WhatsApp»; a new code hides the old QR, since it dies with its code. `/activar` is the public, `noindex`, `no-referrer` landing for anyone who opens the link without the app, and it redeems nothing. e2e: `devices.spec.ts` «Mostrar QR pairs a phone by the scan path, once» (200 then 409, the shared link never contains the typed code) — the whole file green locally against a seeded database. The panel, drawer and revoke button had shipped (9e7c90c1, 1183aa40).
  - 2026-09-22 doc audit: shipped except the QR / app-link pairing panel (N-25, blocked on C-14).
  - In progress: 2026-09-17 · the Dispositivos tab of `/equipo`.
  - Device cards with platform label, model, operator, last sync and a pending-count pill. The
    **pairing panel** on flat yellow renders the eight-character code in 44×56 white boxes with
    the expiry countdown, "Generar otro" and "Enviar por correo". The fixture code is `K7M3DQ9P`
    — no `0`, `O`, `1` or `I`, per ADR-053 Q5.
  - **Platform is a text label, never an Apple or Android logo** (design handoff).
  - Revoke confirm carries the consequence, not just the question: "Revocar borra el acceso, no
    los datos ya sincronizados."
  - 2026-09-18 · **Slots and drawer.** «X de Y dispositivos» from `PLAN_LIMITS`; when full, the
    pairing panel warns that a new code only works after a revoke (generation stays open: replacing
    a phone is «code first, then revoke», and a refused activation does not burn the code, B-12).
    «Ver detalle» opens the device drawer — platform as text, last sync on the business clock, its
    last five cortes (`cortesDeDispositivo`, 2 DB tests) and «Desvincular» for admins. Revoke was
    already wired to real rows. **Fixed:** the header said «Plan Xangarro» for every tenant; it now
    names the business's plan (`PLAN_NOMBRE`). e2e on a throwaway free-plan tenant.
  - 2026-09-19 · **Done**: an `activation-code` template in packages/email (cross-area,
    coordinated with the owner) and `enviarCodigoPorCorreo` — the panel sends the code that
    is live to whatever address the owner names; sending never mints or burns anything.
    e2e asserts the dev outbox against the panel's own code.

- **Steps:** Device cards with a 44×44 platform tile, name, model, state pill, Operador, Última
  sincronización, Turno, and a `--warning-soft` strip "{n} registros esperando conexión" when queued.
  Slot counter. **Pairing panel** on flat `--yellow` (owner/admin): "Código de vinculación activo",
  the expiry countdown, the code in `44×56` white boxes (`2.5px`, `radius 12`, `3px 3px 0`,
  26px/800), "Copiar", "Enviar por correo a…" (B-14), and a dark "Generar otro". Codes never contain
  `0`, `O`, `1` or `I`. Revoke confirm (destructive): "Revocar borra el acceso, no los datos ya
  sincronizados." Drawer: fields, recent cortes, "Desvincular". **Use Lucide-style outline glyphs
  plus a plain text platform label — never Apple or Android logos.**
- **Acceptance:** Playwright — issue code → visible and emailed (Inbucket); revoke → status revoked;
  a seeded activation (B-04) appears in the list.

### P-11 Sincronización

> **Wired to Postgres 2026-09-17.** The container/screen split is real, not
> aspirational: `page.tsx` is an async server component that queries inside
> `withTenant()`, and the screen is a pure component over the result — so Fase 5's
> state-and-role sweep still works from props, and the error state is what renders
> when a read throws.

- [x] Status · **Blocked by:** P-25 · **Blocks:** X-02
  - Verified done by the 2026-09-22 doc audit (evidence, not authorship): `src/app/(portal)/sincronizacion/`, `packages/data-pg/tests/historial-sync.integration.test.ts`.
  - In progress: 2026-09-17 · `/sincronizacion` serves HTTP 200.
  - Pending banner ("Están guardados en el Android de la barra. **Nada se pierde.**"), a three-tile
    Resumen, per-device cards, and the "Registros no enviados" table with "Marcar como resuelto".
    Empty state is the celebratory green "Todo sincronizado".
  - **The four mode cards are gone, and verified gone**: the rendered HTML contains no "Solo este
    dispositivo" and no "Conflictos" (ADR-058 §1). "Sincronizar ahora" is owner-only.
  - Motivos are **human sentences, never codes** — "El producto de este registro ya no existe en
    el portal." In production they come from `ERROR_CATALOG`.
  - 2026-09-18 · **Historial** (derived — `historialSync` groups accepted pushes, refused rows and
    portal changes per device per minute, 3 DB tests) as sentences on the business's clock.
    **«Marcar como resuelto» is saved** (`resolved_at`, admin+, hidden for Solo lectura) — it used to
    only hide the row in local state. Rows name their device (not its id), and motivos come from
    the contract's `ERROR_CATALOG` keys (`lib/sync-motivos.ts`; a test fails if a per-row code has no
    sentence). Device cards say «Con registros rechazados» when they have any. `formatFechaHora` in
    the domain. e2e on a throwaway tenant.
  - **Still to do:** real rejection rows at B-08.
- **Amended 2026-09-17 (ADR-058 §1):** **the four mode cards are removed**, along with the
  mode-derived suppression logic and the "Conflictos por resolver" tile. Read-only sync health.
- **Steps:** Title "Sincronización" / "Qué falta por enviar". Pending banner (`--warning-soft`):
  "{n} registros esperan conexión." / "Están guardados en el {dispositivo}. Nada se pierde."
  Resumen: Registros enviados hoy, Pendientes por enviar, Dispositivos conectados. Per-device cards
  (last push, last pull, last seen). **Registros no enviados** table: Tipo de registro, Dispositivo,
  Motivo (**human text from `ERROR_CATALOG`, not a code**), Vista previa, Recibido, and "Marcar como
  resuelto" (sets `resolved_at`). Historial of sync events. Empty state is celebratory and green:
  "Todo sincronizado. No hay registros pendientes." A global banner on Inicio when unresolved > 0.
- **Acceptance:** seed a rejection → appears; resolve → disappears; message text comes from the
  catalogue (unit test); no mode selector exists anywhere in the built output.

### P-08 Negocio

> **Wired to Postgres 2026-09-17.** The container/screen split is real, not
> aspirational: `page.tsx` is an async server component that queries inside
> `withTenant()`, and the screen is a pure component over the result — so Fase 5's
> state-and-role sweep still works from props, and the error state is what renders
> when a read throws.

- [x] Status · **Blocked by:** P-25 · **Blocks:** —
  - Verified done by the 2026-09-22 doc audit (evidence, not authorship): `src/app/(portal)/negocio/`, `e2e/negocio.sync.spec.ts`.
  - 2026-09-17 · "Editar datos" works, owner-only on the server as well as the screen, appending `sync_log` (`businesses` is DOWN).
  - In progress: 2026-09-17 · `/negocio` serves HTTP 200.
  - Four section cards with their icon tiles — Datos generales (yellow), Datos fiscales (blue),
    Contacto y comprobantes (peach), Preferencias (purple) — in read mode.
  - **An unfilled value renders "Falta por completar" in amber, not blank**: it is a thing to do,
    not an absence. The incomplete banner is derived from the same data, so it cannot claim a gap
    the fields do not show.
  - "Editar datos" is owner-only. Verified in the rendered HTML.
  - 2026-09-18 · **Datos fiscales** (README Q15): RFC, razón social, código postal and uso de CFDI —
    nullable columns on the DOWN `businesses` table (SQLite migration 0001, Postgres 0012, old→new
    tests on both; drift green), edited owner-only in «Editar datos fiscales» and pulled by every
    phone. Validation is `@xangarro/domain/fiscal` — moved out of the CFDI module so both use one
    copy — and now includes the **RFC check digit** (SAT's test RFCs pass; a one-character typo
    fails). Uso defaults to G03; a D-uso on a persona moral warns, it doesn't block. e2e: a typo is
    refused, a valid RFC saves and reaches the phone, the contador cannot edit.
  - 2026-09-18 · **Régimen by SAT code (ADR-082).** `regimen_sat` (SQLite 0002, Postgres 0013,
    backfilled from the bucket, old→new tests on both) is the source of truth; `regimen_fiscal` is
    derived by `regimenPatch()` so older phones keep their ISR bucket. «Editar datos» picks the code
    from option cards and offers the suggested ISR rate behind a switch; «Otro» rows show «Falta por
    completar». e2e: picking 612 reaches the phone as `{regimenSat: '612', regimenFiscal: 'Otro'}`.
  - 2026-09-18 · **Edit mode.** «Editar negocio» turns every card into inputs at once — Datos
    generales (name, régimen cards + suggested-ISR switch), Datos fiscales, **Tipos de pago**
    (switches; the last one on is disabled; Crédito stays a Función) and **Atributos de producto**
    (repeatable rows: name, optional comma-separated choices, obligatorio; key and kind derived by
    `@xangarro/domain/preferencias`) — with one sticky yellow «Cancelar / Guardar cambios» bar.
    `GuardarNegocioUseCase` validates everything and writes **one** patch (one `sync_log` entry); a
    bad field saves nothing. Replaces the two dialogs. e2e: RFC, viewer, régimen, pagos + atributos
    reach the phone, last method locked.
  - 2026-09-18 · **Archive row** (owner): the name typed to confirm; refused while a subscription
    will keep charging (cancel first); then `xangarro.business_archive()` (data-pg 0016) soft-deletes
    the business, revokes its devices and ends every portal session — for the transaction's tenant
    only, never an id passed in — and `memberships_for_user` skips archived businesses, so no
    password or emailed link signs in to it. Reactivation is a support action (clear `deleted_at`).
    Tests: `ArchivarNegocioUseCase` (5), 4 DB integration (only this tenant, sessions end, no
    sign-in, no tenant → refused), e2e on a throwaway tenant.
  - **Still to do:** «Contacto y comprobantes» needs columns first.
- **Steps:** Four section cards (`minmax(420px, 1fr)`), each with a 38×38 icon tile: **Datos
  generales** (`--yellow`), **Datos fiscales** (`--blue-soft`), **Contacto y comprobantes**
  (`--peach-soft`), **Preferencias** (`--purple-soft`). Read mode shows values at 16px/700 and
  renders missing ones as "Falta por completar" in `--warning-text`; edit mode swaps each to a 48 px
  input and shows a sticky yellow bar with "Cancelar" and a dark "Guardar cambios". Incomplete banner
  (`--warning-soft`) stands in for the empty state. Régimen fiscal option cards (RIF 2% / RESICO
  1.25% / Asalariados 25% / Otro 30%) with the ISR-rate confirm dialog. Tipos de pago switches with
  at least one always on. Atributos de producto repeatable rows. **RFC validated with checksum,
  auto-uppercased.** Archive row (owner): "Se archivan tus registros y se desvinculan todos los
  dispositivos. No se borra nada." Writes append `sync_log` for `businesses`. Owner-only editing.
- **Acceptance:** RFC validator tests (persona física, moral, invalid checksum, lowercase
  normalised); save → appears on device pull; admin and viewer cannot edit.

### P-10 Suscripción

- [x] Status · **Blocked by:** P-25, C-11 · **Blocks:** —
  - Verified done by the 2026-09-22 doc audit (evidence, not authorship): `src/app/(portal)/suscripcion/plan-card.tsx`, `e2e/suscripcion.spec.ts`.
  - In progress: 2026-09-17 · `/suscripcion` serves HTTP 200. **C-11 was executed to unblock it.**
  - **The pricing is transcribed verbatim**, not paraphrased: every pitch, price, period, CTA,
    `includesLabel` and feature line comes from `Xangarro Portal - Suscripcion.dc.html`. Verified in
    the rendered HTML — "Para arrancar sin gastar un peso.", "Sin estados financieros NIF", and the
    three plan names.
  - **The current plan is marked and not sold back**: its badge reads "Tu plan actual" and its CTA
    is an inert "Este es tu plan" at 55% opacity; the promoted card falls back to "El más popular"
    when it is not the current one. Xangarro renders as the black emphasis card with the yellow
    shadow.
  - **Only capped allowances draw a bar.** `limits.recordsPerMonth === null` renders
    "340 · sin límite" as text with no bar, because a bar against an unlimited quota misreports it.
    The limits come from `PLAN_LIMITS`, not from a second copy in the portal.
  - The "Asesor en cada plan" block renders as its own section, separate from the plan feature
    lists, exactly as the design does — which is the distinction ADR-059's `capabilities` encodes.
  - 2026-09-18 · **Wired to billing.** The status line comes from the stored Stripe subscription
    (`estadoCopy`: free / trialing / active / past_due with its 7-day grace / lapsed, 4 tests;
    problems render as a warning banner). Owner only: «Administrar pago» and «Cambiar a Xangarrito»
    open the Customer Portal, a plan card's CTA opens Checkout (`iniciarPrueba`), «Cambiar plan»
    jumps to the cards; admins and viewers see no billing buttons. **Consumo was fixture numbers**
    (2 / 340 / 2) — now active operators, linked devices and the metering counter («—» until
    computed). The entitlement debug line names the plan the phones receive and until when. e2e:
    owner view against the seed; a past-due throwaway tenant seen by a viewer.
  - 2026-09-18 · **«Facturas»** replaces the fixture «Comprobantes» and the dropped «Solicitar
    factura» (`factura_requests` is gone — N-33 invoices every payment): each payment with its CFDI
    state from `listarFacturas` (0019). Timbrada → PDF/XML for owner and admin; invoiced by hand →
    «Emitida · UUID …»; En la factura global → «Solicitar factura a mi nombre» when the fiscal data
    is complete (`datosFiscalesCompletos`, the one domain rule), else a link to complete it in
    Negocio; Pendiente → «se enviará a tu correo». e2e on a throwaway tenant with three payments.
- **Amended 2026-09-17 (ADR-059):** plan names and the Asesor block.
- **Steps:** **Tu plan** on flat `--yellow` (name at 44 px, price, "Siguiente cobro", owner-only
  "Cambiar plan" / "Administrar pago"). **Tu consumo este mes** — **only capped allowances render a
  progress bar**; an unlimited quota shows "N · sin límite" with no bar. Three plan cards
  (`minmax(300px, 1fr)`) with the verbatim pitches, prices, CTAs and feature lists; excluded lines
  render with a dash in `--gray-400` and muted text. **Xangarro is the emphasis card**: `--black`
  fill, `--yellow` name, `--white` price, `5px 5px 0 --yellow` shadow, overhanging pill at
  `top: -16px`. **The current plan is badged "Tu plan actual" and must not be sold back** — its CTA
  becomes a non-actionable "Este es tu plan" at 55% opacity, `cursor: default`; when the promoted
  plan is not the current one the badge falls back to "El más popular". Separate **"Asesor en cada
  plan"** block with the three tiers. Método de pago card. Comprobantes table + "Solicitar factura"
  → `billing.factura_requests` (prompting for fiscal data if absent). Pause row → "Cambiar a
  Xangarrito". Empty state: "Todavía no hay cobros". A debug line showing the entitlement the devices
  currently receive.
- **Acceptance:** Playwright with seed — request factura → row pending; a `past_due` Stripe test
  subscription shows the grace copy; the current plan's CTA is inert; owner-only actions hidden for
  admin and viewer.

### P-15 Funciones (in Negocio) — flags and capabilities

- [x] Status · **Blocked by:** P-25, F-06, C-11 · **Blocks:** —
  - Done 2026-09-18: the switches write `businesses.feature_flags` through
    `ToggleFeatureFlagUseCase` — the phone's own rules, now with typed errors and an `allowed` set
    the portal fills with platform ∩ plan, so a dark or unpaid key is refused server-side
    (`FLAG_NOT_ALLOWED`). The write is logged, and activation and pull now send the business's
    stored flags instead of the fixture's. Turning a parent off asks first when the domain's
    cascade would take dependents with it. `e2e/sync.spec.ts` switches Inventario off in the
    portal and sees `stock: false` on the phone's next pull. A new `Switch` primitive (Radix,
    44 px target) — the design has none yet, so it follows the system's border/shadow language.
  - In progress: 2026-09-17 · rendered beneath Negocio, as the design places it.
  - **Two groups, as ADR-059 requires.** "Funciones del negocio" lists the seven
    `FEATURE_FLAG_KEYS` with the three columns «Disponible · En tu plan · Activada», each resolved
    from the domain — `PLATFORM_AVAILABLE`, `PLAN_LIMITS[plan].features`, `DEFAULT_FEATURE_FLAGS`
    — not restated in the portal. A key that is dark on the platform reads "Próximamente" and has
    no switch.
  - "Tu plan incluye" lists the plan `capabilities` **without switches**, because a tenant cannot
    toggle them. That is the distinction the whole `capabilities` structure exists to express.
- **Amended 2026-09-17 (ADR-059):** renders **two** groups.
- **Steps:** **Funciones del negocio** — the seven `FEATURE_FLAG_KEYS` with the three columns
  «Disponible · En tu plan · Activada», the switch editable only when the first two are true,
  "Próximamente" for platform-unavailable keys, and the cascade warning when a parent is turned off
  ("Los datos se conservarán pero no serán visibles. ¿Continuar?"). Writes `businesses.feature_flags`
  - `sync_log`. **Tu plan incluye** — a read-only list of `capabilities` (estados financieros,
    informe mensual, permisos por usuario, nivel de Asesor) with no switch, because a tenant cannot
    toggle them.
- **Acceptance:** toggling `stock` off reaches the device on the next pull; a platform-unavailable
  key cannot be toggled in the UI and is rejected server-side; capabilities render without switches.

---

## Fase 6 — Asesor

**Compuerta:** no conclusion appears without sufficient data — locked capabilities show progress,
never invented text.

### P-26 Asesor shell, "Para ti" feed, capacidades panel

> **Wired to Postgres 2026-09-17.** The container/screen split is real, not
> aspirational: `page.tsx` is an async server component that queries inside
> `withTenant()`, and the screen is a pure component over the result — so Fase 5's
> state-and-role sweep still works from props, and the error state is what renders
> when a read throws.

- [x] Status · **Blocked by:** P-25, P-31 · **Blocks:** P-27, P-28
  - Verified done by the 2026-09-22 doc audit (evidence, not authorship): `src/app/(portal)/asesor/{screen,para-ti}.tsx`, `e2e/asesor.sync.spec.ts`.
  - **Fixed 2026-09-26 — ADR-115, and it was worse than drift.** Reading `calcularCapacidades` against
    the design's `readinessDefs` turned up a live bug in `gastosFueraDeLoNormal`, not just wrong
    strings. The current month was **summed per category** while the baseline averaged **individual
    egreso rows**, so a monthly total was compared against a per-row mean. A business logging a
    category twice a month on perfectly flat spending was told «van 100% arriba» — every month, for
    ever — and ten times a month reads «900% arriba». Its «three months» gate counted **rows**, so
    three egresos inside one April produced a warning whose body claimed «un promedio … en los últimos
    tres». Measured on the seeded tenant at 2026-09-26: «Tus gastos de materia prima van **330%**
    arriba … contra un promedio de **$980.00** en los últimos tres», where the tenant has **two** prior
    months averaging $1,960 — wrong figure, wrong percentage, false «últimos tres». The existing tests
    were blind to it because every fixture logs a category exactly once a month, the one shape where a
    row mean equals a month mean.
  - Both sides are monthly totals now, `MESES_BASE` counts distinct prior months per category, and the
    two panel counts were changed to predict the insights they promise rather than count estate-wide:
    `compras` is the **best single product's** entrada count (`costosQueSubieron` compares a product
    against its own previous entrada) and `mesesConGasto` is the **best single category's** prior
    months, never counting the current one. Inventario reads a new `diasConMovimiento` instead of
    `diasConVenta`, and Pronóstico reads `diasDeHistorial` under the design's own name,
    «¿Me alcanza? (pronóstico) · 90 días de registros». `mesesConGastoDe` was deleted: its only caller
    was its own test, and its semantics were the wrong ones.
  - **`lockedCopy` landed 2026-09-26 — ADR-116**, and it does not repeat the design everywhere. The
    field carries the actionable line beside the count, empty once the capacidad is active so nothing
    stale can render, and the panel shows it under the requirement (`capAccion`). **A date is promised
    only where the calendar alone gets there**, which is `diasDeHistorial`: «Resumen del mes» and
    «¿Me alcanza? (pronóstico)» read «Disponible en N días», and the design's own fixture confirms the
    arithmetic (90 − 67 = «Disponible en 23 días»). Every other counter waits on the shopkeeper, so it
    gets «Llevas X de Y …» instead — including **«Gastos fuera de lo normal», where the design says
    «Disponible en 31 días» and we deliberately do not**: a month only counts once an egreso lands in
    that category, so the calendar alone does not get there and the promise breaks on a quiet month.
    «Precios y márgenes» has two blockers, so the line names the one still standing — «Registra el
    costo de tus productos para activarlo» while `compras < 2`, the días count afterwards, because
    repeating the instruction after the compras have landed is advice already taken.
  - `porCalendario` / `porRegistro` make that distinction structural: a capacidad added later has to
    pick one, so it cannot quietly acquire a date it has not earned.
  - In progress: 2026-09-17 · `/asesor` serves HTTP 200 in dev **and in a production build**.
  - Three tabs. "Para ti" reads `notices` where `source='asesor'`; the capacidades panel shows
    **progress toward the data each capability needs** — "33 de 60 días", "8 de 20 cortes" — never
    invented text. That is the Fase 6 compuerta, and it is visible in the rendered HTML.
  - **The provenance line is correct in both directions**, verified against the production build:
    deterministic output reads "Calculado a partir de tus registros" and **"Generado con IA" never
    appears**. Claiming AI authorship for a SQL result would be as false as the reverse.
  - **Ships live in production**, because every insight here is computed — cost deltas, category
    baselines, staleness windows, duplicate detection (ADR-059).
  - 2026-09-19 · **Done**: five deterministic detectors in `@xangarro/domain/asesor` (cost
    deltas, quincena seasonality, expense anomalies vs the 3-month baseline, stale inventory
    at 45 days, duplicate gastos) materialise **on read** into `notices` (ADR-088): the
    upsert never touches `state`/`resolved_at`, so dismissals survive recomputes and
    vanished insights auto-close as `listo`. The plan's cadence gates the set («semanal»
    keeps the two most urgent); the capacidades panel reports the tenant's real counts;
    Descartar/Listo write through `cerrarAvisoAsesor`. 18 tests + e2e on the seed.

- **Steps:** Three tabs — Para ti / Metas / Diagnóstico. The feed reads `notices` where
  `source='asesor'` (ADR-060): a category tile, icon, title, body and an action link per card.
  **Every insight here is deterministic** — cost deltas, quincena seasonality, expense anomalies
  against a 3-month category baseline, stale inventory at 45 days, duplicate-expense detection —
  computed in SQL plus `@xangarro/domain`, so it ships live in production. **Capacidades panel**
  gated by data volume with progress, never prose: resumen del mes (1 month), precios y márgenes
  (60 days + 2 purchases), inventario (60 days), gastos fuera de lo normal (3 months per category),
  pronóstico (90 days), corte de caja (20 cortes). "Anteriores" list with Listo / Descartado tags.
  Locked-feed rows for tiers below the current cadence. Every generated line carries the **«Asesor»
  marker**; deterministic output must **not** claim AI authorship — use "Calculado a partir de tus
  registros".
- **Acceptance:** each insight has a unit test over fixture data; a business with 33 of 60 days shows
  "33 de 60 días", not a conclusion; four feed states (con avisos / cargando / al día / error).

### P-27 Metas

- [x] Status · **Blocked by:** P-26 · **Blocks:** P-33
  - Verified done by the 2026-09-22 doc audit (evidence, not authorship): `src/app/(portal)/asesor/{metas,wizard}.tsx`, `src/server/metas.ts`, `e2e/asesor-metas.sync.spec.ts`.
  - In progress: 2026-09-17 · the Metas tab.
  - Three-step wizard — qué lograr (Ganar/Vender/Gastar más) → para qué (Comprar/Colchón/Deudas) →
    qué tanto (+10 / +20 / +30%, with the monthly and daily figures) — built on `OptionCards`, so
    Radix supplies the arrow-key navigation and `aria-checked` the prototypes faked.
  - Active goal with the pace verdict and the next-step line, plus the trophy history.
  - **Deterministic arithmetic, so it ships live in production** alongside Para ti.
  - 2026-09-19 · **Done**: the rules live in `@xangarro/domain/metas` (objetivoDe anchors
    ±10/20/30% to the last complete month — down for `gastar`; ritmoDeMeta paces a straight
    line; rachaDe counts consecutive wins; fueraDeRango draws the callout's line),
    `FijarMetaUseCase` / `CerrarMetasVencidasUseCase` orchestrate them over the pg `metas`
    table, and the tab renders its four states — negocio nuevo, the wizard on real figures,
    the running goal with its pace, and the month-end dialog in both variants.
- **Steps:** Three-step wizard — qué lograr (Ganar más / Vender más / Gastar menos) → para qué
  (Comprar algo / Tener un colchón / Pagar deudas) → qué tanto (Un empujón +10% / Un reto +20% /
  Ambicioso +30%, with the computed monthly and daily figures). Out-of-range amounts show the
  `--warning-soft` callout and the CTA becomes "Ajustar monto". Active goal with pace (adelantado /
  al ritmo / atrasado) and a next-step line. Month-end dialog in both variants (lograda → Subir el
  reto / Repetir / Cambiar; al 86% → Repetir / Bajar un nivel / Cambiar). Trophy history. All seven
  states: step1, step2, step3, activa, lograda, sin meta, negocio nuevo. **Deterministic — ships
  live.** `metas` is a portal-only entity (ADR-060).
- **Acceptance:** pace arithmetic unit-tested (1 happy + 3 unhappy); all seven states in Storybook;
  viewer sees no wizard.

### P-28 Diagnóstico + estrategia — **«Próximamente» in production**

- [~] Status · **Blocked by:** P-26, P-30 · **Blocks:** —
  - **Remaining (2026-09-23, verified against the code):** only the tab and both gates exist (`asesor/screen.tsx`); the ten sections, month tiles, price table, estrategia list, six states, printable variant and the prompt-injection fixture are all unbuilt.
  - 2026-09-22 doc audit: shipped except the ten report sections and the price table.
  - In progress: 2026-09-17 · the tab and **both gates** are wired; the report itself is not built.
  - Two gates compose in the right order via `resolveScreenState`: `capabilities.asesor ===
'completo'` renders `locked` with the Xangarrote upsell, and an LLM-backed path with the
    production flag closed renders **«Próximamente»** — which has no call to action, because it is
    not something a customer can unlock.
  - `LLM_ENABLED` is one flag at one boundary: **locally nothing is gated, in production every
    model-backed path is** (ADR-059).
  - **Still to do:** everything behind the gate — the ten report sections, the price-suggestion
    table, the estrategia list, and the six diagnostic states. Needs P-30 and the credential.

  - **2026-09-26 (owner, ADR-109): the Diagnóstico is two reports, not one.** Xangarro gets a
    monthly _short read_ so a shopkeeper tastes what a written reading of their own numbers is
    worth; Xangarrote gets the full report — more metrics, the detail behind them, the estrategia.
    **Deciding what they differ by is now this task's central question, not a detail of it:** a
    taste that reads as a truncated full report sells nothing, and one that is merely shorter
    teaches the reader that the paid version is padding. Also changes here: the gate becomes «not
    `semanal`» (`asesorShowsDiagnostico` is `=== 'completo'` today) and the locked card, which reads
    «El Diagnóstico llega con Xangarrote», belongs to Xangarrito now and should name Xangarro.

  - **2026-09-26 (traced against the design): the design already answers this — and answers it
    twice.** `Xangarro Portal - Asesor.dc.html` carries three independent flags, `diagTeaser`,
    `lockedSections` and `strategyLocked`. Mapping every numbered section to the `sc-if` that wraps
    it gives the split: **1 Tu meta** and **2 Resumen del mes** sit under `diagReport`, so both tiers
    read them; **3 Precios y márgenes, 4 ¿Me alcanza?, 5 ¿Cuánto puedo sacar?, 6 Inventario,
    7 Cobranza, 8 Gastos fuera de lo normal** and **9 Corte de caja** sit under `diagFull`; and
    **10 Plan de acción** sits under `diagReport` with only its three-movimiento `strategy` list
    gated by `strategyLocked`. So the shape is: two sections both tiers read, seven the full report
    adds, and a section 10 whose heading both see and whose answers only Xangarrote does.
    `diagTeaser` was drawn for a paid tier that is not Xangarrote — which under ADR-059 did not
    exist, and under ADR-109 is exactly Xangarro.
  - **Settled 2026-09-26 (owner) — ADR-112. The split is this table, and it is the spec.**

    | §   | Sección                   | Xangarro (la probada)                          | Xangarrote (completo) |
    | --- | ------------------------- | ---------------------------------------------- | --------------------- |
    | 1   | Tu meta                   | real                                           | real                  |
    | 2   | Resumen del mes           | real                                           | real                  |
    | 3   | Precios y márgenes        | teaser                                         | real                  |
    | 4   | ¿Me alcanza?              | teaser                                         | real                  |
    | 5   | ¿Cuánto puedo sacar?      | teaser                                         | real                  |
    | 6   | Inventario                | teaser                                         | real                  |
    | 7   | Cobranza                  | **real**                                       | real                  |
    | 8   | Gastos fuera de lo normal | teaser                                         | real                  |
    | 9   | Corte de caja             | teaser                                         | real                  |
    | 10  | Plan de acción            | **the first movimiento, with its peso impact** | all three             |

    So `lockedSections` keeps its six entries — 3, 4, 5, 6, 8, 9 — and **`diagFull` loses Cobranza**,
    which the design's own teaser array already implied by not having a card for it. The two halves
    of the design disagreed by exactly that one section; the array won, because it is deliberate
    per-section copywriting while the `diagFull` wrapper is markup repeated verbatim across 3–9.

  - **Section 10 is truncated, not locked — and it needs a flag the design does not have.**
    `strategyLocked` (`plan !== 'pro'`) is **not** this: its single use sits inside the **Metas** tab,
    guarding «Estrategia personalizada — Disponible en Xangarrote». Section 10 and its `plan` list sit
    under `isDiag > diagReport` with **no tier gate at all**, so as drawn both tiers read all three
    movimientos. The owner's decision narrows that: Xangarro reads **movimiento 1 in full, with its
    pesos**, then «los otros dos llegan con Xangarrote». A full plan on both tiers leaves the
    Diagnóstico nothing to sell, and an empty section 10 removes the one thing that proves a written
    reading is worth paying for — being told _what to do_. So P-28 introduces a **`planTruncado`**
    flag for the Diagnóstico; `strategyLocked` keeps the Metas tab and is not reused here.
  - **Which movimiento Xangarro reads now matters, and the design does not order them.** Its own
    fixture runs `+$3,100.00`, `+$1,450.00`, `+$6,300.00` — the largest is **third**. Showing «the
    first» out of an unordered list would hand a Xangarro shopkeeper the $1,450 move as its taste of
    what the paid report is worth, which sells the opposite of the intent. **So P-28 orders section
    10 by impact, descending**, and «movimiento 1» then means the best of the three by construction.
    This was free before the truncation and is load-bearing after it.
  - **Settled 2026-09-26 (owner) — the second axis: tier withholds visibly, maturity withholds
    silently.** `calcularCapacidades` (P-26, built) gates six capabilities on data volume, and they
    map onto the sections: **2** wants 30 días de registros, **3** 60 días de ventas + 2 compras,
    **6** 60 días de ventas, **8** 3 meses con gastos, **4** and **5** 90 días de ventas
    (Pronóstico), and **9** 20 cortes de día. So a section can be withheld for two unrelated reasons,
    and the two behave differently:
    - **Not in your plan → the teaser card.** Visible, named, with the real finding and «Disponible
      en Xangarrote».
    - **Data not ready → the section is not rendered at all.** No padlock, no progress bar, no
      mention. The report ends with **one aggregate line** — «N secciones más se abren solas conforme
      captures → Ver capacidades» — and the per-capability detail stays where it already lives, the
      capacidades panel on «Para ti» (`Capacidades` in `para-ti.tsx`, rendered from
      `data.capacidades`).

    The rule behind the asymmetry: **a tier gate is actionable right now** (upgrade), so it earns
    space; **a maturity gate resolves itself** by doing what the shopkeeper is already doing, so it
    earns a line. Rendering both as padlocks is how a 31-day Xangarro ends up reading four real
    sections behind six locks — the same failure ADR-112 just removed for tiers, re-introduced
    through the other axis.

  - **Maturity is checked first, and the reason is stronger than «don't upsell what they bought».**
    The teaser cards carry **real computed findings** — «Detectamos 3 productos con margen en
    riesgo», «4 insumos se acaban antes de la quincena», «3 faltantes del mes tienen un patrón». If
    that section's capability is locked, **the finding does not exist**, so showing the tier teaser to
    an immature business would invent a conclusion, which P-26 forbids outright. Maturity-first is the
    only ordering that cannot fabricate. A pleasant consequence: the Xangarro teasers get sharper as
    the business matures, because each one is a true statement about numbers they cannot read.
  - **Section numbers are names, not positions.** A hidden section leaves a gap — a 31-day Xangarro
    reads 1, 2, 7, 10 — and the numbers are **not** re-flowed. «3 · Precios y márgenes» must mean the
    same section every month, or the report stops being comparable across months and P-34's printable
    variant stops being comparable at all. The closing line is what explains the gaps.
  - **The whole-report `diagNotEnough` keeps only its 30-day trigger.** The design already reuses the
    same `readiness` list twice — in the capacidades panel and inside `diagNotEnough` («Necesitamos un
    mes completo de registros para no darte números a medias. Esto es lo que falta:») — so the other
    five capabilities were always meant to be per-section. Extending the whole-report gate to all six
    would make a new business wait for 90 días de ventas and 20 cortes before reading anything.
  - **Settled 2026-09-26 (owner) — ADR-114, section 10 and its empty month.** The movimientos are a
    **selection of the findings, not an independent analysis**: each of the design's three fixture
    entries traces to a section (quesadilla pricing → §3, refrescos → §6, notas de 30 días → §7), and
    P-28's own rule — every figure computed by `@xangarro/domain`, the model never derives a number —
    means `+$3,100.00` must come from a section's computation. So **section 10 needs no maturity rule
    of its own; it inherits from the sections that feed it**, and its empty case splits in two:
    - **Every contributing section absent** → section 10 is `absent` too and joins ADR-113's aggregate
      count. We could not look.
    - **Mature sections, no finding** → section 10 **renders**, with «Este mes no hay nada que
      cambiar» / «Leímos tus números y no encontramos un movimiento que te acerque más a tu meta.
      Sigue como vas.» That is a real result and the reader can get it nowhere else.
  - **The empty card's footer is «Calculado a partir de tus registros», not «Generado con IA».** The
    design hardcodes the latter on section 10, and copying it onto the empty state would be exactly
    what `asesor.css.ts` warns against: «Deterministic output says "Calculado"; only model-written text
    may say "Generado con IA" (ADR-059). Getting this backwards would be a false claim in either
    direction.» The empty card is the _absence_ of model output.
  - **The heading is derived, not the literal «Tres cosas para octubre».** Both the count and the month
    are hardcoded in the design. Count and period both come from the report: «Una cosa para octubre» ·
    «Dos cosas…» · «Tres cosas…».
  - **Xangarro's upsell line inside section 10 is count-aware.** ADR-112 gives Xangarro movimiento 1,
    and the design has **no** upsell markup in section 10 at all, so this is new: 3 findings → «los
    otros dos llegan con Xangarrote», 2 → «el otro llega con Xangarrote», 0 or 1 → **no line**, because
    there is nothing withheld. «Los otros dos» shipped unconditionally becomes a lie the first month a
    business has two findings.
  - **Movimiento 1 may derive from a section Xangarro only sees as a teaser, and that is deliberate.**
    A Xangarro reader can get «Sube la quesadilla a $46.00 y la gringa a $65.00 · +$3,100.00» in full
    while §3 Precios y márgenes stays a teaser card. It is not an inconsistency to be tidied away: a
    concrete, peso-quantified move out of the half they cannot read is the sharpest form the taste
    takes. Combined with the impact-descending sort (ADR-112), Xangarro reads the single most valuable
    conclusion in the report.
  - Two sections have no maturity rule and must not acquire one: **1 Tu meta** (the owner sets it) and
    **7 Cobranza** (fiado balances are current state, not a trend).

- **Context:** ADR-056, ADR-059. LLM-backed, so production renders «Próximamente»; **locally it is
  fully live.**
- **Steps:** The report's ten sections **per the ADR-112 table above** — sections 1, 2 and 7 real on
  both tiers, 3–6 and 8–9 as `lockedSections` teaser cards for Xangarro, and section 10 **truncated**
  rather than locked: `strategyLocked` now means «movimiento 1 with its pesos, then los otros dos
  llegan con Xangarrote», not an empty section. The month tiles and the price-suggestion table
  (Producto · Costo antes → ahora · Precio actual · Margen · Precio sugerido, margin cells tinted by
  band) belong to **section 3**, so they are Xangarrote-only and Xangarro sees that section's teaser.
  The **month tiles are section 2's**, not section 3's, so they are real on both tiers.
  Six states: report, generating, notenough, free offer, teaser, error — plus the **per-section**
  three-way noted above, which the design has no state for yet. The printable variant feeds P-34. **Every figure
  is computed by `@xangarro/domain` and passed to the model; the model never derives a number.**
  Footer: «Generado con IA a partir de tus registros».
- **Acceptance:** with the production flag on, the tab renders «Próximamente» and no model call is
  made; locally the report renders from fixtures; a prompt-injection fixture (a product named with
  instruction text) does not alter the output structure.

### P-29 Catálogo desde una foto — **«Próximamente» in production**

> **2026-09-26 (ADR-110): the only unbounded model call left.** After P-38 went deterministic and
> P-39 moved to the monthly run, this is the one user-triggered model call in the product, and it
> is vision, which is the expensive kind. The owner's first shape: one catalogue import per new
> business, about five attempts, a byte ceiling and a cap on images — numbers still to set. It does
> not need a bespoke limiter: N-07 already counts metered resources per business
> (`usage_counters`, the metering role, the over-limit notices), so an import is a counted resource
> like any other.
>
> **Settled 2026-09-26 (owner).** A **one-time onboarding import per business**, with up to **5
> extraction attempts** to get a usable photo — it is an accelerator for «start with your catalogue
> already in», not a recurring tool; a shopkeeper adding one product later uses the normal form.
> **8 MB per image, 5 images per import**, and the images are **downscaled server-side to the
> model's working resolution before the call**. The generous byte cap costs nothing because the
> bytes that reach the model are the resized ones, and P-07's 2 MB spreadsheet limit would have
> rejected a normal phone photo — meeting an error before the feature ever works is the worst first
> experience this can give. Still to decide: where the per-business count lives (`usage_counters`
> needs a new counted metric; `assisted_imports` is the staff flow, not this one).

- [ ] Status · **Blocked by:** P-07, P-30 · **Blocks:** —
- **Steps:** Upload → vision extraction → the **same dry-run preview table as P-07's Excel import**
  (Nuevo / Actualizar / Error) → commit. Structured output (`strict: true` or
  `output_config.format`) validating against the domain `Producto` schema — extracted rows are never
  accepted as prose. Not batched: a person is waiting, so this is a normal streaming call.
- **Acceptance:** fixture photographs produce schema-valid rows; a photograph with no products
  produces the error state, not an empty commit; production renders «Próximamente».

### P-30 Asesor generation runtime

- [~] Status · **Blocked by:** — · **Blocks:** P-28, P-29
  - **Remaining (2026-09-26):** the **model call**, and only that. The fan-out landed — see below. The `notices` line in an earlier Remaining was already stale when it was written: ADR-088's materialise-on-read has written `source='asesor'` rows since `loadAsesorPage`.
    - **Model call.** ADR-056 makes it the last step, prompted from the deterministic figures. Held until **P-28**: the Diagnóstico is `<p>Reporte completo del mes.</p>` behind two gates, so generated prose would land in a table no screen reads. The boundary stays the single module ADR-056 requires (`server/asesor/model.ts`) and `runtime.ts` names the seam. The Batches API and prompt caching ride with it — batching needs a ledger to collect results, which is its own table.
  - 2026-09-26 · **The daily fan-out landed, and it needed no migration.** The open question was which role may enumerate tenants, between a new privileged function, the metering role, and the console's service role. **The metering role wins, and the answer was already in the schema:** 0010 grants `xangarro_metering` `SELECT (id, deleted_at) ON public.businesses` beside a `metering_read USING (true)` policy, because `usage_counts(NULL, …)` enumerates the very same set in order to count it. So `liveBusinessIds` reads two already-granted columns — **no migration, no new role, no new secret**, and the portal already holds `METERING_DATABASE_URL` for the nightly recompute. The service role was never eligible: CLAUDE.md §3 makes the backoffice the only project that may hold it, so reaching for it would have moved either the key or the cron. This also un-blocks P-30 from B-02/B-03, which it was only waiting on for that decision.
    - `server/asesor/fanout.ts` sweeps every live business **sequentially**, like the usage recompute — `generarParaNegocio` opens three transactions per business and a serverless pool is small. Per-tenant try/catch: one tenant failing is reported under its own id, tallied in `fallidos`, and the sweep continues to the next, because a scheduled job that 500s on the first bad tenant hides every tenant behind it.
    - **Universal and unfiltered, per ADR-109 §1** — no tier gate and no activity gate. Both belong to the _monthly_ Diagnóstico, which is the only part that costs money and has nowhere to be stored until P-28.
    - **The deadline is explicit.** The sweep stops starting tenants at 240 s (inside Vercel's 300 s) and returns `restantes`, reported as an error so a sweep that outgrew one invocation is loud rather than truncated in silence. It is a freshness bound, not a correctness one: `loadAsesorPage` materialises the same pipeline on read (ADR-088), so a tenant the deadline cut off still sees correct insights the moment it opens the page. **The fix when `restantes` first goes non-zero is sharding by id range** (`?shard=0/4`), which needs no new state because the enumeration is ordered by id.
    - **`GET /api/cron/asesor` is the scheduled fan-out**; `POST` with `{"businessId"}` stays the on-demand unit of work. The GET is what finally allows a `vercel.json` entry — the old note («could not be, since the unit of work is a POST with a body and Vercel Cron sends neither») was right about the POST and wrong to conclude there could be no entry. Added: `0 8 * * *`, 02:00 in Mexico City, an hour ahead of the usage recompute.
    - Tests: 6 hermetic (`apps/web/tests/asesor-fanout.test.ts` — the sweep, one tenant failing while the rest continue, a non-Error throw, the deadline, an empty estate, a failure to enumerate failing the whole run) and 3 against real Postgres (`packages/data-pg/tests/asesor-fanout.integration.test.ts` — the metering role sees every live business with no tenant claim, a soft-deleted one is not live, and **the app role running the same SQL sees only its own row**, which is why the fan-out could not be built on the tenant connection).
  - 2026-09-24 · **One business, on demand** (`ab519eb7`). `server/asesor/runtime.ts` composes the deterministic half in ADR-056's order — entitlement → cadencia → `calcularInsights` → `filtrarPorCadencia` → `materializarInsights` — and is idempotent by construction. `server/asesor/invocacion.ts` is the HTTP contract, split from the route so it tests without Next and without a database; `cron.ts` gained `cronAuth`/`cronRefusal` so it shares the guard with the three `handleCron` routes while answering 400 for a nameless request. `POST /api/cron/asesor`. **Verified against a real database and a real Next runtime:** the seeded tenant answered `{"ok":true,"cadencia":"diario","materializados":1,"cerrados":0}`, its asesor `notices` went 1 → 2, a second call left them at 2, a wrong secret got 401, an empty body 400, and an unknown business 200 with nothing written. 5 contract tests cover the same paths hermetically.
  - The Acceptance's «deterministic path, 1 happy + 3 unhappy against fixtures, no network» is met where it belongs: 11 tests in `packages/domain/tests/asesor/insights.test.ts` and 5 against real Postgres in `packages/data-pg/tests/asesor-insights.integration.test.ts`.
  - 2026-09-22 doc audit: shipped except the cron entry, the per-business route and the batch API.
  - 2026-09-21 · **The model boundary landed** — the single module ADR-056 requires
    (`server/asesor/model.ts`): env-gated, unset → null → fixtures (CI/fresh clones/
    pre-credential production unchanged), set → an Anthropic SDK client pointed at
    whichever gateway owns the credential. 5 unit tests (null path, half-credential,
    live construction, model-id default + override). **Verified live** through the
    owner's local proxy: seeded-figure prose from `claude-opus-4-6` (ADR-056 names
    opus-5; `ASESOR_LLM_MODEL` bridges until the gateway catches up). Azure AI Foundry
    credentials for Vercel will land in the same two env vars — the owner is obtaining
    them. **Still open:** the cron entry, the one-business-per-invocation route, the
    deterministic-then-model ordering, prompt caching, the batch API.

- **Context:** ADR-056.
- **Steps:** A route handler in `apps/web` invoked by **Vercel Cron** declared in the same
  `vercel.json` as P-01, in `iad1`. **One business per invocation** — the cron entry enqueues, it
  does not loop over tenants. Cadence from `capabilities.asesor` (`semanal` / `diario` / `completo`).
  Writes `notices` rows with `source='asesor'`. The deterministic layer runs first from
  `@xangarro/domain`; the model call is the last step, prompted from those values. Scheduled jobs go
  through the **Message Batches** API (half cost, not latency-sensitive). Prompt caching on the
  stable prefix — brand voice, es-MX register rules, the notice schema, and the "never assert a
  figure you were not given" constraint. `claude-opus-5`, adaptive thinking (`budget_tokens` returns
  400). **Local development runs on recorded fixtures**; a real API key is used only for live calls.
  Treat every tenant string and uploaded image as data, never instruction. One environment flag at
  this module boundary implements the production «Próximamente» gate.
- **Acceptance:** the deterministic path has 1 happy + 3 unhappy paths against fixtures with no
  network; a cron invocation for one business writes the expected notices; the model boundary is a
  single module that can be stubbed in tests.

---

## Fase 7 — Avisos y compartir

**Compuerta:** every row links to its screen, severity always carries an icon as well as colour, and
critical avisos cannot be switched off.

### P-31 `notices` entity, side panel and full page

> **Wired to Postgres 2026-09-17.** The container/screen split is real, not
> aspirational: `page.tsx` is an async server component that queries inside
> `withTenant()`, and the screen is a pure component over the result — so Fase 5's
> state-and-role sweep still works from props, and the error state is what renders
> when a read throws.

- [x] Status · **Blocked by:** P-25 · **Blocks:** P-26, P-32
  - Verified done by the 2026-09-22 doc audit (evidence, not authorship): `packages/data-pg/src/schema/portal.ts` (`notices`), `src/app/(portal)/avisos/`, `e2e/bell.spec.ts`.
  - In progress: 2026-09-17 · `/avisos` serves HTTP 200. The entity shape and the counting rule
    are built; the Postgres table lands at B-02.
  - `Notice` carries `source ∈ sistema | operacion | asesor`, severity, title, body, cta target,
    `state ∈ nuevo | leído | listo | descartado` and a `data` record for per-insight payload —
    **one shape for both surfaces** (ADR-060).
  - **`bellUnreadCount()` is a pure function with 5 tests**, because the rule that keeps the two
    surfaces apart is the thing most likely to drift: the bell counts unread `sistema` and
    `operacion`, and **never an Asesor insight however unread**.
  - Severity always pairs a tone with a glyph — `!`, `△`, `i`, `✓` — so colour never carries the
    meaning alone.
  - 2026-09-18 · **Bell panel and real state.** The bell opens a 400 px drawer with the ten newest
    open avisos (fetched on open, never the Asesor's); «Ver todos» goes to the page. Each aviso's CTA
    navigates to its `cta_href` and marks it read; «Listo» closes it (`resolved_at`). The lifecycle is
    the domain's `transicionAviso` (closed is final, reading twice is harmless; 5 tests); admins
    act, Solo lectura reads. One `AvisoLinea` for the page and the panel. The CTA used to be an inert
    button. e2e on a throwaway tenant: Asesor excluded, Listo, CTA → read, badge follows.
  - **Still to do:** the Postgres `notices` generators (who writes the avisos) at B-02.
- **Context:** ADR-060 — **one** table for Avisos and the Asesor feed. Portal-only entity: follow the
  shortened §11 checklist.
- **Steps:** `notices` in `@xangarro/data-pg` — `source ∈ sistema | operacion | asesor`, severity,
  title, body, cta target, `state ∈ nuevo | leído | listo | descartado`, `data JSONB`, `business_id`
  with RLS. Bell side panel and full page; tabs **Operación** and **Sistema** (the Asesor tab filters
  `source='asesor'` and is P-26's). **The bell counts unread excluding `source='asesor'`.** Severity
  always paired with an icon. Sources: discrepancia en caja, egreso automático, stock bajo, gasto
  recurrente confirmado, cambio de operadores, función activada/desactivada. "Marcar todo como
  leído"; filter Todas / Sin leer. Never synced — `scope.ts` is not touched.
- **Acceptance:** domain entity test; 1 happy + 3 unhappy paths on the state transitions; the bell
  count ignores Asesor rows; four states.

### P-32 Configurar — delivery matrix, and Compartir por WhatsApp

- [x] Status · **Blocked by:** P-31 · **Blocks:** —
  - Done: 2026-09-21 · the matrix persisted (0017) and the Compartir dialog landed in its
    three variants — see the Progress line above. The cobranza variant's per-client trigger
    waits for a portal cobranza surface; the body is built and tested.
  - In progress: 2026-09-17 · the «Configurar» tab renders the three-column delivery matrix.
  - **WhatsApp sits in «Próximamente»** on every row, as the design specifies — it is designed but
    not delivered (design plan §7).
  - **Critical avisos cannot be switched off**: those rows render an "Obligatorio" tag and
    "Siempre activo" instead of a control, rather than a switch that refuses to move.
  - 2026-09-18 · **Channel choices persist**, per member (the matrix is personal, so the contador
    sets theirs too): each switch saves through `CambiarCanalAvisoUseCase` into
    `notice_preferences` (data-pg 0017, tenant RLS). The catalogue, defaults and the
    critical-is-always-on rule live in `@xangarro/domain/avisos`; critical rows show «Obligatorio» /
    «Sí», never a switch, and the server refuses regardless. e2e: a switch survives a reload.
  - 2026-09-21 · **The Compartir dialog landed** in its three variants (diagnóstico,
    cobranza, logro): the message bodies are the design file's own copy built by pure,
    tested builders (`compartir-mensajes.ts`); the send is a **deep link only** (`wa.me`,
    no number — the owner picks the recipient) plus copy-to-clipboard, closing on Escape
    and backdrop. The **logro** trigger rides the celebration with the closed goal's own
    figures; the **diagnóstico** trigger sits beside the «Próximamente» gate (sharing the
    month's real figures is arithmetic, not the model's report) fed by
    `resumenParaCompartir()`; the **cobranza** body exists and is tested — its per-client
    trigger waits for a portal cobranza surface (the Diagnóstico's section 7 is LLM-gated).
    e2e covers both live variants end to end.
- **Steps:** Three-column delivery matrix per notice type; the WhatsApp channel card sits in
  **«Próximamente»** (design plan §7). **Critical avisos cannot be disabled.** The Compartir dialog
  in its three variants (diagnóstico, cobranza, logro), closing on Escape.
- **Acceptance:** toggling a channel persists; critical rows have no switch; the WhatsApp card is
  visibly unavailable.

---

## Fase 8 — Celebración y sellos

**Compuerta:** shown once per achievement, never to Solo lectura, skippable by click, Esc or button.

### P-33 Takeover, sellos, rachas, milestone toasts

- [x] Status · **Blocked by:** P-27 · **Blocks:** —
  - Verified done by the 2026-09-22 doc audit (evidence, not authorship): `src/components/{seal-path.ts,celebration.tsx}`, `tests/seal.test.ts`.
  - In progress: 2026-09-17 · the takeover, the seal and the streak render; wiring to a real
    achievement needs the `metas` table at B-02.
  - **The seal is a polygon stamp, ported from the design's own `sealPath` generator** so the
    geometry matches rather than approximates it — 12 arcs, first vertex at the top, deterministic.
    Four tests pin it. It lives in a `.ts` file separate from the component, which is also what
    makes it testable without a JSX transform.
  - Takeover on Radix Dialog: dismissible by **click, Escape or button**, auto-closes at 6 s, and
    every animation — the pop and the twelve confetti pieces — is disabled under
    `prefers-reduced-motion`. That is the Fase 8 compuerta.
  - **The streak counts goals met per month, not days with a record.** This is the constraint
    ADR-058 §6 attached when you chose the full Fase 8: a streak on "days you recorded something"
    rewards recording something, which corrupts the data the product exists to keep true. A streak
    on goals met cannot be farmed, because the goal is measured from ventas that already happened.
    The reasoning is in the component's docblock so it survives a future refactor.
  - 2026-09-19 · **Done**: a goal achieved closes lazily on load and takes the takeover
    exactly once — the `celebraciones` marker (0020) is written the moment it renders
    (ADR-087), so no reload or other device sees it again; a viewer never sees the wizard
    or the takeover (call-site check). e2e covers the celebration and its once-ness.
- **Context:** ADR-058 §6 — this supersedes the design system's "no gamification, no streaks" rule.
- **Steps:** Goal-achieved takeover with the confetti (10 pieces, `xg-fall`, staggered 90 ms) and a
  6 s auto-close; the seal set by type and level, drawn with the polygon `sealPath()` so it reads as
  a stamp, not a trophy; milestone toast; rachas. **The streak metric must not be protectable by
  junk entry — measure goals met per month, not days with a record** (ADR-058). Honour
  `prefers-reduced-motion`; never render for `viewer`; shown once per achievement and dismissible by
  click, Escape or button.
- **Acceptance:** Playwright — a second visit after an achievement shows nothing; viewer never sees
  it; Escape closes it; with reduced motion the takeover appears without animation.

---

## Fase 9 — Impresión, exportes y cierre

**Compuerta:** the PDF prints without browser chrome and with the same visual rhythm as the screen.

### P-16 Responsive + accessibility pass

- [x] Status · **Blocked by:** P-05…P-14, P-26…P-33 · **Blocks:** P-17
  - Done: 2026-09-17 · The remaining item — "re-running once the screens read real data" — is done. The suite had been sweeping eleven error cards (no `DATABASE_URL` reached the server); it now refuses to run without a seeded database, and per-route sentinels gate both a11y tests. Zero serious/critical violations over data-bearing DOM across three viewports; no ratchet baseline was needed.
  - In progress: 2026-09-17 · **79 Playwright tests pass across desktop (1440), laptop (1024) and
    tablet (768), zero failures.** `pnpm --filter @xangarro/web test:e2e`.
  - `@axe-core/playwright` over WCAG 2.0/2.1 A and AA on all eleven product routes: **zero serious
    or critical violations.** Plus a no-horizontal-scroll assertion per route per viewport, the
    shell-does-not-move check (Fase 2's compuerta), the active-nav assertion, the
    sidebar/header one-line check, the sync-pill truth check, and the 44 px target sweep.
  - **It found four real defects, all now fixed**, which is the point of running it:
  - (a) **14 critical `aria-valid-attr-value` violations across every screen.** `SegmentedTabs` was
    Radix `Tabs.List`, but the screens render their panels further down the page — after the KPI
    row and the filter bar — so Radix emitted `aria-controls` at a `Tabs.Content` that never
    existed. It is not a tab widget; it switches a view. Rewritten as `aria-pressed` buttons in a
    labelled group. Honest ARIA beats borrowed ARIA, and it drops a dependency.
  - (b) **`greenText` on the yellow hero measures 3.58:1**, below AA. The `*Text` tokens are
    contrast-verified against white, offwhite, gray100 and their own `*Soft` ground — **never
    against `yellow`**, which nothing had checked until now. `Verdict` gained an `onYellow` form
    where the dot carries the colour and the text stays black. That is also what the design draws:
    "a green-dot line".
  - (c) `UsageBar` rendered `role="progressbar"` with no accessible name. `label` is now required,
    so it cannot be omitted again.
  - (d) The horizontally scrolling table region was unreachable by keyboard; it now takes focus.
  - **One design-versus-accessibility conflict, resolved without choosing:** the handoff draws the
    header avatar at 34×34, while condition 8 of the réplica demands 44 px targets. The **mark**
    stays 34 px and the **button** is padded to 44 px — nothing moves visually and a thumb can
    reach it.
  - **Still to do:** wiring `test:e2e` into the F-08 CI workflow, and re-running once the screens
    read real data.
- **Steps:** Every screen at 768 px and 1024 px; the sidebar rail engaging below 1024; tables
  scrolling **inside their card**, never the page; keyboard navigation with the specified focus ring
  (`3px --yellow` + `inset 0 0 0 2px --black`, inverted on yellow); a visible label on every input;
  contrast ≥ 4.5:1 for text and ≥ 3:1 for large text and UI boundaries; 44 px touch targets on
  tablet; severity never conveyed by colour alone. `pnpm lint:design` clean.
- **Acceptance:** `@axe-core/playwright` reports zero serious or critical findings on every route;
  no route scrolls horizontally at 768 px.

### P-17 Portal smoke E2E (Playwright)

- [x] Status · **Blocked by:** P-03…P-07, P-11, P-16 · **Blocks:** X-02
  - Verified done by the 2026-09-22 doc audit (evidence, not authorship): `e2e/smoke.sync.spec.ts` and the `portal-e2e` CI job.
  - 2026-09-17 · The `portal-e2e` CI job exists and runs the full suite (170 tests) against a seeded Postgres — against a plain Postgres + compat layer, not "local Supabase" as written above.
  - 2026-09-19 · **Done**: `e2e/smoke.sync.spec.ts` runs the named flow end to end — free
    signup → wizard → operator → 3-product import → device code → `/activate` against the
    real endpoint → one pushed sale → Movimientos — through the UI the owner touches, on a
    tenant the run creates.
  - 2026-09-22 · **Hardening — one pool per dev process.** A full local run left the single
    `next-server` holding 97 idle connections to the 100-slot Docker Postgres and global-setup
    failed with "remaining connection slots are reserved". Cause: `next dev --webpack` evaluates
    `server/db.ts` once per route bundle / RSC layer, and its module-level cache is per
    evaluation, so each got its own 5-connection pool. The handle now lives on
    `globalThis.__xangarroDb` outside production (module cache kept in production, pool size
    unchanged); `tests/db-singleton.test.ts` proves a fresh module evaluation reuses it.
  - 2026-09-23 · **Hardening — the seeded tenant stops being a free-for-all** (ADR-103). Four
    consecutive full runs on a fresh database failed in four different files, each of which passed
    alone: the specs that rewrite Taquería Don Pedro were racing the specs that read it, and
    `test.skip(project !== 'desktop')` had never addressed that. A test that writes the seeded
    tenant now carries `@serial` and runs in the `serial` project (`workers: 1`) after the three
    viewports, with `operador` and `sync` behind it; a Postgres trigger refuses every write to that
    tenant while the viewports run, so an untagged write fails naming the table instead of
    poisoning a sibling. `chaos-3` puts the business name back, and `write.spec.ts` un-reads the
    avisos it marks, so a second run against the same database asserts what the first did.
  - 2026-09-23 · **Hardening — the other half of the flakiness was hydration.** With the data races
    gone, unrelated specs still failed a run at a time for one reason: `goto` resolves on `load`, and
    React attaches after it. A click in that gap is dropped (the control is visible, enabled, even
    focused, and nothing is listening) and a `fill` is worse — it writes the DOM, the state behind it
    stays empty, and the re-render puts the empty value back, so the save stored nothing and the
    screen asked for a field the test had typed. Every navigation now waits for
    `next-route-announcer`, the App Router's own client-side element (P-35's `e2e/test.ts`, which
    every spec already imports); `e2e/interact.ts` retries the interaction itself for what the gate
    cannot cover — a page Suspense resolving later, a spec's own `context.newPage()` — as
    `clickUntil` and `filled`. Two long tests also say what they are: the four-scene login animation
    is `test.slow()` (it watches 20 s inside a 30 s budget), and Equipo's cortes list waits for its
    server action rather than the default five seconds.
  - 2026-09-23 · **The `sync` project had been dark.** It only runs after the viewport projects, and
    a failure there skips it — so six of its specs had drifted from the app unnoticed, and the same
    six fail on the previous commit: `smoke` never accepted the privacy consent the signup now
    requires; `estados` counted `.recharts-bar-rectangle` in charts C-13 redrew as SVG, and named
    donuts that were retitled; `captura` and `ventas` read «the newest ticket» and «folio 2» out of a
    seed that grew a 212-ticket ledger (a pushed row carries the device's pinned clock, so it is
    never the newest); `asesor` wrote down $645.00 of May ventas; `comprobantes` typed into a
    controlled form that a revalidation could reset before the save. All six now assert the same
    claims against what the app actually does — which also unblocks P-35's first full measurement,
    taken without the `sync` project because that run could not reach it. **Full suite, three
    consecutive runs on a fresh database: 482 passed, 0 failed.**
- **Steps:** One flow — free signup → onboarding → create operator → import 3 products → issue a
  device code → call `/activate` via the C-10 conformance helper → device appears → push one sale
  via the helper → it appears in Movimientos. Runs against local Supabase and the dev server in CI
  (F-08 job `portal-e2e`, allowed to be slower).
- **Acceptance:** green locally and in CI.

### P-34 Print, PDF and exports

- [x] Status · **Blocked by:** P-14, P-28 · **Blocks:** —
  - Verified done by the 2026-09-22 doc audit (evidence, not authorship): `src/app/api/export/{[dataset],informe-mensual}/route.ts`, `src/styles/global.css.ts` (print), `e2e/imprimir.spec.ts`.
  - 2026-09-17 · Exports: `GET /api/export/<dataset>` returns real .xlsx for ventas, gastos, productos, movimientos and empleados — authenticated, dataset checked against a closed union, RLS-scoped. E2E asserts the `PK` zip magic number.
  - 2026-09-18 · **Print stylesheet**: under `@media print` the sidebar, header, every button and anything marked `data-no-print` drop out, shadows go, black on white — a statement prints as the document. Estados gets «Imprimir» (the period in the URL is what prints). e2e emulates print.
  - 2026-09-19 · **Informe mensual PDF done**: the phone's PDF layout moved to
    `@xangarro/application` beside its use case (ui keeps a re-export shim), the informe's
    rules extract into `construirInforme` so the portal feeds the same computation from
    `periodLedger`, and `GET /api/export/informe-mensual?mes=YYYY-MM` streams the file —
    capability-gated **on the server**, open to every role. e2e: Xangarrote downloads %PDF;
    seeded Xangarro sees no button and a direct fetch gets 403.
- **Steps:** Print stylesheets for the statements (one page each) and the Diagnóstico; the "Informe
  mensual PDF" gated by `capabilities.informeMensual`; CSV and XLSX exports on Movimientos and
  Estados for every plan and role.
- **Acceptance:** the PDF has no browser chrome and matches the screen's rhythm; exports open in
  Excel with correct types.

### P-35 Portal coverage to 95% (unit + E2E merged, ADR-102) `[deuda]`

- [ ] Status · **Blocked by:** — · **Blocks:** —
  - 2026-09-23 · **Measurement and gate landed.** `pnpm test:coverage` (Vitest) and
    `pnpm test:e2e:coverage` (browser + `next start`) write raw V8 data;
    `pnpm coverage:check` merges them and holds `coverage-floor.json`, in the `portal-e2e`
    job. First full measurement, without the `sync` project (blocked that run): lines
    72.7%, statements 68.0%, functions 67.0%, branches 54.3% — from 20% lines for Vitest
    alone. Floor set at 72 / 68 / 67 / 54.
  - 2026-09-24 · **Web Worker coverage.** The register's data layer runs in a Worker that
    page coverage never saw; `e2e/worker-coverage.ts` records it. `operador/runtime` 19% → 95%;
    overall lines 77.4%, statements 72.1%, functions 69.9%, branches 56.1%. Floor 77 / 72 / 69 / 56.
    Also: `devices.spec` moved to its own serial project after `operador` — beside it, a door
    revoking and re-taking a slot made the slot count race (first CI run under ADR-102).
  - 2026-09-24 · **Floor calibrated to 76 / 70 / 68 / 54** — one point under the measurement,
    after P-30/N-07 landed untested code (ADR-102 calibration note). Unit tests for the
    refusals E2E cannot reach: `read-sheet`, `livePacProvider`, the receipt. CI's portal-e2e
    now sets `DATABASE_SUPER_URL` (the sync specs' cleanup needs the owner role) and reports
    coverage even when E2E fails. The six failing `[sync]` specs belong to the session behind
    ADR-103 (census assertions; fixes in flight).
  - 2026-09-24 · **First green `portal-e2e` under the gate** (run 36026962224): lines 84.1%,
    statements 77.5%, functions 76.8%, branches 62.5%. Floor 83 / 76 / 75 / 61. `/inventario-inicial`
    (N-17) had no spec — `e2e/inventario-inicial.spec.ts` now drives it on a throwaway owner, and
    found its «Capturado: …» banner lost to the capture's own revalidation ~1 run in 10
    (fixed in `parts.tsx`). The primitives galleries under `src/app/inventario/` leave the count.
  - 2026-09-24 · **Lines past 85%** (run 36030650074): lines 85.4%, statements 78.4%,
    functions 78.8%, branches 62.4%. Floor 84 / 77 / 77 / 61. Open: statements, functions and
    branches to the acceptance line — `server/actions` error paths, `server/billing/actions.ts`
    (Stripe, 0%), the Estados chart components.
  - 2026-09-24 · **Statements and branches were under-reported**: the minified coverage build
    mapped phantom branches onto `src/` that never merged with the unit suite's (`csv.ts`: 52
    statements / 46 branches counted, 38 / 25 real). The coverage build is no longer minified
    (ADR-102 amendment); `csv.ts` now reads 38/39 and 25/25 merged.
  - 2026-09-24 · **Re-measured unminified** (run 36038951217): lines 85.6%, statements 83.2%,
    functions 79.8%, branches 69.5%. Floor 84 / 82 / 78 / 68.
  - 2026-09-24 · **Two more measurement bugs, both under-counting the server**: the unminified
    build renamed server sources (`xangarro/src/…`) and the path rule dropped ~500 of them; and a
    module compiled into both webpack layers of one chunk kept its dead copy's 0 (29 files, e.g.
    `server/import/templates.ts`). Fixed in `options.ts` and — after a splitter that did not
    work — a one-rule patch to MCR (`patches/`, ADR-102 correction). Also:
    `server/billing/actions.ts` unit-tested (was 0%).
  - 2026-09-24 · **Measurement settled** (run 36047293665): lines 87.1%, statements 84.7%,
    functions 81.2%, branches 71.1%. Floor 86 / 83 / 80 / 70. The gap left is real.
  - 2026-09-24 · **Open question for the owner (found by tests, not changed):** Revisión de
    caja's «Aprobar» requires a menu category (Tacos / Guisados / Bebidas / Extras), but
    `aprobarProducto` always writes `categoria = 'Producto Terminado'` — the column is an
    _inventory_ category — so the owner's choice is discarded. Either the menu category needs a
    home, or the form should not ask. `tests/actions/revision.test.ts` pins today's behaviour.
  - 2026-09-24 · **Lines, statements and functions past 85%** (run 36069556142, after browser
    coverage stopped being lost at each full navigation): lines 91.4%, statements 89.1%,
    functions 85.9%, branches 75.8%. Floor 90 / 88 / 84 / 74. Open: branches — mostly per-screen
    states (empty, error, viewer) no spec renders yet.
  - 2026-09-26 · **Owner raised the target: 95 / 95 / 95, branches 85** (the ten-point spread
    kept; ADR-102 amendment). Also this session: unit tests for states and refusals E2E cannot
    reach — `server/metas.ts` 0 → 100% functions unit, `server/estados.ts` 0 → 81.8%,
    `server/comprobante/datos.ts` 0 → 100% functions and branches — and two findings that block
    a fresh merged measurement tonight: a warm `.next-e2e` build had been masking eight type
    errors in an uncommitted `negocio/` redesign (a clean `next build` fails until it lands), and
    a sandboxed shell exhausts its file table (ENFILE) mid-suite, losing the server's V8 flush —
    full runs must be un-sandboxed. The floor stays 90 / 88 / 84 / 74 until a green full-suite
    run re-measures and earns a `--raise`.
  - 2026-09-27 · **Floor raised to 92.5 / 89.8 / 86.3 / 75.9** on the first green full-suite run
    under the 95 goal (564 passed, every project to the end, server flush verified in the raw
    data). The overnight Mostrador commits grew the app by ~540 functions; covered functions
    grew with them. Still open toward 95 / 85: the gap is ~2.5 lines / ~5.2 statements / ~8.7
    functions / ~9.1 branches. Two follow-ups found by the run: the repeated
    `[MCR] … must be Array(V8) or Object(Istanbul)` warnings (worker-coverage entries MCR
    rejects — may silently under-count, worth the next measurement pass), and the in-flight
    `/como-empiezo` move (from 2026-09-27 00:30) breaks `onboarding.spec`'s tablet project —
    it was set aside as a patch to take this measurement and restored after.
  - 2026-09-27 (later) · **`/negocio/funciones` got its first spec** — `e2e/funciones.spec.ts`
    (@serial, original `feature_flags` restored in an `afterAll` that runs on failure): the rows
    render the tenant's real flags with the 2-de-7 count, a leaf switch saves through
    `cambiarFuncion` and the write is asserted in Postgres, and turning Inventario off with merma
    stored on asks first («Apagar las dos») and the cascade takes the dependent. Also: the
    repeated `[MCR]` warnings were diagnosed — MCR reads an _empty_ array as invalid data, so
    they fire on API-only tests that contribute nothing (log noise, not an under-count);
    `addPageCoverage` now skips empty lists so a real rejection cannot hide among them.
  - 2026-09-27 (evening) · **The como-empiezo blockage was a spec bug, and it is fixed.** The
    tablet project runs at 768px, where the sidebar's «Primeros pasos» card is `wide` — hidden
    under 1024px by design — and the spec's case-sensitive regex missed Inicio's «Ver mis
    primeros pasos» link; the locator is now `/primeros pasos/i` (`.first()` takes the card
    where both exist). With that, the in-flight de-gating work runs green **in** the tree — no
    more setting it aside. Second raise of the day on a full green run (567 passed, every
    project): after the first merge lines read 92.4 against the 92.5 floor (the de-gating had
    removed more covered lines than it added), earned back with `tests/repo-clients.test.ts` —
    the clients repository's not-found / no-row / optional-default branches, plus its sync-log
    discipline. **Floor 92.6 / 90 / 86.5 / 76.2.** The real 95-worklist, from the merged
    per-file gaps: `saldos-iniciales/lineas.tsx` (35 lines), `operador/caja/atajos.ts`
    (33 lines, 51 branches), `server/billing/cfdi.ts`, `operador/cobranza/cliente/recordar.tsx`,
    `repositories/clients.ts` ✦ done, `asesor/cierre.tsx`.
  - 2026-09-27 (night) · **Third raise: 93 / 90.4 / 86.8 / 76.8** (unit half re-measured over
    the same green E2E data — no rerun needed). `operador/caja/atajos.ts` — the register's
    PC-keyboard layer, 51 dark branches — is now 100% functions / 96% branches via
    `tests/operador/atajos.test.ts` (jsdom + React `act`; every root unmounted per test after a
    leaked listener from a double mount was found owning the keyboard while the fresh one never
    fired). `tests/cortes-exportar.test.ts` pins the CSV export: header, quote-aware cells,
    the minus only a shortfall earns, empty-not-«undefined» motivo. Remaining from the
    worklist: `saldos-iniciales/lineas.tsx` ✦ done, `server/billing/cfdi.ts`,
    `cobranza/cliente/recordar.tsx`, `asesor/cierre.tsx`, `operador/caja/nuevo-partes.tsx`.
  - 2026-09-27 (late) · **Fourth raise: 93.4 / 90.7 / 87.1 / 77.2, committed and pushed**
    (`feat/movil-mostrador`, beside the de-gating and the coverage push). `saldos-iniciales/
lineas.tsx` — the CxC prefill — is pinned by `tests/saldos-lineas.test.ts` (jsdom): name
    matching, line replacement, the unknown-cliente report and the no-nombre sheet. Enabler for
    every component test after it: the app tsconfig's `jsx: preserve` left .tsx untransformed
    under Vite 8 — the override moved from `esbuild` to `oxc` in `apps/web/vitest.config.ts`.
    Functions, the steepest climb, are +1.2 since the morning; branches +1.3.
  - 2026-09-28 · **Main red on the gate since #32 — the floor outran CI, coverage never fell.**
    Last green gate: `ec1a5995` (run 36375457279), 91.7 lines against the then-floor 90. The #32
    merge brought the four local raises (92.5 → 93.4), and every CI run since measures the same
    code at 92.7 / 89.9 / 85.6 / 76.6: per-file, CI's merged summary _rose_ from `ec1a5995` to
    `faf0dc1a` on every file that moved (the phone merges and the `@xangarro/caja` move changed
    nothing the portal counts). A CI-mode run locally (Node 22, `CI=1`, private Postgres) gives
    CI's numbers to ±0.15; the raises came from non-CI local runs, and the extra is in their
    E2E half (Node 26 vs 22 on the unit half is not it). **Rule from here: `--raise` only on
    numbers a `portal-e2e` CI run printed.** Restored with tests, floor untouched: unit —
    `cfdi-wiring` (the CFDI composition root: refund → charge → invoice lookup, the monthly
    close), `cron-routes` (all four crons behind the real guard), `facturas-actions` (the
    billing row answers only for its own business), `usage-live`, `import-plantillas` (a
    downloaded template parses clean), `pestana` (the BroadcastChannel fallback); E2E — the
    CxC lines by hand in `saldos-iniciales.spec` (rows asserted in Postgres, read back after a
    reload) and `asesor-metas-cierre.sync.spec` (the missed-goal month-end dialog). That spec
    found a bug: «Cambiar» in the dialog did nothing (`Metas` returned the dialog before
    reading `editando`); fixed. Note: `asesor-metas.sync.spec`'s title promises the lograda
    dialog, but the takeover consumes that load, so the dialog never renders there. CI-mode
    measurement after: **94.2 / 91.4 / 87.9 / 77.6.**
- **Steps:** raise the floor with `--raise` in the commit that earns it. The largest gaps,
  in uncovered lines at the first measurement (≈700 lines to 85%):
  1. ~~`operador/runtime` (19%, 285 lines)~~ — done 2026-09-24: Worker coverage, 95%.
  2. `server/actions` (44%, 290 lines; 7 files at 0%) — the error branches Playwright
     never reaches: Postgres integration tests per CLAUDE.md §6.
  3. `app/(portal)` (75%, 319 lines; 13 files at 0%) and `app/api` (49%; 9 files at 0%) —
     each 0% file is a route or drawer with no spec: a Playwright spec that asserts real
     data, or delete the dead file.
  4. `server/import` (5%) and `server/repositories` (53%).
- **Acceptance:** `coverage-floor.json` at ≥ 95 for lines, statements and functions, and
  branches ≥ 85, on a `portal-e2e` run where every project ran. (85 / 75 until the owner
  raised the goal, 2026-09-26.)

### P-36 First production walkthrough: the owner's findings (2026-09-25)

- [~] Status · **Blocked by:** ADR-105 landing (`feat/no-trial`, the billing session) for P-36.1;
  `feat/don-cuentas-portal` landing for P-36.7
  - Done: 2026-09-25 · items 2–6 on `main` (`feat/p36-walkthrough`): the guide with its required
    and optional lists, the D-2 gate (owner, wizard completed, required list open, no opt-out cookie)
    with «Ir a mi portal» as the escape, both onboarding paths ending on `/como-empiezo`; the wizard's
    answers applied before any Checkout and Crédito never stored as a method (parser tolerant of old
    rows); D-1's `BILLING_BETA_NO_CHARGE=1` (to set on `xangarro-web` in Vercel) keeps Checkout
    closed with the «Durante la beta no cobramos» notice; régimen «Ninguno por ahora» and the two
    one-line explanations; the edit bar on top; «Tu plan incluye» from the session's plan. Tests:
    domain 881, application 513, portal unit 522, portal E2E 489 passed (full local run).
    **Remaining:** P-36.1 and P-36.7 wait on their branches; the Inicio card's line reads «Listo para
    vender. N opcionales por hacer» once the required list is done.
- **Context:** the owner walked signup → wizard → «Tu plan ideal» → Stripe → portal on production
  the night the domains went live and wrote down what was off. Verified against the code
  (`origin/main` @ `d9e0c4a8`); each item names its cause.
- **Decisions (owner, 2026-09-25):** D-1 → **no charge during the beta**: paid CTAs show the «pronto»
  notice behind `BILLING_BETA_NO_CHARGE`, Checkout never opens; D-2 → **yes, gate**: redirect to
  `/como-empiezo` until the required steps pass, with an escape.
- **Decisions as they were put:**
  - **D-1 · Charge during the beta?** ADR-105 removes the trial: a paid plan is paid from day one
    through Stripe Checkout, Xangarrito is the free way in. Stripe is the billing backbone (B-10),
    not a placeholder — but if the beta should not charge anyone yet, the paid CTAs must say so
    («Pronto podrás contratar este plan», the notice `plan/screen.tsx` already has) instead of
    opening Checkout, behind one flag, until launch. Either way, no card is collected for the free
    plan.
  - **D-2 · Gate the portal on the checklist?** Until every required step is done, should
    `/como-empiezo` be the page every portal entry lands on (a redirect, escapable), or only the
    first landing after the wizard plus the Inicio card? Recommended: redirect until the required
    steps pass, with a «Ver el portal» escape; hide the page from the sidebar once complete.
- **Items:**
  1. **Trial copy everywhere (wizard, plan page, Suscripción cards, Checkout).** Cause: ADR-105 is
     on `feat/no-trial` (8 commits ahead of main), not merged; production runs main. Fix: land that
     branch, then re-read every string of the wizard and the plan pages in one pass for one voice
     («Contratar este plan» / «Seguir gratis», the Stripe product name, the Suscripción CTA
     `PLAN_CARDS[xangarrote].cta` = «Probar 14 días gratis»). Depends on D-1.
  2. **After the wizard the owner lands on Suscripción with no guidance.** Cause: the paid path's
     Checkout `successUrl` is `/suscripcion?pago=listo` (`server/onboarding/checkout.ts:29`,
     `server/billing/actions.ts:58`); only the free path goes to `/como-empiezo`. The checklist
     page exists (P-04/N-14: `/como-empiezo`, 7 detected steps, the Inicio card). Fix: both paths
     end on `/como-empiezo` (the `pago=listo` toast moves there); the page grows a **required**
     list (operador, productos, saldos, código, dispositivo, primera venta, tipos de pago revisados,
     datos del negocio) and an **optional** list (logo, WhatsApp, datos fiscales «solo si quieres
     factura», meta del mes con Don Cuentas, importar catálogo); it is hidden from nav and Inicio once
     the required list passes; the subtitle stops saying «Seis pasos» for seven. Depends on D-2.
  3. **Wizard payment answer not reflected in Negocio → Tipos de pago.** Two causes: (a) the paid
     path never runs `AplicarConfiguracionUseCase` — answers wait in `pending_paid_answers` for the
     entitlement listener (`server/onboarding/paid-answers.ts`), which needs the Stripe webhook to
     fire on production (`STRIPE_WEBHOOK_SECRET` set on `xangarro-web`; verify with `stripe
listen`/dashboard events); (b) even when applied, the wizard can write «Crédito» into
     `enabled_payment_methods` (`answers-to-configuration.ts:90,95`) and `parseMetodosPago`
     (`metodos-pago.ts:33-39`) then falls back to all four. Fix: apply the non-plan-dependent answers
     (payment types, inventory, cash) at «Seguir gratis» **and** before redirecting to Checkout;
     keep only the plan-gated ones pending; never write Crédito into the list (it is the
     `ventasCredito` Función). Test: old → new data (§2.9).
  4. **Datos generales / Datos fiscales.** Régimen (626/612/601/606/605) **is used**: it picks the
     ISR estimate in the estado de resultados (`financials/isr-regimen.ts`) and the monthly report.
     Keep it in Datos generales, add the option **«Ninguno por ahora»** (no ISR line, a note in the
     estado) and a one-line label: «Solo sirve para estimar tu ISR en el estado de resultados. No
     afecta nada más.» Uso de CFDI (G03/G01/S01) is **only** the receptor of Xangarro's own invoice
     to the business (N-33): keep it in Datos fiscales, default G03, collapse the choice behind
     «Quiero factura de mi suscripción», label «Solo para tu factura de Xangarro».
  5. **«Estás editando tu negocio» bar** (`negocio/edicion/save-bar.tsx`, rendered at the bottom of
     `screen.tsx`): move it to the top of the page under the header, sticky, Cancelar/Guardar with it.
  6. **«Tu plan incluye» card wrong.** Cause: `CapabilitiesCard` rows come from the deprecated
     fixture `fixtures/business.ts` (plan `xangarro`, asesor `diario`), not the subscription. Fix:
     build the rows from the live entitlement (`computeEntitlement`) and the plan's Don Cuentas tier;
     delete the fixture.
  7. **Sidebar says «Asesor»; no Don Cuentas icon.** `feat/don-cuentas-portal` (f227e0ab, unmerged)
     renames the entry and adds `DonCuentasAvatar`. Fix: land it; the nav icon becomes a 24-px
     Lucide-idiom stroke of the brand coin with glasses and moustache (`shell/icon.tsx` path
     string, matching `apps/landing/home/icons.jsx` `DonCuentasFace`), reused by the avatar.
- **Acceptance:** a fresh signup on production ends on `/como-empiezo` on both paths; Negocio shows
  the payment types the wizard chose; no «14 días» string anywhere (`git grep`); «Tu plan incluye»
  matches the Suscripción card; régimen «Ninguno por ahora» yields an estado without ISR; Playwright
  specs for the checklist landing and the Negocio edit bar; unit tests for the answer application
  and the régimen option.

## Fase 10 — Beta: lo que el diseño ya muestra como listo

The El Mostrador designs (ADR-107, canvas «Configuración y primer día» and «Caja del operador»)
draw these capabilities as available, without a «Pronto» chip, by the owner's decision of
2026-09-26: they are built during the beta. Capabilities that were already tracked stay in their
own task and are not repeated here: P-28 (Diagnóstico, estrategia, «¿Me alcanza?»), P-29 (catálogo
desde una foto), P-30 (the model call behind the monthly review), P-32 (avisos and Compartir por
WhatsApp).

### P-37 Ticket printing from the caja

- [!] Status · **Deferred 2026-09-26 (owner): hardware is not in scope.** There is no ticket
  printer to build against and none on the roadmap, so the acceptance — «a sale prints on a
  58 mm printer» — cannot be met or verified. It stays written down rather than deleted: the
  caja already shares the comprobante by WhatsApp, and the designs hide the Imprimir button
  until this ships, so nothing regresses by waiting. Re-open when a printer exists.
- **Blocked by:** a physical 58/80 mm printer · **Blocks:** —
- **Steps:** the caja sends the comprobante by WhatsApp today; add printing to a ticket printer
  (58/80 mm) from the «¡Listo!» dialog and from a sale's detail, using the «Ticket» template.
  Until it ships, the designs show no Imprimir button (the owner's call, 2026-09-26).
- **Acceptance:** a sale prints on a 58 mm printer from the web caja; the layout matches the
  WhatsApp image.

### P-38 Don Cuentas explains a cash difference

- [ ] Status · **Blocked by:** — · **Blocks:** —
      **2026-09-26 (owner, ADR-110): fully deterministic — no model.** The causes this proposes are
      named in its own Steps: cancelled sales, fiado, gastos without comprobante. Those are three
      queries over one turno, ranked by amount. Its acceptance — «cites only that turno's rows» —
      is then free rather than something a prompt has to be trusted for; it works on every plan,
      Xangarrito included; and it costs nothing on a shop that cashes up daily, which was the most
      frequent model call in the product. **No longer blocked by P-30:** it needed the generation
      runtime only because it was going to be generated.
- **Steps:** on a corte with a faltante or sobrante, Don Cuentas proposes the likely causes from
  the turno's own records (cancelled sales, fiado, gastos without comprobante) in the Cortes drawer
  and in Revisión de caja.
- **Acceptance:** a seeded $60.00 faltante gets an explanation that cites only that turno's rows.

### P-39 Don Cuentas conclusions in Estados financieros

- [ ] Status · **Blocked by:** P-30, P-28 · **Blocks:** —
      **2026-09-26 (owner, ADR-110): written once a month, shown on Estados, and announced.**
      Not per statement view — that was a per-view bill nobody had costed — and not folded into the
      Diagnóstico either, because the value is a line _where the numbers are_. Generated with the
      monthly run, stored for that period, rendered on Estados financieros. The same run writes a
      notice naming what was generated, with links to Diagnóstico and to Estados, so a shopkeeper
      who does not open the right tab still learns it exists. That notice is **`source='sistema'`,
      not `'asesor'`** — ADR-060 keeps the bell clear of Asesor insights on purpose, so an `asesor`
      row would be written and never ring; «your report is ready» is a system event, not an insight.
      Needs somewhere to keep one conclusion per period per statement, which P-28's output defines.
- **Steps:** one short conclusion per statement (resultados, balance, flujo) in plain Spanish,
  computed from the deterministic figures and phrased by the model.
- **Acceptance:** every figure the text cites matches the statement on screen.

### P-40 First diagnóstico free at 90 days

- [ ] Status · **Blocked by:** P-28 · **Blocks:** —
  - **Narrowed by ADR-109 (2026-09-26).** This said «Xangarrito **or Xangarro**», written when the
    Diagnóstico was Xangarrote-only. Xangarro now gets one every month as part of the plan, so a
    one-off free report is not an offer to them — **P-40 is Xangarrito's alone.** What it shows is
    the _short read_ (Xangarro's shape, per P-28), not the full report: the point is to taste what a
    written reading is worth, and a free full report would undercut both paid tiers at once. The
    design already draws the state — `diagFreeOffer`, one of the Diagnóstico's six.
- **Steps:** a **Xangarrito** business that reaches 90 días de registros gets one short-read
  Diagnóstico without upgrading, announced by an aviso.
- **Acceptance:** the aviso fires once per business; the report opens once, in its short-read form.

### P-41 Advanced inventory functions

- [ ] Status · **Blocked by:** — · **Blocks:** —
- **Steps:** conversión de materia prima, conversión automática and auditoría de inventario, off in
  the v1 clamp (Q10), become switchable in Mi negocio › Funciones for Xangarrote.
- **Acceptance:** each one, switched on, appears in the caja and syncs its records.
