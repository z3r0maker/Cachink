# Xangarro! Web Portal — Design Brief Addendum: Asesor IA, Metas y Avisos

> **For:** Claude Design. This **extends** `portal-design-brief.md` — same product, same sample business
> (_Taquería Don Pedro_), same brand tokens (§3), shell (§4), patterns (§5) and rules (§8). Do not restyle
> anything; add the screens below using the existing design system.
> **Language:** all UI copy in **Spanish (es-MX)**. Copy in quotes is real product copy — use it verbatim.
> **Supersedes:** the optional "Notificaciones inbox" in §6.13 of the main brief (replaced by §A5 here).

---

## A1. What we are adding and why

Xangarro! already calculates numbers most owners can't read (NIF statements, margins, rotation). We are adding
an **AI advisor that turns those numbers into plain-Spanish decisions**, a **guided goals system**, and an
**inbox**. Three principles drive every screen:

1. **No chat. Anywhere.** No message box, no "pregúntale a la IA", no assistant avatar, no typing indicator.
   The AI is **proactive**: it shows up as cards, short conclusions, and a monthly report. The owner taps, never types.
2. **The system does the math, the AI explains it.** Every peso figure on screen is calculated by the system.
   AI-written text is always a short explanation or a suggestion next to a real number — never a wall of text.
3. **Nothing appears before there is enough data.** Each AI feature has a data requirement. Until it is met,
   show a friendly **locked/progress state** ("Disponible en 23 días"), never an empty or fake insight.

Sell it in the owner's words: **"te cobra, te cuadra la caja, te dice cuánto puedes sacar"** — never
"insights", "analytics" or "inteligencia artificial de última generación".

**AI marker:** anything written by the AI carries a small Lucide `sparkles` icon + micro-label **"Asesor"**
(upper-case, 12 px, 700). No robot, no gradient, no glow, no purple "AI" styling — it must look like the rest
of the portal. Every AI text block has a muted footer: "Generado con IA a partir de tus registros. Revisa antes de decidir."

---

## A2. Shell changes

- **Sidebar:** add one item after **Inicio**: **"Asesor"** — Lucide `sparkles`. It has three tabs:
  **"Para ti" | "Metas" | "Diagnóstico"**.
- **Header:** add a **bell** (Lucide `bell`) between the sync indicator and the user menu, with an unread
  count badge (yellow fill, black 2px border, tabular number; "9+" max). Opens the Avisos panel (§A5).
- **Viewer role ("Solo lectura"):** can read everything in Asesor and Avisos, but sees **no** buttons to set,
  change or clear goals, or to generate/regenerate a report (hide them, don't disable).

---

## A3. Inicio (dashboard) additions

Insert two blocks **directly under the yellow hero card**, above "Resumen de hoy":

### A3.1 "Tu meta del mes" card
- Header: goal icon + name + month, e.g. `trending-up` **"Vender más · Septiembre"**, link "Ver metas".
- Chunky progress bar (black 2.5px border, green fill, hard shadow), big **"68%"**, line "$38,350.00 de $56,400.00".
- **Pace line (most important element)** with dot + words, never color alone:
  "Vas 2 días adelantado" (greenText) / "Vas al ritmo" (muted) / "Vas 3 días atrasado" (warningText — never red, no guilt).
- Daily target: "Hoy: $1,200.00 de $1,880.00" with a small check when reached.
- Optional second goal as a compact row below: `shopping-cart` "Refrigerador · $6,200.00 de $18,000.00 · lo logras en marzo".
- **When behind:** an Asesor strip inside the card with one next step:
  "Te faltan $4,100.00. Tu mejor día es el sábado — una promo de quesadillas ahí te acerca."
- **No goal yet:** empty state "Ponle una meta a tu mes" / "Elige qué quieres lograr y te decimos cómo vas cada día." + yellow button "Elegir mi meta".
- **New business (< 30 days of data):** automatic starter goal "Registra tus ventas 30 días seguidos" with a ring "12 de 30 días".

### A3.2 "Para ti hoy" feed
- Title "Para ti hoy" + `sparkles` marker. **Maximum 3 cards on Inicio** (5 in the Asesor tab), ranked.
- Card anatomy: category icon tile · bold one-line finding · one-line explanation with the real number ·
  **one action button** · dismiss ("Ahora no"). Examples (use these):
  - `tag` **"El queso te cuesta 18% más que en junio"** — "Sigues vendiendo la quesadilla a $40.00. Tu margen bajó de 35% a 22%." → "Ver precio sugerido"
  - `calendar` **"El viernes es quincena"** — "En las últimas 4 quincenas vendiste 38% más refresco. Tienes 12, necesitas unos 30." → "Ver producto"
  - `zap` **"La luz salió en $2,400.00"** — "Normalmente pagas alrededor de $900.00." → "Ver gasto"
  - `package` **"3 productos no se han vendido en 45 días"** — "Tienes $1,850.00 detenidos en inventario." → "Ver productos"
  - `copy` **"Parece que un gasto se registró dos veces"** — "Renta · $6,000.00 · el mismo día." → "Revisar"
- Empty/caught-up state (celebratory, green): "Todo en orden por hoy." / "Cuando algo necesite tu atención, aparecerá aquí."
- Freelancer plan: one teaser card per week; the rest shown as locked rows "2 avisos más · Disponible en Emprendedor".

---

## A4. Asesor section

### A4.1 Tab "Para ti"
The full feed (up to 5 cards, same anatomy as A3.2) + a collapsed "Anteriores" list (dismissed/done cards, muted).
Include a **data-readiness panel** on the right (or below on tablet): "¿Qué puede hacer tu Asesor hoy?" — a
checklist where each capability is unlocked or shows what is missing:

| Capacidad | Requisito | Locked copy |
|---|---|---|
| Resumen del mes | 1 mes completo | "Disponible en {{n}} días" |
| Precios y márgenes | 60 días de ventas + 2 compras del producto | "Registra el costo de tus productos para activarlo" |
| Inventario | 60 días de movimientos | "Disponible en {{n}} días" |
| Gastos fuera de lo normal | 3 meses por categoría | "Disponible en {{n}} días" |
| ¿Me alcanza? (pronóstico) | 90 días | "Disponible en {{n}} días" |
| Corte de caja | 20 cortes | "Llevas 8 de 20 cortes" |

Unlocked rows: green check + "Activo". Locked: small progress bar + copy. This panel is the "why am I not
seeing more?" answer — keep it friendly, it is also a reason to keep recording.

### A4.2 Tab "Metas" — guided goal setup (the hand-held flow)
**Rule:** at most **2 active goals**, one from each group, never two from the same group. Design it so picking
a second card in the same group **replaces** the first (radio behaviour inside a group).

**Step 1 — "¿Qué quieres lograr?"** Two columns of option cards (existing option-card component):

| Grupo A — "¿Cómo quieres mejorar?" | Grupo B — "¿Para qué?" |
|---|---|
| `wallet` **Ganar más** — "Que te quede más dinero a ti al final del mes." | `shopping-cart` **Comprar algo para mi local** — "Un equipo, mueble o mejora para tu negocio." |
| `trending-up` **Vender más** — "Subir tus ventas del mes." | `life-buoy` **Tener un colchón** — "Ahorro para las semanas flojas." |
| `scissors` **Gastar menos** — "Bajar lo que se te va en gastos." | `credit-card` **Pagar deudas** — "Liquidar lo que debe tu negocio." |

Helper text: "Elige una de cada lado, o solo una. Menos metas, mejores resultados."
When A + B are both chosen, show the sentence preview: **"Vender más para comprar mi refrigerador."**

**Step 2 — "¿Qué tanto?"** (Group A) Three level cards computed from the owner's own average — the owner
**never types a percentage**. Header: "Hoy vendes alrededor de $47,000.00 al mes."
- `footprints` **Un empujón · +10%** — "$51,700.00 al mes · $1,720.00 al día"
- `activity` **Un reto · +20%** — "$56,400.00 al mes · $1,880.00 al día" (tag "Recomendado")
- `rocket` **Ambicioso · +30%** — "$61,100.00 al mes · $2,040.00 al día"
There is **no custom field and no level above +30%**. Footnote: "Si lo logras, el próximo mes subimos el reto desde tu nuevo promedio."

**Step 2 (Group B)** "¿Qué quieres comprar?" text field ("Refrigerador") + money input "¿Cuánto cuesta?".
The system answers immediately in a callout: "A tu ritmo lo logras en **marzo 2027** apartando $3,000.00 al mes."
Unrealistic amount → warning callout: "Esto tomaría más de 3 años. ¿Empezamos con algo más cercano?" (no hard block on the field, but the primary button reads "Ajustar monto").

**Step 3 — Confirmación:** summary card with both goals, the daily number large, button "Empezar mi meta".

**Active state of the tab:** big goal card(s) (same anatomy as A3.1, larger) + for **MiPyME Pro** an
**"Estrategia del Asesor"** card with 2–3 concrete moves, each with its peso impact:
- "Sube la gringa de $60.00 a $65.00" · "+$1,900.00 al mes"
- "Vende 10 aguas de horchata más por semana" · "+$1,200.00 al mes"
- "Recorta el gasto en empaques" · "+$800.00 al mes"
Emprendedor sees the goal + progress, and the strategy card locked: "Estrategia personalizada · Disponible en MiPyME Pro".
Secondary actions: "Cambiar meta" (confirm: "Tu meta actual se guarda en tu historial. ¿Cambiar?") and a
**"Metas logradas"** trophy list (month, goal, result tag "Lograda" green / "86%" neutral) with a streak chip "3 meses seguidos".

**Celebrations:** milestones at 25 / 50 / 75 / 100% — small confetti (reuse onboarding confetti) and a toast
"¡Llegaste al 75% de tu meta!". At 100%: full card takeover "¡Meta lograda!" with the final number.

**End-of-month result dialog** (appears on first visit after month end), three one-tap option cards:
- Reached: title "¡Lograste tu meta de septiembre!" — options **"Subir el reto"** (pre-selected) / "Repetir" / "Cambiar de meta".
- Not reached: title "Llegaste al 86% — tu mejor mes del año." (always lead with the positive) — options "Repetir" (pre-selected) / "Bajar un nivel" / "Cambiar de meta".

### A4.3 Tab "Diagnóstico" — the monthly AI report
A report page (also exported as PDF — design the print layout: one section per block, A4/Letter).
- **Header:** "Diagnóstico de septiembre 2026", generated date, buttons "Descargar PDF", "Compartir por WhatsApp",
  and (owner/admin only) "Volver a generar" with counter "Te quedan 2 este mes". Month selector for past reports.
- **Section order** (each = card with title, 2–4 sentences of AI text, the supporting numbers/mini-chart from the system, and one action):
  1. **Tu meta** — progress vs goal, what helped, what held it back.
  2. **Resumen del mes** — "Vendiste $47,200.00, 12% más que en agosto. Tu utilidad bajó porque la nómina creció, no porque vendiste menos."
  3. **Precios y márgenes** — table: producto · costo antes → ahora · precio actual · margen · **precio sugerido**.
  4. **¿Me alcanza?** — 30-day cash line chart with a band, plus two fixed scenarios as small cards: "Si vendes 20% menos" / "Si cobras lo que te deben".
  5. **¿Cuánto puedo sacar?** — big-number card "Puedes retirar hasta $8,400.00" + "Si sacas más, no alcanzas la nómina del día 15."
  6. **Inventario** — what to reorder and how much; products not moving.
  7. **Cobranza** — (only when Ventas a Crédito is on) ranked clients + "Copiar mensaje de WhatsApp".
  8. **Gastos fuera de lo normal**
  9. **Corte de caja** — "Es el 3er faltante del mes, todos en martes."
  10. **Plan de acción** — yellow hero card, **top 3 actions** ranked by estimated peso impact.
- **Locked sections** (not enough data): keep the section title, show the progress state from A4.1 instead of content.
- **States to design:** (a) **Generating** — "Estamos preparando tu diagnóstico…" skeleton; (b) **Not enough data** —
  progress checklist + "Tu diagnóstico estará listo en 23 días"; (c) **Emprendedor plan, 90 days reached** — hero offer
  "Ya tienes suficientes datos. Genera tu Diagnóstico gratis (una vez)." button "Generar mi diagnóstico";
  (d) **Emprendedor after the free one** — Resumen visible, other sections blurred-free **locked** rows with a real teaser
  "Detectamos 3 productos con margen en riesgo" + "Disponible en MiPyME Pro" (no blur effect — use the lock pattern);
  (e) **Offline / error** — "No pudimos generar tu diagnóstico" + "Reintentar".

### A4.4 AI conclusions on existing screens (Estados financieros)
On each of the four Estados tabs, add **above the "Resumen del periodo" card** a slim **Asesor conclusion strip**
(yellowSoft fill, black 2px border, `sparkles` marker): 2–3 sentences max. Example for Resultados:
"Tu utilidad bajó 12% porque la nómina creció, no porque vendiste menos. Tu margen bruto sigue saludable."
Locked for Freelancer ("Disponible en Emprendedor"). Show loading (skeleton line) and hidden-when-no-data states.

Also on **Reportes de caja** (§6.13 of main brief): when a shift has a difference, add an expandable
"Posibles causas" strip: "Hay un gasto de $150.00 sin registrar parecido a este faltante" · "Una venta a crédito quedó marcada como efectivo".

### A4.5 Goal celebration on login — "el momento trofeo"

When the owner opens the portal and a goal was **reached since their last visit**, celebrate it before anything
else. This is the emotional peak of the product — make it feel like a stamp hitting a receipt, not a casino.

**Trigger & rules**
- Shows on the **first load after the achievement**, once per achievement, never again (after that it lives in "Metas logradas").
- Full goal reached (100%) → **full-screen takeover**. Smaller events (25 / 50 / 75% milestones, daily target hit)
  stay as the toast + mini confetti already described in A4.2 — never a takeover.
- If two goals were reached, show **one** takeover with both badges side by side, not two in a row.
- Only for **Dueño** and **Administrador**. "Solo lectura" (contador) never sees it.
- Always skippable: click anywhere, `Esc`, or the button. Auto-closes after ~6 s. Critical banners (payment, sync
  rejections) are still there underneath once it closes.
- Respect `prefers-reduced-motion`: no movement, no confetti — the badge and text simply appear.

**Layout (desktop and tablet)** — scrim backdrop, centered white card (hero shadow `5px 5px 0`), containing:
1. The **badge** (see below), ~180 px.
2. Upper-case micro-label "META LOGRADA" · month ("SEPTIEMBRE 2026").
3. Headline 800: **"¡Lo lograste, Pedro!"**
4. The number, huge and tabular: **"$57,120.00"** with the line "Tu meta era $56,400.00 · Vender más".
5. One Asesor sentence (with `sparkles` marker): "Tu mejor semana fue la del 14: vendiste $15,300.00."
6. Streak chip when it applies: "3 meses seguidos" (Lucide `flame`, yellow fill).
7. Buttons: yellow **"Subir el reto"** (goes to the end-of-month dialog with that option pre-selected) ·
   ghost "Compartir logro" (opens the A5.1 share dialog with a generated image) · text link "Seguir a Inicio".

**The badge — neobrutalist, flat, no gradients, no metallic shine**
- Shape: a chunky **rosette / seal** (scalloped circle) with a 2.5px black outline and hard shadow, two short
  ribbon tails below, and the goal's Lucide icon in the center (e.g. `trending-up`). A small Lucide `trophy` tops
  the 100% seal.
- Tier by the level the owner chose — flat fills only:
  **Un empujón** → `peachSoft` · **Un reto** → `gray200` with black icon · **Ambicioso** → `yellow`.
  Group B goals (Comprar algo, Colchón, Pagar deudas) → `greenSoft` with the item name under the badge ("Refrigerador").
- Streak variants: at 3, 6 and 12 consecutive months the seal gets a numbered tab ("×3") — design these three.
- Design the full **badge set** as a sheet: 6 goal types × their tiers, plus the 3 streak variants, plus a **locked**
  outline-only state (gray200 fill, gray600 outline — the one exception to black borders) for "Metas logradas".

**Motion spec** (total ≈ 2.4 s, then idle)
1. 0–200 ms: scrim fades in, card scales 0.96 → 1.
2. 200–600 ms: the badge **drops and stamps** — falls from above, slightly rotated (−8°), lands with the brand
   "stamp" press (`translate(2px,2px)`, shadow shrinks to `1px 1px 0`, then springs back), rotation settles to 0°.
   A short black "impact" burst of 6–8 straight lines radiates from the badge and disappears.
3. 600–1400 ms: the big number **counts up** from the goal amount to the achieved amount (tabular numerals so it does not jitter).
4. 600–2000 ms: **confetti** in brand flat colors only (yellow, black, green, blue) — squares and short bars, no
   circles with glow, falling with gravity from the top of the card, ~40 pieces, no looping.
5. 1400–2400 ms: headline, Asesor line, streak chip and buttons rise in, staggered 80 ms.
- No sound. No looping animation after it settles (a very subtle ribbon sway is acceptable).
- Deliver: a static frame of each of the 5 moments above + the final settled state, plus the reduced-motion version.

**Where badges live afterwards:** the "Metas logradas" list in A4.2 becomes a **badge shelf** — a grid of earned
seals with month and result under each, followed by 2–3 locked outlines with the hint "Tu próxima insignia: 3 meses seguidos".
On Inicio, the goal card shows the **latest earned badge** at small size (32 px) next to the goal name.

**Mobile app note (context, no design needed here):** the phone is a capture tool for operators, so it gets no
takeover. At most, a one-line toast for the operator when the business's daily target is hit: "¡Meta del día lograda!".

---

## A5. Avisos (inbox) — bell in the header

Opens as a **right side sheet** (~420 px) on desktop, full page on tablet; "Ver todos" goes to a full page `/avisos`.

- **Tabs:** **"Todos" | "Operación" | "Sistema"** + a gear icon → "Configurar".
  - **Operación** = things that happened in the shop, **coming from the devices**. Always show **device + operator** in the meta line
    ("iPhone de caja · Ana"). Types: Discrepancia en caja ("Falta $150.00 en el corte de Ana"), Stock bajo,
    Venta cancelada, Gasto recurrente pendiente/confirmado, Turno abierto hace más de 12 h, Registro rechazado en sincronización.
  - **Sistema** = things Xangarro! tells you. Types: "Tu Diagnóstico de septiembre está listo", hitos de meta
    ("¡Llegaste al 75% de tu meta!"), resultado del mes, pago/suscripción, dispositivo activado o revocado,
    cambios de operadores, novedades del producto.
- **Filter:** "Todos" / "Sin leer" · action "Marcar todo como leído".
- **Item anatomy:** unread dot · icon tile with severity color (critical red, warning amber, info blue, success green —
  always paired with the icon, never color alone) · bold title · one-line message · meta line (relative time + origin) ·
  whole row is a link that **deep-links** to the right screen ("Ver →"). Read items: muted title weight, no dot.
- Group by day: "Hoy", "Ayer", "Esta semana", "Anteriores". Items auto-expire after ~90 days (footer note).
- **Configurar:** a table of notification types with three switch columns — **"En avisos"**, **"Por correo"** and
  **"Por WhatsApp"**. The WhatsApp column is visible but disabled, with a "Próximamente" tag in its header (see A7.2).
  System-critical types (pago, registros rechazados) are locked on with hint "Este aviso no se puede apagar". Reserve
  (design, shown as off/"Próximamente") a separate category **"Ofertas y novedades"** with its own master switch — see A7.1.
- **Empty:** "Sin avisos" / "Cuando algo requiera tu atención, aparecerá aquí."
- Inbox vs feed: **the feed ("Para ti hoy") is what to do today; Avisos is what happened.** Don't duplicate feed cards into Avisos.

### A5.1 "Compartir por WhatsApp" — share pattern (available now, not Phase 2)

Whenever the owner sends something to **their own customers or their contador**, Xangarro! does **not** send it.
It opens the owner's own WhatsApp with the message already written; the owner picks the contact and taps send.
Design one reusable **share dialog**:
- Title "Compartir por WhatsApp", a **message preview** in a white card (black 2px border) showing the exact text,
  editable in place; below it, if there is a file, a small attachment row ("Diagnóstico-septiembre-2026.pdf").
- Buttons: dark **"Abrir WhatsApp"** (Lucide `message-circle`) + ghost "Copiar mensaje". Helper line:
  "Se envía desde tu WhatsApp. Tú eliges a quién."
- Used by: Diagnóstico ("Compartir por WhatsApp"), Cobranza ("Copiar mensaje de WhatsApp" → this dialog), and the
  Informe mensual para el contador. Sample collections text:
  "Hola Doña Lupe, le recuerdo su saldo pendiente de $350.00 en Taquería Don Pedro. ¡Gracias!"
- Do **not** use WhatsApp's green or logo as a brand color for the button — keep Xangarro! button styles.

---

## A6. Suscripción — updated plan comparison

Replace the "Funciones" row content of §6.11 by adding an **"Asesor"** row group (keep everything else):

| | Freelancer | Emprendedor | MiPyME Pro |
|---|---|---|---|
| Asesor | 1 aviso por semana · Importa tu catálogo con una foto | "Para ti hoy" diario · Conclusiones en tus estados financieros · Explicación de diferencias en caja · Metas con seguimiento diario · 1 Diagnóstico gratis a los 90 días | Todo lo anterior + **Diagnóstico mensual** · "¿Cuánto puedo sacar?" · Pronóstico "¿Me alcanza?" · Estrategia para tu meta |

Pricing-card one-liners: Emprendedor — "Tu Asesor te avisa cada día qué atender."; MiPyME Pro — "Cada mes, un diagnóstico de tu negocio y un plan para tu meta."

---

## A7. Phase 2 — context only, do NOT design full screens

### A7.1 Ofertas (partner credit)
Later, the inbox will carry an opt-in **"Ofertas"** category: businesses with a healthy, consistent history may be
invited to financing options from a partner credit service (a sister startup), using a generated "Expediente para
crédito". For now only: (1) keep the "Ofertas y novedades" switch in Avisos → Configurar as "Próximamente", and
(2) make sure the Avisos item anatomy can hold a **primary button inside an item** (e.g. "Ver opciones") without
breaking the list. No credit screens, no rates, no offer copy.

### A7.2 WhatsApp as a notification channel (Xangarro! → owner)
Later, Xangarro! will send the owner's **own** avisos to their WhatsApp from an official Xangarro! number, because
owners read WhatsApp far more than they open the portal. It is a **delivery channel for Avisos, not a chat**: short
one-way messages with a link back to the portal, opt-in, capped at about one message a day. Examples:
"Tu Diagnóstico de septiembre está listo", "¡Llegaste al 75% de tu meta!", "Falta $150.00 en el corte de Ana",
and a daily closing summary "Hoy vendiste $1,920.00 · vas 2 días adelantado en tu meta".

Design now **only** these two things:
1. The disabled **"Por WhatsApp"** column in Avisos → Configurar (A5), with the "Próximamente" tag.
2. One small **opt-in card** at the top of Configurar, shown in its "Próximamente" state: Lucide `message-circle`,
   title "Recibe tus avisos por WhatsApp", line "Te escribimos solo lo importante, máximo un mensaje al día.",
   a phone field with +52 prefix and a disabled button "Activar". Also draw the future **active** state as a
   secondary variant: "Activo en +52 55 •••• 1234" + link "Cambiar número" + "Desactivar".

Do **not** design: a conversation view, message bubbles, a WhatsApp inbox inside the portal, sending messages to the
business's customers through Xangarro! (that is always the share pattern in A5.1), or capture-by-WhatsApp flows.

---

## A8. What NOT to do (in addition to §8 of the main brief)

- **No chat UI of any kind** — no input box, bubbles, assistant avatar, "escribiendo…", or suggested prompts.
- No robot/brain/magic-wand imagery, no purple "AI" gradient, no glow. `sparkles` + "Asesor" label only.
- No long AI paragraphs: max 3 sentences per block, always next to the number it explains.
- No red, no alarm icons, no guilt copy when a goal is behind. Behind = amber + one next step.
- No free-text percentage or unlimited goal amounts in Group A. No more than 2 active goals.
- Never show an insight without data: use the locked/progress state.
- No emoji in UI chrome (Lucide only), no English, no "IA" as the hero word in marketing copy.

---

## A9. Requested output (in this order)

1. New components for the design-system page: **AI marker + conclusion strip**, **feed card**, **goal progress card**
   (with the 3 pace states), **level option card** (with peso amounts), **locked/progress row**, **inbox item**
   (4 severities × read/unread, with and without inline button), **bell with badge**, milestone toast, and the
   **achievement badge set** (A4.5: tiers, streak variants, locked state).
2. Shell update: sidebar with "Asesor", header with bell (desktop + tablet).
3. Inicio with the goal card + "Para ti hoy" (variants: on track, behind with next step, no goal, starter goal, Freelancer teaser).
4. Asesor → Metas: steps 1–3, active state (Emprendedor vs Pro), end-of-month dialog (both outcomes), "Metas logradas" badge shelf.
   Plus the **login celebration takeover** (A4.5): the 5 motion keyframes, settled state, two-goals variant, reduced-motion version.
5. Asesor → Diagnóstico: full report, PDF/print layout, and states (a)–(e).
6. Asesor → Para ti with the data-readiness panel.
7. Avisos: side sheet, full page, tabs Operación / Sistema, Configurar (three channel columns + the WhatsApp
   opt-in card in "Próximamente" and active variants), empty state. Plus the **"Compartir por WhatsApp" share dialog** (A5.1).
8. Estados financieros with the conclusion strip (one tab is enough) and Reportes de caja "Posibles causas".
9. Suscripción plan comparison with the Asesor row.
10. Viewer ("Solo lectura") variant of Metas, and loading / empty / error for every new list or report.
