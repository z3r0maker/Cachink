import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ProductId, SaleId, UserId } from '@xangarro/domain';
import {
  InMemoryCajaTurnosRepository,
  InMemoryClientsRepository,
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  InMemorySalesRepository,
  InMemoryTicketsRepository,
  TEST_DEVICE_ID,
  makeNewProduct,
  makeNewSale,
} from '../../testing/src/index.js';
import { EditarVentaUseCase, RegistrarTicketUseCase, RegistrarVentaUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER_ID = '01HZ8XQN9GZJXV8AKQ5X0CUSR1' as UserId;

describe('EditarVentaUseCase', () => {
  let tickets: InMemoryTicketsRepository;
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
    tickets = new InMemoryTicketsRepository(TEST_DEVICE_ID);
    registrar = new RegistrarVentaUseCase(
      new RegistrarTicketUseCase(tickets, sales, clients, products, movements, cajaTurnos, {
        userId: USER_ID,
      }),
    );
    editar = new EditarVentaUseCase(sales);

    // Seed a default product for use-case product validation
    const defaultProduct = await products.create(makeNewProduct({ businessId: BIZ }));
    defaultProductId = defaultProduct.id;
  });

  it('applies a monto + concepto patch and returns the updated row', async () => {
    const sale = await registrar.execute(
      makeNewSale({ businessId: BIZ, monto: 1000n, productoId: defaultProductId }),
    );
    const updated = await editar.execute({
      id: sale.id,
      patch: { monto: 2500n, concepto: 'Café americano grande' },
    });
    expect(updated.monto).toBe(2500n);
    expect(updated.concepto).toBe('Café americano grande');
    expect(updated.id).toBe(sale.id);
  });

  it('preserves untouched fields (fecha, categoria)', async () => {
    const sale = await registrar.execute(
      makeNewSale({ businessId: BIZ, productoId: defaultProductId }),
    );
    const updated = await editar.execute({
      id: sale.id,
      patch: { monto: 9999n },
    });
    expect(updated.fecha).toBe(sale.fecha);
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

  it('Zod rejects an empty concepto', async () => {
    const sale = await registrar.execute(
      makeNewSale({ businessId: BIZ, productoId: defaultProductId }),
    );
    await expect(editar.execute({ id: sale.id, patch: { concepto: '' } })).rejects.toThrow();
  });
});
