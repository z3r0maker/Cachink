# Cachink! Design System

**Cachink!** — *Finanzas para emprendedores.*

A simple, mobile-first **financial control and micro-POS app for Mexican emprendedores** (new/emerging businesses). Captures ventas, egresos, inventory movements, and produces NIF-compliant financial statements and KPIs. Intentionally small in surface area — it is **not** a full ERP. The guiding principle is: **"the less clicks, the most value."**

---

## The product at a glance

| Aspect | Detail |
|---|---|
| **Market** | Mexico (MXN, Spanish es-MX, NIF accounting) |
| **Platforms** | Mobile (Expo/iOS/Android tablets) + Desktop (Tauri/Win/macOS) |
| **Roles** | **Operativo** (captures ventas/egresos/inventario) · **Director** (read-only txn + financial statements + dashboard) |
| **Payment methods** | Efectivo · Transferencia · Tarjeta · QR/CoDi · Crédito |
| **Modules** | Ventas · Egresos · Inventario · Estados Financieros · Indicadores · Director Home |
| **Data model** | Local-first SQLite everywhere; optional LAN or Cloud (PowerSync) sync |

---

## Brand essence

The logo is a **thick, black-outlined yellow coin** stamped with a chunky $ — playful, confident, audible (the onomatopoeia *¡cachink!* is the sound of a cash register). The wordmark **"Cachink!"** uses a rounded, heavy sans with a signature yellow exclamation-point dot. The brand voice is **fun, warm, and direct** — it speaks Spanish to people who run their own small business from their phone.

Visually this is **neobrutalist-yellow**: hard 2px black borders on everything, hard drop-shadows with zero blur (`4px 4px 0 #0D0D0D`), no gradients, no soft shadows, no glass. Pressing something physically shifts it 2px and shrinks the shadow — it feels like stamping a form.

---

## Sources (not included — attached context)

Read only. Not pre-loaded into this project.

- **GitHub repo** — `z3r0maker/Cachink` (branch `main`). Key files consulted:
  - `CLAUDE.md` — the architectural contract, incl. §8 Brand & Visual Identity (color tokens, typography, shape + shadow rules) and §1 Product Overview.
  - `packages/ui/src/theme.ts` — token source of truth (imported verbatim into `colors_and_type.css`).
  - `packages/ui/src/components/{Btn,Card,Input,Tag,TopBar,BottomTabBar,Kpi,Gauge,EmptyState,SectionTitle}/*.tsx` — prop contracts + visual logic for every primitive in this kit.
  - `ARCHITECTURE.md`, `ROADMAP.md` — not required for design context; available if anything downstream needs them.
- **Brand masters** provided in `uploads/`:
  - `logo.png` (≈1536×1024, in-app `<BrandLogo />` master)
  - `icon.png` (1254×1254, full-bleed app-icon master — iOS adds the squircle mask)
  - `icon-padded.png` (1024×1024 RGBA, ~82% artwork, dock-ready)
  - `splash-mobile.png` (~852×1846, portrait launch splash, yellow bg)
  - `splash-desktop.png` (~1568×1003, landscape launch splash)

---

## Index — what's in this folder

```
Cachink Design System/
├── README.md                 ← you are here
├── SKILL.md                  ← skill wrapper (for Claude Code use)
├── colors_and_type.css       ← all tokens as CSS vars + semantic helpers
├── assets/                   ← brand masters (logo / icon / splash)
│   ├── logo.png
│   ├── icon.png
│   ├── icon-padded.png
│   ├── splash-mobile.png
│   └── splash-desktop.png
├── preview/                  ← design-system cards (registered for DS tab)
│   ├── type-display.html
│   ├── type-body.html
│   ├── colors-brand.html
│   ├── colors-semantic.html
│   ├── colors-neutrals.html
│   ├── radii.html
│   ├── shadows.html
│   ├── borders.html
│   ├── press-interaction.html
│   ├── buttons.html
│   ├── tags.html
│   ├── cards.html
│   ├── inputs.html
│   ├── kpi-gauge.html
│   ├── logo.html
│   └── iconography.html
└── ui_kits/
    └── cachink_mobile/
        ├── README.md
        ├── index.html        ← interactive 3-tab Operativo prototype
        └── components/       ← JSX primitives matching packages/ui
```

---

## CONTENT FUNDAMENTALS

### Language

- **100% Spanish (es-MX).** No English in user-facing copy, ever. Module names, buttons, toasts, errors — everything in Spanish. English only appears in code and internal comments.
- **Local vocabulary is mandatory.** `ventas` (not sales), `egresos` (not expenses), `cuentas por cobrar`, `corte de día`, `contador`, `comprobante`. Do not translate these to English equivalents even when the target user is bilingual — the point is feeling native to a Mexican emprendedor.

### Tone and voice

- **Warm, confident, tactile.** The voice of someone helpful — a friend who happens to be good with numbers. Never condescending, never corporate, never overly-cheerful.
- **Address the user with *tú*, not *usted*.** Personal. ("Tus ventas de hoy", "Registra un egreso".)
- **Verb-forward CTAs in imperative.** "Registrar venta" · "Ver todo" · "Cerrar día" · "Compartir comprobante". Never "Click here" / "Haga click".
- **No gamification, no streaks, no emoji confetti.** The brand is *confident*, not *cute*. One emoji in an EmptyState is fine; three is too many.

### Casing rules

- **Buttons:** ALL CAPS, letter-spaced wide. `REGISTRAR VENTA`. (CSS `text-transform: uppercase` — source string stays proper-cased for screen readers.)
- **Section headers (eyebrow):** ALL CAPS, wide tracking, gray. `VENTAS HOY · 4`.
- **Headings + titles:** Sentence case. "Tus finanzas hoy" — never Title Case.
- **Tags/chips:** Proper-cased Spanish nouns. `Producto`, `Transferencia`, `Materia Prima`.
- **Labels above inputs:** ALL CAPS, gray. `CATEGORÍA`, `MÉTODO DE PAGO`.

### Money & dates

- **Currency:** `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })` → `$1,234.50`.
- **Internally stored as integer centavos** (never floats). Display formatting is a presentation concern.
- **Dates:** `Intl.DateTimeFormat('es-MX', …)`. Short forms on cards (`24 abr`); full form on screens (`abril 2026`). Lowercase month names.

### Voice samples (from the mock + CLAUDE.md)

- EmptyState title: `Sin ventas todavía`
- EmptyState CTA: `Registrar primera venta`
- TopBar subtitle: `abril 2026`
- Sync chip: `Solo este dispositivo` / `Sincronizado con [server] · 3 dispositivos` / `Sin conexión — se sincronizará después`
- Mode wizard cards: `Solo este dispositivo` · `En la nube` · `Conectar a un servidor local` · `Ser el servidor local`
- Director dashboard label: `Cuentas por cobrar`
- Recurring-entry prompt: `Pendiente de registrar`

---

## VISUAL FOUNDATIONS

### Color

- **Yellow is the hero.** `#FFD60A` (Amarillo Vibrante) is used generously — top of splash, primary buttons, active tab backgrounds, KPI cards. It reads as warm sunshine, not neon.
- **Black is the only border color.** `#0D0D0D`, 2px on every primitive (2.5px on hero cards + sticky bars). Borders are never gray, never dashed, never lighter.
- **Surfaces are off-white (`#F7F7F5`) and pure white.** The off-white app background lets white cards float cleanly.
- **Semantic colors are saturated.** Green `#00C896` for ingresos/success, Red `#FF4757` for egresos/danger, Blue `#3B6FFF` for info/nómina. Each has a matching `-soft` pastel tint for backgrounds (Tag "info", EmptyState badges).
- **Gradients:** *none.* Not in backgrounds, not in buttons, not in splash. If you see a gradient in Cachink, it's a bug.

### Typography

- **Plus Jakarta Sans** — weights 400, 500, 600, 700, 800, 900 (weight 900 may substitute from 800 on Google Fonts; self-host if print-perfect 900 is required).
- **Headings:** weight 900, letter-spacing `-0.02em` → `-0.04em`. Tight, heavy, stamped.
- **Labels (uppercase):** weight 700, letter-spacing `+0.05em` → `+0.08em`. Spaced-out, small, gray.
- **Body:** weight 500–600. Ink color (`#1A1A18`, not pure black) for readability.

### Spacing & layout

- **Mobile base grid:** 4px / 8px. Common vertical rhythm values: `8, 12, 14, 16, 20, 24, 32, 48`.
- **Card padding:** 16 (default) · 24 (hero / large).
- **Form rows:** 14px bottom margin between Inputs; labels sit 5px above fields.
- **TopBar height:** 72px, sticky, 2.5px bottom border.
- **BottomTabBar height:** 68px, sticky, 2.5px top border; active tab gets a full-yellow cell.

### Borders, radii, shadows

- **Borders:** always `2px` (most primitives) or `2.5px` (hero cards + sticky bars + modal frames). Always `#0D0D0D`. Never thinner. Never dashed.
- **Radii:** pick from the strict scale — `8, 10, 12, 14, 16, 18, 20, 22`. Gauge track 8 · Btn 10 · Input 12 · Card 14 · Tag 20 (full pill). Inventing values is forbidden.
- **Shadows:** hard drop only. `3px 3px 0` (small) · `4px 4px 0` (card) · `5px 5px 0` (hero). Zero blur. Zero opacity. Zero rgba. No inner shadows. No soft shadows.

### Interaction: the "stamp" feel

The single most identifiable interaction in Cachink. Every tappable primitive (Btn, Card, BottomTabBar, Modal buttons) does this on press:

- Shifts `translate(2px, 2px)`
- Shadow shrinks from `4px 4px 0` → `1px 1px 0`
- Duration: ~100ms
- Release returns to resting state

Hover states (desktop): no color change by default. Some buttons very subtly brighten via `:hover { background: var(--yellow-deep) }` — never lighter, never opacity, never translate on hover. The motion is exclusively press.

Disabled states: 50% opacity, cursor `not-allowed`, no press transform.

### Motion

- **Animations are functional, not decorative.** Press transform (~100ms) is the only global motion. Modals fade-in ~120ms. No parallax, no scroll animations, no loading skeletons that shimmer — use a static gray block or the EmptyState.
- **Easing:** short, snappy. `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- **No fade-in-on-scroll.** No stagger entrances. The app feels like a paper ledger — you write, you see it, done.

### Backgrounds, imagery & texture

- **No repeating patterns. No textures. No grain.** The yellow is flat.
- **Imagery is minimal.** Splash screens use the logo on flat yellow with sparse black sparkle marks and 2 tiny floating coin silhouettes — that's the only "illustration" in the brand.
- **No stock photography.** No people-at-laptops. No isometric 3D. Empty states use a single Unicode emoji (📭, 🛒, 📦) as the visual.
- **Full-bleed imagery:** only appropriate for onboarding / splash screens — the flat-yellow hero behind the logo. Never behind text content.

### Transparency & blur

- **Never used.** No `rgba()` shadows. No `backdrop-filter`. No glassmorphism. If an overlay is needed (modal dim), use flat `rgba(13, 13, 13, 0.45)` on the backdrop only — the modal card itself is opaque white with a hard border and hero shadow.

### Layout rules

- **TopBar** is sticky, 72px, always-visible, 2.5px black bottom border.
- **BottomTabBar** is sticky, 68px, always-visible, 2.5px black top border. 3 tabs for Operativo, 6 for Director.
- **Content scrolls between them.** Main content area gets 16–20px horizontal padding, a vertical rhythm of 16–24px between section groups.
- **Floating elements:** a single yellow FAB is acceptable above the BottomTabBar for primary action ("+ Nueva venta") on mobile Operativo; desktop replaces this with a permanent primary Btn in the TopBar right slot.

### Component personality

- **Cards** always have a border AND a shadow. A border without a shadow reads "input field"; a shadow without a border reads "native iOS" (wrong brand). Both = "Cachink card".
- **Buttons** come in 6 variants (`primary` · `dark` · `green` · `danger` · `soft` · `ghost`). All 6 share the same border + shadow + press mechanics — only the fill color changes.
- **Inputs** have border but no shadow. On focus, border bumps to 2.5px.
- **Tags** are full pills (radius 20, matches §8.3 scale position 6), 2px border, pastel fill. Not interactive by default.

---

## ICONOGRAPHY

The Cachink codebase does **not** ship an icon font or SVG set in Phase 1A. The `BottomTabBar` and `Btn` components accept an `icon` prop of type `ReactNode` that "Phase 1A intentionally does not pick an icon library — the choice is deferred to Phase 1C, where concrete screen needs will inform the decision. Stories use emoji placeholders." (quoted from `bottom-tab-bar.tsx`).

**What this means for this design system:**

- **Recommended icon library for new design work: [Lucide](https://lucide.dev)** — linked via CDN (`https://unpkg.com/lucide-static@latest/icons/*.svg`). Lucide's **2px stroke, rounded caps** match the Cachink line weight exactly. Use Lucide at **stroke-width: 2.25–2.5** to read as "a little chunkier" — consistent with the 2px borders everywhere else.
- **⚠️ Flagged substitution:** this is a *default chosen by the design system*, not one pulled from the repo. When Phase 1C lands, update this section to match whatever the real shipping icon set becomes.
- **Emoji usage:** permitted only in `<EmptyState>` as the visual glyph (📭 for empty list, 🛒 for no ventas yet, 📦 for no inventario, 💰 for no ingresos yet). Never in buttons, titles, or KPIs.
- **Unicode glyphs as icons:** avoid. Use a real SVG or skip the icon.
- **PNG icons:** only the brand masters in `assets/` — `icon.png`, `icon-padded.png`, `logo.png`, `splash-*.png`. No PNG icons for in-product UI.
- **SVG inline colors:** always `currentColor` on stroke; set color at the parent via `color: var(--black)`.

**Sizing:**

- BottomTabBar tab icon: 24×24
- Btn leading icon: 18×18 (md), 16×16 (sm), 20×20 (lg)
- TopBar action icon (right slot): 22×22

**Brand coin silhouette** (the dollar coin from `icon.png`) may be used as a decorative accent in splash-like contexts — small, floating, black-stroke-only versions like those in `splash-mobile.png`. Use a traced SVG of the logo coin, never a raster PNG, when used at small sizes.

---

## Caveats

- The **900-weight Plus Jakarta Sans** is requested for headings but Google Fonts tops out at 800; expect a synthetic-bold substitution. If print-perfect weight-900 is required, ask the design team to export a TTF/OTF.
- **Icons are substituted with Lucide** (CDN). Confirm with the Cachink eng team whether Lucide is the intended Phase 1C library.
- **No slide template / deck materials were provided**, so no `/slides/` folder exists in this system.
- **Only the mobile UI kit** is built. The desktop Tauri shell is a thin wrapper around the same `packages/ui` components per CLAUDE.md §5 — so a dedicated desktop kit would be largely redundant. Can be added if requested.
