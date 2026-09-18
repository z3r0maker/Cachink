/**
 * FacturapiPacProvider — request shapes, response mapping and error
 * classification, against a scripted fetch (no network, no credentials).
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';
import {
  CfdiProviderRejectedError,
  FacturapiPacProvider,
  type CfdiReceptor,
} from '../../src/cfdi/index.js';
import { FakeHttp, binaryResponse, facturapiInvoice, jsonResponse } from './support/fake-http.js';

const BASE = 'https://www.facturapi.io/v2';
const RECEPTOR: CfdiReceptor = {
  rfc: 'EKU9003173C9',
  nombre: 'ESCUELA KEMPER URGATE',
  regimenFiscal: '601',
  usoCfdi: 'G03',
  codigoPostal: '26015',
  email: 'facturas@kemper.mx',
};
const CONCEPTO = {
  claveProdServ: '81112106',
  claveUnidad: 'E48',
  descripcion: 'Suscripción Xangarro',
  totalCentavos: 39_900n,
};

describe('FacturapiPacProvider', () => {
  let http: FakeHttp;
  let pac: FacturapiPacProvider;

  beforeEach(() => {
    http = new FakeHttp();
    pac = new FacturapiPacProvider({ apiKey: 'sk_test_abc', baseUrl: BASE, fetch: http.fetch });
  });

  describe('happy paths', () => {
    it('stamps an individual invoice with IVA-included price and idempotency key', async () => {
      http.reply(jsonResponse(200, facturapiInvoice({ total: 399 })));
      const stamped = await pac.stampInvoice({
        idempotencyKey: 'cfdi:in_1:ingreso',
        externalId: 'in_1',
        receptor: RECEPTOR,
        conceptos: [CONCEPTO],
        formaPago: '04',
        metodoPago: 'PUE',
      });
      assert.deepEqual(stamped, {
        providerId: 'inv_65f1',
        uuid: '39c85a3f-275b-4341-b259-e8971d9f8a94',
        totalCentavos: 39_900n,
        stampedAt: new Date('2026-09-15T18:00:05.000Z'),
      });
      assert.equal(http.last.url, `${BASE}/invoices`);
      assert.equal(http.last.method, 'POST');
      assert.equal(http.last.headers.Authorization, 'Bearer sk_test_abc');
      assert.deepEqual(http.last.body, {
        type: 'I',
        customer: {
          legal_name: 'ESCUELA KEMPER URGATE',
          tax_id: 'EKU9003173C9',
          tax_system: '601',
          email: 'facturas@kemper.mx',
          address: { zip: '26015' },
        },
        items: [
          {
            quantity: 1,
            product: {
              description: 'Suscripción Xangarro',
              product_key: '81112106',
              unit_key: 'E48',
              price: 399,
              tax_included: true,
              taxes: [{ type: 'IVA', rate: 0.16 }],
            },
          },
        ],
        use: 'G03',
        payment_form: '04',
        payment_method: 'PUE',
        external_id: 'in_1',
        idempotency_key: 'cfdi:in_1:ingreso',
      });
    });

    it('stamps a global invoice to público en general', async () => {
      http.reply(jsonResponse(200, facturapiInvoice({ total: 199.01 })));
      const stamped = await pac.stampGlobalInvoice({
        idempotencyKey: 'cfdi:global:2026-09#1',
        externalId: 'global:2026-09#1',
        informacionGlobal: { periodicidad: '04', meses: '09', anio: 2026 },
        lugarExpedicion: '06600',
        formaPago: '03',
        conceptos: [
          {
            ...CONCEPTO,
            claveProdServ: '01010101',
            claveUnidad: 'ACT',
            descripcion: 'Venta',
            noIdentificacion: 'in_a',
            totalCentavos: 19_901n,
          },
        ],
      });
      assert.equal(stamped.totalCentavos, 19_901n);
      const body = http.last.body as Record<string, unknown>;
      assert.deepEqual(body.customer, {
        legal_name: 'PUBLICO EN GENERAL',
        tax_id: 'XAXX010101000',
        tax_system: '616',
        address: { zip: '06600' },
      });
      assert.deepEqual(body.global, { periodicity: 'month', months: '09', year: 2026 });
      assert.equal(body.use, 'S01');
      assert.equal(body.payment_method, 'PUE');
      assert.equal(body.payment_form, '03');
      const [item] = body.items as { product: Record<string, unknown> }[];
      assert.equal(item?.product.sku, 'in_a');
      assert.equal(item?.product.price, 199.01);
    });

    it('stamps a payment complement (tipo P) for a PPD invoice', async () => {
      http.reply(jsonResponse(200, facturapiInvoice({ id: 'inv_p', total: 0 })));
      await pac.stampPaymentComplement({
        idempotencyKey: 'cfdi:in_1:pago',
        externalId: 'in_1',
        receptor: RECEPTOR,
        fechaPago: new Date('2026-09-15T18:00:00Z'),
        formaPago: '03',
        documentoRelacionado: {
          uuid: 'aaaa',
          numParcialidad: 1,
          saldoAnteriorCentavos: 39_900n,
          importePagadoCentavos: 39_900n,
          baseIvaCentavos: 34_397n,
        },
      });
      const body = http.last.body as Record<string, unknown>;
      assert.equal(body.type, 'P');
      assert.equal(body.use, 'CP01');
      assert.deepEqual(body.complements, [
        {
          type: 'pago',
          data: [
            {
              payment_form: '03',
              date: '2026-09-15T18:00:00.000Z',
              related_documents: [
                {
                  uuid: 'aaaa',
                  amount: 399,
                  installment: 1,
                  last_balance: 399,
                  taxes: [{ base: 343.97, type: 'IVA', rate: 0.16 }],
                },
              ],
            },
          ],
        },
      ]);
    });

    it('cancels with motive and maps the cancellation status', async () => {
      http.reply(
        jsonResponse(
          200,
          facturapiInvoice({ status: 'canceled', cancellation_status: 'accepted' }),
        ),
        jsonResponse(200, facturapiInvoice({ cancellation_status: 'pending' })),
        jsonResponse(200, facturapiInvoice({ cancellation_status: 'verifying' })),
        jsonResponse(200, facturapiInvoice({ cancellation_status: 'rejected' })),
      );
      const ref = { providerId: 'inv_65f1', uuid: 'u' };
      assert.equal(await pac.cancel({ ...ref, motivo: '03' }), 'cancelled');
      assert.equal(http.last.url, `${BASE}/invoices/inv_65f1?motive=03`);
      assert.equal(http.last.method, 'DELETE');
      assert.equal(
        await pac.cancel({ ...ref, motivo: '01', folioSustitucion: 'new-uuid' }),
        'pending_acceptance',
      );
      assert.equal(http.last.url, `${BASE}/invoices/inv_65f1?motive=01&substitution=new-uuid`);
      assert.equal(await pac.cancel({ ...ref, motivo: '02' }), 'verifying');
      assert.equal(await pac.cancel({ ...ref, motivo: '02' }), 'rejected');
    });

    it('downloads PDF and XML as bytes', async () => {
      http.reply(binaryResponse('%PDF-1.7'), binaryResponse('<cfdi:Comprobante/>'));
      const pdf = await pac.getPdf('inv_65f1');
      assert.equal(new TextDecoder().decode(pdf), '%PDF-1.7');
      assert.equal(http.last.url, `${BASE}/invoices/inv_65f1/pdf`);
      const xml = await pac.getXml('inv_65f1');
      assert.equal(new TextDecoder().decode(xml), '<cfdi:Comprobante/>');
      assert.equal(http.last.method, 'GET');
    });
  });

  describe('unhappy paths', () => {
    const stamp = () =>
      pac.stampInvoice({
        idempotencyKey: 'k',
        externalId: 'in_1',
        receptor: RECEPTOR,
        conceptos: [CONCEPTO],
        formaPago: '04',
        metodoPago: 'PUE',
      });

    it('maps a 400 to a non-retryable rejection with the provider code and details', async () => {
      http.reply(
        jsonResponse(400, {
          ok: false,
          code: 'invalid_request',
          message: 'El RFC del receptor no está en la lista de RFC inscritos',
          errors: [{ message: 'CFDI40145', source: 'sat' }],
        }),
      );
      const error = await stamp().catch((e: unknown) => e);
      assert.ok(error instanceof CfdiProviderRejectedError);
      assert.equal(error.retryable, false);
      assert.equal(error.providerCode, 'invalid_request');
      assert.deepEqual(error.details, ['CFDI40145']);
    });

    it('maps 401 to an auth error', async () => {
      http.reply(jsonResponse(401, { message: 'Invalid API key' }));
      await assert.rejects(stamp(), { code: 'CFDI_PROVIDER_AUTH', retryable: false });
    });

    it('maps 5xx, 429, idempotency-key-in-use and network failures to retryable', async () => {
      http.reply(
        jsonResponse(503, { message: 'SAT down' }),
        jsonResponse(429, { message: 'slow down' }),
        jsonResponse(409, { code: 'idempotency_key_in_use', message: 'in use' }),
        new TypeError('fetch failed'),
      );
      for (let i = 0; i < 4; i += 1) {
        await assert.rejects(stamp(), { code: 'CFDI_PROVIDER_UNAVAILABLE', retryable: true });
      }
    });

    it('treats a not-yet-valid (async pending) invoice as retryable', async () => {
      http.reply(jsonResponse(202, facturapiInvoice({ status: 'pending', uuid: null })));
      await assert.rejects(stamp(), { code: 'CFDI_PROVIDER_UNAVAILABLE' });
    });

    it('rejects a malformed success body', async () => {
      http.reply(jsonResponse(200, { hello: 'world' }));
      await assert.rejects(stamp(), { code: 'CFDI_PROVIDER_UNAVAILABLE' });
    });

    it('rejects a success response whose body is not JSON', async () => {
      http.reply(binaryResponse('<html>502</html>'));
      await assert.rejects(pac.cancel({ providerId: 'x', uuid: 'u', motivo: '02' }), {
        code: 'CFDI_PROVIDER_UNAVAILABLE',
      });
    });
  });
});
