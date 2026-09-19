import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ClientId } from '@xangarro/domain';
import {
  InMemoryClientPaymentsRepository,
  InMemoryClientsRepository,
  TEST_DEVICE_ID,
  makeNewClient,
  makeNewClientPayment,
} from '../../testing/src/index.js';
import { RegistrarPagoClienteUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

/**
 * ADR-074: an abono belongs to the client. The use case records it; how it
 * settles tickets is `estadoDeCuenta`'s business. Unhappy paths: zero or
 * less, unknown client, a client the owner fused or rejected in review.
 */
describe('RegistrarPagoClienteUseCase', () => {
  let payments: InMemoryClientPaymentsRepository;
  let clients: InMemoryClientsRepository;
  let useCase: RegistrarPagoClienteUseCase;
  let clienteId: ClientId;

  beforeEach(async () => {
    payments = new InMemoryClientPaymentsRepository(TEST_DEVICE_ID);
    clients = new InMemoryClientsRepository(TEST_DEVICE_ID);
    clienteId = (await clients.create(makeNewClient({ businessId: BIZ }))).id;
    useCase = new RegistrarPagoClienteUseCase(payments, clients);
  });

  it('records a client abono as-is', async () => {
    const pago = await useCase.execute(makeNewClientPayment({ clienteId, montoCentavos: 3_000n }));
    expect(pago.clienteId).toBe(clienteId);
    expect(pago.montoCentavos).toBe(3_000n);
    const rows = await payments.findByCliente(clienteId);
    expect(rows).toHaveLength(1);
  });

  it('records an abono above any balance — the excess is saldo a favor (ADR-083 D5)', async () => {
    const pago = await useCase.execute(makeNewClientPayment({ clienteId, montoCentavos: 99_999n }));
    expect(pago.montoCentavos).toBe(99_999n);
  });

  it('rejects a zero or negative amount', async () => {
    await expect(
      useCase.execute(makeNewClientPayment({ clienteId, montoCentavos: 0n })),
    ).rejects.toThrow();
    await expect(
      useCase.execute(makeNewClientPayment({ clienteId, montoCentavos: -5n })),
    ).rejects.toThrow();
  });

  it('rejects an unknown client', async () => {
    await expect(
      useCase.execute(
        makeNewClientPayment({
          clienteId: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as ClientId,
          montoCentavos: 100n,
        }),
      ),
    ).rejects.toThrow(/no existe/i);
  });

  it('rejects a client the owner fused or rejected in review', async () => {
    const fusionado = await clients.create(
      makeNewClient({ nombre: 'Duplicado', estadoRevision: 'fusionado' }),
    );
    await expect(
      useCase.execute(makeNewClientPayment({ clienteId: fusionado.id, montoCentavos: 100n })),
    ).rejects.toThrow(/fusionado/i);

    const rechazado = await clients.create(
      makeNewClient({ nombre: 'Rechazado', estadoRevision: 'rechazado' }),
    );
    await expect(
      useCase.execute(makeNewClientPayment({ clienteId: rechazado.id, montoCentavos: 100n })),
    ).rejects.toThrow(/rechazado/i);
  });

  it('accepts a client still pending review — the cash is real', async () => {
    const pendiente = await clients.create(
      makeNewClient({ nombre: 'En revisión', estadoRevision: 'pendiente' }),
    );
    const pago = await useCase.execute(
      makeNewClientPayment({ clienteId: pendiente.id, montoCentavos: 500n }),
    );
    expect(pago.montoCentavos).toBe(500n);
  });
});
