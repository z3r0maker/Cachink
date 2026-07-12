/**
 * Fullstack scenario 5 — Inventory + Egresos linkage.
 *
 * Business narrative:
 *   1. Create a stock-tracked product
 *   2. Register an entrada → auto-creates Egreso (categoria=Inventario,
 *      monto = cantidad × costoUnit)
 *   3. Register a salida with motivo → no Egreso
 *   4. Verify Egreso links and amounts
 *
 * Covers: STK-04, STK-07, EGR-03
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ProductId, UserId } from '@cachink/domain';
import { newEntityId } from '@cachink/domain';
import {
  makeNewBusiness,
  makeNewProduct,
} from '../../../testing/src/index.js';
import { buildHarness, type FullstackHarness } from './fullstack-harness.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER_ID = newEntityId<UserId>();

describe('Inventario + Egresos [fullstack]', () => {
  let h: FullstackHarness;
  let productId: ProductId;

  beforeEach(async () => {
    h = buildHarness({ userId: USER_ID, stockEnabled: true });

    await h.repos.businesses.create(makeNewBusiness({ businessId: BIZ }));

    const product = await h.repos.products.create(
      makeNewProduct({
        businessId: BIZ,
        nombre: 'Azúcar 1kg',
        costoUnitCentavos: 4_500n,
        seguirStock: true,
      }),
    );
    productId = product.id;
  });

  it('entrada creates both movement and linked Egreso', async () => {
    const movement = await h.useCases.registrarMovimiento.execute({
      productoId: productId,
      fecha: '2026-04-23',
      tipo: 'entrada',
      cantidad: 5,
      costoUnitCentavos: 4_500n,
      motivo: 'Compra a proveedor',
      businessId: BIZ,
    });

    expect(movement.tipo).toBe('entrada');
    expect(movement.cantidad).toBe(5);

    // Verify stock
    const stock = await h.repos.movements.sumStock(productId);
    expect(stock).toBe(5);

    // Verify Egreso was auto-created: 5 × $45 = $225
    const egresos = await h.repos.expenses.findByDate('2026-04-23', BIZ);
    expect(egresos.length).toBe(1);
    expect(egresos[0]!.categoria).toBe('Inventario');
    expect(egresos[0]!.monto).toBe(22_500n); // 5 × 4500
    expect(egresos[0]!.concepto).toContain('Compra inventario');
  });

  it('salida does NOT create an Egreso', async () => {
    // Seed stock first
    await h.useCases.registrarMovimiento.execute({
      productoId: productId,
      fecha: '2026-04-23',
      tipo: 'entrada',
      cantidad: 10,
      costoUnitCentavos: 4_500n,
      motivo: 'Compra inicial',
      businessId: BIZ,
    });

    // Register a salida
    const salida = await h.useCases.registrarMovimiento.execute({
      productoId: productId,
      fecha: '2026-04-23',
      tipo: 'salida',
      cantidad: 3,
      costoUnitCentavos: 4_500n,
      motivo: 'Merma',
      businessId: BIZ,
    });

    expect(salida.tipo).toBe('salida');

    // Verify stock: 10 - 3 = 7
    expect(await h.repos.movements.sumStock(productId)).toBe(7);

    // Verify only 1 Egreso (from entrada), not 2
    const egresos = await h.repos.expenses.findByDate('2026-04-23', BIZ);
    expect(egresos.length).toBe(1); // only the entrada Egreso
  });

  it('multiple entradas accumulate Egresos independently', async () => {
    await h.useCases.registrarMovimiento.execute({
      productoId: productId,
      fecha: '2026-04-23',
      tipo: 'entrada',
      cantidad: 5,
      costoUnitCentavos: 4_500n,
      motivo: 'Lote 1',
      businessId: BIZ,
    });

    await h.useCases.registrarMovimiento.execute({
      productoId: productId,
      fecha: '2026-04-23',
      tipo: 'entrada',
      cantidad: 3,
      costoUnitCentavos: 5_000n,
      motivo: 'Lote 2',
      businessId: BIZ,
    });

    // Stock: 5 + 3 = 8
    expect(await h.repos.movements.sumStock(productId)).toBe(8);

    // 2 Egresos: 5×4500=22500 and 3×5000=15000
    const egresos = await h.repos.expenses.findByDate('2026-04-23', BIZ);
    expect(egresos.length).toBe(2);
    const montos = egresos.map((e) => e.monto).sort();
    expect(montos).toEqual([15_000n, 22_500n]);
  });
});
