import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';
import type { BusinessId, ClientId } from '@xangarro/domain';

import { InMemoryClientsRepository } from '../../testing/src/index.js';
import { CrearClienteUseCase, EditarClienteUseCase } from '../src/index.js';

const BUSINESS = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

async function seeded(clients: InMemoryClientsRepository): Promise<ClientId> {
  const c = await new CrearClienteUseCase(clients).execute({
    client: { nombre: 'Doña Mary', telefono: '55 1234 5678', businessId: BUSINESS },
  });
  return c.id;
}

describe('EditarClienteUseCase', () => {
  let clients: InMemoryClientsRepository;

  beforeEach(() => {
    clients = new InMemoryClientsRepository();
  });

  it('updates telefono and rfc on an existing cliente', async () => {
    const id = await seeded(clients);
    const c = await new EditarClienteUseCase(clients).execute({
      id,
      patch: { telefono: '55 8765 4321', rfc: 'XEXX010101000' },
    });
    assert.equal(c.telefono, '55 8765 4321');
    assert.equal(c.rfc, 'XEXX010101000');
    assert.equal(c.nombre, 'Doña Mary');
  });

  it('a no-op patch keeps the row and bumps nothing the caller can see', async () => {
    const id = await seeded(clients);
    const c = await new EditarClienteUseCase(clients).execute({ id, patch: {} });
    assert.equal(c.nombre, 'Doña Mary');
    assert.equal(c.telefono, '55 1234 5678');
  });

  it('refuses a missing row with the typed error', async () => {
    await assert.rejects(
      new EditarClienteUseCase(clients).execute({
        id: '01HZ8XQN9GZJXV8AKQ5X0MISSIN' as ClientId,
        patch: { telefono: '55 0000 0000' },
      }),
      (e: unknown) => (e as { code?: string }).code === 'CLIENT_NOT_FOUND',
    );
  });

  it('refuses a patch that would make the row invalid', async () => {
    const id = await seeded(clients);
    await assert.rejects(
      new EditarClienteUseCase(clients).execute({ id, patch: { rfc: 'NO-RFC' } }),
      (e: unknown) => e instanceof Error,
    );
    const after = await clients.findById(id);
    assert.equal(after?.rfc ?? null, null);
  });
});
