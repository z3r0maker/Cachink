# `@cachink/ui` Component Index

> One index per primitive — what it is, when to reach for it, and the
> Storybook entry-point. Generated as part of Audit Round 2 G4 once
> the Storybook coverage gap (G2) closed.
>
> **Mobile + desktop share these.** Per CLAUDE.md §5, every reusable
> component lives in `packages/ui` and both apps import it by name.
> Anything exporting a reusable component from `apps/*/src/` is a bug.

## Surface primitives

| Primitive          | One-liner                                                                                                                                         | Storybook                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **`<Btn>`**        | The Cachink button. 7 variants (`primary` / `dark` / `ghost` / `green` / `danger` / `soft` / `outline`), 3 sizes, optional leading icon.          | `Phase 1A / Primitives / Btn`         |
| **`<Card>`**       | Hard-bordered, hard-shadow surface. 3 variants (`white` / `yellow` / `black`), 4 padding scales, optional `onPress` press transform.              | `Phase 1A / Primitives / Card`        |
| **`<Tag>`**        | Decorative chip. ADR-043: not tappable — use `<SegmentedToggle>` for radio chips.                                                                 | `Phase 1A / Primitives / Tag`         |
| **`<EmptyState>`** | Title + body + optional emoji + optional action. The "we have nothing to show" surface for every list screen.                                     | `Phase 1A / Primitives / Empty State` |
| **`<ErrorState>`** | Title + body + optional retry CTA in brand `danger` red. The "we tried and failed" companion to `<EmptyState>`.                                   | `Phase 1A / Primitives / Error State` |
| **`<Skeleton>`**   | Compound: `<Skeleton.Row>` (canonical Card + two grey bars) and `<Skeleton.Bar>` (single bar for KPI shimmer). `role="status"` + i18n aria-label. | `Phase 1A / Primitives / Skeleton`    |
| **`<Callout>`**    | Coloured-surface notice block. Used on the wizard for "data preserved" confirmations.                                                             | `Phase 1A / Primitives / Callout`     |
| **`<HelloBadge>`** | The Phase 0 "hello world" smoke component.                                                                                                        | `Phase 0 / HelloBadge`                |

## Form + input primitives

| Primitive             | One-liner                                                                                                                                          | Storybook                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **`<Input>`**         | The brand-styled text input. Type union covers text / number / decimal / email / phone / password / date / select. Field primitives below wrap it. | `Phase 1A / Primitives / Input`     |
| **`<Combobox>`**      | Searchable single-select. Used for currency, role, and category pickers.                                                                           | `Phase 1A / Primitives / Combobox`  |
| **`<TextField>`**     | RHF-friendly text input with `<RhfTextField>` controlled wrapper.                                                                                  | `Phase 1A / Fields / TextField`     |
| **`<MoneyField>`**    | Peso-amount input. Strips locale separators, formats on blur, exposes canonical `Money` bigint.                                                    | `Phase 1A / Fields / MoneyField`    |
| **`<EmailField>`**    | Email keyboard + `autoComplete="email"`.                                                                                                           | `Phase 1A / Fields / EmailField`    |
| **`<PhoneField>`**    | Phone-pad keyboard + `autoComplete="tel"`.                                                                                                         | `Phase 1A / Fields / PhoneField`    |
| **`<PasswordField>`** | Masked input with brand show/hide toggle. `current-password` / `new-password` autofill.                                                            | `Phase 1A / Fields / PasswordField` |
| **`<IntegerField>`**  | Strips non-digits at the input layer; clamps to `min`/`max` on blur.                                                                               | `Phase 1A / Fields / IntegerField`  |
| **`<DateField>`**     | Platform-extension date input — native HTML5 on web, brand Modal-Combobox on RN.                                                                   | `Phase 1A / Fields / DateField`     |

## Layout + chrome

| Primitive             | One-liner                                                                                               | Storybook                                |
| --------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **`<TopBar>`**        | App-shell header with title / subtitle / sync state / settings cog.                                     | `Phase 1A / Primitives / Top Bar`        |
| **`<BottomTabBar>`**  | The 5-cell bottom tab bar (3 mobile + 2 desktop variants).                                              | `Phase 1A / Primitives / Bottom Tab Bar` |
| **`<SectionTitle>`**  | Uppercase eyebrow + optional right-aligned action slot. `role="heading"` + `aria-level={2}`.            | `Phase 1A / Primitives / Section Title`  |
| **`<SearchBar>`**     | Labelled input with leading search icon + Enter-to-search.                                              | `Phase 1A / Primitives / Search Bar`     |
| **`<List>`**          | Platform-extension list. Web `.map()` inside `<View>`; native delegates to `<FlatList>`. `role="list"`. | `Phase 1A / Primitives / List`           |
| **`<SplitPane>`**     | Stacks on phone, side-by-side on `gtMd`. The tablet-landscape detail-pane host.                         | `Phase 1A / Primitives / Split Pane`     |
| **`<Modal>`**         | Branded bottom-sheet on RN, centered Dialog on web. KeyboardAvoidingView built in.                      | `Phase 1A / Primitives / Modal`          |
| **`<ConfirmDialog>`** | Modal-based replacement for cross-platform-broken `globalThis.confirm()`.                               | `Phase 1A / Primitives / Confirm Dialog` |
| **`<FAB>`**           | 56-pt floating action button anchored above the BottomTabBar.                                           | `Phase 1A / Primitives / FAB`            |
| **`<SwipeableRow>`**  | Native swipe-to-edit / swipe-to-delete for list rows. Web-passthrough; native uses gesture-handler.     | `Phase 1A / Primitives / Swipeable Row`  |

## Composite display

| Primitive               | One-liner                                                                                         | Storybook                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **`<Kpi>`**             | Hero "big number" with eyebrow + value + optional hint. Combined `aria-label` for screen readers. | `Phase 1A / Primitives / Kpi`              |
| **`<Gauge>`**           | Horizontal bar meter with `role="meter"` + ARIA value attributes. 4 tones.                        | `Phase 1A / Primitives / Gauge`            |
| **`<InitialsAvatar>`**  | Coloured circle with first-letter glyph for cliente avatars.                                      | `Phase 1A / Primitives / Initials Avatar`  |
| **`<Icon>`**            | Curated Lucide icon names — typed union prevents emoji drift.                                     | `Phase 1A / Primitives / Icon`             |
| **`<SegmentedToggle>`** | Radio-style chip cluster for sub-tabs (Gasto / Nómina / Inventario).                              | `Phase 1A / Primitives / Segmented Toggle` |

## Sensors + platform-extension

| Primitive            | One-liner                                                                           | Storybook                               |
| -------------------- | ----------------------------------------------------------------------------------- | --------------------------------------- |
| **`<Scanner>`**      | Barcode scanner — RN expo-camera, web BarcodeDetector.                              | `Phase 1C / Primitives / Scanner`       |
| **`<PeriodPicker>`** | Estados Financieros period selector — mensual / anual / rango. `role="radiogroup"`. | `Phase 1C / Primitives / Period Picker` |

## Conventions

- **One component per folder.** Folder name PascalCase (`<FooBar>` lives in `FooBar/`); file name kebab-case (`foo-bar.tsx`). Index barrel re-exports.
- **Platform extensions:** `foo-bar.tsx` (shared / web), `foo-bar.native.tsx` (RN), `foo-bar.shared.tsx` (when types live separately). See CLAUDE.md §5.3.
- **a11y:** every focusable primitive declares its `role` + `aria-label`; layout primitives declare semantic roles (`status`, `alert`, `heading`, `meter`, `radiogroup`, `list`). See `tests/a11y-semantics.test.tsx`.
- **i18n:** Spanish (es-MX) only at launch — see CLAUDE.md §8.5. All user-facing strings flow through `useTranslation` from `@cachink/ui/i18n`.
- **Tests:** Vitest + Testing Library, jsdom environment. Below-floor primitives carry ≥6 tests apiece (Audit Round 2 G4).

> **Did this README go stale?** Run `find packages/ui/src/components -maxdepth 2 -type d` to compare against the table above. Add new primitives here as part of the same PR that ships them.
