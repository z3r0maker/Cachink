/**
 * Drizzle-backed {@link ClientsRepository}.
 */

import { and, asc, eq, isNull, like } from 'drizzle-orm';
import type {
  BusinessId,
  ClientId,
  DeviceId,
  IsoTimestamp,
  NewClient,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { Client, ClientsRepository } from '../clients-repository.js';
import { clients } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type ClientRow = typeof clients.$inferSelect;

export class DrizzleClientsRepository implements ClientsRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;

  constructor(db: CachinkDatabase, deviceId: DeviceId) {
    this.#db = db;
    this.#deviceId = deviceId;
  }

  async create(input: NewClient): Promise<Client> {
    const id = newEntityId<ClientId>();
    const ts = now();
    const row = {
      id,
      nombre: input.nombre,
      telefono: input.telefono ?? null,
      email: input.email ?? null,
      nota: input.nota ?? null,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(clients).values(row).run();
    return this.#mapRow(row);
  }

  async findById(id: ClientId): Promise<Client | null> {
    const row = await this.#db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findByName(query: string, businessId: BusinessId): Promise<readonly Client[]> {
    const rows = await this.#db
      .select()
      .from(clients)
      .where(
        and(
          like(clients.nombre, `%${query}%`),
          eq(clients.businessId, businessId),
          isNull(clients.deletedAt),
        ),
      )
      .orderBy(asc(clients.nombre))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async delete(id: ClientId): Promise<void> {
    const ts = now();
    await this.#db
      .update(clients)
      .set({ deletedAt: ts, updatedAt: ts })
      .where(eq(clients.id, id))
      .run();
  }

  #mapRow(row: ClientRow): Client {
    return {
      id: row.id as ClientId,
      nombre: row.nombre,
      telefono: row.telefono,
      email: row.email,
      nota: row.nota,
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
