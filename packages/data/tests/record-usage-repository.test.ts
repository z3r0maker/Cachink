/**
 * DrizzleRecordUsageRepository (A-10): one capture counts once.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, DeviceId, IsoDate } from '@xangarro/domain';
import {
  makeNewExpense,
  makeNewInventoryMovement,
  makeNewProduct,
  makeNewSale,
} from '../../testing/src/index.js';
import {
  DrizzleExpensesRepository,
  DrizzleInventoryMovementsRepository,
  DrizzleProductsRepository,
  DrizzleRecordUsageRepository,
  DrizzleSalesRepository,
} from '../src/repositories/drizzle/index.js';
import type { XangarroDatabase } from '../src/repositories/drizzle/_db.js';
import { makeFreshDb } from './helpers/fresh-db.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const OTHER = '01HZ8XQN9GZJXV8AKQ5X0C7OTH' as BusinessId;
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const SEP = '2026-09-10' as IsoDate;

describe('DrizzleRecordUsageRepository', () => {
  let db: XangarroDatabase;
  beforeEach(() => {
    db = makeFreshDb();
  });

  it('counts sales, expenses and manual salidas — not the salida a sale creates', async () => {
    const product = await new DrizzleProductsRepository(db, DEV).create(
      makeNewProduct({ businessId: BIZ }),
    );
    const movs = new DrizzleInventoryMovementsRepository(db, DEV);
    const base = { businessId: BIZ, productoId: product.id, fecha: SEP };
    await new DrizzleSalesRepository(db, DEV).create(makeNewSale(base));
    await movs.create(
      makeNewInventoryMovement({ ...base, tipo: 'salida', motivo: 'Venta', cantidad: 1 }),
    );
    await movs.create(
      makeNewInventoryMovement({ ...base, tipo: 'salida', motivo: 'Merma', cantidad: 1 }),
    );
    await movs.create(makeNewInventoryMovement({ ...base, tipo: 'entrada' }));
    const expenses = new DrizzleExpensesRepository(db, DEV);
    await expenses.create(makeNewExpense({ businessId: BIZ, fecha: SEP }));
    await expenses.create(makeNewExpense({ businessId: BIZ, fecha: '2026-08-31' as IsoDate }));
    await expenses.create(makeNewExpense({ businessId: OTHER, fecha: SEP }));

    const usage = new DrizzleRecordUsageRepository(db);
    // sale + merma salida + September expense
    expect(await usage.countRecordsInMonth(BIZ, '2026-09')).toBe(3);
    expect(await usage.countRecordsInMonth(BIZ, '2026-08')).toBe(1);
    expect(await usage.countRecordsInMonth(OTHER, '2026-09')).toBe(1);
  });
});
