/**
 * In-memory {@link ClientsRepository}.
 */

import type {
  BusinessId,
  Client,
  ClientId,
  DeviceId,
  IsoTimestamp,
  NewClient,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { ClientsRepository } from '@cachink/data';

export class InMemoryClientsRepository implements ClientsRepository {
  private readonly rows = new Map<ClientId, Client>();
  private readonly deviceId: DeviceId;

  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) {
    this.deviceId = deviceId;
  }

  async create(input: NewClient): Promise<Client> {
    const id = newEntityId<ClientId>();
    const ts = now();
    const row: Client = {
      id,
      nombre: input.nombre,
      telefono: input.telefono ?? null,
      email: input.email ?? null,
      nota: input.nota ?? null,
      businessId: input.businessId,
      deviceId: this.deviceId,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    };
    this.rows.set(id, row);
    return row;
  }

  async findById(id: ClientId): Promise<Client | null> {
    const row = this.rows.get(id);
    if (!row || row.deletedAt !== null) return null;
    return row;
  }

  async findByName(query: string, businessId: BusinessId): Promise<readonly Client[]> {
    const needle = query.toLowerCase();
    return [...this.rows.values()]
      .filter(
        (r) =>
          r.businessId === businessId &&
          r.deletedAt === null &&
          r.nombre.toLowerCase().includes(needle),
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  async delete(id: ClientId): Promise<void> {
    const existing = this.rows.get(id);
    if (!existing) return;
    const ts: IsoTimestamp = now();
    this.rows.set(id, { ...existing, deletedAt: ts, updatedAt: ts });
  }
}
