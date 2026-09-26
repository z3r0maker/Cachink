# Spike: Mercado Pago Point for N-40 (card payments at the mostrador)

Date: 2026-09-25 · Task: N-40 · ADR-066 · Script: `scripts/spikes/mercadopago-point.ts`

Read from the Mexico developer site (`mercadopago.com.mx/developers`, the `.md`
version of each page). Hands-on sandbox run: **pending test credentials**.

## Verdict so far

**Go for terminals, no-go for QR.** Point in Mexico runs on the Orders API with a
full sandbox, including a virtual terminal, so N-41 can be built and tested before
anyone buys a reader. The "dynamic QR" that ADR-066 lists for Mexico is not a
payment product here (see the QR section below).

## The terminal flow

| Step              | Call                                                                                                                               | Notes                                                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Store + caja      | `POST /users/{user_id}/stores`, `POST /v2/pos`                                                                                     | One store per business, one POS per caja (`external_id` is ours).                                                                               |
| Find the terminal | `GET /terminals/v1/list?store_id&pos_id`                                                                                           | `id` is `TYPE__SERIAL`, e.g. `NEWLAND_N950__N950NCB801293324`.                                                                                  |
| Integrated mode   | `PATCH /terminals/v1/setup` → `operating_mode: PDV`                                                                                | A terminal in `STANDALONE` ignores orders.                                                                                                      |
| Charge            | `POST /v1/orders` `{type:"point", external_reference, expiration_time, transactions.payments[{amount}], config.point.terminal_id}` | `X-Idempotency-Key` required. Amount is a string with exactly two decimals. Expiry 30 s–3 h (`PT16M`). `external_reference` ≤ 64 chars, no PII. |
| Result            | `GET /v1/orders/{id}`                                                                                                              | `created` → `at_terminal` → `processed` · `failed` · `canceled` · `expired` · `action_required`, then `refunded`.                               |
| Cancel / refund   | `POST /v1/orders/{id}/cancel`, `POST /v1/orders/{id}/refund`                                                                       | Cancel only while `created`; once `at_terminal` it is cancelled on the reader.                                                                  |

Readers: **Point Smart 1 and Point Smart 2** (chip, contactless and stripe; debit, credit and prepaid).
Meses con/sin intereses are configured in the merchant's account, not per order.

## Testing without a reader

- Test credentials: _Tus integraciones → app → Pruebas → Credenciales de prueba_. Test
  accounts (seller + buyer, up to 15) are created with the app.
- **Virtual terminal** `SBX0000001` works with any valid `poi_type`:
  `NEWLAND_N950__SBX0000001`. Not valid for the integration-quality score.
- `POST /v1/orders/{id}/events` `{status: processed | failed | …, payment_method_type, payment_method_id}`
  makes the sandbox settle the order (204; ~10 s, 40 s for `action_required`) and fires the webhook.
- Real payments on a physical reader need a production account; test accounts cannot charge a card.

## Webhooks

Configured per application (_Webhooks → Configurar notificaciones_, topic **Order (Mercado Pago)**), with
a simulator in the panel. Events: `order.processed`, `.canceled`, `.refunded`, `.action_required`,
`.failed`, `.expired`. **Signed**: `x-signature: ts=…,v1=…` is HMAC-SHA256 with the app's secret over
`id:{data.id lowercased};request-id:{x-request-id};ts:{ts};` (drop a part that is missing). The Node
SDK exposes `WebhookSignatureValidator`. We still fetch the order before trusting it (ADR-066).

## Linking a merchant (N-43)

OAuth authorization code at `https://auth.mercadopago.com/authorization?client_id&response_type=code&state&redirect_uri`,
PKCE supported (S256). The code lives 10 minutes; the access token **180 days**, renewed with the
refresh token. `test_token: true` on `POST /oauth/token` yields sandbox credentials for a linked
test seller. Orders created for a linked merchant carry our `integration_data.platform_id` /
`integrator_id`.

## QR in Mexico

Mexico's in-person menu and API reference list **only Point**. The QR pages that exist on the Mexico
domain (`docs/qr-code-ca/*`) are **cash-out**, where a customer withdraws cash by scanning, and are
limited to Managed Wallet clients. The QR payment guide (`docs/qr-code/*`) exists for Argentina and
returns 404 for Mexico. ADR-066's "dynamic QR" for Mexico was therefore wrong; N-41 drops the QR mode.

## To run it

```bash
MP_ACCESS_TOKEN=APP_USR-… pnpm tsx scripts/spikes/mercadopago-point.ts processed
```

Then `failed`, then a webhook through the panel simulator. Record the outputs here.

## Sources

- [Point overview](https://www.mercadopago.com.mx/developers/es/docs/mp-point/overview) ·
  [configure terminal](https://www.mercadopago.com.mx/developers/es/docs/mp-point/configure-terminal) ·
  [payment processing](https://www.mercadopago.com.mx/developers/es/docs/mp-point/payment-processing) ·
  [notifications](https://www.mercadopago.com.mx/developers/es/docs/mp-point/notifications) ·
  [integration test](https://www.mercadopago.com.mx/developers/es/docs/mp-point/integration-test) ·
  [test accounts](https://www.mercadopago.com.mx/developers/es/docs/mp-point/resources/test-accounts)
- [OAuth: get the access token](https://www.mercadopago.com.mx/developers/es/docs/security/oauth/creation)
- [API reference, Mexico](https://www.mercadopago.com.mx/developers/es/reference) ·
  [QR cash-out, Mexico](https://www.mercadopago.com.mx/developers/es/docs/qr-code-ca/payment-processing) ·
  [QR payments, Argentina](https://www.mercadopago.com.ar/developers/es/docs/qr-code/overview)
