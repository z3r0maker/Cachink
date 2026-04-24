import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ClientId, NewSale } from '@cachink/domain';
import {
  InMemoryClientsRepository,
  InMemorySalesRepository,
  TEST_DEVICE_ID,
  makeClient,
  makeNewSale,
} from '../../testing/src/index.js';
import { RegistrarVentaUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('RegistrarVentaUseCase', () => {
  let sales: InMemorySalesRepository;
  let clients: InMemoryClientsRepository;
  let useCase: RegistrarVentaUseCase;

  beforeEach(() => {
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    clients = new InMemoryClientsRepository(TEST_DEVICE_ID);
    useCase = new RegistrarVentaUseCase(sales, clients);
  });

  it('creates a cash sale as pagado without checking the clients repo', async () => {
    const sale = await useCase.execute(makeNewSale({ businessId: BIZ }));
    expect(sale.estadoPago).toBe('pagado');
  });

  it('creates a Crédito sale as pendiente when the cliente exists', async () => {
    const cliente = makeClient({ businessId: BIZ });
    // Seed the clients repo by inserting a Client directly via create()
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
      businessId: BIZ,
    } as NewSale;
    await expect(useCase.execute(input)).rejects.toThrow(/clienteId/);
  });

  it('rejects a Crédito sale when the cliente does not exist', async () => {
    const input = makeNewSale({
      businessId: BIZ,
      metodo: 'Crédito',
      clienteId: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as ClientId,
    });
    await expect(useCase.execute(input)).rejects.toThrow(/no existe/);
  });

  it('Zod rejections propagate (e.g. invalid fecha)', async () => {
    const input = {
      fecha: '2026-04-23 12:00:00', // malformed ISO date
      concepto: 'Taco',
      categoria: 'Producto',
      monto: 100n,
      metodo: 'Efectivo',
      businessId: BIZ,
    } as unknown as NewSale;
    await expect(useCase.execute(input)).rejects.toThrow();
  });

  it('persists the sale so subsequent findById returns it', async () => {
    const sale = await useCase.execute(makeNewSale({ businessId: BIZ }));
    const loaded = await sales.findById(sale.id);
    expect(loaded?.id).toBe(sale.id);
  });
});
