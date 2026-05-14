import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ConversionRecetaId, IsoDate, ProductId } from '@cachink/domain';
import {
  InMemoryConversionRecetasRepository,
  InMemoryConversionsRepository,
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  TEST_DEVICE_ID,
  makeNewProduct,
} from '../../testing/src/index.js';
import { EjecutarConversionUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const TODAY = '2026-05-12' as IsoDate;

describe('EjecutarConversionUseCase', () => {
  let recetas: InMemoryConversionRecetasRepository;
  let conversions: InMemoryConversionsRepository;
  let movements: InMemoryInventoryMovementsRepository;
  let products: InMemoryProductsRepository;
  let useCase: EjecutarConversionUseCase;

  let mpId: ProductId;
  let productId: ProductId;
  let recetaId: ConversionRecetaId;

  beforeEach(async () => {
    recetas = new InMemoryConversionRecetasRepository(TEST_DEVICE_ID);
    conversions = new InMemoryConversionsRepository(TEST_DEVICE_ID);
    movements = new InMemoryInventoryMovementsRepository(TEST_DEVICE_ID);
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    useCase = new EjecutarConversionUseCase(recetas, conversions, movements, products);

    // Seed materia prima
    const mp = await products.create(
      makeNewProduct({
        nombre: 'Bolsa de Café 1kg',
        usoProducto: 'materia-prima',
        businessId: BIZ,
      }),
    );
    mpId = mp.id;

    // Seed producto resultante
    const prod = await products.create(
      makeNewProduct({
        nombre: 'Taza de Café',
        usoProducto: 'venta',
        precioVentaCentavos: 5_000n,
        businessId: BIZ,
      }),
    );
    productId = prod.id;

    // Add stock for MP: 10 units
    await movements.create({
      productoId: mpId,
      fecha: TODAY,
      tipo: 'entrada',
      cantidad: 10,
      costoUnitCentavos: 3_500n,
      motivo: 'Compra inicial',
      businessId: BIZ,
    });

    // Seed recipe: 1 bag → 10 cups
    const r = await recetas.create({
      materiaPrimaId: mpId,
      productoResultanteId: productId,
      cantidadOrigen: 1,
      cantidadResultante: 10,
      businessId: BIZ,
    });
    recetaId = r.id;
  });

  it('happy path: converts MP into products with correct stock movements', async () => {
    const result = await useCase.execute({
      recetaId,
      multiplicador: 2,
      today: TODAY,
      businessId: BIZ,
    });

    expect(result.conversion.cantidadOrigenUsada).toBe(2);
    expect(result.conversion.cantidadResultanteCreada).toBe(20);
    expect(result.movimientoSalidaId).toBeTruthy();
    expect(result.movimientoEntradaId).toBeTruthy();

    // MP stock should drop from 10 → 8
    const mpStock = await movements.sumStock(mpId);
    expect(mpStock).toBe(8);

    // Product stock should go from 0 → 20
    const prodStock = await movements.sumStock(productId);
    expect(prodStock).toBe(20);
  });

  it('throws when recipe does not exist', async () => {
    const fakeId = '01NONEXISTENT00000000000000' as ConversionRecetaId;
    await expect(
      useCase.execute({
        recetaId: fakeId,
        multiplicador: 1,
        today: TODAY,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/no encontrada/);
  });

  it('throws when MP stock is insufficient', async () => {
    // Multiplicador 20 needs 20 units, but we only have 10
    await expect(
      useCase.execute({
        recetaId,
        multiplicador: 20,
        today: TODAY,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/Stock insuficiente/);
  });

  it('throws when multiplicador is zero', async () => {
    await expect(
      useCase.execute({
        recetaId,
        multiplicador: 0,
        today: TODAY,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/Multiplicador/);
  });
});
