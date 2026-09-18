import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { CfdiMode, FacturaRegistrada, PacProvider } from '@xangarro/application/cfdi';
import { RecordingSupportInbox } from '@xangarro/application/support-inbox';

import {
  listarFacturasCon,
  solicitarFacturaNominalCon,
  urlDescargaFacturaCon,
  type FacturasPorts,
} from '../../src/server/billing/facturas-core';

/** The Facturas server functions (N-33) over fake ports: roles, results, reporting. */
const RANK = { viewer: 0, admin: 1, owner: 2 } as const;
type Role = keyof typeof RANK;

const row = (over: Partial<FacturaRegistrada> = {}): FacturaRegistrada => ({
  paymentId: 'in_1',
  stripeInvoiceId: 'in_1',
  paidAt: '2026-09-01T12:00:00.000Z',
  totalCentavos: 34_800n,
  ruta: 'individual',
  estado: 'timbrada',
  cfdiUuid: '6F9619FF-8B86-D011-B42D-00C04FC964FF',
  pdfDisponible: true,
  xmlDisponible: true,
  emitidaManual: false,
  ...over,
});

const FISCAL = {
  rfc: 'XOJI740919U48',
  razonSocial: 'INTERNACIONAL OJEDA',
  regimenFiscal: '626',
  usoCfdi: 'G03',
  codigoPostal: '06600',
  email: 'duena@test.mx',
};

const pac = {
  getPdf: (id: string) => Promise.resolve(new TextEncoder().encode(`%PDF ${id}`)),
  getXml: (id: string) => Promise.resolve(new TextEncoder().encode(`<x id="${id}"/>`)),
} as unknown as PacProvider;

function harness(opts: { role?: Role; mode?: CfdiMode; rows?: FacturaRegistrada[] } = {}) {
  const reported: unknown[] = [];
  const asked: string[] = [];
  const inbox = new RecordingSupportInbox();
  const ports: FacturasPorts = {
    member: (min) => {
      if (RANK[opts.role ?? 'owner'] < RANK[min]) {
        return Promise.reject(Object.assign(new Error('Solo lectura.'), { code: 'NOT_PERMITTED' }));
      }
      return Promise.resolve({ businessId: 'BIZ', email: 'duena@test.mx' });
    },
    mode: () => opts.mode ?? 'test',
    source: (id) => {
      asked.push(id);
      return Promise.resolve(opts.rows ?? [row()]);
    },
    providerIdOf: () => Promise.resolve('pac_1'),
    pac: () => pac,
    fiscalOf: () => Promise.resolve(FISCAL),
    inbox: () => inbox,
    report: (e) => reported.push(e),
  };
  return { ports, reported, asked, inbox };
}

describe('listarFacturas', () => {
  it('any member reads the session business list', async () => {
    const h = harness({ role: 'viewer' });
    const res = await listarFacturasCon(h.ports);
    assert.ok(res.ok);
    assert.equal(res.facturas[0]?.estado, 'timbrada');
    assert.deepEqual(h.asked, ['BIZ']);
  });

  it('no session → NO_PERMITIDO, not reported', async () => {
    const h = harness();
    const ports = {
      ...h.ports,
      member: () => Promise.reject(Object.assign(new Error('x'), { code: 'NOT_PERMITTED' })),
    };
    const res = await listarFacturasCon(ports);
    assert.equal(!res.ok && res.code, 'NO_PERMITIDO');
    assert.equal(h.reported.length, 0);
  });

  it('a database failure is reported and answers FALLO', async () => {
    const h = harness();
    const ports = { ...h.ports, source: () => Promise.reject(new Error('db down')) };
    const res = await listarFacturasCon(ports);
    assert.equal(!res.ok && res.code, 'FALLO');
    assert.equal(h.reported.length, 1);
  });
});

describe('urlDescargaFactura', () => {
  it('owner/admin in test/live gets a data: URL of the PDF', async () => {
    const res = await urlDescargaFacturaCon(harness({ role: 'admin' }).ports, 'in_1', 'pdf');
    assert.ok(res.ok);
    assert.match(res.url, /^data:application\/pdf;base64,/);
    assert.equal(Buffer.from(res.url.split(',')[1] ?? '', 'base64').toString(), '%PDF pac_1');
    assert.match(res.filename, /\.pdf$/);
  });

  it('a viewer → NO_PERMITIDO', async () => {
    const res = await urlDescargaFacturaCon(harness({ role: 'viewer' }).ports, 'in_1', 'xml');
    assert.equal(!res.ok && res.code, 'NO_PERMITIDO');
  });

  it('CFDI_MODE=off → NO_DISPONIBLE', async () => {
    const res = await urlDescargaFacturaCon(harness({ mode: 'off' }).ports, 'in_1', 'pdf');
    assert.equal(!res.ok && res.code, 'NO_DISPONIBLE');
  });

  it('a PAC failure is reported and answers FALLO', async () => {
    const h = harness();
    const broken = {
      ...h.ports,
      pac: () => ({ getPdf: () => Promise.reject(new Error('503')) }) as unknown as PacProvider,
    };
    const res = await urlDescargaFacturaCon(broken, 'in_1', 'pdf');
    assert.equal(!res.ok && res.code, 'FALLO');
    assert.equal(h.reported.length, 1);
  });
});

describe('solicitarFacturaNominal', () => {
  const enGlobal = [row({ estado: 'en_global', ruta: 'global', cfdiUuid: null })];

  it('the owner files one factura item for a payment in the global CFDI', async () => {
    const h = harness({ rows: enGlobal });
    assert.deepEqual(await solicitarFacturaNominalCon(h.ports, 'in_1'), { ok: true });
    assert.equal(h.inbox.items[0]?.paymentRef, 'in_1');
  });

  it('an admin → NO_PERMITIDO, nothing filed', async () => {
    const h = harness({ role: 'admin', rows: enGlobal });
    const res = await solicitarFacturaNominalCon(h.ports, 'in_1');
    assert.equal(!res.ok && res.code, 'NO_PERMITIDO');
    assert.equal(h.inbox.items.length, 0);
  });

  it('a stamped payment → NO_APLICA', async () => {
    const res = await solicitarFacturaNominalCon(harness().ports, 'in_1');
    assert.equal(!res.ok && res.code, 'NO_APLICA');
  });

  it('incomplete fiscal data → DATOS_FISCALES_INCOMPLETOS', async () => {
    const h = harness({ rows: enGlobal });
    const ports = { ...h.ports, fiscalOf: () => Promise.resolve({ ...FISCAL, rfc: null }) };
    const res = await solicitarFacturaNominalCon(ports, 'in_1');
    assert.equal(!res.ok && res.code, 'DATOS_FISCALES_INCOMPLETOS');
    assert.equal(h.reported.length, 0);
  });
});
