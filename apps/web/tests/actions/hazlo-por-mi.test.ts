import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * «Hazlo por mí» (N-18), the owner's decision on a migration staff mapped:
 * approve applies it through the import templates in one transaction, reject
 * discards it. What the owner is told in each outcome is the contract here.
 */

const requireMember = vi.fn();
const reportError = vi.fn();
const revalidatePath = vi.fn();
const claimForApproval = vi.fn();
const rejectAssistedImport = vi.fn();
const plan = vi.fn();
const apply = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('../../src/server/auth', () => ({ requireMember }));
vi.mock('../../src/server/db', () => ({
  withTenant: (_biz: string, fn: (tx: unknown) => unknown) => fn({ tx: true }),
}));
vi.mock('../../src/server/observability/report', () => ({ reportError }));
vi.mock('../../src/server/support-inbox', () => ({ supportInboxFromEnv: vi.fn() }));
vi.mock('../../src/server/billing/plan', () => ({ tenantEntitlement: vi.fn() }));
vi.mock('../../src/server/import/templates', () => ({
  TEMPLATES: { productos: { plan, apply }, clientes: { plan, apply } },
}));
vi.mock('@xangarro/data-pg', () => ({
  assistedFilesOf: vi.fn(),
  claimForApproval,
  createAssistedImport: vi.fn(),
  hasActiveAssistedImport: vi.fn(),
  latestAssistedImport: vi.fn(),
  rejectAssistedImport,
}));

const { resolverImportacionAsistida } = await import('../../src/server/actions/hazlo-por-mi');

const CLAIM = {
  plantilla: 'productos',
  file: { filename: 'mapeado.csv', bytes: Buffer.from('sku,nombre\nA,Taco\n') },
};

beforeEach(() => {
  vi.clearAllMocks();
  requireMember.mockResolvedValue({ business_id: 'biz-1' });
});

describe('resolverImportacionAsistida — rechazar', () => {
  it('discards the pending migration and refreshes Importar', async () => {
    rejectAssistedImport.mockResolvedValue(true);
    assert.deepEqual(await resolverImportacionAsistida('rechazar'), { ok: true });
    assert.deepEqual(revalidatePath.mock.calls, [['/importar']]);
    assert.equal(claimForApproval.mock.calls.length, 0);
  });

  it('nothing pending says so', async () => {
    rejectAssistedImport.mockResolvedValue(false);
    assert.deepEqual(await resolverImportacionAsistida('rechazar'), {
      ok: false,
      message: 'No hay una migración esperando tu decisión.',
    });
  });
});

describe('resolverImportacionAsistida — aprobar', () => {
  it('applies the mapped file through its template and refreshes both screens', async () => {
    claimForApproval.mockResolvedValue(CLAIM);
    const planned = [{ kind: 'nuevo' }, { kind: 'actualizar' }, { kind: 'sin_cambios' }];
    plan.mockResolvedValue(planned);
    assert.deepEqual(await resolverImportacionAsistida('aprobar'), { ok: true });
    const file = plan.mock.calls[0]?.[1] as File;
    assert.equal(file.name, 'mapeado.csv');
    assert.equal(await file.text(), 'sku,nombre\nA,Taco\n');
    assert.deepEqual(apply.mock.calls[0]?.slice(1), ['biz-1', planned]);
    assert.deepEqual(revalidatePath.mock.calls, [['/importar'], ['/productos']]);
  });

  it('nothing pending says so, and applies nothing', async () => {
    claimForApproval.mockResolvedValue(null);
    assert.deepEqual(await resolverImportacionAsistida('aprobar'), {
      ok: false,
      message: 'No hay una migración esperando tu decisión.',
    });
    assert.equal(apply.mock.calls.length, 0);
  });

  it('a mapped file with no usable row names the reason instead of «intenta de nuevo»', async () => {
    claimForApproval.mockResolvedValue(CLAIM);
    plan.mockResolvedValue([{ kind: 'error' }, { kind: 'sin_cambios' }]);
    assert.deepEqual(await resolverImportacionAsistida('aprobar'), {
      ok: false,
      message: 'El archivo mapeado no trae filas válidas.',
    });
    assert.equal(apply.mock.calls.length, 0);
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('a failed apply is reported, and rolls back with the claim', async () => {
    claimForApproval.mockResolvedValue(CLAIM);
    plan.mockResolvedValue([{ kind: 'nuevo' }]);
    const boom = new Error('duplicate key value violates unique constraint');
    apply.mockRejectedValue(boom);
    const r = await resolverImportacionAsistida('aprobar');
    assert.equal(r.ok, false);
    assert.doesNotMatch(r.ok ? '' : r.message, /duplicate key/);
    assert.deepEqual(reportError.mock.calls[0], [
      boom,
      { endpoint: 'resolverImportacionAsistida' },
    ]);
  });
});
