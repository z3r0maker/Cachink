# Xangarro! Web Portal — Design Brief

> **For:** Claude Design (or any designer). Self-contained: you do not need the codebase.
> **Deliverable:** high-fidelity screens for the admin web portal at `app.xangarro.mx`, in the Xangarro!
> visual language, desktop-first but working down to a 768 px tablet.
> **Language:** all UI copy in **Spanish (es-MX)**. Copy in quotes below is the real product copy — use it verbatim.
> **Sources:** `docs/plan/04-portal.md` (tasks P-01…P-17), `ARCHITECTURE.md` ADR-053, `docs/plan/00-README.md` §4,
> `packages/ui/src/theme.ts`, and the archived mobile screens in `archive/ui-screens/`.

---

## 1. Product context

**Xangarro!** — _"Finanzas para emprendedores."_ — is a micro-POS and finance service for Mexican small
businesses: taquerías, papelerías, cafés, food trucks, tiendas de barrio, salones de belleza.

It has two surfaces:

| Surface | Who | What it does |
|---|---|---|
| **Mobile app** (already built) | **Operador** — shop-floor staff. Signs in with name + PIN, no email. | Captures ventas, gastos, movimientos de inventario, caja (turnos) and corte de día. Works offline. |
| **Web portal** (this brief) | **Director** — the owner, a partner, or the contador. Email login. | Everything else: dashboard, financial statements, catalog, operators, devices, business settings, subscription, sync health. |

The phone captures; the portal **configures and reports**. Every setting made in the portal travels to the phones on
their next sync ("se sincroniza con tus dispositivos").

**Design principle (non-negotiable): _"the less clicks, the most value."_** Users are small-business owners, often
not finance-literate, often older, frequently on a tablet standing in the shop. Every number gets a plain-language
explanation. Every screen should answer "¿cómo va mi negocio?" before it shows detail. Never look like an ERP.

**Sample business used across all mocks:** _Taquería Don Pedro_ — tipo "Mezcla de productos y servicios",
régimen RESICO (ISR 1.25%), plan **Emprendedor**, 2 operadores (Ana, Luis), 2 dispositivos (iPhone de caja,
Android de la barra). Products: Taco al pastor $25, Quesadilla $40, Gringa $60, Agua de horchata $30,
Refresco $25, Tortilla (kg, materia prima). Use MXN formatted `$4,850.00`.

---

## 2. Users and permissions

Portal members belong to one or more businesses, each with one role:

| Role | Label | Can |
|---|---|---|
| `owner` | "Dueño" | Everything; is the billing contact. Created at signup. |
| `admin` | "Administrador" | Everything except being the billing contact. |
| `viewer` | "Solo lectura" (the contador) | See and **export** everything. **No create / edit / delete buttons are rendered** at all (don't show them disabled — hide them). Cannot issue device codes. |

Design two variants for at least one list screen (Productos) to show the viewer state.

Operators are **not** portal members; they are managed as records (§6.5) and have no role.

---

## 3. Visual language (brand tokens — use exactly)

The brand is **neobrutalist yellow**: flat fills, thick black outlines, **hard offset shadows**, chunky type,
a tactile "stamp" press. It must feel like the mobile app and a sticker on a cash register — not a generic SaaS
dashboard.

### 3.1 Color

| Token | Hex | Use |
|---|---|---|
| yellow | `#FFD60A` | Hero color: primary buttons, hero cards, active nav, highlights |
| yellowDeep | `#F5C800` | Hover on yellow |
| yellowSoft | `#FFFBCC` | Soft highlight surfaces, sticky footers, selected rows |
| black | `#0D0D0D` | **All borders**, primary text, dark buttons |
| ink | `#1A1A18` | Body text |
| white | `#FFFFFF` | Cards |
| offwhite | `#F7F7F5` | **App background** |
| gray100 / gray200 | `#F2F2F0` / `#E4E4E0` | Subtle fills, dividers, table stripes |
| gray400 | `#9E9E9A` | Fills and chart series only — **never text** |
| gray600 | `#5A5A56` | Labels |
| textMuted | `#6F6F6B` | Secondary text (AA-safe) |
| green / greenSoft / **greenText** | `#00C896` / `#D6FFF4` / `#007E5E` | Positive, ingresos, "Saludable", success |
| red / redSoft / **redText** | `#FF4757` / `#FFE8EA` / `#DA0013` | Negative, egresos, "Crítico", destructive |
| blue / blueSoft / **blueText** | `#3B6FFF` / `#E5ECFF` / `#1D59FF` | Info, links, "Director" chips |
| warning / warningSoft / **warningText** | `#FFB800` / `#FFF8E1` / `#8E6600` | Warnings, pending, grace |
| purple / purpleSoft | `#8B5CF6` / `#F0E5FF` | Chart series, product tile color |
| cyan | `#06B6D4` | Chart series |
| peachSoft | `#FFE8D6` | Product tile color |
| scrim | `rgba(13,13,13,0.45)` | Modal/sheet backdrop (the only translucent value) |

**Rule:** the base semantic colors (green, red, blue, warning) are fills. When they color **text**, use the
`*Text` variant. All text must pass WCAG AA (4.5:1). **No gradients. No dark mode.**

### 3.2 Typography

- **Plus Jakarta Sans** everywhere (weights 400–900).
- Headlines 800, tight tracking (-0.03em to -0.04em). Big numbers 800–900 with `tabular-nums`.
- Type scale (px): **12** (floor — nothing smaller), 13, 14, 16, 18, 20, 24, 28, 32, 36, 48. For a desktop web
  hero number, 56–64 is acceptable.
- Upper-case micro-labels use wide tracking (0.05–0.08em), weight 700.

### 3.3 Shape, borders, shadows

- **Borders:** always solid black, **2px** (inputs, chips, small cards) or **2.5px** (cards, buttons). Never dashed, never colored — except semantic callout boxes (e.g. green 2.5px border on a greenSoft "Cambio" card).
- **Shadows:** **hard only, no blur, no rgba**: small `3px 3px 0 #0D0D0D`, card `4px 4px 0`, hero `5px 5px 0`, pressed `1px 1px 0`.
- **Press interaction ("stamp"):** on press, the element moves `translate(2px, 2px)` and its shadow shrinks to `1px 1px 0` (100 ms). Desktop hover may lift slightly or darken yellow to yellowDeep.
- **Radii scale:** 8, 10, 12, 14, 16, 18, 20, 22. Cards 16–18, buttons 14–16, inputs 12–14, pills 9999, chart bars 2–4.
- **Spacing:** 4-pt grid (4, 8, 12, 16, 20, 24, 28, 32, then 40, 48, 64 for layout).

### 3.4 Iconography & imagery

- **Lucide** icons, 2–2.2 px stroke, black.
- Brand mark: a yellow coin with a black "$" (`assets/brand/icon-padded.png`). Wordmark "Xangarro!" in Plus Jakarta Sans 800.
- No stock photos, no illustrations of people, no emoji in UI chrome.

### 3.5 Components to define (design system page)

Button (primary yellow / dark black / ghost / destructive red; sizes md, lg; loading; disabled) · Input, money
input (`$` prefix, right-aligned tabular), select/combobox, date & period picker · **Option cards** (for ≤ 5
mutually exclusive choices, use tappable icon + bold label + 1-line description cards stacked — not a dropdown) ·
Switch · Tag/chip (neutral, success, warning, danger, info) · Card, **hero card** (yellow), **big-number card** ·
**Health verdict line** (§5.3) · **Delta indicator** ("↑ 12% vs mes anterior") · Help toggle ((?) that expands a
plain-language explanation) · Table (sortable header, stripe, row hover, row → drawer) · Drawer / side sheet ·
Dialog (confirm, destructive) · Toast · Empty state · Skeleton loading · Banner (info / warning / critical) ·
Progress/usage bar · Tabs · Segmented toggle · Sidebar nav item · Business switcher · User menu · Charts (§5.4).

---

## 4. App shell

**Desktop (≥ 1281 px) and laptop (≥ 1024 px):**

- **Left sidebar** (~248 px, white, 2.5px black right border): coin + "Xangarro!" wordmark at top; nav items with
  Lucide icons; active item = yellow fill, black border, hard shadow. Footer: onboarding progress chip if
  incomplete ("¿Cómo empiezo? 3/6").
- **Top header** (offwhite, 2px black bottom border): **business switcher** on the left (business name + plan chip,
  dropdown lists memberships with role); on the right a global **sync health indicator** (green "Todo sincronizado" /
  amber "3 registros no enviados") and the **user menu** (avatar, email, "Cerrar sesión").
- **Content:** max width ~1200 px, 32 px page padding, page title (32–36 px, 800) + optional subtitle + primary action top-right.

**Tablet (768–1023 px):** sidebar collapses to an icon rail or a hamburger drawer; tables become cards or scroll
horizontally inside their card; no page-level horizontal scroll (acceptance criterion).

**Navigation (proposed order):**

1. **Inicio** — `layout-dashboard`
2. **Ventas** — `receipt`
3. **Gastos** — `wallet`
4. **Estados financieros** — `line-chart`
5. **Productos** — `package`
6. **Operadores** — `users`
7. **Empleados** — `id-card`
8. **Dispositivos** — `smartphone`
9. **Sincronización** — `refresh-cw`
10. **Negocio** — `store` (includes Funciones and Datos fiscales)
11. **Suscripción** — `credit-card`

> The engineering plan's sidebar lists Inicio, Ventas, Gastos, Productos, Operadores, Dispositivos, Negocio,
> Suscripción, Sincronización; Estados, Empleados and Funciones are separate tasks without a nav slot. The order
> above is a proposal — group settings-type pages under a "Configuración" divider if it reads better.

**Global banners** (top of content, full width, dismiss not allowed while the condition holds):
- Payment grace (warning): "Tu pago está pendiente — tienes hasta el {{fecha}}." + "Actualizar pago".
- Unresolved sync rejections (critical, on Inicio): "{{n}} registros no se pudieron sincronizar." + "Revisar".
- Plan limit reached (info, Freelancer): "Llegaste a 50 registros este mes" / "Tu plan Freelancer incluye 50 registros al mes. Con Emprendedor tus registros son ilimitados." + "Mejorar plan".

---

## 5. Cross-cutting patterns

### 5.1 Period picker
Segmented toggle **"Hoy" / "Semana" / "Mes" / "Personalizado"** for lists (Ventas, Gastos). For Estados and reports:
**"Mensual" / "Trimestral" / "Anual" / "Rango"** — Mensual shows "Año" + "Mes"; Rango shows "Desde" / "Hasta".
Default: current month. Always show the resolved label, e.g. "01/MAY/2026 – 31/MAY/2026".

### 5.2 Delta indicator
"↑ 12% vs mes anterior" (greenText), "↓ 8% vs mes anterior" (redText), "= sin cambio vs mes anterior" (muted).

### 5.3 Health verdict
A short colored sentence under a key number, three tones: **healthy** (greenText), **warning** (warningText),
**critical** (redText), with a small dot or icon. Copy is per metric (see §6.3).

### 5.4 Charts
Flat fills, black 2px axis lines, no gridline clutter, no gradients/glows, rounded bar caps (2–4 px), tabular labels.
Series palette in order: green, blue, warning, purple, cyan, red, gray400. Types used: sparkline, line, waterfall,
donut, horizontal diverging bar, stacked 100% bar, half-circle gauge.

### 5.5 Money
Always `$1,234.56` MXN with thousands separators and two decimals; negatives `−$1,234.56` in redText. Ingresos green,
egresos red only where it adds meaning (dashboards, statements), not in every table cell.

### 5.6 States (design every one for every list/report)
- **Loading:** skeleton cards/rows in gray100 with the black borders kept.
- **Empty:** icon + bold title + one helpful sentence + primary action (hidden for viewer).
- **Error:** "Algo salió mal" + message + "Reintentar".
- **Read-only (viewer):** no action buttons.

### 5.7 Export
"Exportar" button (dropdown: "CSV" / "Excel") on Ventas, Gastos, Estados. Available on **every plan** and to viewers.

### 5.8 Plain language help
Every financial number has a one-line subtitle always visible, and a (?) toggle that expands a longer example-based
explanation (examples use pasteles/tacos and round pesos). This is a core brand trait — keep it.

---

## 6. Screens

Priority: **P0** = design first. Each screen lists purpose, layout, content, actions, states.

### 6.1 Auth & signup — P0

**`/login`** — split layout: left yellow panel with coin, "Xangarro!" and "Finanzas para emprendedores."; right a
white card with tabs **"Enlace mágico" | "Contraseña"**. Magic link: email field + "Enviarme un enlace"; success
state "Revisa tu correo". Password: email, password, "Entrar", link "¿Olvidaste tu contraseña?" → `/reset`.

**`/signup?plan=freelancer|emprendedor|mipyme_pro`** — 3-step stepper (progress chips 1-2-3):
1. **Cuenta:** email + password (or magic link).
2. **Tu negocio:** "Nombre del negocio" + "¿Qué tipo de negocio tienes?" as **option cards**:
   - "Productos físicos con inventario" — "Vendes cosas que compras, produces o almacenas. Xangarro! lleva tu stock."
   - "Productos sin inventario" — "Vendes café, comida u otro producto que no necesita conteo de piezas."
   - "Servicios" — "Ofreces cortes, consultas, clases u otro servicio sin producto físico."
   - "Mezcla de productos y servicios" — "Vendes un poco de todo. Puedes configurar qué sigue stock y qué no."
3. **Plan:** the chosen plan card (see §6.11 pricing) → paid plans go to Stripe Checkout; return state
   "Confirmando tu pago…" (spinner, up to 60 s, then continue). Free plan skips payment.

### 6.2 Onboarding — "¿Cómo empiezo?" — P0
Persistent, dismissible checklist (page + a compact card on Inicio + sidebar chip). Progress bar "3 de 6", small
confetti on completion. Items, each with title, 1–2 line instruction, CTA, done state (green check, strikethrough-free):
1. Datos fiscales (optional on Freelancer) → Negocio
2. Crea tu primer operador → Operadores
3. Agrega tu primer producto (o importa desde Excel) → Productos
4. Genera un código para tu dispositivo → Dispositivos (**shows the 8-char code inline + the 3 steps on the phone:** "Descarga Xangarro!", "Escribe tu correo y el código", "¡Listo! Empieza a vender")
5. Activa tu dispositivo (auto-completes)
6. Tu primera venta sincronizada (auto-completes)

### 6.3 Inicio (Dashboard) — P0
Answers "¿cómo va mi negocio hoy y este mes?" in one glance.

1. **Greeting row:** "Hola, {{nombre}}" + date.
2. **Yellow hero card:** big number **"Utilidad del mes"** (green/red/neutral), month range label, dark button "Ver estados".
3. **Tiles row "Resumen de hoy":** "Ventas hoy" (green) → "Ver ventas"; "Gastos hoy" (red if > 0) → "Ver gastos"; "Utilidad hoy".
4. **"Últimos 30 días"** card: sparkline/line of ventas vs gastos per day.
5. **"Caja"** card: per device — device name, operator, "Turno abierto" (green tag, since HH:MM) / "Caja cerrada" (neutral); last corte with tag **"Cuadra"** (neutral) / **"Sobra $X"** (green) / **"Falta $X"** (red).
6. **"Stock bajo"** card (only if > 0): upper-case label, big count, list of top 5 products "quedan N (umbral M)", "Ver productos".
7. **"Actividad reciente"**: last 6 entries — round icon ("$" on green for venta, "−" on red for gasto), concepto, tag (método de pago or categoría), operador, amount "+$…" / "−$…". Empty: "Aún no hay movimientos hoy".
8. **"Cuentas por cobrar"** — hidden in v1 (post-launch).
9. Onboarding card if incomplete; sync-rejections banner if any.

Responsive grid: 3 columns desktop, 2 laptop, 1 tablet portrait.

### 6.4 Ventas & Gastos — P0
Same template, two pages.

- **Header:** title + period picker + search + "Exportar".
- **Totals strip:** Ventas → "Total vendido", "Número de ventas", "Ticket promedio", "Canceladas". Gastos → "Total gastado", by sub-type "Gasto / Nómina / Inventario".
- **Filters (chips/dropdowns):** Ventas: "Método de pago" (Efectivo, Transferencia, Tarjeta, QR/CoDi, Crédito), "Categoría" (Producto, Servicio, Anticipo, Suscripción, Otro), "Operador", "Dispositivo". Gastos: "Tipo" (Gasto, Nómina, Inventario), "Categoría" (Materia Prima, Inventario, Nómina, Renta, Servicios, Publicidad, Mantenimiento, Impuestos, Logística, Otro), "Operador", "Dispositivo".
- **Table columns:** Ventas — Fecha/hora, Concepto, Cantidad, Categoría, Método (chip), Operador, Dispositivo, Monto (right). Gastos — Fecha, Concepto, Tipo, Categoría, Proveedor ("Sin proveedor"), Operador, Monto.
- **Cancelled sale rows:** strikethrough amount, muted row, red tag **"Cancelada · {{motivo}}"**.
- **Row → right drawer** with full detail: all fields, estado de pago (pagado / pendiente / parcial), stock impact, for cancelled sales: motivo, fecha de cancelación, efectivo devuelto, stock devuelto. Read-only (records are captured on the phone).
- **Empty:** "Aún no hay ventas en este periodo" / "Las ventas que registren tus operadores en el teléfono aparecerán aquí."

### 6.5 Estados financieros — P0
Tabs **"Resultados" | "Balance" | "Flujo" | "Indicadores"**, period picker at top, "Exportar Excel", and
**"Informe mensual PDF"** (visible to all, **gated to MiPyME Pro** — show a lock + "Disponible en MiPyME Pro").
Print stylesheet: one page per statement. Empty: "Sin datos en el periodo" / "Registra movimientos en esta ventana de tiempo."

**ISR notice** (yellow card, on Resultados and Indicadores): "ISR referencial (1.25%)" — "La cifra de ISR es orientativa. Consulta a tu contador antes de declarar." Button "Ajustar tasa (1.25%)" → Negocio. Loss variant: "Tu tasa de ISR es del {{rate}}%, pero como la utilidad operativa es negativa, no se calcula ISR. Consulta a tu contador."

**Resultados (NIF B-3)**
- **"Resumen del periodo"** card: "Vendiste {{ingresos}}, gastaste {{egresos}}, y te quedaron {{neto}}." Big "Utilidad neta" in a green/red box, verdict ("Tu negocio fue rentable este periodo." / "Quedaste en cero — no ganaste ni perdiste." / "Tu negocio operó a pérdida este periodo."), delta, 6-month sparkline.
- **Line items** (label · amount · subtitle · (?) explanation):

| Label | Subtitle | Expanded |
|---|---|---|
| Ingresos | Todo el dinero que entró por ventas | Es la suma de todas tus ventas en este periodo, sin importar el método de pago. Si vendiste 50 pasteles a $100, tus ingresos son $5,000. |
| Costo de ventas | Lo que gastaste para producir lo que vendiste | Incluye materia prima e inventario. Si compraste harina, azúcar y cajas para hacer los pasteles que vendiste, eso es tu costo de ventas. |
| **Utilidad bruta** | Lo que te queda después del costo del producto | Ingresos menos costo de ventas. … Un número negativo significa que estás vendiendo por debajo de tu costo. |
| Merma (only if > 0) | Producto perdido por daño, caducidad o robo | Cuando se echa a perder un producto o se daña, ese costo se resta de tu utilidad. |
| Gastos operativos | Gastos para mantener el negocio andando | Renta, nómina, luz, publicidad, servicios — todo lo que pagas aunque no vendas nada ese día. |
| **Utilidad operativa** | Lo que queda después de TODOS los gastos | Es la utilidad bruta menos la merma y los gastos operativos. |
| ISR | Impuesto sobre la renta (estimado) | Es un cálculo aproximado. Solo aplica cuando hay utilidad operativa positiva. |
| **Utilidad neta** | Lo que realmente te queda al final | La ganancia final después de todos los costos, gastos e impuestos. |

- **"Cascada de resultados"** waterfall: Ingresos → Costo vtas → Ut. bruta → Merma → Gastos op. → Ut. operativa → ISR → Ut. neta.
- **"¿De dónde vienen tus ingresos?"** donut by categoría de venta, center "Total ingresos".
- **"¿En qué se gasta?"** donut by categoría de gasto, center "Total egresos".

**Balance (NIF B-6)**
- Resumen: "Tienes {{activo}} en activos. Tu patrimonio neto es {{capital}}." Verdict "Tu patrimonio es positivo." / "Tu patrimonio es negativo — debes más de lo que tienes."
- Two cards side by side: **"Activo"** — Efectivo ("Dinero en caja y banco"), Inventarios ("Valor del producto que tienes para vender"), Cuentas por cobrar ("Lo que te deben los clientes"), a 100% stacked bar (green / blue / warning), big "Total activo". **"Pasivo y Capital"** — Pasivo ("Lo que tu negocio le debe a otros"; tag "Sin pasivos registrados" if 0), Capital ("Lo que vale tu negocio como tal"), "Utilidad del periodo", big "Total capital".

**Flujo (NIF B-2)**
- Resumen: "Flujo neto del periodo: {{total}}." Verdict "Este mes entró más dinero del que salió." / "Este mes salió más dinero del que entró."
- Collapsible **"Flujo de operación"** ("Dinero que entra y sale por el día a día"): Cobros ventas contado, Cobros crédito clientes, Gastos operativos (−).
- Collapsible **"Flujo de inversión"** ("Dinero gastado en comprar inventario" — "Es normal que sea negativo."): Compras inventario (−).
- Diverging horizontal bar chart around zero; big **"Incremento neto en efectivo"**.

**Indicadores**
- Section **"¿Qué tan rentable es tu negocio?"** — "Qué porcentaje de cada peso de venta se queda como ganancia." Three **half-circle gauges** with red/amber/green bands, verdict, delta, 6-month trend:

| Card | Subtitle | Bands (red / amber / green) | Healthy · Warning · Critical |
|---|---|---|---|
| Margen bruto | De cada peso vendido, ¿cuánto te queda después del costo? | <10 / 10–20 / ≥20 % | "Saludable — buen control de costos." · "Bajo — tus costos consumen casi todo." · "Crítico — vendes casi al costo o por debajo." |
| Margen operativo | De cada peso vendido, ¿cuánto queda después de TODOS los gastos? | <5 / 5–10 / ≥10 % | "Saludable — tu operación genera ganancia." · "Bajo — tus gastos operativos son altos." · "Crítico — la operación consume toda tu ganancia." |
| Margen neto | Tu ganancia real por cada peso vendido | <3 / 3–8 / ≥8 % | "Saludable — tu negocio es rentable." · "Bajo — queda muy poco después de todo." · "Crítico — no generas ganancia real." |

- Section **"¿Qué tan sano opera tu negocio?"** — "Eficiencia operativa — qué tan rápido cobras, vendes y cumples." Three big-number cards:

| Card | Format | Subtitle | Healthy · Warning · Critical |
|---|---|---|---|
| Razón de liquidez | `1.52×` (≥1.5 / ≥1.0) | ¿Puedes pagar lo que debes con lo que tienes? | "Saludable — puedes cubrir tus obligaciones." · "Ajustada — cubres pero sin margen." · "Riesgo — podrías tener problemas para pagar." |
| Rotación de inventario | `4.00 veces/mes` (≥4 / ≥2) | ¿Cuántas veces renovaste tu inventario? | "Buena — tu producto se mueve rápido." · "Lenta — tu producto tarda en venderse." · "Muy lenta — revisa si tienes producto estancado." |
| Días promedio de cobranza | `30 días` (≤30 / ≤60) | ¿Cuántos días tardan tus clientes en pagarte? | "Rápido — tus clientes pagan pronto." · "Moderado — tardan en pagarte." · "Lento — mucho dinero atrapado en cuentas por cobrar." |

- Footer: "Estos indicadores usan rangos generales para pequeños negocios."

### 6.6 Productos — P0
- **Header:** title, search, filters ("Categoría", "Stock bajo", "Archivados"), buttons **"Importar desde Excel"** (ghost) and **"Nuevo producto"** (yellow).
- **Table:** Ícono (colored tile with Lucide icon), Nombre, SKU, Categoría, Precio de venta, Costo, Margen %, Stock actual (with red "Stock bajo" tag when ≤ umbral), row menu (Editar, Archivar).
- **Create / edit — right sheet**, sections:
  - **Básico:** "Nombre" (placeholder "Tortilla"), "SKU" ("Opcional"), "Categoría" (Materia Prima, Producto Terminado, Empaque, Herramienta, Insumo, Otro), "Tipo" (Producto / Servicio).
  - **Uso** — option cards "¿Qué haremos con este producto?": "Para venta" / "Materia prima (para convertir)" / "Ambos (venta y conversión)".
  - **Precio:** "Precio de venta", "Costo por unidad (opcional)", live "Margen de ganancia" chip.
  - **Inventario** — option cards: "Llevar inventario" ("Descuenta existencias con cada venta.") / "Sin inventario" ("Servicios o productos que no se cuentan."); if on: "Unidad" (pza, kg, lt, m, caja, bolsa, rollo, par, otro), "Alerta de Stock Bajo" (default 3), "Stock inicial".
  - **Apariencia:** "Color de fondo" swatches (white, yellow, green, blue, pink, purple, peach, gray) + **icon picker** ("Seleccionar ícono") — grid of 66 Lucide icons in tabs: Alimentos, Bebidas, Comercio, Servicios, Belleza y Cuidado, Hogar y Oficina, General; live preview of the product tile as it appears on the phone.
  - Validation copy: "Campo requerido", "Debe ser mayor a $0".
- **Archive confirm:** "¿Archivar {{producto}}? Dejará de aparecer en los teléfonos. Tus ventas anteriores no cambian."
- **Excel import — full-page or large dialog, 3 steps:**
  1. "Descarga la plantilla" (button "Descargar plantilla") + drop zone "Arrastra tu archivo .xlsx aquí o elige uno" (max 5,000 filas).
  2. **Vista previa** (dry run): summary chips "12 nuevos · 3 actualizados · 2 con error"; table with a status column **Nuevo** (green) / **Actualizar** (blue) / **Error** (red + reason, e.g. "Precio no es un número", "SKU duplicado en el archivo"); toggle "Mostrar solo errores"; "Descargar errores".
  3. Commit button **"Importar 15 productos"** → success "Listo: 15 productos importados. Tus teléfonos los recibirán en la siguiente sincronización."
- Empty: "Aún no tienes productos" + both actions.

### 6.7 Operadores — P0
Operators are the people who use the phone app; they sign in with **name + PIN**, no email.
- **Header:** title, usage counter **"2 de 2 operadores"** with progress bar, "Nuevo operador" (disabled when full, tooltip "Tu plan incluye 2 operadores" + link "Mejorar plan").
- **Explainer card:** "Tus operadores entran a la app con su nombre y su PIN. No necesitan correo."
- **List:** avatar with initials (colored), Nombre, Estado (tag "Activo" / "Inactivo"), Creado, menu (Cambiar PIN, Desactivar / Reactivar).
- **Create dialog:** "Nombre", "PIN (4 a 6 dígitos)" (masked, show/hide), "Confirma el PIN", "Crear operador". Helper: "Es el PIN que escribirá en el teléfono."
- Empty: "Crea tu primer operador para empezar a vender desde el teléfono."

### 6.8 Dispositivos — P0
- **Header:** title, slot counter "1 de 2 dispositivos", **"Agregar dispositivo"**.
- **Table:** Nombre, Plataforma (iOS / Android icon), Última sincronización (relative, e.g. "hace 5 min"), Pendientes / Rechazados (red count chip links to Sincronización), Estado ("Activo" green / "Revocado" neutral), menu "Revocar".
- **"Agregar dispositivo" dialog — hero moment:** the **8-character code shown very large** in a monospaced-feeling 800 weight with letter spacing, e.g. `K7M3 DQ9P`, on yellowSoft with black border; "Copiar" button; "Vence en 47:59:12" countdown; "Enviar por correo a…" email field + send; the 3 phone steps. Note: codes never contain 0, O, 1 or I.
- **Revocar confirm (destructive):** "¿Revocar {{dispositivo}}?" — "Revocar borra el acceso, no los datos ya sincronizados." Buttons "Cancelar" / "Revocar".
- Slots-full state: "Tu plan ya no tiene lugar para otro dispositivo." + "Mejorar plan".

### 6.9 Sincronización — P1
- Per-device cards: name, "Última subida", "Última descarga", "Última vez visto".
- **"Registros no enviados"** table: Tipo de registro (Venta, Egreso, Movimiento de inventario, Turno de caja, Movimiento de caja, Cancelación, Corte de día, Producto, Cliente, Pago de cliente), Dispositivo, Motivo (human message), Vista previa (e.g. "Venta · Taco al pastor ×3 · $75.00"), Recibido, action **"Marcar como resuelto"**.
- Example motivos: "El producto de este registro ya no existe en el portal." · "El operador de este registro ya no existe en el portal." · "Este tipo de registro solo se cambia en el portal." · "El registro tiene datos que el servidor no acepta."
- Empty (celebratory, green): "Todo sincronizado. No hay registros pendientes."

### 6.10 Negocio (settings) — P1
Sectioned page with a sticky "Guardar cambios" bar when dirty. Sections:
1. **Perfil:** "Nombre del negocio", "Tipo de negocio" (the 4 option cards), logo upload (optional).
2. **Impuestos:** "Régimen fiscal" option cards — RIF ("Régimen de Incorporación Fiscal." · 2%), RESICO ("Régimen Simplificado de Confianza." · 1.25%), Asalariados ("Personas físicas con ingresos por salarios." · 25%), Otro ("Otro régimen o persona moral." · 30%); "Tasa de ISR (%)" pre-filled from régimen, confirm "¿Actualizar tasa de ISR a {{pct}}%?" — "Sí, actualizar" / "No, mantener actual".
3. **Tipos de pago:** switches with icons — Efectivo, Transferencia, Tarjeta, QR/CoDi (at least one must stay on; last one disabled with hint "Necesitas al menos un método de pago"). Crédito lives in Funciones.
4. **Ventas:** "Categoría de venta predeterminada" (Producto, Servicio, Anticipo, Suscripción, Otro); **"Atributos de producto"** — repeatable rows (Etiqueta, Tipo: Texto / Lista, Opciones, Obligatorio) e.g. Talla, Color, Marca.
5. **Funciones del negocio** — "Activa o desactiva las funciones que necesita tu negocio". Each row: icon, label, description, three indicator columns **"Disponible" · "En tu plan" · "Activada"** (switch editable only when the first two are true):

| Función | Descripción | v1 state |
|---|---|---|
| Inventario / Stock | Controla las cantidades de tus productos | Available, switch |
| Lector de código de barras | — | Available, switch |
| Ventas a Crédito | Entrega productos a clientes con pago posterior | "Próximamente" |
| Conversión de Materia Prima | Convierte materia prima en productos (ej: bolsa de café → tazas) | "Próximamente" |
| Conversión Automática | Convierte automáticamente al vender cuando no hay stock suficiente | "Próximamente"; "Requiere Conversión de Materia Prima activado" |
| Auditoría de Inventario | Conteo físico periódico para validar cantidades | "Próximamente" |
| Merma | Registra pérdidas por caducidad, daño o preparación | "Próximamente" |

   Turning off a parent warns: "Los datos se conservarán pero no serán visibles. ¿Continuar?" Not-in-plan state shows lock + "Disponible en {{plan}}".
6. **Datos fiscales** (for facturas of the subscription): "RFC" (validated, auto-uppercase; error "RFC no válido"), "Razón social", "Régimen fiscal", "Uso de CFDI", "Código postal", "Correo para facturas".

### 6.11 Suscripción — P1
- **Current plan card** (hero): plan name, price "$199 MXN / mes + IVA", status tag — "Activa" (green), "Prueba" (blue, "Tu prueba termina el {{fecha}}"), "Pago pendiente" (warning, "Tienes hasta el {{fecha}}"), "Vencida" (red, "Tu plan volvió a Freelancer"), "Gratis". "Próximo cobro: {{fecha}}".
- **Usage bars:** Operadores "2 de 2", Dispositivos "1 de 2", Registros este mes "Ilimitados" (Freelancer: "38 de 50").
- Buttons "Cambiar plan" and "Método de pago" (open Stripe portal).
- **Plan comparison** (3 cards, Emprendedor tagged "El más popular"):

| | Freelancer | Emprendedor | MiPyME Pro |
|---|---|---|---|
| Precio | $0 | $199 MXN/mes | $399 MXN/mes — "Probar 14 días gratis" |
| Operadores / dispositivos | 1 | hasta 2 | hasta 5 |
| Registros | 50 al mes | Ilimitados | Ilimitados |
| Funciones | Ventas, gastos, caja | + Inventario, código de barras, ventas a crédito | Todas las funciones + "Reportes avanzados y PDF para tu contador" + "Multi-sucursal (próximamente)" |
| Exportar a Excel | ✓ | ✓ | ✓ |

  CTAs: "Crear cuenta gratis" / "Empezar ahora" / "Probar 14 días gratis". (Prices are not final.)
- **Facturas table:** Fecha, Concepto, Monto, Estado, "Descargar", **"Solicitar factura"** (if no datos fiscales: inline prompt "Completa tus datos fiscales" → Negocio; after request: tag "Solicitada").
- Small debug-friendly line: "Tus dispositivos reciben: plan Emprendedor · 2 operadores · 2 dispositivos".

### 6.12 Empleados — P2
Payroll people (used by Gastos → Nómina on the phone), not app users.
- Table: Nombre, Puesto, Salario, Periodo, menu. Header "Agregar empleado".
- Sheet: "Nombre", "Puesto", "Salario" (money), "Periodo" option cards — "Semanal" ("Pago cada semana."), "Quincenal" ("Pago cada 15 días.", default), "Mensual" ("Pago una vez al mes.").
- Titles "Nuevo empleado" / "Editar empleado"; delete "¿Eliminar empleado?"; empty "No hay empleados registrados".

### 6.13 Optional / later (design only if time allows)
- **Reportes de caja:** period picker; tiles "Turnos", "Con diferencia", "Diferencia promedio"; per-shift cards: fecha, "Apertura", "Cierre", "Diferencia" (green $0 / red − / amber +), motivo tag ("Gasto no registrado", "Error al dar cambio", "Retiro autorizado", "Faltante sin explicación", "Sobrante", "Otro"). Empty: "Sin turnos de caja registrados".
- **Notificaciones** inbox (bell in header): tabs "Bandeja" / "Configurar"; filter "Todas" / "Sin leer"; "Marcar todo como leído"; cards with severity color (critical red, warning amber, info blue), title, 2-line message, relative time, "Ver →". Sources: Discrepancia en caja, Egreso automático, Stock bajo, Gasto recurrente confirmado, Cambio de operadores, Función activada/desactivada. Empty: "Sin notificaciones" / "Cuando algo requiera tu atención, aparecerá aquí."
- **Clientes & Cuentas por cobrar** (post-launch with Ventas a Crédito).
- **Miembros del portal** (invite by email, assign Dueño / Administrador / Solo lectura).

---

## 7. Responsive & accessibility requirements

- Breakpoints: ≥ 1281 desktop, 1024–1280 laptop, 768–1023 tablet (must work, no horizontal page scroll). Phones are not a target (the mobile app exists), but the login and device-code screens should survive 390 px.
- Touch targets ≥ 44 px on tablet.
- Full keyboard navigation with a visible focus ring: **3px yellow outline + 2px black inner** (must show on yellow buttons too — use black outline there).
- Every input has a visible label (no placeholder-only labels).
- Contrast ≥ 4.5:1 for text, ≥ 3:1 for large text and UI boundaries; never convey status by color alone — always pair with a tag word or icon.

---

## 8. What NOT to do

- No soft/blurred shadows, glassmorphism, gradients, neon, or dark theme.
- No generic SaaS phrasing ("Optimiza tu flujo de trabajo"). Speak like a friendly shop owner's accountant.
- No dense ERP tables as the first thing on a page — summary first, table second.
- No floats-looking money (`$25` is fine in marketing, but tables always show `$25.00`).
- No English in UI copy. No "Cachink" anywhere (old name). Human-facing name is **"Xangarro!"** with the exclamation mark.
- Don't show create/edit controls to viewers, and don't invent capture flows — sales, gastos and caja are captured on the phone, the portal only views them.

---

## 9. Requested output (in this order)

1. Design-system page (tokens + components in §3.5, including all states).
2. App shell (desktop + tablet) with sidebar, header, business switcher, banners.
3. P0 screens: Login, Signup (3 steps), Onboarding, Inicio, Ventas (+ drawer, + cancelled row), Gastos, Estados (4 tabs), Productos (+ sheet, + import 3 steps, + viewer variant), Operadores, Dispositivos (+ code dialog, + revoke).
4. P1 screens: Sincronización, Negocio (all sections), Suscripción.
5. P2 / optional: Empleados, Reportes de caja, Notificaciones.
6. For each list/report: loading, empty and error states.
