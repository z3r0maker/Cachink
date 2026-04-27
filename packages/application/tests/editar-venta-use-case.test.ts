import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ClientId, SaleId } from '@cachink/domain';
import {
  InMemoryClientsRepository,
  InMemorySalesRepository,
  TEST_DEVICE_ID,
  makeNewSale,
} from '../../testing/src/index.js';
import { EditarVentaUseCase, RegistrarVentaUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('EditarVentaUseCase', () => {
  let sales: InMemorySalesRepository;
  let clients: InMemoryClientsRepository;
  let registrar: RegistrarVentaUseCase;
  let editar: EditarVentaUseCase;

  beforeEach(() => {
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    clients = new InMemoryClientsRepository(TEST_DEVICE_ID);
    registrar = new RegistrarVentaUseCase(sales, clients);
    editar = new EditarVentaUseCase(sales, clients);
  });

  it('applies a monto + concepto patch and returns the updated row', async () => {
    const sale = await registrar.execute(makeNewSale({ businessId: BIZ, monto: 1000n }));
    const updated = await editar.execute({
      id: sale.id,
      patch: { monto: 2500n, concepto: 'Café americano grande' },
    });
    expect(updated.monto).toBe(2500n);
    expect(updated.concepto).toBe('Café americano grande');
    expect(updated.id).toBe(sale.id);
  });

  it('preserves untouched fields (fecha, metodo, categoria)', async () => {
    const sale = await registrar.execute(makeNewSale({ businessId: BIZ }));
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
    const sale = await registrar.execute(makeNewSale({ businessId: BIZ, metodo: 'Efectivo' }));
    // Trying to flip metodo to Crédito while clienteId is null.
    await expect(editar.execute({ id: sale.id, patch: { metodo: 'Crédito' } })).rejects.toThrow(
      /clienteId/,
    );
  });

  it('rejects a Crédito patch when the clienteId points at a missing cliente', async () => {
    const sale = await registrar.execute(makeNewSale({ businessId: BIZ }));
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
    const sale = await registrar.execute(makeNewSale({ businessId: BIZ }));
    const updated = await editar.execute({
      id: sale.id,
      patch: { metodo: 'Crédito', clienteId: cliente.id },
    });
    expect(updated.metodo).toBe('Crédito');
    expect(updated.clienteId).toBe(cliente.id);
  });

  it('Zod rejects an empty concepto', async () => {
    const sale = await registrar.execute(makeNewSale({ businessId: BIZ }));
    await expect(editar.execute({ id: sale.id, patch: { concepto: '' } })).rejects.toThrow();
  });
});
