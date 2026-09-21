# Handoff: Xangarro! Portal (Director / Desktop Web)

## Overview

The **Xangarro! portal** is the desktop-web companion to the Xangarro mobile app — a
financial control and micro-POS product for Mexican *emprendedores*. The mobile app is
where **operadores** capture ventas, egresos and inventory movements at the counter. The
portal is where the **dueño/director** reads what was captured: daily summaries, NIF
financial statements, product and inventory state, team and device status, sync health,
business data and subscription.

This bundle covers **nine screens** plus a full auth/onboarding entry point. The operator
mobile app already exists and is **out of scope** for this handoff.

Language is **100% Spanish (es-MX)** and must stay that way — module names, buttons,
toasts, errors. Currency is MXN, dates are `es-MX` with lowercase month names.

## About the Design Files

The files in this bundle are **design references created in HTML** — prototypes showing
intended look and behavior, **not production code to copy directly**. They are authored as
"Design Components" (`.dc.html`): a template plus a logic class, rendered by a runtime
(`support.js`) that is part of the design tool, not of any shipping product. The inline
`style="…"` attributes, the `<sc-if>` / `<sc-for>` template tags and the `renderVals()`
method are artifacts of that authoring environment.

**The task is to recreate these designs in the target codebase's existing environment**
(React, Vue, SwiftUI, native — whatever the app already uses), using its established
patterns, component library and styling approach. Per the product's architecture contract
the shipping desktop client is a Tauri shell over the same `packages/ui` React components
as mobile, so in practice these screens should be rebuilt from those primitives (`Btn`,
`Card`, `Input`, `Tag`, `TopBar`, `Kpi`, `Gauge`, `EmptyState`, `SectionTitle`).

Do **not** ship the `.dc.html` files, and do not port the inline styles verbatim — map them
onto the existing theme tokens listed under *Design Tokens*.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, borders, shadows, copy and
interaction states. Every value in this README is the value used in the prototypes. The UI
should be recreated pixel-accurately using the codebase's existing libraries.

Two caveats:
- **Data is fictional.** "Taquería Don Pedro", Ana Robledo, Luis Ortega, the amounts and the
  invoice folios are sample content for the mock. Only the **Suscripción pricing** is real
  (see that screen).
- **Charts are hand-authored SVG** in the prototypes (fixed `viewBox`, hardcoded point
  lists). Rebuild them with the codebase's charting solution; the point data is illustrative.

---

## Visual foundation

The product is **neobrutalist-yellow**. The rules below are not stylistic suggestions — they
are what makes the UI recognizably Xangarro, and they apply to every surface.

- **Yellow `#FFD60A` is the hero color.** Used generously: primary buttons, active nav items,
  active tabs, hero KPI cards, the auth panel.
- **Black `#0D0D0D` is the only border color.** `2px` on most primitives, `2.5px` on hero
  cards, sticky bars and modal/drawer frames. Never gray, never dashed, never thinner.
- **Shadows are hard drops with zero blur and zero alpha**: `3px 3px 0` (small),
  `4px 4px 0` (card), `5px 5px 0` (hero). No `rgba()` shadows, no inner shadows, no soft
  shadows.
- **No gradients anywhere.** No textures, no grain, no blur, no glassmorphism.
- **Press = "stamp".** Every pressable element shifts `translate(2px, 2px)` and its shadow
  shrinks to `1px 1px 0`, over ~100ms, easing `cubic-bezier(0.2, 0.8, 0.2, 1)`. Release
  returns to rest. **Motion is press-only** — no hover translate, no scroll animation, no
  shimmer skeletons (loading uses static gray blocks).
- **Cards always have a border AND a shadow.** Border without shadow reads as an input
  field; shadow without border reads as native iOS (wrong brand).
- **Inputs have a border but no shadow.** On focus the border goes to `2.5px`.
- **Tags are full pills** (`border-radius: 9999px`), `2px` border, pastel fill, not
  interactive by default.

### Typography

- **Plus Jakarta Sans** for all UI text — weights 400/500/600/700/800.
  - Headings: weight 800, letter-spacing `-0.02em` → `-0.04em`.
  - Body: weight 600, color `--ink`.
  - Uppercase labels/eyebrows: weight 700, letter-spacing `+0.05em` → `+0.08em`, color
    `--gray-600`.
- **Anton** (Google Fonts, single weight) **for the wordmark only** — "XANGARRO!" set in
  caps, `letter-spacing: -0.005em`, `line-height: 0.92`. This is a deliberate exception to
  the single-typeface rule and must not spread to UI text.

### The brand lockup

A yellow coin — `border-radius: 9999px`, `2.5px` black border, `3px 3px 0` black shadow —
carrying a **black X** (two strokes, `stroke-width: 4.6` on a `24×24` viewBox, `butt` caps,
sized at 60% of the coin). Sidebar coin is `38×38`; the auth screen uses `clamp(38px, 4.4vw, 50px)`.
In the sidebar the coin sits **left** of the wordmark so it survives the icon-rail collapse.

**Do not** use the Cachink brand PNGs from the design system for this product — they carry a
different wordmark. **Do not** generate or embed third-party platform logos (Apple, Android);
the device rows use Lucide-style outline glyphs plus a plain text platform label.

### Iconography

**Lucide**, drawn inline as `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">`
with `stroke-width` **2.2–2.4** (chunkier than Lucide's default, to match the 2px borders),
`stroke-linecap="round"`, `stroke-linejoin="round"`. Color is always inherited via
`currentColor`. Sizes: nav 20px, inline/button 17–19px, empty-state glyph 30–34px.

Emoji are permitted **only** as the visual in an empty state (`🛒` no ventas, `📦` no
inventario, `📭` nothing to show) and nowhere else.

---

## Application shell

Every portal screen (all except Acceso y onboarding) shares one shell. Build it **once** as a
layout component.

### Sidebar

- `position: sticky; top: 0; height: 100vh`, `background: --white`,
  `border-right: 2.5px solid --black`, `flex: none`.
- Width **248px** expanded, **84px** icon rail. The rail engages automatically below
  **1024px** viewport width and is also togglable.
- **Brand block**: `min-height: 76px`, `padding: 0 16px`,
  `border-bottom: 2.5px solid --black`, `gap: 11px`. Coin + "XANGARRO!" (wordmark hidden in
  rail mode). **This 76px must equal the header height exactly** — the sidebar's bottom
  border and the header's bottom border form one continuous line.
- **Nav**: `padding: 14px 12px`, `gap: 5px`, scrolls independently
  (`flex: 1; min-height: 0; overflow-y: auto`).
- **Nav item**: real `<a href>` (not a div — cross-screen navigation must work),
  `height: 46px`, `border-radius: 14px`, `padding: 0 12px`, `gap: 12px`, icon 20px, label
  15px/`-0.01em`, `text-decoration: none`, `color: --black`. Inactive: transparent
  background, `2px solid transparent` border (reserved so the box doesn't shift), no shadow,
  weight 700. **Active**: `background: --yellow`, `2px solid --black`, `3px 3px 0 --black`,
  weight 800. Press behavior as per the stamp rule. In rail mode the label is removed and
  `title` carries it.
- **Section divider** after *Dispositivos*: uppercase eyebrow "Configuración" (12px/700/
  `0.08em`, `--gray-600`) plus a `2px --gray-200` rule, `padding: 14px 4px 6px`.

**Nav order** (label → screen):

| Label | Screen |
|---|---|
| Inicio | Inicio |
| Ventas | Ventas y gastos (Ventas tab) |
| Gastos | Ventas y gastos (Gastos tab) |
| Estados financieros | Estados financieros |
| Productos | Productos |
| Operadores | Operadores y dispositivos (Operadores tab) |
| Empleados | Empleados |
| Dispositivos | Operadores y dispositivos (Dispositivos tab) — divider after |
| Sincronización | Sincronización |
| Negocio | Negocio |
| Suscripción | Suscripción |

Note that **Ventas/Gastos** and **Operadores/Dispositivos** are two nav entries each
pointing at one screen with a different tab preselected.

### Header

- `position: sticky; top: 0; z-index: 30`, `height: 76px`, `padding: 0 32px`,
  `background: --gray-200`, `border-bottom: 2.5px solid --black`.
- Inner row capped at `max-width: 1760px`, `margin: 0 auto` — matching the main content cap
  so header and content align.
- **Left — business switcher**: `2px --black`, `radius 14px`, `--white`, `3px 3px 0`,
  `padding: 6px 12px`, `gap: 11px`. A `30×30` yellow tile (`radius 10px`, `2px` border) with
  2-letter initials; business name 15px/800/`-0.01em`; below it a yellow "Emprendedor" pill
  and the uppercase role label (12px/700/`0.05em`, `--gray-600`). Chevron 18px. On Inicio
  this opens a **320px** dropdown (`2.5px` border, `radius 16px`, `5px 5px 0`, `padding 10px`)
  listing the user's businesses with initials tile, name, role and a check on the current one;
  the active row is tinted `--yellow-soft`. Dropdown animates in over 140ms
  (`translateY(-5px)` → 0, opacity 0 → 1) and closes on outside pointerdown.
- **Right**: a sync status pill (full pill, `2px` border, `padding: 7px 14px`, an `11px`
  bordered dot plus 13px/700 label) and a `34×34` circular avatar (`2px` border,
  `--blue-soft` fill, `--blue-text` initials, `3px 3px 0`). On Inicio the avatar opens a
  **272px** menu with name, email and "Cerrar sesión".
- **The sync pill must tell the truth.** It shows `"{n} registros no enviados"` on
  `--warning-soft` with a `--warning` dot when a queue exists, and only says "Sincronizado"
  when the queue is empty. Do not hardcode a label independent of the count.

### Main

- `padding: 28px 32px 96px`; inner column `max-width: 1760px; margin: 0 auto`,
  `display: flex; flex-direction: column; gap: 20px`.
- **Page ground is `--gray-200`**, deliberately darker than the app's `--offwhite`, so white
  cards read as floating panels.
- **Page title block**: `<h1>` 36px/800/`-0.03em`/`line-height: 1.05`, plus a 15px/600
  `--gray-600` subtitle 6px below. Primary action(s) right-aligned on the same row,
  `flex-wrap: wrap`.

### Standard controls

- **Primary button**: `height: 48px`, `padding: 0 20px`, `--yellow`,
  `2.5px --black`, `radius 16px`, `4px 4px 0`, label 13px/700/`0.08em`/uppercase. Hover
  darkens to `--yellow-deep` (`#F5C800`) — the only permitted hover color change.
- **Secondary button**: same geometry, `--white` fill.
- **Dark button**: `--black` fill, `--white` text.
- **Danger button**: `--red-soft` fill, `--red-text` text.
- **Small button**: `height: 42–46px`, `radius 12px`, `3px 3px 0`, label 12px.
- **Segmented tab bar** (Ventas/Gastos, Productos, Empleados, Operadores): one
  `inline-flex` container, `2.5px --black`, `radius 16px`, `--white`, `4px 4px 0`,
  `overflow: hidden`; each tab `height: 52px`, `padding: 0 24px`, label 14px/800/`0.04em`/
  uppercase, plus a count pill; tabs after the first carry
  `border-left: 2.5px solid --black`; the active tab is filled `--yellow` and its count pill
  turns `--white` (inactive: `--gray-100`).
- **Table**: header row `height: 52px`, `--gray-100`,
  `border-bottom: 2.5px --black`, labels 12px/700/`0.07em`/uppercase/`--gray-600`. Body rows
  `min-height: 56px` (comfortable density), `border-bottom: 2px --gray-200`, hover
  `--yellow-soft` over 90ms, selected row stays `--yellow-soft`. Layout is CSS grid with
  fixed px track widths plus one `minmax(240px, 1fr)` flexible column; wrapped in
  `overflow-x: auto` with a `min-width` so it scrolls inside its card instead of breaking the
  page. Money cells are right-aligned with `font-variant-numeric: tabular-nums`.
- **Detail drawer**: `position: fixed`, full height, flush to the right edge,
  `width: min(460px, 100vw)`, `border-left: 2.5px --black`, slides in 160ms
  (`translateX(24px)` → 0, opacity 0 → 1) over a flat `rgba(13,13,13,0.45)` backdrop.
  Header is 76px, tinted by record type, with a `40×40` close button. Body scrolls; footer is
  pinned with `border-top: 2.5px --black`. Closes on backdrop click, on the close button, and
  on **Escape**.
- **KPI card**: `--white`, `2px --black`, `radius 16px`, `4px 4px 0`, `padding: 20px`;
  uppercase eyebrow, then a 34px/800/`-0.04em` tabular figure, then a 14px/600 `--text-muted`
  hint. Cards sit in `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))` so four
  KPIs fill wide screens and reflow gracefully.
- **Hover lift** (cards only): `translate(-1px, -1px)` with the shadow growing to
  `6px 6px 0`, 120ms. This is the one non-press motion in the product.

### Focus and accessibility

- `*:focus-visible` → `3px solid --yellow` outline, `offset: 1px`, plus
  `inset 0 0 0 2px --black` so the ring is visible against yellow surfaces.
- Elements **on** yellow get the inverse: `3px solid --black`, `offset: 2px`, no inset.
- Every interactive div carries `role` (`button` / `link` / `tab` / `radio` / `checkbox`) and
  `tabindex="0"`; tabs carry `aria-selected`, disclosures `aria-expanded`, radios
  `aria-checked`. **In the rebuild, use real semantic elements instead** — these roles exist
  only because the prototype could not.
- Text contrast is ≥ 4.5:1. Note `--gray-400` (`#C9C9C4`) is decorative only (dots,
  excluded-feature dashes) and must never carry text.
- All animation is wrapped in `@media (prefers-reduced-motion: reduce)` which disables it
  entirely.

### The four data states

**Every portal screen implements all four.** They are mutually exclusive and swap the main
content area only — shell, title and filters stay.

1. **`happy`** — populated content.
2. **`loading`** — static gray blocks: `--gray-100` fills with the real borders and shadows
   in place, sized to the content they replace, plus an uppercase "Cargando…" line.
   **Never a shimmer or a spinner.**
3. **`empty`** — centered card (`2.5px` border, `radius 18px`, `5px 5px 0`,
   `padding: 64px 24px`): a `76×76` `--yellow-soft` tile with a `2.5px` border and
   `4px 4px 0` shadow holding an icon or a single emoji; a 24px/800/`-0.03em` title; a
   `max-width: 46ch` 15px/600 `--text-muted` body with `text-wrap: pretty`; and one primary
   CTA (hidden for read-only roles).
4. **`error`** — same card shape, `--red-soft` tile, `--red-text` icon, and a **dark**
   "Reintentar" button. Error copy must reassure that nothing was lost: offline capture is a
   core promise of the product.

### Roles

Three roles: **owner** (Dueño), **admin** (Administrador), **viewer** (Solo lectura).

- `viewer` sees no create/edit/delete affordances anywhere. Read-only actions (Exportar,
  Informe PDF, Compartir comprobante) remain available to everyone — this is why Estados
  financieros has no gating at all.
- Some screens restrict further to **owner only**: Suscripción (plan changes, payment
  method), Sincronización (changing sync mode), Negocio (editing business data, archiving).
- Gating hides the control rather than disabling it, except where a disabled state carries
  meaning (the current plan's CTA on Suscripción).

---

## Screens

### 1. Acceso y onboarding

**File:** `Xangarro Portal - Acceso y onboarding.dc.html`
**Purpose:** sign in, sign up, recover access, and a 5-step first-run wizard.

**Layout.** Two columns via
`display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr))` — so it
gracefully becomes one column on narrow viewports.

**Left column — brand panel.** Flat `--yellow`, `border-right: 2.5px --black`,
`padding: clamp(22px, 4.5vh, 56px) 48px`, `height: 100vh`, `position: sticky; top: 0`,
`align-self: start`, `overflow: hidden`, `gap: clamp(14px, 3vh, 40px)`. Stacked top to
bottom, each block at full column width:

1. **Wordmark row** — "XANGARRO!" in Anton at `clamp(34px, 4.6vw, 54px)` plus the X coin.
2. **Hero image** — a `1983×793` (2.5:1) flat-vector illustration of a taquería vendor
   holding a phone, in the brand palette, with the right third left empty. Framed in a
   `2.5px --black` / `radius 18px` / `5px 5px 0` box with `aspect-ratio: 1983/793`,
   `box-sizing: border-box`, `object-fit: cover`. **The box must keep the asset's aspect
   ratio** — any other ratio either crops the subject or leaves the artwork floating in dead
   yellow.
3. **A four-scene looping animation** (see below).
4. **Headline** — "Finanzas para emprendedores." at `clamp(30px, 4.2vw, 48px)`/800/
   `-0.04em`, pinned to the bottom with `margin-top: auto`, plus a two-line 
   `clamp(15px, 1.6vw, 17px)`/600 subhead.

The panel is `height: 100vh` and sticky **specifically** so its content lays out against the
viewport rather than stretching to the (taller) form column and pushing the headline past the
fold.

**Right column — form card.** Centered, `max-width: 460px`, `--white`, `2.5px --black`,
`radius 18px`, `5px 5px 0`, `padding: 36px`. Five variants, all fading in over 160ms:

- **Entra a tu portal** — 30px/800 title; "Aquí ves lo que capturan tus operadores.";
  Correo and Contraseña fields (`height: 52px`, `radius 12px`, `2px --black`, `--offwhite`
  fill, 16px/600 text) with uppercase labels and an "Olvidé mi contraseña" link on the
  password row; full-width yellow **ENTRAR**; an "O" rule; a secondary "Entrar con un código
  de dispositivo"; and a footer "¿Todavía no tienes cuenta? **Crea tu negocio**".
  The **error** state adds a `--red-soft` inline alert ("Tu correo o contraseña no
  coinciden. Inténtalo otra vez.") and bumps the password border to `2.5px --red`. The
  **loading** state changes the CTA to "Entrando…".
- **Crea tu negocio** — Tu nombre / Nombre del negocio / Correo / Contraseña, a checked
  yellow consent checkbox ("Acepto el aviso de privacidad y los términos de uso de
  Xangarro."), and "Crear mi negocio".
- **Recupera tu acceso** — back link, explanatory copy, Correo, "Enviar código".
- **Escribe tu código** — six `64px`-tall digit boxes (`radius 12px`, `3px 3px 0`; the
  active box gets a `2.5px` border and `--white` fill against `--offwhite`), "Confirmar", and
  a "Puedes pedir otro código en 00:48." note.
- **Onboarding wizard** — a "Paso {n} de 4" eyebrow with the step name, a four-segment
  progress bar (`14px` tall, `2px` border, `radius 8px`; done segments `--yellow`, pending
  `--gray-100`), then the step card. Steps:
  1. **Negocio** — Nombre del negocio, Giro, Ciudad.
  2. **Datos fiscales** — RFC, Régimen, Inicio de tu ejercicio.
  3. **Sincronización** — four radio cards: *Solo este dispositivo*, *En la nube*,
     *Conectar a un servidor local*, *Ser el servidor local*. Selected card is
     `--yellow-soft` with a `3px 3px 0` shadow and a checked yellow dot.
  4. **Dispositivo** — the 6-character pairing code in six `52×66` yellow boxes
     (`2.5px` border, `4px 4px 0`) plus a numbered "Cómo se usa" explainer.
  5. **Listo** — four green confirmation rows and an "Ir a mi portal" link to Inicio.
  Footer: "Atrás" (hidden on step 1 and the final step) and "Continuar" / "Ya lo vinculé";
  a "Configurar después" link sits below the card.

**The looping animation.** Four scenes cycling continuously — **6s / 3.5s / 5s / 5.5s,
20s total**:

1. *Captura en el mostrador* — a phone mock; its COBRAR button presses at 20–30% of the
   scene, a "+$145.00" pill then flies from the phone into a "Ventas de hoy" card and lands
   as a new row while the card's total counts 4,705 → 4,850.
2. *Cada venta, al instante* — three pale-gold coins (`--yellow-soft`, `2.5px` border,
   `4px 4px 0`) drop in with a bounce and stack, while "Cobrado hoy" counts 0 → $4,850.00 and
   black sparkle marks pop.
3. *Del ticket al estado* — a receipt slides down, three lines print in sequence, then an
   "Estado de resultados · Mayo 2026" card folds in beside it.
4. *Tus números del día* — four ventas/gastos bar pairs stamp up (green `#00C896` /
   red `#FF4757`), then a "Utilidad de hoy" badge pops and counts 0 → $3,610.00.

Implementation notes that matter:
- The scenes are authored on a **fixed 460×200 canvas** that is uniformly scaled to fit its
  container (`transform: scale()`, measured with a `ResizeObserver`). Every inner size is
  therefore a plain pixel value. Do **not** make the scene internals viewport-relative —
  that was tried and every fixed-height child overflowed its box.
- Keep the canvas's aspect ratio close to its container's, or the height term binds the
  scale and the text becomes illegibly small.
- Counters are written straight to the DOM from a single `requestAnimationFrame` loop
  (no re-render per frame); only the scene index lives in state.
- Scenes cross-fade: each fades in over 360ms and out over the last 360ms of its slot.
- The loop **pauses whenever an input is focused** — it sits next to a password field.
- Under `prefers-reduced-motion` it holds scene 4 (the payoff) with final values.

---

### 2. Inicio

**File:** `Xangarro Portal - Inicio.dc.html`
**Purpose:** the director's morning glance — is the business healthy, is anything stuck.

Top to bottom:

- **Rejection banner** (`happy` only) — `--red-soft`, `2.5px` border, `radius 16px`,
  `4px 4px 0`: a `40×40` white tile with a `--red-text` alert icon, "3 registros no se
  pudieron sincronizar." / "Revísalos para que tus números cuadren.", and a "Revisar" button.
- **Title** "Hola, Pedro" with the full date ("martes 12 de mayo de 2026"), plus "Nuevo
  producto" (owner/admin) and "Exportar".
- **Hero row** — `repeat(auto-fit, minmax(340px, 1fr))`:
  - **Utilidad del mes** on flat `--yellow` (`2.5px`, `radius 18px`, `5px 5px 0`,
    `padding: 28px`): eyebrow, a **56px**/800/`-0.04em` tabular figure ($15,197.62), the
    period range, a green-dot line "Tu negocio fue rentable este periodo.", a dark "Ver
    estados" link to Estados financieros, and "12% vs mes anterior" with an up arrow.
  - **¿Cómo empiezo?** checklist: a `14px` yellow progress bar at 50%, six rows with `24×24`
    check badges (done → `--green-soft` fill and a check, muted label; pending → white fill,
    black label), and a "Continuar configuración" button.
- **Resumen de hoy** — three KPI cards (Ventas hoy `--green-text`, Gastos hoy `--red-text`,
  Utilidad hoy black) at 36px, each with a hint line and an underlined blue "Ver ventas" /
  "Ver gastos" link with a trailing arrow.
- **Últimos 30 días** — a line chart of ventas vs gastos on a `560×190` viewBox, two
  3.5px polylines (green/red) that draw in over 900ms (`stroke-dasharray` 1200 →
  `stroke-dashoffset` 0, red delayed 120ms), with axis labels and a legend.
- **Caja** — per-device shift cards: device name, a state pill with a dot (Turno abierto →
  `--green-soft`, Caja cerrada → `--gray-100`), the operator, and a footer row with the last
  corte date and its result ("Cuadra" on `--gray-100`, "Falta $60.00" on `--red-soft`).
- **Stock bajo** — a 40px `--red-text` count, three product rows with `34×34` icon tiles and
  `--red-soft` stock pills, and a "Ver productos" link.
- **Actividad reciente** — six rows: a `36×36` circular badge (`$` on `--green-soft` for
  ventas, `−` on `--red-soft` for gastos), the concepto, a tag pill plus "operator · time",
  and a signed amount (`+$75.00` green / `−$420.00` red).

---

### 3. Ventas y gastos

**File:** `Xangarro Portal - Ventas y gastos.dc.html`
**Purpose:** the full transaction ledger, filterable, with a detail drawer.

- Title "Movimientos" / "Todas las ventas y gastos capturados en tus dispositivos"; primary
  CTA is "Nueva venta" or "Nuevo gasto" depending on tab; "Exportar" alongside.
- **Tabs** Ventas (254) / Gastos (86).
- **Four KPIs per tab.** Ventas: Ventas del periodo $68,420.00, Ticket promedio $269.37,
  Efectivo en caja $21,180.00, Cuentas por cobrar $3,940.00 (`--warning-text`). Gastos:
  Gastos del periodo $53,222.38, Mayor categoría $24,610.00 (Materia Prima · 46%), Nómina
  $16,800.00, Sin factura $7,310.00.
- **Filter bar** — a search field (`height: 46px`, `radius 12px`, `--offwhite`, magnifier
  icon, placeholder "Buscar por concepto, folio u operador"), four range chips (Hoy /
  Semana / Mayo 2026 / Personalizado — selected is `--yellow` with a `3px 3px 0` shadow), and
  a "Filtros" toggle. Expanding it reveals a `--white` panel of chip groups: for Ventas
  Método de pago (Efectivo, Transferencia, Tarjeta, QR / CoDi, Crédito), Operador,
  Dispositivo; for Gastos Categoría (Materia Prima, Nómina, Renta, Servicios, Insumos,
  Mantenimiento), Operador, Comprobante.
- **Table** — Fecha (date + time stacked), Concepto (circular `$`/`−` badge, label, and a
  "Sin enviar" `--warning-soft` pill when queued), Método de pago / Categoría (pill),
  Operador, Dispositivo, Monto (right-aligned, signed, colored). 10 rows per page, then a
  footer with "Mostrando 10 de 254 movimientos" and pagination.
- **Detail drawer** — header tinted `--green-soft` (venta) or `--red-soft` (gasto); a big
  amount block (`--yellow` for ventas, `--white` for gastos) with a 44px figure and a
  date/time stamp; a field list (Método de pago / Categoría, Operador, Dispositivo, Folio,
  Turno, Comprobante / Factura); a line-item list when the sale has products; a sync status
  block (`--green-soft` "Sincronizado" / `--warning-soft` "Pendiente de sincronizar" with
  reassuring copy); and footer actions "Compartir comprobante" plus a danger "Cancelar".
- **The prototype-controls FAB is suppressed while the drawer is open** — otherwise it
  covers the drawer's footer buttons.

---

### 4. Estados financieros

**File:** `Xangarro Portal - Estados financieros.dc.html`
**Purpose:** NIF-compliant statements for the director and their contador.

- Title plus "Exportar Excel" and "Informe mensual PDF" — both available to **all roles**.
- **Period switcher**: Mensual / Trimestral / Anual / Personalizado as a bordered segmented
  control (`height: 44px`, `radius 14px`, `3px 3px 0`).
- **Statement tabs**: Resultados / Posición / Flujo / Indicadores, in the same bordered
  segmented style (`height: 52px`, `padding: 0 26px`) — deliberately **not** folder tabs.
- **ISR notice** — an inline "ISR referencial (1.25%)" card: "La cifra de ISR es orientativa.
  Consulta a tu contador antes de declarar." with a learn-more button. This disclaimer must
  survive into production.
- **Statement lines** are expandable: each row has a label (size/weight varying by
  hierarchy level), an optional subtitle, a `23×23` circular disclosure toggle, and a
  tabular amount. Totals are heavier and rule off.
- Flujo groups (Operación, Inversión) are collapsible cards.
- Indicadores presents ratio cards.

---

### 5. Productos

**File:** `Xangarro Portal - Productos.dc.html`
**Purpose:** the catalog and the inventory ledger.

- Tabs **Catálogo** (48) / **Movimientos** (412); CTA "Nuevo producto" or "Registrar
  movimiento".
- **Low-stock banner** (Catálogo only) — `--red-soft`: "3 productos están por debajo de su
  umbral." / "Repón antes de que tus operadores se queden sin qué vender." with a "Ver stock
  bajo" button that **applies the stock-bajo filter**.
- **KPIs.** Catálogo: Productos activos 48, Valor del inventario $38,640.00, Stock bajo 3
  (`--red-text`), Margen promedio 56% (`--green-text`). Movimientos: Movimientos del mes 412,
  Entradas 86, Mermas 14, Ajustes manuales 9.
- **Filter chips** are functional, not decorative: Catálogo filters to Todos / Platillos /
  Insumos / Stock bajo; Movimientos filters to Todos / Ventas / Entradas / Mermas. Switching
  tabs resets the filter to "Todos" because the keys are not shared. The row counters in the
  footers reflect the filtered length.
- **Catálogo table** — Producto (initial tile colored by category, name, SKU, plus an
  "Inactivo" pill), Categoría pill (Platillo `--yellow-soft`, Bebida `--blue-soft`, Materia
  Prima `--peach-soft`, Insumo `--gray-100`), Precio, **Existencias** (a `12px` mini bar —
  green above threshold, red below — plus "{stock} · umbral {n}"), Vendidos (mes), Margen
  (green at ≥55%).
- **Movimientos table** — Fecha, Producto, Tipo pill (Venta `--yellow-soft`, Entrada
  `--green-soft`, Merma `--red-soft`, Ajuste `--blue-soft`), Operador, Dispositivo, Cambio
  (signed `+18` / `−3`).
- **Product drawer** — yellow header with the category as eyebrow; two stat boxes (Precio,
  and Existencias tinted green or red by threshold); a field list (Clave, Umbral mínimo,
  Vendidos este mes, Margen, Costo unitario, Última actualización); that product's last
  movements; and actions "Ajustar inventario" (owner/admin) and "Ver ventas".

---

### 6. Operadores y dispositivos

**File:** `Xangarro Portal - Operadores y dispositivos.dc.html`
**Purpose:** who captures, from which device, and how current they are.

- Title "Tu equipo" / "Quién captura, desde qué dispositivo y qué tan al día está"; CTA
  "Nuevo operador" or "Vincular dispositivo".
- Tabs **Operadores** (4) / **Dispositivos** (3).
- **KPIs.** Operadores: Operadores activos 3, Turnos abiertos 1, Capturado hoy 20, Sin
  vincular 1. Dispositivos: Dispositivos vinculados 3, Al día 2, Registros pendientes 3,
  Último corte 11 may.
- **Operator cards** (`minmax(360px, 1fr)` grid) — a `48×48` circular avatar, name, uppercase
  role, and a state pill (Turno abierto `--green-soft` / Turno cerrado `--gray-100` /
  Escritorio `--blue-soft` / Sin vincular `--warning-soft`); two inset stat boxes (Capturó
  hoy, Cobrado hoy); a footer with device and last-seen.
- **Pairing panel** (Dispositivos, owner/admin) — flat `--yellow`: "Código de vinculación
  activo", "Escríbelo en el teléfono del operador. Vence en 09:42.", the six-character code
  in `44×56` white boxes (`2.5px`, `radius 12px`, `3px 3px 0`, 26px/800), and a dark
  "Generar otro".
- **Device cards** — a `44×44` icon tile, name, model, state pill; rows for Operador, Última
  sincronización and Turno; plus a `--warning-soft` strip "{n} registros esperando conexión"
  when queued.
- **Drawer** — operators get fields plus recent shifts and permission pills
  (`--green-soft`), with "Editar permisos" / "Desactivar"; devices get fields plus recent
  cortes, with "Forzar sincronización" / "Desvincular".

---

### 7. Empleados

**File:** `Xangarro Portal - Empleados.dc.html`
**Purpose:** the people record — payroll, staff data and attendance, **including people who
never touch the app**. This is the HR view; *Operadores* is the app-access view. Someone can
appear in one and not the other.

- Title "Empleados" / "Quién trabaja contigo, cuánto le pagas y cuándo asistió"; CTA "Nuevo
  empleado" or "Registrar nómina". A header chip reads "Nómina de la semana por pagar"
  (`--warning` dot) — it must agree with the payroll rows, not contradict them.
- Tabs **Personas** (6) / **Nómina** (6) / **Asistencia** (4).
- **KPIs.** Personas: Empleados activos 5, Con acceso a la app 2, Nómina de la semana
  $8,150.00, Horas de la semana 168 h. Nómina: Nómina de la semana $8,150.00, Pagado en mayo
  $16,300.00, Promedio semanal $7,750.00, Peso sobre tus ventas 12%.
- **Personas table** — Empleado (circular avatar, name, puesto), Contrato pill (Fijo
  `--green-soft`, Por horas `--yellow-soft`, Temporal `--gray-100`), Ingreso, Acceso a la app
  ("Sí · operadora" / "Invitada" / "No" — muted when No), Sueldo semanal, Estado pill with a
  dot.
- **Nómina table** — Periodo, Empleados, Registrado por, Total (`--red-text`), Estado.
  **Newest first, and the pending run leads the list** with a `--yellow-soft` row tint —
  every list in this portal is newest-first and the actionable row must not sit below settled
  ones. A footer notes that each payroll payment is also recorded as a gasto, linking to
  Ventas y gastos.
- **Asistencia** — a week grid: employee column plus seven day cells (`34px` tall,
  `radius 10px`, `2px` border) reading "8h" on `--green-soft`, "4h" on `--yellow-soft` or
  "—" on `--gray-100`, with an hours total and a legend.
- **Drawer** — the weekly salary as a hero figure with a note on how it's calculated, a field
  list (Contrato, Fecha de ingreso, Acceso a la app, Estado, Horas de la semana, Último pago),
  recent payments, and "Editar datos" / "Dar de baja".

---

### 8. Sincronización

**File:** `Xangarro Portal - Sincronizacion.dc.html`
**Purpose:** where the data lives and what is still queued.

- Title "Sincronización" / "Dónde viven tus datos y qué falta por enviar"; "Sincronizar
  ahora" (owner only, **and only when a sync target exists**).
- **Pending banner** — `--warning-soft`: "3 registros esperan conexión." / "Están guardados
  en el Android de la barra. Nada se pierde."
- **Modo actual** on flat `--yellow`: the mode name at 34px, its description, and either
  "Última sincronización: hoy 14:38" or, in local mode, "No se envía nada a ningún lado."
- **Resumen** card: Registros enviados hoy 43, Pendientes por enviar 3, Conflictos por
  resolver 0, Dispositivos conectados 3.
- **Four mode cards** (`role="radio"`, owner-editable) — *Solo este dispositivo* /
  *En la nube* / *Conectar a un servidor local* / *Ser el servidor local*, each with an icon
  tile, description and a meta line ("Incluido en tu plan", "Requiere la misma red wifi",
  "Este equipo debe quedarse encendido"). The active card is `--yellow-soft` with a `2.5px`
  border, `5px 5px 0` shadow and an "Activo" pill.
- **Dispositivos** — per-device cards with a platform icon tile, name, an uppercase platform
  label (iOS / Android / Escritorio), a state pill, last-sync time and pending count.
- **Historial** — a log of sync events with green check or amber warning badges.
- **Everything on this screen is derived from the selected mode.** In *Solo este dispositivo*
  there is no sync target, so the last-sync line, the pending banner, the "Sincronizar ahora"
  CTA, the device list and the history are all suppressed and replaced by a "Sin dispositivos
  ni historial" empty state; the summary switches to local figures. The header chip reads
  "Solo este dispositivo" in that mode, the pending count otherwise, and "Sincronizado" only
  at zero.

---

### 9. Negocio

**File:** `Xangarro Portal - Negocio.dc.html`
**Purpose:** the business profile that feeds statements and receipts.

- Title "Negocio" / "Los datos con los que armamos tus estados y tus comprobantes"; an
  "Editar datos" / "Dejar de editar" toggle (owner only).
- **Incomplete banner** — `--warning-soft`: "Falta tu domicilio fiscal." / "Sin él no
  podemos poner tus datos completos en los comprobantes." This stands in for an empty state.
- **Four section cards** (`minmax(420px, 1fr)`), each with a `38×38` icon tile and a 20px
  title, holding four fields:
  - **Datos generales** (`--yellow` tile): Nombre del negocio, Giro, Ciudad, Teléfono.
  - **Datos fiscales** (`--blue-soft`): RFC, Régimen, Domicilio fiscal *(empty — renders
    "Falta por completar" in `--warning-text`)*, Inicio del ejercicio.
  - **Contacto y comprobantes** (`--peach-soft`): Correo de contacto, WhatsApp para
    comprobantes, Leyenda en el ticket, Dirección que se imprime.
  - **Preferencias** (`--purple-soft`): Moneda, Zona horaria, Formato de fecha, Cierre de día.
- **Read mode** shows values as 16px/700 text; empty values show the "Falta por completar"
  placeholder in amber. **Edit mode** swaps every value for a `48px` input. Edit mode also
  shows a sticky yellow action bar: "Estás editando los datos de tu negocio." with "Cancelar"
  and a dark "Guardar cambios".
- **Archive row** (owner): "Cerrar este negocio" / "Se archivan tus registros y se
  desvinculan todos los dispositivos. No se borra nada." with a danger "Archivar negocio".

---

### 10. Suscripción

**File:** `Xangarro Portal - Suscripcion.dc.html`
**Purpose:** current plan, consumption, plan comparison and billing.

**The pricing on this screen is real.** Copy it verbatim; everything else on the screen is
sample data.

- Header chip shows the current plan ("Plan Emprendedor").
- **Tu plan** on flat `--yellow`: plan name at 44px, "$199.00 MXN / mes", "Siguiente cobro:
  01/jun/2026", and (owner) "Cambiar plan" / "Administrar pago".
- **Tu consumo este mes**: Usuarios "2 de 2" at 100% on a `--warning` bar; Registros del mes
  "340 · sin límite"; Dispositivos vinculados "3 · sin límite". **Only capped allowances
  render a progress bar** — drawing a bar against an unlimited quota misreports it.
- **Three plan cards** (`minmax(300px, 1fr)`):

  | | Freelancer | **Emprendedor** | MiPyme Pro |
  |---|---|---|---|
  | Pitch | Para empezar a ordenar tu negocio desde cero. | Para el negocio que ya vende y quiere crecer con control. | Para el negocio con equipo, múltiples roles y crecimiento acelerado. |
  | Price | **$0** · para siempre gratis | **$199** · MXN / mes | **$399** · MXN / mes |
  | CTA | Crear cuenta gratis | Empezar ahora | Probar 14 días gratis |
  | Eyebrow | Incluye | Todo en Freelancer, más: | Todo en Emprendedor, más: |

  - **Freelancer** — 1 usuario · Registro de ventas y gastos · Hasta 50 registros al mes ·
    Dashboard básico · *Sin inventario* · *Sin estados financieros NIF* · *Sin escaneo de
    código de barras*. The three "Sin …" lines render with a dash mark in `--gray-400` and
    muted text.
  - **Emprendedor** — 2 usuarios (dueño + empleado) · Inventario ilimitado · Escaneo de
    código de barras · Estados financieros NIF (B-2, B-3, B-6) · Roles Director / Equipo
    Operativo · Registros ilimitados · Reportes de ventas y gastos.
  - **MiPyme Pro** — 5 usuarios · Multi-sucursal (próximamente) · Reportes avanzados y
    comparativos · Exportación a PDF y Excel · Soporte prioritario por WhatsApp ·
    Configuración de permisos por usuario · Historial de auditoría completo.

  The **Emprendedor** card is the emphasis card: `--black` fill, `--yellow` plan name,
  `--white` price, `--gray-200` body text, `--yellow` check marks, a `5px 5px 0 --yellow`
  shadow, and a yellow CTA with a `--white` shadow. A pill badge overhangs its top-left
  corner (`top: -16px`).

  **The user's current plan must be marked and must not be sold back to them** — its badge
  reads "Tu plan actual", its CTA becomes a non-actionable "Este es tu plan" at 55% opacity
  with `cursor: default`. Decide what the badge shows when the promoted plan is *not* the
  current one ("El más popular" is the natural fallback).
- **Método de pago** — a card row with a `46×32` "VISA" tile, masked number, expiry and
  holder; "Cambiar tarjeta" (owner); and a `--green-soft` "Tu método de pago está al día."
  strip.
- **Comprobantes** — five invoice rows (date, folio, status pill, amount, download button).
- **Pause row** — "¿Quieres pausar tu suscripción?" / "Bajas al plan Freelancer y conservas
  tus registros. Puedes volver cuando quieras." with a danger "Cambiar a Freelancer".
- **Empty state** (no charges yet): "Todavía no hay cobros" / "Estás en el plan Freelancer,
  que es gratis para siempre. Cuando cambies de plan verás aquí tus comprobantes."

---

## Interactions & Behavior

| Behavior | Detail |
|---|---|
| Navigation | Sidebar `<a href>` per screen. Ventas/Gastos and Operadores/Dispositivos preselect a tab on a shared screen. |
| Tabs | Client-side; switching resets row selection and (on Productos) the filter key. |
| Drawers | Open on row/card click; close on backdrop, close button, or Escape. Suppress any floating overlay while open. |
| Filters | Must actually filter the rendered collection and update the row counters. A chip that only highlights is a bug. |
| Disclosures | Statement lines and flujo groups expand/collapse; state is per-row. |
| Dropdowns | Business switcher and user menu; 140ms reveal; close on outside pointerdown; `aria-expanded`. |
| Press | `translate(2px, 2px)` + shadow → `1px 1px 0`, 100ms, `cubic-bezier(0.2, 0.8, 0.2, 1)`. |
| Card hover | `translate(-1px, -1px)` + shadow → `6px 6px 0`, 120ms. |
| Loading | Static `--gray-100` blocks at content size. No shimmer. |
| Responsive | Sidebar → 84px rail below 1024px; tables scroll horizontally inside their card; KPI/card grids use `auto-fit` + `minmax`; content capped at 1760px. |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables all animation and transition. |

## State Management

Per-screen UI state in the prototypes (replace with the codebase's own patterns):

- `dataState`: `'happy' | 'loading' | 'empty' | 'error'` — a **mock switch**, not product
  state. In production this derives from the real request lifecycle.
- `role`: `'owner' | 'admin' | 'viewer'` — comes from the session in production.
- `tab`, `period`, `filter`, `range` — view selection.
- `selected` — the open drawer's record (`null` = closed).
- `editing` — Negocio read/edit toggle.
- `mode` — Sincronización sync mode.
- `rail`, `vw` — sidebar collapse, driven by a window resize listener.
- `expanded` maps — statement line and flujo group disclosures.
- `bizOpen`, `userOpen` — header dropdowns.
- `panelOpen` — the prototype controls panel. **Delete this entirely in production**; see
  below.

**Data the real screens need:** business profile and fiscal data; transactions (ventas,
egresos) with operator, device, payment method/category, folio, shift, line items and sync
status; products with stock, threshold, cost, margin and movement history; NIF statement
lines per period; operators with permissions and shifts; devices with sync state and pending
counts; employees with contract, salary, attendance and payroll runs; sync mode, queue and
event log; subscription plan, usage, payment method and invoices.

## Design Tokens

From the design system's `colors_and_type.css`. Use these tokens rather than raw hex where
the codebase already defines them.

**Brand**

| Token | Hex |
|---|---|
| `--yellow` | `#FFD60A` |
| `--yellow-deep` | `#F5C800` |
| `--yellow-soft` | `#FFFBCC` |

**Semantic** — each saturated color has a pastel `-soft` for fills. The `*-text` values below
are **darkened variants defined by these prototypes** (not in the design system) so semantic
text clears 4.5:1 on white; the raw saturated colors are for fills, bars, dots and strokes.

| Purpose | Fill | Soft | Text |
|---|---|---|---|
| Ingresos / success | `--green` `#00C896` | `--green-soft` | `--green-text` `#007E5E` |
| Egresos / danger | `--red` `#FF4757` | `--red-soft` | `--red-text` `#DA0013` |
| Info / nómina | `--blue` `#3B6FFF` | `--blue-soft` | `--blue-text` `#1D59FF` |
| Warning / pending | `--warning` | `--warning-soft` | `--warning-text` `#8E6600` |

**Neutrals**

| Token | Hex | Use |
|---|---|---|
| `--black` | `#0D0D0D` | every border, ink |
| `--ink` | `#1A1A18` | body text |
| `--text-muted` | `#6F6F6B` | secondary text *(prototype-defined)* |
| `--gray-600` | — | uppercase labels |
| `--gray-400` | `#C9C9C4` | decorative only, never text |
| `--gray-200` | — | page ground, inner rules |
| `--gray-100` | — | table headers, loading blocks |
| `--offwhite` | `#F7F7F5` | app background, input fills |
| `--white` | `#FFFFFF` | cards |

**Extra accents defined by these prototypes** (for category tiles and avatars):
`--purple-soft` `#F0E5FF`, `--peach-soft` `#FFE8D6`.

**Radii** — strict scale, do not invent values: `8` (bars, small marks), `10`, `11`, `12`
(inputs, small buttons), `14` (cards, drawer buttons), `16` (buttons, cards), `18` (hero
cards), `20`, `22` (phone bezel), `9999` (pills, coins, avatars).

**Borders** — `2px` standard, `2.5px` hero cards / sticky bars / drawer frames / modal frames,
`3px` the brand coin. Always `--black`.

**Shadows** — `3px 3px 0`, `4px 4px 0`, `5px 5px 0`, and `1px 1px 0` for the pressed state.
Always zero blur, zero alpha, `--black` (or `--yellow` / `--white` when stamped on dark).

**Spacing** — 4px base. Common values `5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48`.
Card padding 20–22 (standard) or 26–28 (hero). Grid gaps 16 (cards) / 20 (sections).
Main padding `28px 32px 96px`.

**Type scale** — 56 (hero figure), 44, 40, 36 (page title, KPI figure), 34, 30, 26, 24, 22,
20 (card title), 19, 17, 16, 15 (body/table), 14, 13, 12 (uppercase label), 11.
Line-height 1.02–1.15 for display, ~1.4 for body.

**Easing** — `cubic-bezier(0.2, 0.8, 0.2, 1)` everywhere. Durations: 90ms (row hover),
100ms (press), 120ms (card hover), 140ms (dropdown), 160ms (drawer, card fade), 360ms (scene
cross-fade), 420–480ms (print/bar reveals), 900ms (chart draw).

## Assets

- **Hero illustration** — `assets/hero-taqueria.png`, `1983×793` PNG. A flat 2D vector
  illustration of a taquería vendor holding a phone: uniform ~3px black outlines, flat fills,
  no gradients or shading, palette limited to the brand tokens, sparse black sparkle marks and
  two small coin silhouettes, with the right third intentionally empty. Generated from a text
  prompt for the prototype — **replace with a licensed or commissioned asset before
  shipping**, and keep the 2.5:1 ratio and the empty right third.
- **Brand lockup** — no raster asset. The coin is inline SVG and the wordmark is live text in
  Anton; reproduce both in code so they stay crisp at any size.
- **Icons** — all inline SVG in the Lucide idiom, no icon font, no sprite sheet. If the
  codebase already has an icon set, map to it and keep `stroke-width` at 2.2–2.4.
- **Fonts** — Plus Jakarta Sans (UI) and Anton (wordmark only), both Google Fonts. Self-host
  both in production. Note the design system asks for weight 900 headings but Google Fonts
  tops out at 800; these prototypes use 800 throughout. If true 900 is wanted, source a
  TTF/OTF rather than relying on synthetic bolding.
- **No stock photography, no isometric 3D, no people-at-laptops.** Imagery is limited to the
  flat-vector hero and the brand marks.

## Files

In this bundle:

| File | Screen |
|---|---|
| `Xangarro Portal - Acceso y onboarding.dc.html` | Auth + 5-step onboarding wizard + brand animation |
| `Xangarro Portal - Inicio.dc.html` | Director home |
| `Xangarro Portal - Ventas y gastos.dc.html` | Transaction ledger + drawer |
| `Xangarro Portal - Estados financieros.dc.html` | NIF statements |
| `Xangarro Portal - Productos.dc.html` | Catalog + inventory movements |
| `Xangarro Portal - Operadores y dispositivos.dc.html` | Team + device pairing |
| `Xangarro Portal - Empleados.dc.html` | Staff, payroll, attendance |
| `Xangarro Portal - Sincronizacion.dc.html` | Sync mode + queue + log |
| `Xangarro Portal - Negocio.dc.html` | Business profile |
| `Xangarro Portal - Suscripcion.dc.html` | Plans + billing |
| `colors_and_type.css` | Design-system tokens (the source of truth for colors and type) |
| `image-slot.js` | Prototype-only image placeholder component — **do not port** |
| `assets/hero-taqueria.png` | Hero illustration |

To view a prototype, open the `.dc.html` file in a browser — each is self-contained apart
from the token stylesheet and the asset.

## Before you ship — things the prototypes do that production should not

1. **Remove the prototype controls.** Every portal screen has a floating black FAB at
   `bottom: 24px; right: 24px` opening a panel that switches `dataState`, `role` and sidebar
   width. It exists purely to demo states. Delete the FAB, the panel, and the `panelOpen`
   state.
2. **Replace interactive `div`s with semantic elements.** `role="button"` /
   `role="link"` / `role="tab"` on `div`s and `span`s is a limitation of the prototype
   environment, not a design decision. Use `<button>`, `<a>`, and the codebase's tab
   primitives, and drop the manual `tabindex`.
3. **Rebuild the charts.** The line chart, bar pairs and mini stock bars are hand-plotted
   SVG with literal coordinates.
4. **Replace all sample data**, including the business name, people, amounts, folios and
   dates. Keep the Suscripción pricing.
5. **Keep the `role`-based gating** — it is product behavior, not mock scaffolding.
6. **Keep the ISR disclaimer** on Estados financieros.
7. **Honor the offline-first promise in copy.** Error and pending states must say the data is
   safe on the device; never imply loss.
