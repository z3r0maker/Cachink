import 'server-only';

import type { ExpensesRepository, InventoryMovementsRepository } from '@xangarro/data';
import { expenses, inventoryMovements, logChange } from '@xangarro/data-pg';
import {
  newUlid,
  type Expense,
  type InventoryMovement,
  type NewExpense,
  type NewInventoryMovement,
  type ProductId,
} from '@xangarro/domain';
import { and, eq, isNull, sql } from 'drizzle-orm';

import type { Tx } from '../db';
import { PORTAL_DEVICE_ID } from './portal-device';

/**
 * What the movement and archive use cases need, over Postgres (ADR-081):
 * creating a movement, creating the entrada's expense, and a product's stock.
 *
 * - A **movement** is HYBRID: logged, so every phone pulls it and its stock
 *   agrees with the portal's.
 * - An **expense** is UP and stays in the cloud: phones capture expenses, the
 *   portal reports them. Nothing to log.
 */
function stamps(businessId: string) {
  const now = new Date().toISOString();
  return {
    id: newUlid(),
    businessId,
    deviceId: PORTAL_DEVICE_ID,
    createdByUserId: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

export function pgMovementsCreator(
  tx: Tx,
  businessId: string,
): Pick<InventoryMovementsRepository, 'create' | 'sumStock'> {
  return {
    /** Entradas minus salidas — the same sum the phones and the catalogue make. */
    async sumStock(productoId: ProductId): Promise<number> {
      const [row] = await tx
        .select({
          stock: sql<string>`COALESCE(SUM(CASE WHEN ${inventoryMovements.tipo} = 'salida' THEN -${inventoryMovements.cantidad} ELSE ${inventoryMovements.cantidad} END), 0)::text`,
        })
        .from(inventoryMovements)
        .where(
          and(eq(inventoryMovements.productoId, productoId), isNull(inventoryMovements.deletedAt)),
        );
      return Number(row?.stock ?? 0);
    },
    async create(input: NewInventoryMovement): Promise<InventoryMovement> {
      const row = { ...input, nota: input.nota ?? null, ...stamps(businessId) };
      await tx.insert(inventoryMovements).values(row);
      await logChange(tx, businessId, 'inventory_movements', row.id, 'insert');
      return row as unknown as InventoryMovement;
    },
  };
}

export function pgExpensesCreator(tx: Tx, businessId: string): Pick<ExpensesRepository, 'create'> {
  return {
    async create(input: NewExpense): Promise<Expense> {
      const row = { ...input, ...stamps(businessId) };
      await tx.insert(expenses).values(row);
      return row as unknown as Expense;
    },
  };
}
