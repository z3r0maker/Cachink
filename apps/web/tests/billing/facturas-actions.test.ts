import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import type { FacturaRegistrada, PacProvider } from '@xangarro/application/cfdi';
import { RecordingSupportInbox } from '@xangarro/application/support-inbox';

import {
  listarFacturas,
  solicitarFacturaNominal,
  urlDescargaFactura,
} from '../../src/server/billing/facturas';

/**
 * The Facturas server functions' own ports (N-33): the core is pinned in
 * `facturas.test.ts` over fakes; this file pins what the ports add — the
 * session's business, the billing row read back only for its own business,
 * and the fiscal data taken from the tenant's `businesses` row. E2E runs
 * with `CFDI_MODE` off, where no download or nominal request gets that far.
 */

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const OTRO = '01HZ8XQN9GZJXV8AKQ5X0C7OTR';

const io = vi.hoisted(() => ({
  role: 'owner' as 'viewer' | 'admin' | 'owner',
  rows: [] as unknown[],
  billingRow: null as null | { businessId: string; invoiceProviderId: string | null },
  business: undefined as undefined | Record<string, unknown>,
  inbox: null as unknown,
  reported: [] as unknown[],
  tenants: [] as string[],
  pac: [] as string[],
}));

vi.mock('../../src/server/auth', () => ({
  requireMember: async (min: 'viewer' | 'admin' | 'owner') => {
    const rank = { viewer: 0, admin: 1, owner: 2 };
    if (rank[io.role] < rank[min]) {
      throw Object.assign(new Error('Solo el dueño puede hacerlo.'), { code: 'NOT_PERMITTED' });
    }
    return { business_id: BIZ, email: 'duena@test.mx', member_role: io.role };
  },
}));
vi.mock('../../src/server/db', () => ({
  withTenant: (businessId: string, fn: (tx: object) => unknown) => {
    io.tenants.push(businessId);
    return fn({});
  },
}));
vi.mock('@xangarro/data-pg', () => ({
  facturasDelNegocioRows: async () => io.rows,
  cfdiPaymentOf: async () => io.billingRow,
  getBusiness: async () => io.business,
}));
vi.mock('../../src/server/billing/config', () => ({ billingDb: () => ({}) }));
vi.mock('../../src/server/billing/cfdi', () => ({
  livePacProvider: (): Partial<PacProvider> => ({
    getPdf: async (id: string) => {
      io.pac.push(`pdf:${id}`);
      return new TextEncoder().encode('%PDF');
    },
    getXml: async (id: string) => {
      io.pac.push(`xml:${id}`);
      return new TextEncoder().encode('<cfdi/>');
    },
  }),
}));
vi.mock('../../src/server/support-inbox', () => ({ supportInboxFromEnv: () => io.inbox }));
vi.mock('../../src/server/observability/report', () => ({
  reportError: (e: unknown) => void io.reported.push(e),
}));

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

const NEGOCIO = {
  rfc: 'XOJI740919U48',
  razonSocial: 'INTERNACIONAL OJEDA',
  regimenSat: '626',
  usoCfdi: 'G03',
  codigoPostal: '06600',
};

beforeEach(() => {
  io.role = 'owner';
  io.rows = [row()];
  io.billingRow = { businessId: BIZ, invoiceProviderId: 'fac_1' };
  io.business = { ...NEGOCIO };
  io.inbox = new RecordingSupportInbox();
  io.reported = [];
  io.tenants = [];
  io.pac = [];
  vi.stubEnv('CFDI_MODE', 'test');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('listarFacturas', () => {
  it('reads the session’s business, as that tenant', async () => {
    const r = await listarFacturas();
    assert.ok(r.ok);
    assert.equal(r.facturas.length, 1);
    assert.deepEqual(io.tenants, [BIZ]);
  });
});

describe('urlDescargaFactura', () => {
  it('asks the PAC for the provider id the billing row names, as a data: URL', async () => {
    const r = await urlDescargaFactura('in_1', 'xml');
    assert.ok(r.ok);
    assert.deepEqual(io.pac, ['xml:fac_1']);
    assert.equal(r.url, `data:application/xml;base64,${Buffer.from('<cfdi/>').toString('base64')}`);
    assert.match(r.filename, /\.xml$/);
  });

  it('never hands out another business’s CFDI, even with its payment id', async () => {
    io.billingRow = { businessId: OTRO, invoiceProviderId: 'fac_ajeno' };
    const r = await urlDescargaFactura('in_1', 'pdf');
    assert.deepEqual(r.ok ? null : r.code, 'NO_DISPONIBLE');
    assert.deepEqual(io.pac, []);
  });

  it('is NO_DISPONIBLE when billing has no row for the payment', async () => {
    io.billingRow = null;
    const r = await urlDescargaFactura('in_1', 'pdf');
    assert.equal(r.ok ? null : r.code, 'NO_DISPONIBLE');
  });

  it('refuses a viewer', async () => {
    io.role = 'viewer';
    const r = await urlDescargaFactura('in_1', 'pdf');
    assert.equal(r.ok ? null : r.code, 'NO_PERMITIDO');
  });
});

describe('solicitarFacturaNominal', () => {
  beforeEach(() => {
    io.rows = [row({ ruta: 'global', estado: 'en_global', cfdiUuid: null })];
  });

  it('files the request with the fiscal data from the business row', async () => {
    const r = await solicitarFacturaNominal('in_1');
    assert.deepEqual(r, { ok: true });
    const inbox = io.inbox as RecordingSupportInbox;
    assert.equal(inbox.items.length, 1);
    assert.equal(inbox.items[0]?.sourceRef, 'nominal:in_1');
  });

  it('asks for the fiscal data when the business row lacks it', async () => {
    io.business = { ...NEGOCIO, rfc: null };
    const r = await solicitarFacturaNominal('in_1');
    assert.equal(r.ok ? null : r.code, 'DATOS_FISCALES_INCOMPLETOS');
  });

  it('asks for the fiscal data when the business row is gone', async () => {
    io.business = undefined;
    const r = await solicitarFacturaNominal('in_1');
    assert.equal(r.ok ? null : r.code, 'DATOS_FISCALES_INCOMPLETOS');
  });

  it('reports an unexpected failure and answers FALLO', async () => {
    io.inbox = { file: async () => Promise.reject(new Error('inbox down')) };
    const r = await solicitarFacturaNominal('in_1');
    assert.equal(r.ok ? null : r.code, 'FALLO');
    assert.equal(io.reported.length, 1);
  });
});
