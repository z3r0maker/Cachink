/**
 * FacturapiPacProvider.stampCreditNote (N-33) — the CFDI de egreso body:
 * tipo E, PUE, one IVA-included concepto, related to the income CFDI with
 * TipoRelacion 01 (Facturapi's «egreso» guide).
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';
import {
  CfdiProviderRejectedError,
  EGRESO,
  FacturapiPacProvider,
  type StampCreditNoteRequest,
} from '../../src/cfdi/index.js';
import { FakeHttp, facturapiInvoice, jsonResponse } from './support/fake-http.js';

const BASE = 'https://www.facturapi.io/v2';
const REQUEST: StampCreditNoteRequest = {
  idempotencyKey: 'egreso:in_1:10000',
  externalId: 're_1',
  receptor: {
    rfc: 'EKU9003173C9',
    nombre: 'ESCUELA KEMPER URGATE',
    regimenFiscal: '601',
    usoCfdi: EGRESO.usoCfdi,
    codigoPostal: '26015',
  },
  relatedUuid: '39c85a3f-275b-4341-b259-e8971d9f8a94',
  formaPago: '04',
  concepto: {
    claveProdServ: EGRESO.claveProdServ,
    claveUnidad: EGRESO.claveUnidad,
    descripcion: 'Devolución — Suscripción Xangarro',
    totalCentavos: 10_000n,
  },
};

describe('FacturapiPacProvider.stampCreditNote', () => {
  let http: FakeHttp;
  let pac: FacturapiPacProvider;

  beforeEach(() => {
    http = new FakeHttp();
    pac = new FacturapiPacProvider({ apiKey: 'sk_test_abc', baseUrl: BASE, fetch: http.fetch });
  });

  it('posts a tipo E invoice related to the income CFDI', async () => {
    http.reply(jsonResponse(200, facturapiInvoice({ total: 100 })));
    const stamped = await pac.stampCreditNote(REQUEST);
    assert.equal(stamped.totalCentavos, 10_000n);
    assert.equal(http.last.url, `${BASE}/invoices`);
    assert.equal(http.last.method, 'POST');
    assert.deepEqual(http.last.body, {
      type: 'E',
      customer: {
        legal_name: 'ESCUELA KEMPER URGATE',
        tax_id: 'EKU9003173C9',
        tax_system: '601',
        address: { zip: '26015' },
      },
      items: [
        {
          quantity: 1,
          product: {
            description: 'Devolución — Suscripción Xangarro',
            product_key: '84111506',
            unit_key: 'ACT',
            price: 100,
            tax_included: true,
            taxes: [{ type: 'IVA', rate: 0.16 }],
          },
        },
      ],
      use: 'G02',
      payment_form: '04',
      payment_method: 'PUE',
      related_documents: [
        { relationship: '01', documents: ['39c85a3f-275b-4341-b259-e8971d9f8a94'] },
      ],
      external_id: 're_1',
      idempotency_key: 'egreso:in_1:10000',
    });
  });

  it('a refused egreso is a non-retryable rejection', async () => {
    http.reply(jsonResponse(400, { message: 'El UUID relacionado no existe', code: 'invalid' }));
    await assert.rejects(pac.stampCreditNote(REQUEST), CfdiProviderRejectedError);
  });
});
