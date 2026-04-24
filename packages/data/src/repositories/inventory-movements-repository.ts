/**
 * InventoryMovementsRepository — append-only ledger of stock deltas.
 *
 * Running stock for a product is derived by summing entradas and
 * subtracting salidas (`sumStock`). Movements are never updated, only
 * appended — a typo is fixed by recording a corrective movement.
 */

import type {
  BusinessId,
  InventoryMovement,
  InventoryMovementId,
  IsoDate,
  NewInventoryMovement,
  ProductId,
} from '@cachink/domain';

export type { InventoryMovement, NewInventoryMovement };

export interface InventoryMovementsRepository {
  create(input: NewInventoryMovement): Promise<InventoryMovement>;
  findById(id: InventoryMovementId): Promise<InventoryMovement | null>;
  findByProduct(productoId: ProductId): Promise<readonly InventoryMovement[]>;
  findByDateRange(
    from: IsoDate,
    to: IsoDate,
    businessId: BusinessId,
  ): Promise<readonly InventoryMovement[]>;
  /** Sum of entradas minus salidas; stock level for a single product. */
  sumStock(productoId: ProductId): Promise<number>;
  delete(id: InventoryMovementId): Promise<void>;
}
