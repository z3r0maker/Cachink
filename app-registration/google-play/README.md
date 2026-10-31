# App Registration — Google Play

The Play Store presence for the phone app (`mx.xangarro.mobile`). The
positioning is the same as on the App Store (`../apple/README.md`): **the app
is the terminal, the portal is the product.** Nobody buys anything in the app,
so it needs no Play Billing and its copy points at no purchase.

## What lives here

| File                                                                         | What it is                                                               |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`docs/store/listing-play-store.md`](../../docs/store/listing-play-store.md) | Main store listing: name, descriptions, contact, graphics                |
| [DATA-SAFETY.md](./DATA-SAFETY.md)                                           | The Data safety form, row by row                                         |
| This file                                                                    | The other App content answers, reviewer access, the order of submissions |
| [`docs/beta/play-internal-setup.md`](../../docs/beta/play-internal-setup.md) | The internal testing track and the EAS service account                   |

## The developer account

Open it as an **organization** (MEXIA, S.A.S.), not a personal account. Google
asks new personal accounts to run a closed test with at least 12 testers for
14 days before the first production release; organization accounts skip that,
but need the company's D-U-N-S number, which can take a few days to get.

## App content (Policy → App content)

| Section            | Answer                                                                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Privacy policy     | `https://xangarro.mx/privacidad/`                                                                                                                                                                                     |
| Ads                | **No**, the app contains no ads                                                                                                                                                                                       |
| App access         | **All or some functionality is restricted**; the instructions are below                                                                                                                                               |
| Content rating     | Fill the IARC questionnaire as a non-game utility: no violence, sex, language, drugs or gambling. Answer **yes** to «users can interact»: the owner sends messages to operators and they reply. Digital purchases: no |
| Target audience    | **18 and over** only. Not designed for children; no appeal to them in the listing                                                                                                                                     |
| News app           | No                                                                                                                                                                                                                    |
| Government app     | No                                                                                                                                                                                                                    |
| Health             | No health features                                                                                                                                                                                                    |
| Financial features | The app moves no money: no loans, payments, transfers, wallets or trading. It records sales a business made elsewhere. Choose the option that says it offers none of the listed financial features                    |
| Data safety        | [DATA-SAFETY.md](./DATA-SAFETY.md)                                                                                                                                                                                    |
| Advertising ID     | **No**, the app does not use it                                                                                                                                                                                       |

## App access (the reviewer's sign-in)

Play Console → App content → App access → **Add instructions**. One entry:

| Field                   | Value                                       |
| ----------------------- | ------------------------------------------- |
| Name                    | `Demo business`                             |
| Username, email address | `demo@xangarro.mx`                          |
| Password                | the code that is free (see the order below) |
| Any other information   | the text below                              |

```text
Xangarro is a point-of-sale and cash-register app for small businesses in
Mexico. A business owner sets up the business on our website; this app is the
register their employees use at the counter. The app has no purchases,
prices, plans or links to buy, and it does not let anyone create an account.

HOW TO SIGN IN (demo business "Tacos La Esquina")
1. On the first screen, tap "Escribe el código".
2. "Correo del dueño": demo@xangarro.mx
   "Código de 8 letras": the code in the Password field.
   Tap "Conectar esta caja".
3. Choose "Lupita" and enter the NIP 1234 (or "Chuy", NIP 5678).
4. To start selling, open the shift: count the cash float and confirm.

Each code links one device, once. To test on a second device, use the
other code, DEMXK7M3 or DEMXPAD2, with the same email.

The camera is used only to scan the owner's QR code and product barcodes.
The privacy policy and the terms open from Mi turno > Ajustes > "Privacidad
y términos".
Support: soporte@xangarro.mx · https://xangarro.mx/soporte/
```

## One store at a time

The demo business has two device slots and two single-use codes
(`DEMXK7M3`, `DEMXPAD2`). An App Store review can use both (iPhone and iPad),
so **don't have both stores in review at once**:

1. Re-run the demo seed (`../apple/REVIEW-NOTES.md`, step 1). It re-mints
   both codes and frees both slots.
2. Submit to one store and wait for its decision.
3. Re-run the seed, then submit to the other.

Every later update that goes to review follows the same rule.

**Don't give the pre-launch report any credentials** (Testing → Pre-launch
report → Settings). Its robots run on several devices at once; with the code
they would link, use up both slots and leave the human reviewer locked out.
Without it they stop at the linking screen, which is expected.

## Before every submission

1. The demo seed was re-run, as above.
2. Walk the sign-in yourself on a fresh install of the build, then re-run the
   seed.
3. `pnpm lint:store` is green.
4. `https://xangarro.mx/soporte/` and `https://xangarro.mx/privacidad/` load.
5. The Data safety form matches [DATA-SAFETY.md](./DATA-SAFETY.md).
