# Screenshots manifest — `screenshots/`

Captured 2026-11-19 from the real app on the Android emulator by the same
Maestro flow as the App Store set,
[`store-screenshots.yaml`](../../apps/mobile/maestro/flows/internal/store-screenshots.yaml),
against the contracts mock, on `main` with the gasto's receipt photo (PR #181)
and the redesigned Ventas and Mi turno (PRs #195, #196). No compositing, no
fixture screens. The story, the eight shots and their order are the App
Store's ([`../apple/SCREENSHOTS.md`](../apple/SCREENSHOTS.md)): «Caja 1», a
$2,000 turno, all twenty products stocked, then cash with change, transfer
and card, and one gasto, $180.00 of tortillas, with its ticket's photo picked
from the gallery. Expected cash: $2,085.00.

| Shot             | Screen                                  | What it shows                      |
| ---------------- | --------------------------------------- | ---------------------------------- |
| `01-inicio`      | Inicio with the turno open              | The operator's view of the day     |
| `02-cobrar`      | Cobrar: catalogue + ticket building     | The money screen                   |
| `03-checkout`    | «Total a cobrar», $500 and the change   | Cash, card, transfer, fiado        |
| `04-venta-hecha` | Venta hecha with «Dale de cambio»       | The sale closes, receipt goes out  |
| `05-mi-turno`    | Mi turno: the cash and the turno's rows | The turno at a glance              |
| `06-ventas`      | Ventas del turno, totals and filters    | What the turno recorded            |
| `07-gastos`      | Gastos del turno with one gasto         | What left the drawer               |
| `08-activacion`  | Vincular, the typed code                | This app joins an existing negocio |

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

- **The phone's Inicio** leaves «Efectivo esperado» ($2,085.00) below the
  tab bar: 1920 px is shorter than an iPhone, and Plus Jakarta Sans sets the
  cards a little taller. Mi turno (05) shows the figure.
- **The phone's Gastos** is scrolled to the gasto, so «Lo que salió de la caja»
  and the cifras are above the shot.
- **The times read past ten** (the turno «desde las 11:34» on the tablet)
  under a 9:41 status bar: the clock was set to 9:41 so Inicio says «Buenos
  días», and it kept running through the capture.
- **«Renta local» reads «Atrasado 18 días»**: the mock's recurrente is due on
  the 1st and nobody registers it in the story.
- The shots were taken from a debug build (the dev client), which draws
  exactly what a release build draws on these screens.

## Reproducing

1. The contracts mock (`PORT=3007 pnpm mock:api`, any free port) and Metro
   with `EXPO_PUBLIC_E2E=1 EXPO_PUBLIC_API_BASE=http://10.0.2.2:3007`, started
   with `--clear`. `10.0.2.2` is the host from the emulator: Maestro restarts
   adb, which drops any `adb reverse`. In an agent sandbox Metro's file
   watcher does not run, so restart it with `--clear` after every edit.
2. The debug dev client: `npx expo prebuild -p android`, then, in the
   generated `android/app/src/main/AndroidManifest.xml` (gitignored, local
   only):
   - delete the two `expo.modules.updates.CODE_SIGNING_*` entries. The app
     signs its OTA updates (ADR-145), and with them a debug build asks Metro
     for a signed manifest, which Metro refuses without the private key.
   - add
     `<meta-data android:name="EXDevMenuShowFloatingActionButton" android:value="false"/>`
     inside `<application>`. The dev menu's «Tools button» setting does not
     survive a relaunch, and this sets its default to off; without it every
     shot gets the floating gear over the status bar.

   Then `./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a`
   (`JAVA_HOME` on JDK 17). A build signed with another debug key must be
   uninstalled first.

3. Boot each emulator with `-no-window`: with a window, the Mac's pointer
   resting over it hovers Android 15's app handle, and every shot gets a grey
   box behind the bar at the top. The box can also come up headless; another
   app in front (Settings) clears it, so check the top of the screen before a
   run. Per emulator, once: `hw.keyboard=no` in its AVD `config.ini` (with a
   hardware keyboard Gboard shows only a floating bar, and the flow's
   `hideKeyboard` then presses Back and closes the app), and
   `adb shell settings put secure stylus_handwriting_enabled 0` (the Play
   image reports its touch input as a stylus, with the same effect).
4. Per boot: `adb shell settings put global device_name "'Caja 1'"` (the
   header says the device's name); the clock at 9:41 in the morning
   (`settings put global auto_time 0`, then `cmd alarm set-time <epoch ms>`),
   so the greeting matches the status bar; and SystemUI demo mode:
   `sysui_demo_allowed 1`, then the `com.android.systemui.demo` broadcasts
   `enter`, `clock -e hhmm 0941`, `network -e wifi show -e level 4 -e fully true`,
   `network -e mobile show -e datatype none -e level 4`,
   `battery -e level 100 -e plugged false`, `notifications -e visible false`.
   The tablet also gets `adb shell wm size 2560x1440` and `wm density 288`
   (800 dp across in portrait, the real Pixel Tablet's width, so the app
   draws its tablet rail), and is turned to portrait
   (`settings put system accelerometer_rotation 0`, then `user_rotation 1`).
   Re-enter demo mode (`exit`, then `enter`) after a density change or the
   Wi-Fi icon doubles.
5. Per run: `adb shell "run-as mx.xangarro.mobile sh -c 'rm -f files/SQLite/xangarro.db*'"`
   (the quotes keep the `*` for the device's shell; never `clearState`, which
   forgets the dev client's settings), open the dev client at
   `exp+xangarro://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081`
   (Metro's port), then from `apps/mobile/maestro/flows/internal/`:
   `apps/mobile/maestro/scripts/maestro-locked.sh --device <serial> test --no-reinstall-driver --test-output-dir=<folder> -e OUT=shots -e FORMA=telefono -e MOCK=http://127.0.0.1:3007 store-screenshots.yaml`
   (`FORMA=tableta` on the tablet). A full run takes about 25 minutes on the
   phone and 45 on the tablet. Since Maestro 2.12 the shots land in
   `<folder>/<run>/…/shots/` (a screenshot outside the run's output folder is
   refused); copy them out from there.
6. When other Maestro sessions are registered, Maestro skips starting its
   Android driver and every command fails with `UNAVAILABLE (tcp:7001)`.
   Install `maestro-app.apk` and `maestro-server.apk` (inside
   `~/.maestro/lib/maestro-client.jar`), keep
   `adb shell am instrument -w -m -e debug false -e class 'dev.mobile.maestro.MaestroDriverService#grpcServer' dev.mobile.maestro.test/androidx.test.runner.AndroidJUnitRunner`
   running, and pass `--no-reinstall-driver`.
7. Look at every shot before copying it here.
