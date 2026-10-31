# Data safety — the answers for Play Console

Play Console → App content → Data safety. Derived on 2026-10-30 from the same
code review as the App Store label (`../apple/PRIVACY-LABEL.md`) and checked
against the aviso de privacidad §3 (`docs/legal/aviso/aviso-integral.md`), so
the three cannot disagree. When a screen starts sending something new, update
all three together.

Google's rules that shape the answers:

- **Collected** means it leaves the device, optional data included (crash
  reports are opt-in here and are still declared).
- **Shared** means handed to a third party. Our own processors (database,
  hosting, Sentry, Expo's update server) work on our behalf, so nothing is
  shared.
- **Required vs optional:** optional when the person can use the app without
  that data ever leaving the device.

## Data collection and security

| Question                                                            | Answer                                                                                                                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does your app collect or share any of the required user data types? | **Yes**                                                                                                                                                       |
| Is all of the user data collected by your app encrypted in transit? | **Yes**: every endpoint is HTTPS, and release builds keep Android's default block on plain HTTP (nothing in `apps/mobile` overrides it)                       |
| Which methods of account creation does your app support?            | **My app does not allow users to create an account.** The owner creates the account on the web portal; the app only links a device to it (ADR-069)            |
| Data deletion                                                       | If the form offers a deletion link, use `https://xangarro.mx/soporte/` (its «Si eres el dueño del negocio» section) or `https://xangarro.mx/privacidad/arco/` |

## Data types to tick

Every row: **collected = yes**, **shared = no**, **not processed
ephemerally**, **purpose = App functionality** only.

| Play category → type                        | Required / optional | What it is in Xangarro                                                                                      | Same row on the App Store label                     |
| ------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Personal info → Email address               | Required            | The owner's email, typed when linking a device                                                              | Contact Info → Email Address                        |
| Personal info → Name                        | Optional            | Names of the business's fiado customers, only when fiado is used                                            | Contact Info → Name                                 |
| Personal info → Phone number                | Optional            | Those customers' phone numbers, for WhatsApp reminders                                                      | Contact Info → Phone Number                         |
| Personal info → User IDs                    | Required            | The operator's id on each shift, cash movement and record they create                                       | Identifiers → User ID                               |
| Financial info → Other financial info       | Required            | The business's sales, expenses, cash counts and stock movements                                             | Financial Info → Other Financial Info               |
| Messages → Other in-app messages            | Optional            | Operators' replies to the owner's messages (`respuestas_operador`)                                          | User Content → Other User Content                   |
| App activity → Other user-generated content | Required            | Free text typed into records (concepts, notes) and the description sent with «Reportar un problema»         | User Content → Other User Content, Customer Support |
| App info and performance → Crash logs       | Optional            | Crash reports, **only if the user turns them on**; scrubbed of names, phones, amounts and text              | Diagnostics → Crash Data                            |
| App info and performance → Diagnostics      | Required            | Platform, OS version and device name at linking; the scrubbed event log sent with a bug report              | Diagnostics → Other Diagnostic Data                 |
| Device or other IDs → Device or other IDs   | Required            | The device id Xangarro generates at linking, and `expo-updates`' random install id (not the advertising id) | Identifiers → Device ID                             |

Play has a «Messages» category Apple lacks, so the operators' replies sit
there instead of under user content; the data is the same.

Customer names and phones are data about the business's own customers, not
about the person using the app. Play has no separate place for that, so they
are declared under Personal info rather than left out.

## Not collected (leave unticked)

Location, Contacts, Health and fitness, Photos and videos, Audio, Files and
docs, Calendar, Web browsing, Installed apps, App interactions, In-app search
history, Purchase history (the app sells nothing), Payment info (no card is
ever typed: «Tarjeta» only records how the customer paid), Credit score, the
Advertising ID (no ads SDK; don't add the `AD_ID` permission).

## The camera

The camera reads QR and barcodes on the device; no image or frame leaves it,
so **Photos and videos** stays unticked. `app.json` turns the microphone off
(`recordAudioAndroid: false`), so no audio permission ships either.
