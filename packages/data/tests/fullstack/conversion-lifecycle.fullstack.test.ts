/**
 * Fullstack scenario 4 — Conversion lifecycle.
 *
 * Business narrative:
 *   1. Enable feature flags (stock → conversionMateriaPrima)
 *   2. Create materia prima product with initial stock
 *   3. Create a finished product
 *   4. Create a conversion recipe (materia prima → finished)
 *   5. Execute conversion ×2 → salida on materia prima, entrada on finished
 *   6. Verify movements and Conversion record
 *   7. Execute with insufficient stock → rejected
 *   8. Execute with multiplicador < 1 → rejected
 *
 * Covers: CNV-02, CNV-04, CNV-05
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ConversionRecetaId, ProductId, UserId } from '@cachink/domain';
import { newEntityId } from '@cachink/domain';
import {
  makeNewBusiness,
  makeNewProduct,
} from '../../../testing/src/index.js';
import { buildHarness, type FullstackHarness } from './fullstack-harness.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER_ID = newEntityId<UserId>();

describe('Conversion Lifecycle [fullstack]', () => {
  let h: FullstackHarness;
  let materiaPrimaId: ProductId;
  let productoResultanteId: ProductId;
  let recetaId: ConversionRecetaId;

  beforeEach(async () => {
    h = buildHarness({ userId: USER_ID, stockEnabled: true });

    // Seed business with stock + conversion flags enabled
    await h.repos.businesses.create(
      makeNewBusiness({
        businessId: BIZ,
        featureFlags: JSON.stringify({
          stock: true,
          conversionMateriaPrima: true,
          conversionAutomatica: false,
          auditoriaInventario: false,
          merma: false,
          ventasCredito: false,
          caja: true,
        }),
      }),
    );

    // Create materia prima with 20 units stock
    const mp = await h.repos.products.create(
      makeNewProduct({
        businessId: BIZ,
        nombre: 'Masa de maíz',
        costoUnitCentavos: 1_500n,
        unidad: 'kg',
        seguirStock: true,
        usoProducto: 'materia-prima',
      }),
    );
    materiaPrimaId = mp.id;

    await h.repos.movements.create({
      productoId: materiaPrimaId,
      fecha: '2026-04-23',
      tipo: 'entrada',
      cantidad: 20,
      costoUnitCentavos: 1_500n,
      motivo: 'Compra a proveedor',
      businessId: BIZ,
    });

    // Create finished product
    const pr = await h.repos.products.create(
      makeNewProduct({
        businessId: BIZ,
        nombre: 'Tortillas 1kg',
        costoUnitCentavos: 3_000n,
        unidad: 'kg',
        seguirStock: true,
        usoProducto: 'venta',
      }),
    );
    productoResultanteId = pr.id;

    // Create recipe: 2 kg masa → 3 kg tortillas
    const receta = await h.repos.recetas.create({
      materiaPrimaId,
      productoResultanteId,
      cantidadOrigen: 2,
      cantidadResultante: 3,
      businessId: BIZ,
    });
    recetaId = receta.id;
  });

  it('executes conversion: materia prima decreases, finished product increases', async () => {
    const result = await h.useCases.ejecutarConversion.execute({
      recetaId,
      multiplicador: 2, // 2× recipe: 4 kg masa → 6 kg tortillas
      businessId: BIZ,
    });

    expect(result.conversion.cantidadOrigenUsada).toBe(4);
    expect(result.conversion.cantidadResultanteCreada).toBe(6);

    // Materia prima: 20 - 4 = 16
    const stockMP = await h.repos.movements.sumStock(materiaPrimaId);
    expect(stockMP).toBe(16);

    // Producto resultante: 0 + 6 = 6
    const stockPR = await h.repos.movements.sumStock(productoResultanteId);
    expect(stockPR).toBe(6);
  });

  it('rejects conversion when stock is insufficient', async () => {
    // multiplicador 20 → needs 40 kg masa, only 20 available
    await expect(
      h.useCases.ejecutarConversion.execute({
        recetaId,
        multiplicador: 20,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/stock insuficiente/i);
  });

  it('rejects conversion with multiplicador < 1', async () => {
    await expect(
      h.useCases.ejecutarConversion.execute({
        recetaId,
        multiplicador: 0,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/multiplicador/i);
  });

  it('rejects non-integer multiplicador', async () => {
    await expect(
      h.useCases.ejecutarConversion.execute({
        recetaId,
        multiplicador: 1.5,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/multiplicador/i);
  });

  it('successive conversions accumulate correctly', async () => {
    // First conversion: 1× = 2 kg masa → 3 kg tortillas
    await h.useCases.ejecutarConversion.execute({
      recetaId,
      multiplicador: 1,
      businessId: BIZ,
    });

    // Second conversion: 3× = 6 kg masa → 9 kg tortillas
    await h.useCases.ejecutarConversion.execute({
      recetaId,
      multiplicador: 3,
      businessId: BIZ,
    });

    // Materia prima: 20 - 2 - 6 = 12
    expect(await h.repos.movements.sumStock(materiaPrimaId)).toBe(12);
    // Producto resultante: 3 + 9 = 12
    expect(await h.repos.movements.sumStock(productoResultanteId)).toBe(12);
  });
});
