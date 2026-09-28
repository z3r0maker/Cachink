import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

import { calculateBalanceGeneral } from '@xangarro/domain';

/**
 * `loadEstadosModel`'s own decisions (P-14, N-17, ADR-107), over a faked
 * ledger: which periods count as empty, how the day-one apertura reaches the
 * Balance, and how a merma names its product. The NIF arithmetic itself stays
 * in the domain and is pinned by `tests/estados.test.ts`; here the identity
 * check is the container's contract — the model feeds the calculator exactly
 * the rows these queries returned, nothing invented in between.
 */

let ledger: { ventas: unknown[]; egresos: unknown[] };
let inputs: {
  cortes: unknown[];
  pagos: unknown[];
  stock: unknown[];
  merma: { cantidad: number; costoUnitCentavos: bigint; fecha: string; producto: string | null }[];
};
let business: { isrTasa?: number; regimenSat?: string | null } | undefined;
let apertura: {
  header: { cajaCentavos: bigint; bancosCentavos: bigint };
  lines: { clienteId: string; saldoCentavos: bigint }[];
  valuacion: bigint;
} | null;

vi.mock('@xangarro/data-pg', () => ({
  periodLedger: async () => ledger,
  periodBalanceInputs: async () => inputs,
  getBusiness: async () => business,
  openingBalanceOf: async () => apertura?.header ?? null,
  openingBalanceClientsOf: async () => apertura?.lines ?? [],
  valuacionApertura: async () => apertura?.valuacion ?? 0n,
  tickets: { fecha: { name: 'fecha' } },
}));
vi.mock('../src/server/db', () => ({
  // `leerPeriodo` hands the fake tx to the mocked queries; `ticketsConTotal`
  // builds one select that never matches a ticket row in these fixtures.
  withTenant: (_biz: string, fn: (tx: unknown) => unknown) =>
    fn({ select: () => ({ from: () => ({ where: async () => [] }) }) }),
}));

const { loadEstadosModel } = await import('../src/server/estados');

beforeEach(() => {
  vi.clearAllMocks();
  ledger = { ventas: [], egresos: [] };
  inputs = { cortes: [], pagos: [], stock: [], merma: [] };
  business = undefined;
  apertura = null;
});

describe('loadEstadosModel', () => {
  it('a window with no movement at all is vacío, even though the statements still compute', async () => {
    const model = await loadEstadosModel('biz-1', '2026-05-01', '2026-05-31');
    assert.equal(model.vacio, true);
    assert.equal(model.resultados.utilidadNeta, 0n);
    assert.equal(model.mermas.length, 0);
  });

  it('a business with no row read falls back to ISR 0 and no régime', async () => {
    const model = await loadEstadosModel('biz-1', '2026-05-01', '2026-05-31');
    assert.equal(model.isrTasa, 0);
    assert.equal(model.regimenSat, null);
  });

  it('reads the business’s own ISR rate and SAT régime when they exist', async () => {
    business = { isrTasa: 1200, regimenSat: '621' };
    const model = await loadEstadosModel('biz-1', '2026-05-01', '2026-05-31');
    assert.equal(model.isrTasa, 1200);
    assert.equal(model.regimenSat, '621');
  });

  it('the apertura reaches the Balance as the calculator wants it (N-17), without un-emptying the window', async () => {
    apertura = {
      header: { cajaCentavos: 100_00n, bancosCentavos: 50_00n },
      lines: [{ clienteId: 'c-1', saldoCentavos: 30_00n }],
      valuacion: 20_00n,
    };
    const model = await loadEstadosModel('biz-1', '2026-05-01', '2026-05-31');
    assert.equal(model.vacio, true);
    assert.deepEqual(
      model.balance,
      calculateBalanceGeneral({
        cortesDelDia: [],
        inventarioStock: [],
        ventasConCredito: [],
        pagosClientes: [],
        pasivosManuales: 0n,
        utilidadDelPeriodo: 0n,
        apertura: {
          efectivoInicial: 150_00n,
          cuentasPorCobrar: [{ clienteId: 'c-1', saldoCentavos: 30_00n }],
          capitalInicial: 200_00n,
        },
      }),
    );
  });

  it('one venta is enough for the window to stop being empty', async () => {
    ledger = { ventas: [{ ticketId: 't-1', monto: 12_00n, deletedAt: null }], egresos: [] };
    const model = await loadEstadosModel('biz-1', '2026-05-01', '2026-05-31');
    assert.equal(model.vacio, false);
  });

  it('a merma without its product still lists, as «Producto borrado», at cost', async () => {
    inputs.merma = [
      { cantidad: 2, costoUnitCentavos: 5_000n, fecha: '2026-05-03T12:00:00Z', producto: null },
      {
        cantidad: 1,
        costoUnitCentavos: 3_000n,
        fecha: '2026-05-04T08:30:00Z',
        producto: 'Cebolla',
      },
    ];
    const model = await loadEstadosModel('biz-1', '2026-05-01', '2026-05-31');
    assert.deepEqual(model.mermas, [
      { producto: 'Producto borrado', cantidad: 2, fecha: '2026-05-03', monto: 10_000n },
      { producto: 'Cebolla', cantidad: 1, fecha: '2026-05-04', monto: 3_000n },
    ]);
  });
});
