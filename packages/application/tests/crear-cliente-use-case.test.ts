import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { BusinessId } from '@xangarro/domain';

import { InMemoryClientsRepository } from '../../testing/src/index.js';
import { CrearClienteUseCase } from '../src/index.js';

const BUSINESS = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const base = { nombre: 'Doña Mary', businessId: BUSINESS };

describe('CrearClienteUseCase', () => {
  let clients: InMemoryClientsRepository;

  beforeEach(() => {
    clients = new InMemoryClientsRepository();
  });

  it('creates a cliente, normalising the RFC to upper case', async () => {
    const c = await new CrearClienteUseCase(clients).execute({
      client: { ...base, telefono: '55 1234 5678', rfc: 'xaxx010101000' },
    });
    assert.equal(c.nombre, 'Doña Mary');
    assert.equal(c.telefono, '55 1234 5678');
    assert.equal(c.rfc, 'XAXX010101000');
    assert.equal(await clients.count(BUSINESS), 1);
  });

  it('refuses an empty nombre and creates nothing', async () => {
    await assert.rejects(
      new CrearClienteUseCase(clients).execute({ client: { ...base, nombre: '   ' } }),
      (e: unknown) => (e as { code?: string }).code === 'CLIENT_INVALID',
    );
    assert.equal(await clients.count(BUSINESS), 0);
  });

  it('refuses a malformed teléfono and creates nothing', async () => {
    await assert.rejects(
      new CrearClienteUseCase(clients).execute({ client: { ...base, telefono: 'abc' } }),
      (e: unknown) => (e as { code?: string }).code === 'CLIENT_INVALID',
    );
    assert.equal(await clients.count(BUSINESS), 0);
  });

  it('refuses an invalid RFC and creates nothing', async () => {
    await assert.rejects(
      new CrearClienteUseCase(clients).execute({ client: { ...base, rfc: 'ABC123' } }),
      (e: unknown) => (e as { code?: string }).code === 'CLIENT_INVALID',
    );
    assert.equal(await clients.count(BUSINESS), 0);
  });
});
