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

### P-21 `pnpm design:compare` capture harness

- [x] Status · **Blocked by:** P-18 · **Blocks:** every screen task's check 1
- **Context:** ADR-058. Check 1 is a review, not an assertion — the design plan itself lists browser
  width, text reflow and real-vs-sample data as acceptable differences, and the `.dc.html` files
  render through a vendored runtime that fetches fonts over the network. This never runs in CI.
- **Steps:** A Playwright script that serves `/design-reference/` (use `http-server`, per the note in
  `packages/ui/playwright.config.ts` about `serve` 301-stripping `.html`) and the portal dev server,
  screenshots a named screen from both at the same width, and writes a stacked side-by-side PNG to
  `design-compare/`. Support `--width` (default 1440, plus 768) and `--state`.
- **Acceptance:** `pnpm design:compare inicio` produces a PNG in which bar heights, card paddings,
  title sizes and button positions are directly comparable. `design-compare/` is gitignored.

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

### P-23 Primitives + Storybook inventory + visual-regression baselines

- [~] Status · **Blocked by:** P-22 · **Blocks:** P-24 and every screen task
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

- [~] Status · **Blocked by:** P-01, P-23 · **Blocks:** P-02 and every screen task
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

- [~] Status · **Blocked by:** P-01, P-24, B-05 · **Blocks:** all other P
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

- [~] Status · **Blocked by:** P-24 · **Blocks:** every screen task
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

- [~] Status · **Blocked by:** P-25 · **Blocks:** —
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

- [~] Status · **Blocked by:** P-25 · **Blocks:** P-13, P-14
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

- [~] Status · **Blocked by:** P-25, C-11 · **Blocks:** P-34
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

- [~] Status · **Blocked by:** P-25 · **Blocks:** —
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

- [ ] Status · **Blocked by:** P-02, P-09
- **Steps:** port `DirectorHome` intent, not code (reference: `archive/ui-screens/DirectorHome/`, `archive/ui-screens/CajaReportes/compute-report-kpis.ts`): today's ventas/gastos/utilidad tiles, 30-day sparkline (Recharts), caja status per device (open turno?), stock bajo list, cuentas por cobrar placeholder (hidden until Z-01), unresolved rejections banner, onboarding progress if incomplete. Read via `@xangarro/domain` KPI functions where they exist (`packages/domain/src/**/kpi*`).
- **Acceptance:** numbers match P-09 totals for "hoy"; renders at 768 px width without horizontal scroll.

> **Wired to Postgres 2026-09-17.** The container/screen split is real, not
> aspirational: `page.tsx` is an async server component that queries inside
> `withTenant()`, and the screen is a pure component over the result — so Fase 5's
> state-and-role sweep still works from props, and the error state is what renders
> when a read throws.

- [~] Status · **Blocked by:** P-25 · **Blocks:** X-02
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
- [ ] Status · **Blocked by:** P-02, P-09
- **Steps:** (the archived app UI in `archive/ui-screens/Estados/` holds `health-verdicts.ts` and `estado-resultados-mappers.ts` — port their logic into `@xangarro/domain` rather than rewriting it) period picker (mes/trimestre/año/custom); NIF B-3 Estado de Resultados, B-6 Balance, B-2 Flujo de Efectivo computed with the **existing** `@xangarro/domain` functions used by `packages/ui/src/screens/Estados` (locate them; do not reimplement); print stylesheet; "Exportar Excel" (all plans). "Informe mensual PDF" button visible but gated to Pro → Z-06.
- **Acceptance:** a fixture business (seed) produces the same numbers as the domain unit tests' expectations; print preview is one page per statement.

### P-06 Dispositivos

> **Amended 2026-09-17 by Track N:** the pairing panel also shows a QR / https app link (N-25, C-14).

> **Wired to Postgres 2026-09-17.** The container/screen split is real, not
> aspirational: `page.tsx` is an async server component that queries inside
> `withTenant()`, and the screen is a pure component over the result — so Fase 5's
> state-and-role sweep still works from props, and the error state is what renders
> when a read throws.

- [~] Status · **Blocked by:** P-25 · **Blocks:** X-02
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

- [~] Status · **Blocked by:** P-25 · **Blocks:** X-02
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

- [~] Status · **Blocked by:** P-25 · **Blocks:** —
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

- [~] Status · **Blocked by:** P-25, C-11 · **Blocks:** —
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

- [~] Status · **Blocked by:** P-25, P-31 · **Blocks:** P-27, P-28
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

- [~] Status · **Blocked by:** P-26 · **Blocks:** P-33
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
  - In progress: 2026-09-17 · the tab and **both gates** are wired; the report itself is not built.
  - Two gates compose in the right order via `resolveScreenState`: `capabilities.asesor ===
'completo'` renders `locked` with the Xangarrote upsell, and an LLM-backed path with the
    production flag closed renders **«Próximamente»** — which has no call to action, because it is
    not something a customer can unlock.
  - `LLM_ENABLED` is one flag at one boundary: **locally nothing is gated, in production every
    model-backed path is** (ADR-059).
  - **Still to do:** everything behind the gate — the ten report sections, the price-suggestion
    table, the estrategia list, and the six diagnostic states. Needs P-30 and the credential.
- **Context:** ADR-056, ADR-059. LLM-backed, so production renders «Próximamente»; **locally it is
  fully live.**
- **Steps:** The report's ten sections, the month tiles, the price-suggestion table (Producto ·
  Costo antes → ahora · Precio actual · Margen · Precio sugerido, margin cells tinted by band), and
  the estrategia list (move + impact) gated by `strategyLocked` to Xangarrote. Six states: report,
  generating, notenough, free offer, teaser, error. The printable variant feeds P-34. **Every figure
  is computed by `@xangarro/domain` and passed to the model; the model never derives a number.**
  Footer: «Generado con IA a partir de tus registros».
- **Acceptance:** with the production flag on, the tab renders «Próximamente» and no model call is
  made; locally the report renders from fixtures; a prompt-injection fixture (a product named with
  instruction text) does not alter the output structure.

### P-29 Catálogo desde una foto — **«Próximamente» in production**

- [ ] Status · **Blocked by:** P-07, P-30 · **Blocks:** —
- **Steps:** Upload → vision extraction → the **same dry-run preview table as P-07's Excel import**
  (Nuevo / Actualizar / Error) → commit. Structured output (`strict: true` or
  `output_config.format`) validating against the domain `Producto` schema — extracted rows are never
  accepted as prose. Not batched: a person is waiting, so this is a normal streaming call.
- **Acceptance:** fixture photographs produce schema-valid rows; a photograph with no products
  produces the error state, not an empty commit; production renders «Próximamente».

### P-30 Asesor generation runtime

- [ ] Status · **Blocked by:** P-26, B-02, B-03 · **Blocks:** P-28, P-29
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

- [~] Status · **Blocked by:** P-25 · **Blocks:** P-26, P-32
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

- [~] Status · **Blocked by:** P-27 · **Blocks:** —
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

- [~] Status · **Blocked by:** P-03…P-07, P-11, P-16 · **Blocks:** X-02
  - 2026-09-17 · The `portal-e2e` CI job exists and runs the full suite (170 tests) against a seeded Postgres — against a plain Postgres + compat layer, not "local Supabase" as written above.
  - 2026-09-19 · **Done**: `e2e/smoke.sync.spec.ts` runs the named flow end to end — free
    signup → wizard → operator → 3-product import → device code → `/activate` against the
    real endpoint → one pushed sale → Movimientos — through the UI the owner touches, on a
    tenant the run creates.
- **Steps:** One flow — free signup → onboarding → create operator → import 3 products → issue a
  device code → call `/activate` via the C-10 conformance helper → device appears → push one sale
  via the helper → it appears in Movimientos. Runs against local Supabase and the dev server in CI
  (F-08 job `portal-e2e`, allowed to be slower).
- **Acceptance:** green locally and in CI.

### P-34 Print, PDF and exports

- [~] Status · **Blocked by:** P-14, P-28 · **Blocks:** —
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
