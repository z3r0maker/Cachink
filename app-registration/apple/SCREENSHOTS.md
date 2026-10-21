# Screenshots manifest — `screenshots/`

Captured 2026-10-20 from the real app (Maestro-driven on the simulator, the
contracts mock as the business data, `simctl status_bar` set to 9:41 / full
battery, the dev client's floating gear parked off-screen). No compositing,
no fixture screens — what the app shows against the demo taquería
(«Tacos La Esquina») is what the shots contain.

## The set (8 per device)

| Shot             | Screen                                   | Story it tells                     |
| ---------------- | ---------------------------------------- | ---------------------------------- |
| `01-activacion`  | The activation screen (manual-code view) | This app joins an existing negocio |
| `02-inicio`      | Inicio, hero with the turno open         | The operator's morning view        |
| `03-cobrar`      | Cobrar: catalogue + ticket building      | The money screen                   |
| `04-checkout`    | «¿Cómo paga?» with the method tiles      | Cash, card, transfer, fiado        |
| `05-venta-hecha` | Venta hecha + the comprobante share      | The sale closes, receipt goes out  |
| `06-ventas`      | The day's Ventas list                    | What the turno recorded            |
| `07-gastos`      | Gastos (cifras + the due recurrente)     | What left the drawer               |
| `08-mi-turno`    | Mi turno KPIs                            | The turno at a glance              |

## Devices and sizes (Apple's required sets)

| Folder        | Simulator                    | Resolution  |
| ------------- | ---------------------------- | ----------- |
| `iphone-6.9/` | iPhone 17 Pro Max (iOS 26.5) | 1320 × 2868 |
| `ipad-13/`    | iPad Pro 13-inch M5 (26.5)   | 2064 × 2752 |

## Known imperfections (for the next re-shoot)

- **«Quedan 0» on every product tile** in `03-cobrar`: the mock seeds a
  catalogue with no inventory movements, so stock reads zero everywhere.
  Realistic shelves want an inventory entrada driven before shot 03 (the
  `inventario-llego-merma` flow's steps do exactly that).
- The iPad captures fought the XCUITest tree-blindness wedge (the known
  CoreSimulator killall cure, several recoveries mid-set) — shots came out
  of a split run; verify visual continuity before submission.

## Reproducing

Metro must run with `EXPO_PUBLIC_E2E=1` (the sale sound's expo-audio replay
throws an unhandled native rejection on a second sale — see
[METADATA.md](./METADATA.md)'s checklist), the mock on :3000, the FAB parked
off-screen (`DevMenuFAB.positionX/Y -float -80`), camera permission granted
(`xcrun simctl privacy <udid> grant camera mx.xangarro.mobile`), and the
status bar overridden to 9:41. The capture drove: activation → login (Toni)
→ turno ($500 fondo) → two sales (Efectivo + Transferencia) → the eight
screens, screenshotting each.
