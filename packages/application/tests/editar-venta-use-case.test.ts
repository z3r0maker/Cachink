import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ClientId, ProductId, SaleId, UserId } from '@cachink/domain';
import {
  InMemoryCajaTurnosRepository,
  InMemoryClientsRepository,
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  InMemorySalesRepository,
  TEST_DEVICE_ID,
  makeNewProduct,
  makeNewSale,
} from '../../testing/src/index.js';
import { EditarVentaUseCase, RegistrarVentaUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER_ID = '01HZ8XQN9GZJXV8AKQ5X0CUSR1' as UserId;

describe('EditarVentaUseCase', () => {
  let sales: InMemorySalesRepository;
  let clients: InMemoryClientsRepository;
  let products: InMemoryProductsRepository;
  let movements: InMemoryInventoryMovementsRepository;
  let cajaTurnos: InMemoryCajaTurnosRepository;
  let registrar: RegistrarVentaUseCase;
  let editar: EditarVentaUseCase;
  let defaultProductId: ProductId;

  beforeEach(async () => {
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    clients = new InMemoryClientsRepository(TEST_DEVICE_ID);
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    movements = new InMemoryInventoryMovementsRepository(TEST_DEVICE_ID);
    cajaTurnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
    // Seed an open turno for the registrar
    await cajaTurnos.create({
      userId: USER_ID,
      fecha: '2026-04-23',
      aperturaAt: '2026-04-23T09:00:00.000Z',
      montoAperturaCentavos: 500_00n,
      efectivoAdicionalCentavos: 0n,
      businessId: BIZ,
    });
    registrar = new RegistrarVentaUseCase(
      sales, clients, products, movements, cajaTurnos,
      { userId: USER_ID },
    );
    editar = new EditarVentaUseCase(sales, clients);

    // Seed a default product for use-case product validation
    const defaultProduct = await products.create(
      makeNewProduct({ businessId: BIZ }),
    );
    defaultProductId = defaultProduct.id;
  });

  it('applies a monto + concepto patch and returns the updated row', async () => {
    const sale = await registrar.execute(makeNewSale({ businessId: BIZ, monto: 1000n, productoId: defaultProductId }));
    const updated = await editar.execute({
      id: sale.id,
      patch: { monto: 2500n, concepto: 'Café americano grande' },
    });
    expect(updated.monto).toBe(2500n);
    expect(updated.concepto).toBe('Café americano grande');
    expect(updated.id).toBe(sale.id);
  });

  it('preserves untouched fields (fecha, metodo, categoria)', async () => {
    const sale = await registrar.execute(makeNewSale({ businessId: BIZ, productoId: defaultProductId }));
    const updated = await editar.execute({
      id: sale.id,
      patch: { monto: 9999n },
    });
    expect(updated.fecha).toBe(sale.fecha);
    expect(updated.metodo).toBe(sale.metodo);
    expect(updated.categoria).toBe(sale.categoria);
  });

  it('throws when the venta does not exist', async () => {
    await expect(
      editar.execute({
        id: '01HZ8XQN9GZJXV8AKQ5X0CZZZZ' as SaleId,
        patch: { monto: 1n },
      }),
    ).rejects.toThrow(/no existe/);
  });

  it('rejects a Crédito patch without a clienteId on the merged row', async () => {
    const sale = await registrar.execute(makeNewSale({ businessId: BIZ, metodo: 'Efectivo', productoId: defaultProductId }));
    // Trying to flip metodo to Crédito while clienteId is null.
    await expect(editar.execute({ id: sale.id, patch: { metodo: 'Crédito' } })).rejects.toThrow(
      /clienteId/,
    );
  });

  it('rejects a Crédito patch when the clienteId points at a missing cliente', async () => {
    const sale = await registrar.execute(makeNewSale({ businessId: BIZ, productoId: defaultProductId }));
    await expect(
      editar.execute({
        id: sale.id,
        patch: {
          metodo: 'Crédito',
          clienteId: '01HZ8XQN9GZJXV8AKQ5X0C7CCC' as ClientId,
        },
      }),
    ).rejects.toThrow(/no existe/);
  });

  it('accepts a Crédito patch with an existing cliente', async () => {
    const cliente = await clients.create({
      nombre: 'María',
      telefono: '5512345678',
      businessId: BIZ,
    });
    const sale = await registrar.execute(makeNewSale({ businessId: BIZ, productoId: defaultProductId }));
    const updated = await editar.execute({
      id: sale.id,
      patch: { metodo: 'Crédito', clienteId: cliente.id },
    });
    expect(updated.metodo).toBe('Crédito');
    expect(updated.clienteId).toBe(cliente.id);
  });

  it('Zod rejects an empty concepto', async () => {
    const sale = await registrar.execute(makeNewSale({ businessId: BIZ, productoId: defaultProductId }));
    await expect(editar.execute({ id: sale.id, patch: { concepto: '' } })).rejects.toThrow();
  });
});
