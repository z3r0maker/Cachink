import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ClientId, NewSale, ProductId } from '@cachink/domain';
import {
  InMemoryClientsRepository,
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  InMemorySalesRepository,
  TEST_DEVICE_ID,
  makeClient,
  makeNewProduct,
  makeNewSale,
} from '../../testing/src/index.js';
import { RegistrarVentaUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('RegistrarVentaUseCase', () => {
  let sales: InMemorySalesRepository;
  let clients: InMemoryClientsRepository;
  let products: InMemoryProductsRepository;
  let movements: InMemoryInventoryMovementsRepository;
  let useCase: RegistrarVentaUseCase;
  /** A seeded default product — its ID is used in all `makeNewSale()` overrides. */
  let defaultProductId: ProductId;

  beforeEach(async () => {
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    clients = new InMemoryClientsRepository(TEST_DEVICE_ID);
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    movements = new InMemoryInventoryMovementsRepository(TEST_DEVICE_ID);
    useCase = new RegistrarVentaUseCase(sales, clients, products, movements);

    // Seed a default product so makeNewSale() fixtures resolve
    const defaultProduct = await products.create(
      makeNewProduct({ businessId: BIZ }),
    );
    defaultProductId = defaultProduct.id;
  });

  it('creates a cash sale as pagado without checking the clients repo', async () => {
    const sale = await useCase.execute(makeNewSale({ businessId: BIZ, productoId: defaultProductId }));
    expect(sale.estadoPago).toBe('pagado');
  });

  it('creates a Crédito sale as pendiente when the cliente exists', async () => {
    const cliente = makeClient({ businessId: BIZ });
    const persisted = await clients.create({
      nombre: cliente.nombre,
      telefono: '3312345678',
      businessId: BIZ,
    });
    const sale = await useCase.execute(
      makeNewSale({
        businessId: BIZ,
        metodo: 'Crédito',
        clienteId: persisted.id,
        productoId: defaultProductId,
      }),
    );
    expect(sale.estadoPago).toBe('pendiente');
    expect(sale.clienteId).toBe(persisted.id);
  });

  it('rejects a Crédito sale without a clienteId', async () => {
    const input = {
      fecha: '2026-04-23',
      concepto: 'Taco',
      categoria: 'Producto',
      monto: 100n,
      metodo: 'Crédito',
      cantidad: 1,
      productoId: defaultProductId,
      businessId: BIZ,
    } as NewSale;
    await expect(useCase.execute(input)).rejects.toThrow(/clienteId/);
  });

  it('rejects a Crédito sale when the cliente does not exist', async () => {
    const input = makeNewSale({
      businessId: BIZ,
      metodo: 'Crédito',
      clienteId: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as ClientId,
      productoId: defaultProductId,
    });
    await expect(useCase.execute(input)).rejects.toThrow(/no existe/);
  });

  it('rejects a sale when the producto does not exist', async () => {
    const input = makeNewSale({
      businessId: BIZ,
      productoId: '01HZ8XQN9GZJXV8AKQ5XGHOST' as ProductId,
    });
    await expect(useCase.execute(input)).rejects.toThrow(/Producto.*no existe/);
  });

  it('Zod rejections propagate (e.g. invalid fecha)', async () => {
    const input = {
      fecha: '2026-04-23 12:00:00',
      concepto: 'Taco',
      categoria: 'Producto',
      monto: 100n,
      metodo: 'Efectivo',
      cantidad: 1,
      productoId: defaultProductId,
      businessId: BIZ,
    } as unknown as NewSale;
    await expect(useCase.execute(input)).rejects.toThrow();
  });

  it('persists the sale so subsequent findById returns it', async () => {
    const sale = await useCase.execute(makeNewSale({ businessId: BIZ, productoId: defaultProductId }));
    const loaded = await sales.findById(sale.id);
    expect(loaded?.id).toBe(sale.id);
  });

  // --- Auto stock movement ---

  it('creates a salida movement when selling a stock-tracked producto', async () => {
    const producto = await products.create(
      makeNewProduct({ businessId: BIZ, seguirStock: true }),
    );
    // Seed some stock first
    await movements.create({
      productoId: producto.id,
      fecha: '2026-04-23',
      tipo: 'entrada',
      cantidad: 10,
      costoUnitCentavos: 3_500n,
      motivo: 'Compra a proveedor',
      businessId: BIZ,
    });

    await useCase.execute(
      makeNewSale({
        businessId: BIZ,
        productoId: producto.id,
        cantidad: 3,
      }),
    );

    const stock = await movements.sumStock(producto.id);
    expect(stock).toBe(7); // 10 entrada - 3 salida
  });

  it('does NOT create a movement when producto has seguirStock=false', async () => {
    const servicio = await products.create(
      makeNewProduct({
        businessId: BIZ,
        tipo: 'servicio',
        seguirStock: false,
        precioVentaCentavos: 10_000n,
      }),
    );

    await useCase.execute(
      makeNewSale({ businessId: BIZ, productoId: servicio.id }),
    );

    const stock = await movements.sumStock(servicio.id);
    expect(stock).toBe(0); // no movements created
  });

  it('propagates cantidad to the salida movement', async () => {
    const producto = await products.create(
      makeNewProduct({ businessId: BIZ, seguirStock: true }),
    );
    await movements.create({
      productoId: producto.id,
      fecha: '2026-04-23',
      tipo: 'entrada',
      cantidad: 20,
      costoUnitCentavos: 3_500n,
      motivo: 'Compra a proveedor',
      businessId: BIZ,
    });

    await useCase.execute(
      makeNewSale({
        businessId: BIZ,
        productoId: producto.id,
        cantidad: 5,
      }),
    );

    const stock = await movements.sumStock(producto.id);
    expect(stock).toBe(15); // 20 - 5
  });
});
