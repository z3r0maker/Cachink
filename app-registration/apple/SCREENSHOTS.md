# Screenshots manifest — `screenshots/`

Captured 2026-11-17 from the real app by one Maestro flow,
[`store-screenshots.yaml`](../../apps/mobile/maestro/flows/internal/store-screenshots.yaml),
against the contracts mock, on `main` with the brand font (PR #117). No
compositing, no fixture screens: what the app shows for the demo taquería
(«Tacos La Esquina») is what the shots contain. Play's set comes from the same
flow ([`../google-play/SCREENSHOTS.md`](../google-play/SCREENSHOTS.md)).

## The story

The turno opens with a $2,000 fondo; ten products arrive (all twenty on the
iPad, whose Cobrar shows every row); then three sales: cash with change (2 Alambre, 2 Agua de horchata,
1 Café, $265.00 paid with $500), transfer ($150.00) and card ($227.50).

| Shot             | Screen                                | What it shows                      |
| ---------------- | ------------------------------------- | ---------------------------------- |
| `01-activacion`  | Vincular, the typed code              | This app joins an existing negocio |
| `02-inicio`      | Inicio with the turno open            | The operator's view of the day     |
| `03-cobrar`      | Cobrar: catalogue + ticket building   | The money screen                   |
| `04-checkout`    | «¿Cómo paga?», $500 and the change    | Cash, card, transfer, fiado        |
| `05-venta-hecha` | Venta hecha with «Dale de cambio»     | The sale closes, receipt goes out  |
| `06-ventas`      | Ventas del turno                      | What the turno recorded            |
| `07-gastos`      | Gastos del turno (cifras, recurrente) | What left the drawer               |
| `08-mi-turno`    | Mi turno: the cash that must be there | The turno at a glance              |

## Devices and sizes (Apple's required sets)

| Folder        | Simulator                    | Resolution  |
| ------------- | ---------------------------- | ----------- |
| `iphone-6.9/` | iPhone 17 Pro Max (iOS 26.5) | 1320 × 2868 |
| `ipad-13/`    | iPad Pro 13-inch M5 (26.5)   | 2064 × 2752 |

## Known imperfections (for the next re-shoot)

- **Gastos shows no gasto**: since M-15 it lists only the turno's stamped
  gastos, and the story records none, so its cifras read zero and the empty
  state's search badge peeks above the tab bar. Only «Renta local», the due
  recurrente, fills the screen.
- **The iPad's code boxes** show the typed code faintly behind the first box
  («VALDK7M3»): the hidden field's own text bleeds through (shot 01).

## Reproducing

1. The contracts mock on :3000 (`PORT=3000 pnpm mock:api`) and Metro with
   `EXPO_PUBLIC_E2E=1 EXPO_PUBLIC_API_BASE=http://127.0.0.1:3000` (see the
   Maestro README). Start Metro with `--clear` after switching branches: a
   stale Metro serves the old modules.
2. Per simulator, once: the dev menu's «Tools button» off (the floating gear),
   `xcrun simctl status_bar <udid> override --time 9:41 --batteryState discharging --batteryLevel 100`.
3. Per run: `MAESTRO_DEVICE_UDID=<udid> apps/mobile/maestro/scripts/fresh-install.sh --kill --reset-only`
   (never `clearState`: it also forgets the dev client's settings), then from
   `apps/mobile/maestro/flows/internal/`:
   `maestro --device <udid> test -e OUT=<folder> -e FORMA=telefono store-screenshots.yaml`
   (`FORMA=tableta` on the iPad; `-e MOCK=http://127.0.0.1:<port>` when the
   mock is not on :3000).
4. **One Maestro run at a time, iOS and Android together.** Maestro 2.5 gives
   every device host port 7001: an Android run takes it from an iOS driver
   mid-flow, and an iOS driver left running (`xcodebuild test-without-building`)
   answers for the simulator it was started on, not the one passed to
   `--device`. Stop leftover drivers before an iOS run, and shut the Android
   emulators down first: on a loaded Mac the simulator keyboard drops letters
   («jmai» for «jamaica») and the entradas fail.
5. Look at every shot before copying it here: a capture can catch the
   Dynamic Island's momentary blob (`store-pausa.yaml` waits it out).
