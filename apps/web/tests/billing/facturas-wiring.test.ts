import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

/**
 * The Facturas server functions (P-10, N-33) — the thin server layer over
 * `facturas-core`, whose logic is fully tested there. What is pinned here is
 * the WIRING: the session's business (never the caller's), the tenant read,
 * the provider row checked against that business before any download, and
 * the fiscal read as the tenant with the member's email.
 */

const requireMember = vi.fn();
const withTenant = vi.fn();
const cfdiPaymentOf = vi.fn();
const facturasDelNegocioRows = vi.fn();
const getBusiness = vi.fn();
const livePacProvider = vi.fn();

vi.mock('../../src/server/auth', () => ({ requireMember }));
vi.mock('../../src/server/db', () => ({
  withTenant: (b: string, fn: (tx: unknown) => unknown) => withTenant(b, fn),
}));
vi.mock('@xangarro/data-pg', () => ({
  cfdiPaymentOf: (...a: unknown[]) => cfdiPaymentOf(...a),
  facturasDelNegocioRows: (...a: unknown[]) => facturasDelNegocioRows(...a),
  getBusiness: (...a: unknown[]) => getBusiness(...a),
}));
vi.mock('../../src/server/billing/cfdi', () => ({ livePacProvider }));
vi.mock('../../src/server/billing/config', () => ({
  billingDb: () => ({}),
  stripeClient: () => ({}),
}));
vi.mock('../../src/server/support-inbox', () => ({ supportInboxFromEnv: () => ({}) }));

const { listarFacturas, solicitarFacturaNominal, urlDescargaFactura } =
  await import('../../src/server/billing/facturas');

const SESION = { business_id: 'biz-1', email: 'dueno@negocio.mx' };

beforeEach(() => {
  vi.clearAllMocks();
  requireMember.mockResolvedValue(SESION);
  withTenant.mockImplementation(async (_b: string, fn: (tx: unknown) => unknown) => fn({}));
  facturasDelNegocioRows.mockResolvedValue([]);
  getBusiness.mockResolvedValue(null);
  delete process.env.CFDI_MODE;
});

afterEach(() => {
  delete process.env.CFDI_MODE;
});

describe('listarFacturas', () => {
  it('reads as the tenant, from the session’s business', async () => {
    const r = await listarFacturas();
    assert.deepEqual(r, { ok: true, facturas: [] });
    assert.equal(requireMember.mock.calls[0]?.[0], 'viewer');
    assert.equal(withTenant.mock.calls[0]?.[0], 'biz-1');
  });

  it('a member without the role is the core’s word for it', async () => {
    requireMember.mockRejectedValue(
      Object.assign(new Error('Solo el dueño o un admin.'), { code: 'NOT_PERMITTED' }),
    );
    const r = await listarFacturas();
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.code, 'NO_PERMITIDO');
  });
});

describe('urlDescargaFactura', () => {
  it('a payment of another business answers NO_DISPONIBLE, never its file', async () => {
    process.env.CFDI_MODE = 'test';
    process.env.FACTURAPI_API_KEY = 'sk_test_x';
    livePacProvider.mockReturnValue({});
    cfdiPaymentOf.mockResolvedValue({ businessId: 'otro-negocio', invoiceProviderId: 'fa_1' });
    const r = await urlDescargaFactura('pi_1', 'pdf');
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.code, 'NO_ENCONTRADA');
    assert.equal(livePacProvider.mock.calls.length, 0, 'no PAC is touched');
  });

  it('CFDI off refuses before the PAC is ever asked', async () => {
    process.env.CFDI_MODE = 'off';
    cfdiPaymentOf.mockResolvedValue({ businessId: 'biz-1', invoiceProviderId: null });
    const r = await urlDescargaFactura('pi_1', 'pdf');
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.code, 'NO_DISPONIBLE');
    assert.equal(livePacProvider.mock.calls.length, 0);
  });
});

describe('solicitarFacturaNominal', () => {
  it('a payment not in the global is NO_APLICA, the core’s own word', async () => {
    facturasDelNegocioRows.mockResolvedValue([
      { paymentId: 'pi_1', estado: 'timbrada', puedeSolicitarNominal: false },
    ]);
    const r = await solicitarFacturaNominal('pi_1');
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.code, 'NO_APLICA');
  });

  it('a business without fiscal data is told what is missing, read as the tenant', async () => {
    process.env.CFDI_MODE = 'test';
    process.env.FACTURAPI_API_KEY = 'sk_test_x';
    process.env.CFDI_LUGAR_EXPEDICION = '06600';
    livePacProvider.mockReturnValue({});
    getBusiness.mockResolvedValue({
      rfc: null,
      razonSocial: null,
      regimenSat: null,
      usoCfdi: null,
      codigoPostal: null,
    });
    facturasDelNegocioRows.mockResolvedValue([
      { paymentId: 'pi_1', estado: 'en_global', puedeSolicitarNominal: true },
    ]);
    const r = await solicitarFacturaNominal('pi_1');
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.code, 'DATOS_FISCALES_INCOMPLETOS');
    assert.equal(withTenant.mock.calls[0]?.[0], 'biz-1', 'the fiscal read is the tenant’s');
  });
});
