# App Review — notes and pre-submission checklist

What goes in App Store Connect → the version → **App Review Information**,
and what to check before every submission (N-32's reviewer checklist, X-05).

## Before every submission

1. **Re-run the demo seed against the hosted database.** It re-mints both
   codes and revokes the last review's devices. The Xangarro plan has two
   device slots, so without this a second review cannot link at all
   (`NO_DEVICE_SLOTS`), even with a live code:

   ```bash
   DATABASE_URL=… BILLING_DATABASE_URL=… DEMO_OWNER_PASSWORD=… \
     pnpm --filter @xangarro/data-pg exec tsx scripts/seed-demo.ts
   ```

   It prints `códigos DEMXK7M3, DEMXPAD2`. Each code links **one device, once**.
   An App Store review can use both, so never have the App Store and Google
   Play in review at the same time ([one store at a time](../google-play/README.md#one-store-at-a-time)).

2. **Walk the steps below yourself** on a fresh install of the build you are
   submitting, with `DEMXK7M3`. Then re-run the seed, so both codes and both
   slots are free again for the reviewer.
3. `pnpm lint:store` is green (it gates CI): no price, plan name or link to
   buy anywhere in the app's copy. See [AUDIT-steering.md](./AUDIT-steering.md).
4. `https://xangarro.mx/soporte/` and `https://xangarro.mx/privacidad/` load.
5. The App Privacy answers match [PRIVACY-LABEL.md](./PRIVACY-LABEL.md).

## Sign-in information (the two fields)

| Field     | Value              |
| --------- | ------------------ |
| User name | `demo@xangarro.mx` |
| Password  | `DEMXK7M3`         |

There is no password in the usual sense; the notes below explain the second
code and the NIP.

## Notes (paste as is)

```text
Xangarro is a point-of-sale and cash-register app for small businesses in
Mexico. A business owner sets up the business on our website; this app is the
register their employees use at the counter. Business owners buy the service
on our website. The app has no purchases, prices, plans or links to buy, and
it does not let anyone create an account.

HOW TO SIGN IN (demo business "Tacos La Esquina")
1. On the first screen, tap "Escribe el código".
2. "Correo del dueño": demo@xangarro.mx
   "Código de 8 letras": DEMXK7M3
   Tap "Conectar esta caja".
3. Choose "Lupita" and enter the NIP 1234 (or "Chuy", NIP 5678).
4. To start selling, open the shift: count the cash float and confirm.

Each code links one device, once. If you test on a second device (for
example an iPad), use the code DEMXPAD2 for it with the same email.

The QR option on the first screen does the same thing, but needs the owner's
website on a second screen, so the typed code is the easier path.

WHAT TO TRY
- Cobrar: add products to a ticket and charge it in cash, card, transfer or
  fiado (store credit). The receipt can be shared by WhatsApp.
- Turn on airplane mode: sales still go through and are sent when the
  connection returns.
- Ventas, Gastos and Mi turno show the day's sales, expenses and totals.

PERMISSIONS
The camera is used only to scan the owner's QR code and product barcodes.

ACCOUNTS AND DATA
Employees do not create accounts in the app; the business owner adds them on
the website. A business can request deletion of its account and data at
soporte@xangarro.mx or through https://xangarro.mx/privacidad/arco/.
The privacy policy and the terms open from Mi turno > Ajustes > "Privacidad
y términos", and from the privacy notice on the linking screen.

Support: soporte@xangarro.mx · https://xangarro.mx/soporte/
```

## Contact information

The person App Review may call or email: a founder's name, phone and email.
Fill it in App Store Connect; it is not kept in the repo.
