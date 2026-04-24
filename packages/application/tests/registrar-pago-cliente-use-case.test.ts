import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ClientId, NewSale, SaleId } from '@cachink/domain';
import {
  InMemoryClientPaymentsRepository,
  InMemorySalesRepository,
  TEST_DEVICE_ID,
  makeNewClientPayment,
  makeNewSale,
} from '../../testing/src/index.js';
import { RegistrarPagoClienteUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const CLIENT = '01HZ8XQN9GZJXV8AKQ5X0C7CKJ' as ClientId;

async function seedCreditVenta(
  sales: InMemorySalesRepository,
  monto = 10_000n,
  overrides: Partial<NewSale> = {},
) {
  return sales.create(
    makeNewSale({
      businessId: BIZ,
      metodo: 'Crédito',
      clienteId: CLIENT,
      monto,
      ...overrides,
    }),
  );
}

describe('RegistrarPagoClienteUseCase', () => {
  let payments: InMemoryClientPaymentsRepository;
  let sales: InMemorySalesRepository;
  let useCase: RegistrarPagoClienteUseCase;

  beforeEach(() => {
    payments = new InMemoryClientPaymentsRepository(TEST_DEVICE_ID);
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    useCase = new RegistrarPagoClienteUseCase(payments, sales);
  });

  it('partial pago sets estadoPago to parcial', async () => {
    const venta = await seedCreditVenta(sales, 10_000n);
    await useCase.execute(
      makeNewClientPayment({ ventaId: venta.id, montoCentavos: 3_000n }),
    );
    const updated = await sales.findById(venta.id);
    expect(updated?.estadoPago).toBe('parcial');
  });

  it('exact full pago sets estadoPago to pagado', async () => {
    const venta = await seedCreditVenta(sales, 10_000n);
    await useCase.execute(
      makeNewClientPayment({ ventaId: venta.id, montoCentavos: 10_000n }),
    );
    expect((await sales.findById(venta.id))?.estadoPago).toBe('pagado');
  });

  it('multiple partials accumulate correctly and end as pagado', async () => {
    const venta = await seedCreditVenta(sales, 10_000n);
    await useCase.execute(
      makeNewClientPayment({ ventaId: venta.id, montoCentavos: 3_000n }),
    );
    await useCase.execute(
      makeNewClientPayment({ ventaId: venta.id, montoCentavos: 2_000n }),
    );
    await useCase.execute(
      makeNewClientPayment({ ventaId: venta.id, montoCentavos: 5_000n }),
    );
    expect((await sales.findById(venta.id))?.estadoPago).toBe('pagado');
    expect(await payments.sumByVenta(venta.id)).toBe(10_000n);
  });

  it('rejects overpayment', async () => {
    const venta = await seedCreditVenta(sales, 10_000n);
    await useCase.execute(
      makeNewClientPayment({ ventaId: venta.id, montoCentavos: 7_000n }),
    );
    await expect(
      useCase.execute(
        makeNewClientPayment({ ventaId: venta.id, montoCentavos: 5_000n }),
      ),
    ).rejects.toThrow(/excede/);
  });

  it('rejects pago against a non-Crédito venta', async () => {
    const venta = await sales.create(makeNewSale({ businessId: BIZ, metodo: 'Efectivo' }));
    await expect(
      useCase.execute(makeNewClientPayment({ ventaId: venta.id, montoCentavos: 100n })),
    ).rejects.toThrow(/Crédito/);
  });

  it('rejects pago against a venta that is already pagado', async () => {
    const venta = await seedCreditVenta(sales, 10_000n);
    await useCase.execute(
      makeNewClientPayment({ ventaId: venta.id, montoCentavos: 10_000n }),
    );
    await expect(
      useCase.execute(
        makeNewClientPayment({ ventaId: venta.id, montoCentavos: 1n }),
      ),
    ).rejects.toThrow(/pagada/);
  });

  it('rejects pago when the venta does not exist', async () => {
    await expect(
      useCase.execute(
        makeNewClientPayment({
          ventaId: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as SaleId,
          montoCentavos: 100n,
        }),
      ),
    ).rejects.toThrow(/no existe/);
  });
});
