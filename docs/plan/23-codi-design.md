# CoDi — the brief for Claude Design

Track K (`22-codi.md`, ADR-129) needs boards before code: the canvas is the spec (ADR-117). The
boards live on their own page, «CoDi», of the El Mostrador canvas
(https://claude.ai/artifact/DxbWpgBQRbix3mpXnnysyt). The owner approves each board; then
`docs/design/el-mostrador.md` §11 drops «never QR/CoDi».

**Rounds 1 and 2, drawn 2026-10-08, waiting for the owner's approval:**

| Board          | Covers                                                         |
| -------------- | -------------------------------------------------------------- |
| `CdConfigurar` | KD-01                                                          |
| `CdActivo`     | KD-02                                                          |
| `CdLetrero`    | KD-03                                                          |
| `CdMvCobro`    | KD-04, phone                                                   |
| `CdMvVivo`     | KD-05, phone                                                   |
| `CdTbCobro`    | KD-04 and KD-05, tablet                                        |
| `CdOpCobro`    | KD-04 and KD-05, web caja, with its venta hecha                |
| `CdMvTurno`    | KD-06 by method in Mi turno; KD-05's late-cobro aviso          |
| `CdVentas`     | KD-06: the CoDi chip and «Cómo se confirmó» in the sale detail |
| `CdNivel2Bis`  | KD-07, its four states, on hold                                |
| `CdLanding`    | KD-08                                                          |

Each board has Tweaks for its states. Some choices differ from the blocks below:

- the phone bridge drops «Cambiar método», because the method cards sit right above the QR;
- the live flow adds a «QR del banco» state, for when the cashier picks it after a code expires;
- on tablet and web caja, «Voltear hacia el cliente» becomes «Mostrar en grande»;
- the tablet ticket's method row becomes 3 + 2 cards, so five methods fit;
- the cierre itself is not redrawn: Mi turno carries the by-method split and the reminder to compare
  CoDi with the bank app, and the cierre reuses it.

Each quoted block can be pasted into Claude Design as it stands. Send §1 first, then the boards in
order: KD-01 … KD-04 are the bridge and are needed by **2026-10-20** so the bridge ships before El
Buen Fin. KD-05 waits for nothing but is built later.

## 1. Context and shared rules

> **CoDi en Xangarro — context for every board.** Xangarro is the financial control and micro-POS
> for Mexican emprendedores. A new law (Ley de Economía Digital, 2026) pushes small shops toward
> CoDi: the customer pays from their bank app by scanning a QR, the money arrives in the shop's
> account in seconds, and it is free for both sides. We are adding CoDi as a payment method. It
> ships in two stages, and the boards must show both:
>
> 1. **Puente (now):** the shop's bank app makes a fixed CoDi QR. The owner loads it into
>    Xangarro once, and the phone or caja shows it at checkout. Xangarro can't see the payment,
>    so the cashier checks their own bank app and taps «Ya me llegó». The copy must never suggest
>    Xangarro confirms the payment.
> 2. **Confirmación automática (later):** Xangarro makes a QR with the exact amount inside, and
>    the screen changes to «Pago recibido» by itself in about 5 seconds. If there is no internet,
>    or the code expires, the same screen falls back to the puente QR.
>
> Use the El Mostrador language exactly as the approved boards do:
>
> - page gray200, quiet white panels (radius 20, quiet border, no shadow), one hero per screen
>   (thick black border, hard shadow);
> - black means you can act on it; a selected chip is black with yellow text, never filled
>   yellow;
> - Spanish (México) with «tú»; no em dashes in visible text; money as «$1,234.00»; text at
>   4.5:1 contrast or better;
> - every action is a button, never a bare link or raw URL;
> - every list and panel has loading, empty, error and with-data states.
>
> The payment methods are exactly **Efectivo, Tarjeta, Transferencia, CoDi, Fiado**. That makes five,
> so the method picker stays icon-plus-description cards. CoDi appears only once the shop has set
> it up. Say «CoDi» in text, and leave a place for Banxico's CoDi® mark without drawing it: we use
> it only after Banxico's trademark licence is signed.
>
> The QR is the hero of a cobro screen: large, high contrast, on white, with a quiet zone, never
> tinted yellow, and readable from 60 cm on a phone held toward the customer.

## 2. Portal

### KD-01 Negocio → Cobros → CoDi: configurar

> **Portal · Negocio → Cobros → «CoDi» (first time).** A new card in Cobros next to the payment
> methods: «Cobra con CoDi. Tu cliente escanea con la app de su banco y el dinero llega a tu
> cuenta en segundos. Sin comisiones.» Button: «Configurar CoDi».
>
> The setup is one panel with three steps:
>
> 1. **«Genera tu QR en la app de tu banco».** A short how-to («Abre tu app → CoDi → Cobrar →
>    Código QR fijo»), plus «¿Tu banco no tiene CoDi todavía?» with a one-line answer.
> 2. **«Súbelo aquí».** A drop zone that takes a screenshot or a photo, with «Usar la cámara» on
>    devices that have one and «Pegar imagen». While reading: «Leyendo tu código…».
> 3. **«Revisa y activa».** The QR redrawn crisp next to what it contains: titular, banco and the
>    CLABE masked as «•••• 1234». Then a checkbox «Es la cuenta de mi negocio» and the button
>    «Activar CoDi».
>
> Draw the refusal states, each with «Probar con otra imagen»:
>
> - «No encontramos un código QR en la imagen»;
> - «Este QR no es de CoDi» (for example a link or another app's code);
> - «Esa imagen está muy borrosa».

### KD-02 CoDi activo, y la confirmación automática

> **Portal · Negocio → Cobros → CoDi (active).** A quiet panel with:
>
> - the QR thumbnail, titular, banco and «•••• 1234»;
> - a state line: «Confirmación: en caja (tu equipo revisa la app del banco)»;
> - actions: «Descargar letrero», «Cambiar QR», «Desactivar CoDi» (desactivar confirms in a
>   dialog: «Tus cajas dejarán de ofrecer CoDi»).
>
> **Later state, same panel:** a block «Confirmación automática. Xangarro verifica cada pago con
> Banxico y registra la venta solo.» with the button «Activar confirmación automática». Draw its
> states:
>
> - «Verificando tu cuenta con Banxico…»;
> - «Listo: tus cobros CoDi se confirman solos»;
> - «No pudimos verificar que la cuenta sea de tu negocio», with what to do next.
>
> The puente QR stays listed as «Respaldo sin internet».

### KD-03 Letrero imprimible

> **Portal · «Descargar letrero».** A dialog with two sizes, as option cards: «Hoja carta» and
> «Calcomanía 10 × 10 cm».
>
> The sign: «Aquí aceptamos CoDi», the shop's name, the large QR, «Escanea con la app de tu
> banco», «Sin comisiones», and a small Xangarro mark at the foot.
>
> It must stay legible printed in black and white on a home printer. The download button is
> «Descargar PDF».

### KD-06 Reportes: CoDi en su propia línea

> **CoDi in the reports.** Show CoDi as its own line or chip everywhere the methods are split:
>
> - Mi turno's KPIs and the cierre on the phone and caja, as a digital method: it does not enter
>   the counted cash;
> - the portal's flujo de efectivo;
> - a «CoDi» filter chip in Ventas y gastos;
> - the comprobante: «Pagado con CoDi».
>
> The sale detail gains one line under the method: either «Confirmado por Banxico · folio
> ABC123» or «Confirmado en caja por {operador}».

### KD-07 Inicio: «Cobros digitales este mes»

> **Portal · Inicio, a small panel «Cobros digitales este mes».** The month's CoDi plus
> Transferencia in pesos, over a meter against the limit of the Cuenta Nivel 2 Bis (shown in pesos
> at today's UDI value), with the caption «Límite de tu cuenta Nivel 2 Bis». Three bands:
>
> - normal;
> - «Vas en 80%»;
> - «Llegaste al límite. Habla con tu banco para subir de nivel».
>
> The panel shows only if the owner said their account is Nivel 2 Bis (a one-tap question inside
> the panel: «¿Tu cuenta es Nivel 2 Bis?» Sí / No / No sé). It is hidden until the law's limits
> are final, so draw it, but mark the board «on hold».

## 3. Phone, tablet and web caja

### KD-04 Cobrar con CoDi (puente)

> **Teléfono · Cobrar → método «CoDi» (puente).** In the cobro sheet, CoDi is the fourth of five
> method cards, with a QR icon and the description «Tu cliente escanea con su banco». Choosing it
> opens a full-height sheet:
>
> - the shop's QR as the hero, and over it the total in very large digits: «Cobra $245.50»;
> - under the QR: «Tu cliente escanea y escribe $245.50 en su app» (the fixed QR carries no
>   amount, so the cashier says the total out loud);
> - a quiet line: «Revisa en la app de tu banco que llegó el pago»;
> - the primary button «Ya me llegó» and the secondary «Cambiar método»;
> - «Ya me llegó» leads to the existing venta hecha screen with «Pagado con CoDi».
>
> Add a «Voltear hacia el cliente» toggle that enlarges the QR and hides everything but the total.
> Draw the tablet (760 px, the docked ticket panel) and the web caja at 1280 px. Draw the
> no-CoDi-configured case: the card is simply absent.

### KD-05 QR en vivo (confirmación automática)

> **Teléfono · Cobrar con CoDi, automatic.** Same sheet; the QR now carries the amount. States:
>
> 1. **«Generando tu código…»** (under 1 s, a skeleton of the QR).
> 2. **Esperando:** the QR, «Cobra $245.50», «Esperando el pago…» with a calm progress hint,
>    and a countdown «El código vence en 4:32». Buttons: «Cambiar método», «Cancelar cobro».
> 3. **«Pago recibido»:** a success state (no confetti), which goes on to venta hecha with
>    «Confirmado por Banxico».
> 4. **Código vencido:** «El código venció», with «Generar otro» and «Usar QR fijo».
> 5. **Sin internet / Banxico no responde:** the same sheet swaps to the puente QR with a band
>    «Sin conexión: confirma en la app de tu banco» and «Ya me llegó».
> 6. **Rechazado:** «Tu cliente canceló o su banco rechazó el pago», with «Intentar de nuevo» and
>    «Cambiar método».
>
> Also: the customer paid but the phone closed before it heard. The venta appears on the next
> open with an aviso «Registramos un cobro CoDi de $245.50 que llegó mientras la app estaba
> cerrada».

## 4. Landing

### KD-08 «Cobra con CoDi»

> **xangarro.mx · a section «Cobra con CoDi, sin terminal y sin comisiones».** Three short beats:
>
> - «Configúralo en 2 minutos con el QR de tu banco»;
> - «Tu cliente paga desde su app»;
> - «Cada cobro queda en tus cuentas».
>
> A phone mock showing KD-04, and a line «Incluido en todos los planes, también el gratis». Do not
> claim «confirmación automática» yet. Tie it gently to the new law: «La nueva Ley de Economía
> Digital impulsa los pagos con QR. Tu negocio ya está listo.»
