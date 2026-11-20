# Screenshots manifest — `screenshots/`

Captured 2026-11-19 from the real app by one Maestro flow,
[`store-screenshots.yaml`](../../apps/mobile/maestro/flows/internal/store-screenshots.yaml),
against the contracts mock, on `main` with the gasto's receipt photo (PR #181)
and the redesigned Ventas and Mi turno (PRs #195, #196). No
compositing, no fixture screens: what the app shows for the demo taquería
(«Tacos La Esquina») is what the shots contain. Play's set comes from the same
flow ([`../google-play/SCREENSHOTS.md`](../google-play/SCREENSHOTS.md)).

## The story

The caja is «Caja 1». The turno opens with a $2,000 fondo; all twenty
products arrive, so nothing reads «Quedan 0» and the bell counts only the
owner's two messages; then three sales: cash with change (2 Alambre, 2 Agua de
horchata, 1 Café, $265.00 paid with $500), transfer ($150.00) and card
($227.50); and one gasto, $180.00 of tortillas, with its ticket's photo picked
from the gallery (the simulator has no camera), so Gastos reads «Con foto» and
Mi turno «1 comprobante». Expected cash: $2,085.00.

The numbers are the store's order, not the capture's: Inicio first, because
Don greets there; Vincular last, because a privacy notice should not open the
set.

| Shot             | Screen                                  | What it shows                      |
| ---------------- | --------------------------------------- | ---------------------------------- |
| `01-inicio`      | Inicio with the turno open              | The operator's view of the day     |
| `02-cobrar`      | Cobrar: catalogue + ticket building     | The money screen                   |
| `03-checkout`    | «¿Cómo paga?», $500 and the change      | Cash, card, transfer, fiado        |
| `04-venta-hecha` | Venta hecha with «Dale de cambio»       | The sale closes, receipt goes out  |
| `05-mi-turno`    | Mi turno: the cash and the turno's rows | The turno at a glance              |
| `06-ventas`      | Ventas del turno, totals and filters    | What the turno recorded            |
| `07-gastos`      | Gastos del turno with one gasto         | What left the drawer               |
| `08-activacion`  | Vincular, the typed code                | This app joins an existing negocio |

## Devices and sizes (Apple's required sets)

| Folder        | Simulator                    | Resolution  |
| ------------- | ---------------------------- | ----------- |
| `iphone-6.9/` | iPhone 17 Pro Max (iOS 26.5) | 1320 × 2868 |
| `ipad-13/`    | iPad Pro 13-inch M5 (26.5)   | 2064 × 2752 |

## Known imperfections (for the next re-shoot)

- **Inicio greets «¡Buenas tardes, Toni!»** under a 9:41 status bar: the
  greeting follows the simulator's real clock, and the set was taken after
  noon.
- **«Renta local» reads «Atrasado 18 días»**: the mock's recurrente is due on
  the 1st and nobody registers it in the story.
- **On the iPhone, Mi turno's Gastos row is cut** («$180.00 salieron de la
  c…»): the «Atrasado 18 días» chip takes the row's width. The iPad has room
  and reads «· 1 comprobante». Fixed in the app (the line wraps to two since
  2026-11-20); `05-mi-turno` on the iPhone needs a daytime re-shoot, since
  the simulators follow the Mac's clock and a shot after midnight reads
  another day than the rest of the set.
- **The iPad** draws its window-resize arc in the bottom-right corner, and the
  status bar's «9:41 a.m.» sits over the rail's «Caja 1» chip; both are iPadOS.

## Reproducing

1. The contracts mock on :3000 (`PORT=3000 pnpm mock:api`) and Metro with
   `EXPO_PUBLIC_E2E=1 EXPO_PUBLIC_API_BASE=http://127.0.0.1:3000` (see the
   Maestro README). Start Metro with `--clear` after switching branches: a
   stale Metro serves the old modules.
2. Per simulator, once: the dev menu's «Tools button» off (the floating gear);
   `xcrun simctl rename <udid> "Caja 1"`, then shut it down and boot it again
   (the header reads the device's name, and only a reboot changes it); then
   `xcrun simctl status_bar <udid> override --time 9:41 --dataNetwork wifi --wifiMode active --wifiBars 3 --cellularMode active --cellularBars 4 --operatorName '' --batteryState discharging --batteryLevel 100`
   (a reboot drops the override; without the cellular flags a shot can lose
   its signal bars). Rename it back afterwards.
3. Per run: `MAESTRO_DEVICE_UDID=<udid> apps/mobile/maestro/scripts/fresh-install.sh --kill --reset-only`
   (never `clearState`: it also forgets the dev client's settings), then from
   `apps/mobile/maestro/flows/internal/`:
   `apps/mobile/maestro/scripts/maestro-locked.sh --device <udid> test --test-output-dir=<folder> -e OUT=shots -e FORMA=telefono store-screenshots.yaml`
   (`FORMA=tableta` on the iPad; `-e MOCK=http://127.0.0.1:<port>` when the
   mock is not on :3000). Maestro 2.12 writes a screenshot only inside the
   run's own output folder: the shots land in
   `<folder>/<run>/…/shots/0N-<name>.png`, to copy out from there.
4. **One Maestro run at a time, iOS and Android together.** Maestro 2.5 gives
   every device host port 7001: an Android run takes it from an iOS driver
   mid-flow, and an iOS driver left running (`xcodebuild test-without-building`)
   answers for the simulator it was started on, not the one passed to
   `--device`. Stop leftover drivers before an iOS run, and shut the Android
   emulators down first: on a loaded Mac the simulator keyboard drops letters
   («jmai» for «jamaica») and the entradas fail.
5. Look at every shot before copying it here: a capture can catch the
   Dynamic Island's momentary blob (`store-pausa.yaml` waits it out).
