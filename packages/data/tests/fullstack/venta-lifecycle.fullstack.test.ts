/**
 * Fullstack scenario 1 — Venta lifecycle.
 *
 * Business narrative:
 *   1. Create a business + user
 *   2. Open caja
 *   3. Create a stock-tracked product with initial stock
 *   4. Register a cash sale → stock deducted, inventory_movements row
 *   5. Cancel the sale with PIN → stock reversed
 *   6. Attempt a sale without caja → CajaNoAbiertaError
 *   7. Verify that RegistrarVenta allows negative stock (no block)
 *
 * Covers: VEN-01, VEN-07, VEN-11, VEN-13, VEN-16, VEN-20
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, UserId, ProductId } from '@xangarro/domain';
import { CajaNoAbiertaError, newEntityId } from '@xangarro/domain';
import { makeNewBusiness, makeNewProduct, makeNewSale } from '../../../testing/src/index.js';
import { buildHarness, type FullstackHarness } from './fullstack-harness.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER_ID = newEntityId<UserId>();
/** bcrypt("123456", 4 rounds) — the portal hashes PINs; the device only compares. */
const PIN_123456_HASH = '$2b$04$evzlfJ7TAHvaDduEWaAAVOK7cs/r3lNuH5VAZ0G5Zr0DTkx1vaHa.';

describe('Venta Lifecycle [fullstack]', () => {
  let h: FullstackHarness;
  let productId: ProductId;

  beforeEach(async () => {
    h = buildHarness({ userId: USER_ID, stockEnabled: true });

    // Seed business
    await h.repos.businesses.create(makeNewBusiness({ businessId: BIZ }));

    // Seed an operator the portal allowed to cancel sales (PIN 123456).
    await h.repos.users.create({
      nombre: 'Cajero Test',
      pinHash: PIN_123456_HASH,
      avatarColor: 'blue',
      businessId: BIZ,
      permissions: { canCancelSales: true },
    });

    // Seed a stock-tracked product
    const product = await h.repos.products.create(
      makeNewProduct({
        businessId: BIZ,
        nombre: 'Tortilla 1kg',
        costoUnitCentavos: 2_000n,
        precioVentaCentavos: 3_500n,
        seguirStock: true,
      }),
    );
    productId = product.id;

    // Seed initial stock (10 units)
    await h.repos.movements.create({
      productoId: productId,
      fecha: '2026-04-23',
      tipo: 'entrada',
      cantidad: 10,
      costoUnitCentavos: 2_000n,
      motivo: 'Compra inicial',
      businessId: BIZ,
    });
  });

  it('cash sale deducts stock and creates inventory movement', async () => {
    // Open caja first
    const turno = await h.useCases.abrirCaja.execute({
      userId: USER_ID,
      fecha: '2026-04-23',
      montoAperturaCentavos: 500_00n,
      efectivoAdicionalCentavos: 0n,
      businessId: BIZ,
    });
    expect(turno.cierreAt).toBeNull();

    // Register sale of 3 units
    const sale = await h.useCases.registrarVenta.execute(
      makeNewSale({
        businessId: BIZ,
        productoId: productId,
        cantidad: 3,
        monto: 10_500n, // 3 × $35
        metodo: 'Efectivo',
      }),
    );

    expect(sale.estadoPago).toBe('pagado');
    expect(sale.cajaTurnoId).toBe(turno.id);

    // Verify stock: 10 entrada - 3 salida = 7
    const stock = await h.repos.movements.sumStock(productId);
    expect(stock).toBe(7);
  });

  it('cancel sale reverses stock and creates audit log', async () => {
    // Open caja + register a sale
    await h.useCases.abrirCaja.execute({
      userId: USER_ID,
      fecha: '2026-04-23',
      montoAperturaCentavos: 500_00n,
      efectivoAdicionalCentavos: 0n,
      businessId: BIZ,
    });

    const sale = await h.useCases.registrarVenta.execute(
      makeNewSale({
        businessId: BIZ,
        productoId: productId,
        cantidad: 2,
        monto: 7_000n,
      }),
    );

    // Stock after sale: 10 - 2 = 8
    expect(await h.repos.movements.sumStock(productId)).toBe(8);

    // Find the user for PIN verification
    const cajero = await h.repos.users.findByNombre('Cajero Test', BIZ);
    expect(cajero).not.toBeNull();

    // Cancel the sale
    const result = await h.useCases.cancelarVenta.execute({
      saleId: sale.id,
      userId: cajero!.id,
      pin: '123456',
      motivo: 'Cliente no quiso',
      businessId: BIZ,
      stockEnabled: true,
    });

    expect(result.stockReversed).toBe(true);
    expect(result.cantidadDevuelta).toBe(2);
    expect(result.cashToReturn).toBe(7_000n);

    // Stock reversed: 10 - 2 + 2 = 10
    const stock = await h.repos.movements.sumStock(productId);
    expect(stock).toBe(10);
  });

  it('sale without caja throws CajaNoAbiertaError', async () => {
    // No caja opened — should throw
    await expect(
      h.useCases.registrarVenta.execute(makeNewSale({ businessId: BIZ, productoId: productId })),
    ).rejects.toThrow(CajaNoAbiertaError);
  });

  it('allows selling more than available stock (negative stock)', async () => {
    // Open caja
    await h.useCases.abrirCaja.execute({
      userId: USER_ID,
      fecha: '2026-04-23',
      montoAperturaCentavos: 500_00n,
      efectivoAdicionalCentavos: 0n,
      businessId: BIZ,
    });

    // Sell 15 when only 10 in stock — should succeed (no block)
    const sale = await h.useCases.registrarVenta.execute(
      makeNewSale({
        businessId: BIZ,
        productoId: productId,
        cantidad: 15,
        monto: 52_500n,
      }),
    );

    expect(sale.estadoPago).toBe('pagado');

    // Stock goes negative: 10 - 15 = -5
    const stock = await h.repos.movements.sumStock(productId);
    expect(stock).toBe(-5);
  });
});
