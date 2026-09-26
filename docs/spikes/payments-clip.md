# Spike: Clip PinPad for N-40 (card payments at the mostrador)

Date: 2026-09-25 · Task: N-40 · ADR-066 · Script: `scripts/spikes/clip-pinpad.ts`

Read from `developer.clip.mx` (the `.md` version of each page). Hands-on run:
**pending a reader with the PinPad app and production credentials**.

## Verdict so far

**Go, with an owner action first.** The API is small and does what N-53 needs, but
there is **no sandbox**: every test is a real charge on a real reader, and Clip has
to install its PinPad app on each reader before the API can reach it.

## Before any call works

1. A reader from the supported list: **Total 3, Ultra, Clip PinPad, Stand 2**. Not Plus.
2. Clip installs the **PinPad APK** on it: email `sdk@payclip.com` with the serial number.
3. Merchant **KYC** completed.
4. Credentials from _dashboard.clip.mx → Desarrolladores → Credenciales_: an API key + secret
   (secret shown once; up to 6 apps). Auth is `Authorization: Basic base64(key:secret)`.
   There is no OAuth: each merchant pastes their own key and secret (N-43).
5. The reader on Wi-Fi of at least 10 Mbps; "Clip Wakeup" (draw over other apps) enabled so the
   intent opens the PinPad app on its own.

## The flow

Base URL `https://api.payclip.io/f2f/pinpad/v1`, production only.

| Step   | Call                                                                                  | Notes                                                                                                                                                            |
| ------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Health | `GET /devices/status`                                                                 | Per serial: `active` / `inactive`, with `expires_at`. Only `active` readers take intents.                                                                        |
| Charge | `POST /payment` `{amount, reference, serial_number_pos, webhook_url?, preferences?}`  | Returns `pinpad_request_id`. `400 PINPAD_TERMINAL_TIMEOUT_EXCEPTION` when the reader is unreachable. Preferences cover tips, MSI/MCI, split payment, auto-print. |
| Result | `GET /payment?pinpadRequestId=…` (header `Pinpad-Include-Detail` for the card detail) | `PENDING` → `COMPLETED` · `FAILED`; detail carries `transaction_id`, brand, last 4, `approved_at`.                                                               |
| Cancel | `DELETE /payment/{pinpad_request_id}` or `DELETE /payment/serial-number/{serial}`     | Clears a pending intent from the reader.                                                                                                                         |

## Webhooks

`webhook_url` per intent or in the Clip portal. The body is only
`{id, origin: "pinpad-payments-api", event_type: "PINPAD_INTENT_STATUS_CHANGED"}`, and it is
**unsigned**. Clip's own guidance is to fetch the payment with that `id`. This confirms
ADR-066: for Clip, the webhook is a signal and the fetch is the truth.

## To run it

```bash
CLIP_API_KEY=… CLIP_SECRET=… CLIP_SERIAL=P82… pnpm tsx scripts/spikes/clip-pinpad.ts --charge
```

It charges $1.00 and cancels the intent if nobody pays in 2 minutes. Refund the peso from the Clip app.

## Sources

- [API de PinPad](https://developer.clip.mx/docs/api-de-pinpad) ·
  [introducción y requisitos](https://developer.clip.mx/reference/introducci%C3%B3n-a-la-api-de-pinpad)
- [Crear intención de pago](https://developer.clip.mx/reference/post_payment-1) ·
  [consultar pago](https://developer.clip.mx/reference/get_payment) ·
  [cancelar](https://developer.clip.mx/reference/delete_payment-pinpad-request-id-1) ·
  [estado de lectores](https://developer.clip.mx/reference/get_f2f-pinpad-v1-devices-status)
- [Webhook](https://developer.clip.mx/reference/webhook) ·
  [token de autenticación](https://developer.clip.mx/reference/token-de-autenticacion)
