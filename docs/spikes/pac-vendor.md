# Spike: PAC vendor for N-33 (CFDI for Xangarro's own subscriptions)

Date: 2026-09-17 · Task: N-33 · ADR-070 · Decision: **Facturapi** for the first adapter.

## Comparison

| Criterion                        | Facturapi                                                                                                                                                                                       | Facturama                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Price (checked 2026-09-17)       | API plan **$299 MXN/month + $0.60 MXN per stamp**, no bundles, pay-as-you-go ([pricing](https://www.facturapi.io/pricing))                                                                      | API module **$1,650 MXN/year** + prepaid stamps **$0.50** (1–10k), $0.45 (10–50k), $0.40 (>50k), IVA included ([planes](https://facturama.mx/planes-facturacion), [API](https://facturama.mx/api-facturacion-electronica)) |
| Node SDK                         | Official `facturapi` on npm, **v5.0.0 published 2026-09-10**, ships TypeScript types, ESM + CJS, a thin wrapper over `fetch` ([repo](https://github.com/FacturAPI/facturapi-node))              | **No official npm package** (`npm view facturama` returns 404). Official SDKs are C#, PHP, Python, Java ([python wiki](https://github.com/Facturama/facturama-python-sdk/wiki/API-Web))                                    |
| Sandbox                          | Separate test keys (`sk_test_…`) with the same API, which never reach the SAT. There is also a 14-day trial of the API plan, with no card needed ([API ref](https://docs.facturapi.io/en/api/)) | Separate sandbox host `apisandbox.facturama.mx` ([guías](https://apisandbox.facturama.mx/guias/diferencias))                                                                                                               |
| Global CFDI "público en general" | `global: { periodicity, months, year }` on `POST /invoices`, customer `XAXX010101000` / `616` (OpenAPI `openapi_v2.en.yaml`, [docs repo](https://github.com/FacturAPI/facturapi-docs))          | Supported ([guía CFDI global](https://apisandbox.facturama.mx/guias/cfdi40/publico-general))                                                                                                                               |
| Complemento de pago (REP 2.0)    | `type: "P"` + `complements[{type:"pago"}]` with `related_documents` (uuid, amount, installment, last_balance, taxes) ([guide](https://docs.facturapi.io/en/docs/guides/invoices/pago/))         | Supported ([guía](https://apisandbox.facturama.mx/guias/api-web/cfdi/complemento-pago))                                                                                                                                    |
| Cancellation with motivo         | `DELETE /invoices/{id}?motive=01..04&substitution=uuid`. The response carries `cancellation_status` (`pending` / `verifying` / `accepted` / `rejected` / `expired`)                             | Supported                                                                                                                                                                                                                  |
| Idempotency                      | `idempotency_key` body field, plus the `idempotency_key_in_use` error code                                                                                                                      | Not documented as a first-class field                                                                                                                                                                                      |
| Errors                           | Stable JSON `{ code, message, status, errors[] }`, with `source: facturapi / sat / pac`                                                                                                         | Varies by endpoint                                                                                                                                                                                                         |

## Why Facturapi

At our volume, the monthly cost is dominated by the fixed fee rather than per-stamp
prices. Year one should be a few hundred stamps a month: about 1 individual CFDI per
paying tenant, plus 1 global CFDI, plus 1 REP per SPEI payment. Facturapi costs
about $299 + 0.60·n per month. Facturama costs about $137.50 per month (the annual
fee spread over 12 months) + 0.50·n. So Facturama is cheaper by roughly $160–$200
MXN a month until volumes are large.

We pay that difference for three things:

1. A maintained, typed Node SDK and REST API.
2. A first-class `idempotency_key`, which N-33's "duplicate webhook → one CFDI"
   acceptance criterion relies on.
3. Stable error codes that we can branch on.

The adapter does **not** depend on the SDK. The SDK types its request bodies as
`Record<string, any>`, which CLAUDE.md forbids, and it is only a thin `fetch`
wrapper (checked in `dist/index.es.js`). So the adapter calls the same REST
endpoints through an injected `fetch`. That keeps `pnpm-lock.yaml` untouched and
makes tests a fake HTTP function. Swapping vendors means writing a new
`PacProvider` adapter, with no use-case changes.

## CFDI 4.0 rules encoded (confirm with contador)

- **Global CFDI:** receptor `XAXX010101000`, name `PUBLICO EN GENERAL`, régimen
  `616`, uso `S01`, DomicilioFiscalReceptor = issuer's CP (lugar de expedición).
  InformacionGlobal: Periodicidad `04` (monthly) with Meses `01`–`12` and Año.
  Bimonthly `05` uses Meses `13`–`18` and only applies to RIF taxpayers
  ([SAT guía global](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/GuiallenadoCFDIglobal311221.pdf),
  [MySuite](https://blog.mysuitemex.com/2024/12/06/cfdi-4-factura-global-datos-obligatorios-sat/)).
  There is one concepto per operation: ClaveProdServ `01010101`, ClaveUnidad `ACT`,
  NoIdentificacion = the payment's id. The global CFDI is PUE, and its forma de
  pago is the one with the largest amount.
- **PUE vs PPD:** PUE when the full payment is received at or before issuance. PPD
  (forma `99`) when it is paid later. A PPD invoice needs a **REP** (complemento de
  pagos 2.0) by the **5th calendar day of the month after the payment**
  ([SAT guía pagos](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/Guia_comple_pagos.pdf)).
- **Formas de pago:** `03` transfer (SPEI), `04` credit card, `28` debit card, `99`
  por definir (PPD only).
- **Cancellation motivos:**
  - `01` errors with relation (needs a substitute UUID).
  - `02` errors without relation.
  - `03` the operation did not happen.
  - `04` a nominative operation related to a global CFDI.

  Receptor acceptance is needed above $1,000 MXN total, and **always for a REP**
  (RMF 2026 r. 2.7.1.35,
  [Alegra](https://blog.alegra.com/mexico/cancelacion-de-cfdi-paso-a-paso/)). A REP
  must be cancelled before its PPD invoice.

- **IVA:** 16% on the subscription (a SaaS service in national territory, LIVA art.
  1). Plan prices are IVA-included, as consumer prices must be. Rounding rule:
  `subtotal = round_half_up(total × 100 / 116)`, and `iva = total − subtotal`. So
  subtotal + IVA always equals what Stripe charged. The tie case (exactly .5
  centavo) cannot occur, because `50·T ≠ 58·k + 29`. Facturapi's example (345.60 →
  base 297.93) matches.
- **SaaS product key:** `81112106` (proveedores de servicios de aplicación),
  unidad `E48`. This is to confirm with the contador.
