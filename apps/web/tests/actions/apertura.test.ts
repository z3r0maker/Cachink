import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * N-17's server actions: saldos iniciales, their lock, and the one-time
 * inventario inicial. The E2E specs drive the happy paths; every refusal the
 * owner can cause — and how its message reaches them — is here. The use cases
 * have their own tests in @xangarro/application; they are replaced at the
 * module boundary so each action's own decisions can be isolated.
 */

const requireMember = vi.fn();
const reportError = vi.fn();
const revalidatePath = vi.fn();
const guardar = vi.fn();
const bloquear = vi.fn();
const capturar = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('../../src/server/auth', () => ({ requireMember }));
vi.mock('../../src/server/db', () => ({
  withTenant: (_biz: string, fn: (tx: unknown) => unknown) => fn({}),
}));
vi.mock('../../src/server/observability/report', () => ({ reportError }));
vi.mock('@xangarro/data-pg', () => ({
  inventoryMovements: {},
  lockOpeningBalance: vi.fn(),
  openingBalanceClientsOf: vi.fn(),
  openingBalanceOf: vi.fn(),
  saveOpeningBalance: vi.fn(),
}));
vi.mock('@xangarro/application', () => ({
  GuardarSaldosInicialesUseCase: class {
    execute = guardar;
  },
  BloquearSaldosInicialesUseCase: class {
    execute = bloquear;
  },
  CapturarInventarioInicialUseCase: class {
    execute = capturar;
  },
}));

const actions = await import('../../src/server/actions/apertura');

const coded = (code: string, message: string) => Object.assign(new Error(message), { code });

const FORM = {
  fechaApertura: '2026-05-01',
  caja: '5000.50',
  bancos: '12000',
  lines: [{ clienteId: 'cli-1', saldo: '350' }],
};

beforeEach(() => {
  vi.clearAllMocks();
  requireMember.mockResolvedValue({ business_id: 'biz-1', member_role: 'owner' });
});

describe('guardarSaldosIniciales', () => {
  it('sends centavos, never pesos, and refreshes Saldos and Estados', async () => {
    assert.deepEqual(await actions.guardarSaldosIniciales(FORM), { ok: true });
    assert.deepEqual(requireMember.mock.calls[0], ['admin']);
    assert.deepEqual(guardar.mock.calls[0]?.[0], {
      businessId: 'biz-1',
      fechaApertura: '2026-05-01',
      cajaCentavos: 500_050n,
      bancosCentavos: 1_200_000n,
      lines: [{ clienteId: 'cli-1', saldoCentavos: 35_000n }],
    });
    assert.deepEqual(revalidatePath.mock.calls, [['/saldos-iniciales'], ['/estados']]);
  });

  it('a malformed amount is the owner’s to fix: named back to them, not reported', async () => {
    const r = await actions.guardarSaldosIniciales({ ...FORM, bancos: 'doce mil' });
    assert.deepEqual(r, { ok: false, message: '«doce mil» no es un monto.' });
    assert.equal(reportError.mock.calls.length, 0);
    assert.equal(guardar.mock.calls.length, 0);
  });

  it('a rule the use case enforces comes back as its own message', async () => {
    guardar.mockRejectedValue(coded('SALDOS_BLOQUEADOS', 'Los saldos ya están bloqueados.'));
    const r = await actions.guardarSaldosIniciales(FORM);
    assert.deepEqual(r, { ok: false, message: 'Los saldos ya están bloqueados.' });
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('a viewer is refused with the permission message', async () => {
    requireMember.mockRejectedValue(coded('NOT_PERMITTED', 'No tienes permiso.'));
    assert.deepEqual(await actions.guardarSaldosIniciales(FORM), {
      ok: false,
      message: 'No tienes permiso.',
    });
  });

  it('anything else is reported, and the owner gets the retry message', async () => {
    const boom = new Error('connection reset');
    guardar.mockRejectedValue(boom);
    const r = await actions.guardarSaldosIniciales(FORM);
    assert.deepEqual(r, { ok: false, message: 'No pudimos guardar. Intenta de nuevo.' });
    assert.deepEqual(reportError.mock.calls[0], [boom, { endpoint: 'guardarSaldosIniciales' }]);
  });
});

describe('bloquearSaldosIniciales', () => {
  it('locks once and refreshes the screen', async () => {
    bloquear.mockResolvedValue(true);
    assert.deepEqual(await actions.bloquearSaldosIniciales(), { ok: true });
    assert.deepEqual(revalidatePath.mock.calls, [['/saldos-iniciales']]);
  });

  it('a second lock says so instead of pretending', async () => {
    bloquear.mockResolvedValue(false);
    assert.deepEqual(await actions.bloquearSaldosIniciales(), {
      ok: false,
      message: 'Los saldos ya estaban bloqueados.',
    });
    assert.equal(revalidatePath.mock.calls.length, 0);
  });

  it('a failure is reported under its own endpoint', async () => {
    bloquear.mockRejectedValue(new Error('timeout'));
    assert.equal((await actions.bloquearSaldosIniciales()).ok, false);
    assert.equal(
      (reportError.mock.calls[0]?.[1] as { endpoint: string }).endpoint,
      'bloquearSaldosIniciales',
    );
  });
});

describe('capturarInventarioInicial', () => {
  const ROWS = [
    { productoId: 'p-1', cantidad: 4, costo: '12.50' },
    { productoId: 'p-2', cantidad: 10, costo: '3' },
  ];

  it('sends centavos and answers the valuation in pesos, thousands grouped', async () => {
    capturar.mockResolvedValue({ total: 123_450n, movimientos: 2 });
    const r = await actions.capturarInventarioInicial('2026-05-01', ROWS);
    assert.deepEqual(r, { ok: true, total: '1,234.50', movimientos: 2 });
    assert.deepEqual((capturar.mock.calls[0]?.[0] as { rows: unknown[] }).rows, [
      { productoId: 'p-1', cantidad: 4, costoUnitCentavos: 1_250n },
      { productoId: 'p-2', cantidad: 10, costoUnitCentavos: 300n },
    ]);
    assert.deepEqual(revalidatePath.mock.calls, [
      ['/inventario-inicial'],
      ['/productos'],
      ['/estados'],
    ]);
  });

  it('a malformed cost is named back, not reported', async () => {
    const r = await actions.capturarInventarioInicial('2026-05-01', [
      { productoId: 'p-1', cantidad: 4, costo: 'doce' },
    ]);
    assert.deepEqual(r, { ok: false, message: '«doce» no es un monto.' });
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('a second capture is refused with the use case’s message', async () => {
    capturar.mockRejectedValue(coded('INVENTARIO_YA_CAPTURADO', 'Ya se capturó.'));
    assert.deepEqual(await actions.capturarInventarioInicial('2026-05-01', ROWS), {
      ok: false,
      message: 'Ya se capturó.',
    });
  });
});
