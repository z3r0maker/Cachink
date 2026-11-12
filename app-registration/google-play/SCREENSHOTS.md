# Screenshots manifest — `screenshots/`

Captured 2026-11-12 from the real app on the Android emulator by the same
Maestro flow as the App Store set,
[`store-screenshots.yaml`](../../apps/mobile/maestro/flows/internal/store-screenshots.yaml),
against the contracts mock. No compositing, no fixture screens. The story,
the eight shots and their order are the App Store's
([`../apple/SCREENSHOTS.md`](../apple/SCREENSHOTS.md)): a $2,000 turno, ten
products stocked (all twenty on the tablet, whose Cobrar shows every row and
whose Inicio lists what needs restocking), then cash with change, transfer and card.

| Shot             | Screen                                | What it shows                      |
| ---------------- | ------------------------------------- | ---------------------------------- |
| `01-activacion`  | Vincular, the typed code              | This app joins an existing negocio |
| `02-inicio`      | Inicio with the turno open            | The operator's view of the day     |
| `03-cobrar`      | Cobrar: catalogue + ticket building   | The money screen                   |
| `04-checkout`    | «¿Cómo paga?», $500 and the change    | Cash, card, transfer, fiado        |
| `05-venta-hecha` | Venta hecha with «Dale de cambio»     | The sale closes, receipt goes out  |
| `06-ventas`      | Ventas del turno                      | What the turno recorded            |
| `07-gastos`      | Gastos del turno (cifras, categories) | What left the drawer               |
| `08-mi-turno`    | Mi turno: the cash that must be there | The turno at a glance              |

## Devices and sizes (Play's rules)

| Folder    | Emulator (android-35, Play image)                     | Resolution  | Play's rule                           |
| --------- | ----------------------------------------------------- | ----------- | ------------------------------------- |
| `phone/`  | `Xangarro_Phone`                                      | 1080 × 1920 | 9:16, long side ≤ 2× the short        |
| `tablet/` | `Pixel_Tablet`, `wm size 2560x1440`, `wm density 288` | 1440 × 2560 | 9:16 portrait, each side 1080–7680 px |

The Pixel Tablet's own panel is 2560 × 1600 (16:10), which Play refuses for
large screens; the display override gives the app a 16:9 window and the
capture is that window. Portrait, like the App Store's iPad set: in landscape
the entrada sheet and the keyboard cover «Guardar».

## Known imperfections (for the next re-shoot)

- **The type is the system font**, not Plus Jakarta Sans, as in the App Store
  set: re-shoot both stores once the phone loads the brand font (PR #117).
- **The phone's Inicio** cuts «Efectivo esperado» ($2,265.00) at the tab bar:
  1920 px is shorter than an iPhone, and the figure is still readable.
- **Gastos** shows no gasto: the story records none, so its cifras read zero.
- The shots were taken from a debug build (the dev client), which draws
  exactly what a release build draws on these screens.

## Reproducing

1. The contracts mock (`PORT=3007 pnpm mock:api`, any free port) and Metro
   with `EXPO_PUBLIC_E2E=1 EXPO_PUBLIC_API_BASE=http://10.0.2.2:3007`, started
   with `--clear`. `10.0.2.2` is the host from the emulator: Maestro restarts
   adb, which drops any `adb reverse`. In an agent sandbox Metro's file
   watcher does not run, so restart it with `--clear` after every edit.
2. Per emulator, once: `hw.keyboard=no` in its AVD `config.ini` (with a
   hardware keyboard Gboard shows only a floating bar, and the flow's
   `hideKeyboard` then presses Back and closes the app), and
   `adb shell settings put secure stylus_handwriting_enabled 0` (the Play
   image reports its touch input as a stylus, with the same effect), the dev
   menu's «Tools button» off (the floating gear), then install the
   debug dev client
   (`npx expo prebuild -p android`, then
   `./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a`),
   `adb shell settings put global device_name Mostrador`, and SystemUI demo
   mode: `sysui_demo_allowed 1`, then the `com.android.systemui.demo`
   broadcasts `enter`, `clock -e hhmm 0941`,
   `network -e wifi show -e level 4 -e fully true`, `network -e mobile hide`,
   `battery -e level 100 -e plugged false`, `notifications -e visible false`.
   The tablet also gets `adb shell wm size 2560x1440` and `wm density 288`
   (800 dp across in portrait, the real Pixel Tablet's width, so the app
   draws its tablet rail), and is turned to portrait
   (`settings put system accelerometer_rotation 0`, then `user_rotation 1`).
3. Per run: `adb shell run-as mx.xangarro.mobile rm -f files/SQLite/xangarro.db*`
   (never `clearState`: it forgets the dev client's settings), open the dev
   client at
   `exp+xangarro://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081`
   (Metro's port), then from `apps/mobile/maestro/flows/internal/`:
   `maestro --device <serial> test -e OUT=<folder> -e FORMA=telefono -e MOCK=http://127.0.0.1:3007 store-screenshots.yaml`
   (`FORMA=tableta` on the tablet).
4. When other Maestro sessions are registered, Maestro skips starting its
   Android driver and every command fails with `UNAVAILABLE (tcp:7001)`.
   Install `maestro-app.apk` and `maestro-server.apk` (inside
   `~/.maestro/lib/maestro-client.jar`), keep
   `adb shell am instrument -w -m -e debug false -e class 'dev.mobile.maestro.MaestroDriverService#grpcServer' dev.mobile.maestro.test/androidx.test.runner.AndroidJUnitRunner`
   running, and pass `--no-reinstall-driver`.
5. Look at every shot before copying it here.
