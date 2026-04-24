/**
 * Drizzle-backed {@link InventoryMovementsRepository}.
 */

import { and, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import type {
  BusinessId,
  DeviceId,
  InventoryMovementId,
  IsoDate,
  IsoTimestamp,
  MovementType,
  NewInventoryMovement,
  ProductId,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type {
  InventoryMovement,
  InventoryMovementsRepository,
} from '../inventory-movements-repository.js';
import { inventoryMovements } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type MovementRow = typeof inventoryMovements.$inferSelect;

export class DrizzleInventoryMovementsRepository implements InventoryMovementsRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;

  constructor(db: CachinkDatabase, deviceId: DeviceId) {
    this.#db = db;
    this.#deviceId = deviceId;
  }

  async create(input: NewInventoryMovement): Promise<InventoryMovement> {
    const id = newEntityId<InventoryMovementId>();
    const ts = now();
    const row = {
      id,
      productoId: input.productoId,
      fecha: input.fecha,
      tipo: input.tipo,
      cantidad: input.cantidad,
      costoUnitCentavos: input.costoUnitCentavos,
      motivo: input.motivo,
      nota: input.nota ?? null,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(inventoryMovements).values(row).run();
    return this.#mapRow(row);
  }

  async findById(id: InventoryMovementId): Promise<InventoryMovement | null> {
    const row = await this.#db
      .select()
      .from(inventoryMovements)
      .where(and(eq(inventoryMovements.id, id), isNull(inventoryMovements.deletedAt)))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findByProduct(productoId: ProductId): Promise<readonly InventoryMovement[]> {
    const rows = await this.#db
      .select()
      .from(inventoryMovements)
      .where(
        and(
          eq(inventoryMovements.productoId, productoId),
          isNull(inventoryMovements.deletedAt),
        ),
      )
      .orderBy(desc(inventoryMovements.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async findByDateRange(
    from: IsoDate,
    to: IsoDate,
    businessId: BusinessId,
  ): Promise<readonly InventoryMovement[]> {
    const rows = await this.#db
      .select()
      .from(inventoryMovements)
      .where(
        and(
          gte(inventoryMovements.fecha, from),
          lte(inventoryMovements.fecha, to),
          eq(inventoryMovements.businessId, businessId),
          isNull(inventoryMovements.deletedAt),
        ),
      )
      .orderBy(desc(inventoryMovements.fecha))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async sumStock(productoId: ProductId): Promise<number> {
    const rows = await this.findByProduct(productoId);
    let total = 0;
    for (const row of rows) {
      total += row.tipo === 'entrada' ? row.cantidad : -row.cantidad;
    }
    return total;
  }

  async delete(id: InventoryMovementId): Promise<void> {
    const ts = now();
    await this.#db
      .update(inventoryMovements)
      .set({ deletedAt: ts, updatedAt: ts })
      .where(eq(inventoryMovements.id, id))
      .run();
  }

  #mapRow(row: MovementRow): InventoryMovement {
    return {
      id: row.id as InventoryMovementId,
      productoId: row.productoId as ProductId,
      fecha: row.fecha as IsoDate,
      tipo: row.tipo as MovementType,
      cantidad: row.cantidad,
      costoUnitCentavos: row.costoUnitCentavos,
      motivo: row.motivo,
      nota: row.nota,
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
