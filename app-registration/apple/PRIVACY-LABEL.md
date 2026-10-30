# App Privacy — the answers for App Store Connect

App Store Connect → App Privacy. Derived on 2026-10-30 from what the app's
code sends off the device, checked against the aviso de privacidad §3
(`docs/legal/aviso/aviso-integral.md`) so the two cannot disagree. When a
screen starts sending something new, update this file and the label together.

Apple's rule: declare data that leaves the device, **including optional
data** (crash reports are opt-in here and are still declared). Data handled
by our own processors (database, hosting) counts as ours, not a third party's.

## The first two questions

| Question                                          | Answer                                                 |
| ------------------------------------------------- | ------------------------------------------------------ |
| Do you or your third-party partners collect data? | **Yes**                                                |
| Is data used to track users (ATT)?                | **No**: no ads, no data brokers, no cross-app tracking |

## Data types to tick

Every row: **purpose = App Functionality only**, **not used for tracking**.

| Apple category → type                 | Linked to the user | What it is in Xangarro                                                                                        | Where in the code                                                                 |
| ------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Contact Info → Email Address          | Yes                | The owner's email, typed when linking a device                                                                | `contracts/src/activate.ts`                                                       |
| Contact Info → Name                   | Yes                | Names of the business's fiado customers, created at checkout                                                  | `ui/src/screens/Checkout/use-crear-cliente-fiado.ts`, `clients` is a synced table |
| Contact Info → Phone Number           | Yes                | Those customers' phone numbers (for WhatsApp reminders)                                                       | `domain/src/entities/client.ts`                                                   |
| Financial Info → Other Financial Info | Yes                | The business's sales, expenses, cash counts and stock movements                                               | `contracts/src/sync-push.ts`                                                      |
| User Content → Other User Content     | Yes                | Free text typed into those records (concepts, notes) and operators' replies to the owner's messages           | `contracts/src/sync-push.ts`                                                      |
| User Content → Customer Support       | Yes                | The description sent with «Reportar un problema»                                                              | `ui/src/screens/Settings/use-bug-report-submit.ts`                                |
| Identifiers → User ID                 | Yes                | The operator's id on each shift, cash movement and record they create                                         | `data/src/schema/caja-turnos.ts`, `_audit.ts`                                     |
| Identifiers → Device ID               | Yes                | The device id Xangarro generates at linking (not the advertising id)                                          | `contracts/src/activate.ts`                                                       |
| Diagnostics → Crash Data              | **No**             | Crash reports, **only if the user turns them on**; scrubbed of names, phones, amounts and text before sending | `ui/src/telemetry/sentry.native.ts`, `pii-scrubber.ts`                            |
| Diagnostics → Other Diagnostic Data   | Yes                | Platform, OS version and device name at linking; the scrubbed event log sent with a bug report                | `contracts/src/activate.ts`, bug report                                           |

Customer names and phones are data about the business's own customers, not
about the person using the app. Apple's form has no separate place for that,
so they are declared under Contact Info rather than left out.

## Not collected (leave unticked)

Location (no GPS, no location permission), Contacts (the address book is
never read), Health & Fitness, Sensitive Info, Browsing and Search History,
Purchases (the app sells nothing), Usage Data (no analytics SDK), Photos or
Videos and Audio (the camera only reads codes; no image leaves the device).

## Third-party SDKs that send data

| SDK                    | What it sends                                                                                          | Declared as          |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | -------------------- |
| `@sentry/react-native` | Crash reports, opt-in, scrubbed                                                                        | Crash Data           |
| `expo-updates`         | The app version and a random install id (`EAS-Client-ID`) to Expo's update server, to download updates | Covered by Device ID |

## Privacy manifest (separate from the label)

Apple refuses an upload whose binary uses a «required reason» API without a
privacy manifest (email `ITMS-91053`). Expo's modules ship their own manifests
and EAS merges them at build time, so nothing is configured in `app.json`
today. If the first production upload is flagged, add the APIs the email names
under `expo.ios.privacyManifests` in `apps/mobile/app.json` and rebuild.
