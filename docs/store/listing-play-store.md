# Xangarro — Google Play listing (es-MX)

Paste-ready text for each Play Console field (Grow → Store presence → Main
store listing). The number after each heading is Google's character limit;
every field was counted against it on 2026-10-30. Like the App Store listing
(`listing-app-store.md`), the text names no price or plan and has no link to
buy: the app sells nothing, so nothing in it may point at a purchase. No
emoji, no ranking words («el mejor», «#1»): Play's metadata policy rejects
both. The rest of the Play Console answers are in `app-registration/google-play/`.

## Nombre de la app (30)

Xangarro! Caja de tu negocio

Play has no subtitle, so the name carries the description. If Play objects to
the descriptor, use `Xangarro!` alone.

## Descripción breve (80)

Cobra, registra gastos y cierra la caja de tu negocio, aunque no haya internet.

## Descripción completa (4000)

Xangarro es la caja de tu negocio en el teléfono o la tablet. Tu equipo cobra en el mostrador, registra los gastos y cierra el turno, y todo llega a la cuenta del negocio.

Para usar la app necesitas una cuenta de Xangarro. El dueño vincula cada dispositivo con un código o un QR, y cada persona del equipo entra con su NIP.

COBRA EN SEGUNDOS
• Arma el ticket tocando tus productos o escaneando su código de barras.
• Cobra en efectivo, tarjeta, transferencia o fiado.
• La app te dice el cambio y manda el comprobante por WhatsApp.

SE VA EL INTERNET, NO LA VENTA
• La app sigue cobrando sin conexión.
• Las ventas se envían solas cuando vuelve la señal.

CAJA Y TURNOS
• Abre el turno con el fondo de la caja y ciérralo con el corte.
• Ve lo que se vendió y lo que salió de la caja en el día.

GASTOS E INVENTARIO
• Registra los gastos del día y confirma los recurrentes cuando toca.
• Da entrada a la mercancía y lleva el stock al día.

FIADO
• Anota quién te debe y mándale un recordatorio por WhatsApp.

Funciona en teléfonos y tablets Android, en español y en pesos.

## Categoría

App → **Empresa** (Business).

## Etiquetas

Play only offers tags from its own list (up to five). Pick the ones closest
to: punto de venta, caja registradora, inventario, pequeños negocios,
contabilidad. Leave out any tag about payments or banking: the app moves no
money.

## Datos de contacto

| Campo              | Valor                       |
| ------------------ | --------------------------- |
| Correo electrónico | soporte@xangarro.mx         |
| Sitio web          | https://xangarro.mx         |
| Teléfono           | (opcional; vacío por ahora) |

## Política de privacidad (App content → Privacy policy)

https://xangarro.mx/privacidad/

## Gráficos

| Asset                 | Play's rule                                  | Status                                                                                                                                                                                                    |
| --------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ícono (512 × 512 PNG) | 32-bit PNG, ≤ 1 MB                           | Ready: `assets/brand/icons/app-icon-512.png`                                                                                                                                                              |
| Gráfico de funciones  | 1024 × 500, JPEG or 24-bit PNG, no alpha     | **Missing.** Brand work (X-07); draw it on the canvas first                                                                                                                                               |
| Capturas de teléfono  | 2–8, each side 320–3840 px, at most 2:1      | **Missing.** The App Store set (`app-registration/apple/screenshots/iphone-6.9/`, 1320 × 2868) is 2.17:1, over Play's limit, and shows the iOS status bar. Re-shoot the same eight on an Android emulator |
| Capturas de tablet    | 7" and 10" sets, needed for the tablet badge | **Missing.** The iPad set (2064 × 2752) fits the size rule but shows iPadOS; re-shoot on an Android tablet emulator                                                                                       |

The eight shots and their story are in `app-registration/apple/SCREENSHOTS.md`;
the Android set should tell the same story in the same order.
