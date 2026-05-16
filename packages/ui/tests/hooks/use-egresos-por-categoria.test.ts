/**
 * composeEgresosPorCategoria tests.
 */

import { describe, expect, it } from 'vitest';
import { InMemoryExpensesRepository, makeNewExpense } from '@cachink/testing';
import type { BusinessId, DeviceId, IsoDate } from '@cachink/domain';
import { composeEgresosPorCategoria } from '../../src/hooks/use-egresos-por-categoria';

const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function makeRepo() {
  return new InMemoryExpensesRepository(DEV);
}

describe('composeEgresosPorCategoria', () => {
  it('groups by category correctly', async () => {
    const repo = makeRepo();
    await repo.create(makeNewExpense({ businessId: BIZ, fecha: '2026-04-10' as IsoDate, categoria: 'Nómina', monto: 1000n }));
    await repo.create(makeNewExpense({ businessId: BIZ, fecha: '2026-04-15' as IsoDate, categoria: 'Renta', monto: 2000n }));

    const result = await composeEgresosPorCategoria(repo, BIZ, { from: '2026-04-01' as IsoDate, to: '2026-04-30' as IsoDate });
    expect(result.length).toBe(2);
    const cats = result.map((r) => r.categoria);
    expect(cats).toContain('Nómina');
    expect(cats).toContain('Renta');
  });

  it('sorts by descending total', async () => {
    const repo = makeRepo();
    await repo.create(makeNewExpense({ businessId: BIZ, fecha: '2026-04-10' as IsoDate, categoria: 'Nómina', monto: 500n }));
    await repo.create(makeNewExpense({ businessId: BIZ, fecha: '2026-04-10' as IsoDate, categoria: 'Renta', monto: 3000n }));

    const result = await composeEgresosPorCategoria(repo, BIZ, { from: '2026-04-01' as IsoDate, to: '2026-04-30' as IsoDate });
    expect(result[0]!.categoria).toBe('Renta');
    expect(result[1]!.categoria).toBe('Nómina');
  });

  it('empty egresos returns empty array', async () => {
    const repo = makeRepo();
    const result = await composeEgresosPorCategoria(repo, BIZ, { from: '2026-04-01' as IsoDate, to: '2026-04-30' as IsoDate });
    expect(result).toEqual([]);
  });

  it('single category yields one entry', async () => {
    const repo = makeRepo();
    await repo.create(makeNewExpense({ businessId: BIZ, fecha: '2026-04-10' as IsoDate, categoria: 'Servicios', monto: 100n }));

    const result = await composeEgresosPorCategoria(repo, BIZ, { from: '2026-04-01' as IsoDate, to: '2026-04-30' as IsoDate });
    expect(result.length).toBe(1);
    expect(result[0]!.categoria).toBe('Servicios');
  });

  it('multiple entries same category are summed', async () => {
    const repo = makeRepo();
    await repo.create(makeNewExpense({ businessId: BIZ, fecha: '2026-04-05' as IsoDate, categoria: 'Nómina', monto: 1000n }));
    await repo.create(makeNewExpense({ businessId: BIZ, fecha: '2026-04-15' as IsoDate, categoria: 'Nómina', monto: 2000n }));

    const result = await composeEgresosPorCategoria(repo, BIZ, { from: '2026-04-01' as IsoDate, to: '2026-04-30' as IsoDate });
    expect(result.length).toBe(1);
    expect(result[0]!.total).toBe(3000n);
  });

  it('all 10 categories present yield 10 entries', async () => {
    const repo = makeRepo();
    const cats = ['Materia Prima', 'Inventario', 'Nómina', 'Renta', 'Servicios', 'Publicidad', 'Mantenimiento', 'Impuestos', 'Logística', 'Otro'] as const;
    for (const cat of cats) {
      await repo.create(makeNewExpense({ businessId: BIZ, fecha: '2026-04-10' as IsoDate, categoria: cat, monto: 100n }));
    }
    const result = await composeEgresosPorCategoria(repo, BIZ, { from: '2026-04-01' as IsoDate, to: '2026-04-30' as IsoDate });
    expect(result.length).toBe(10);
  });
});
