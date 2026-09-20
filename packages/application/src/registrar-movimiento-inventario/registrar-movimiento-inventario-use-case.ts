/**
 * RegistrarMovimientoInventarioUseCase — one movement, plus the purchase
 * egreso an `entrada` implies. The optional quota (A-10) lets the phone
 * gate creations against the plan; the portal passes none (ADR-081).
 */

import {
  NewInventoryMovementSchema,
  multiplyByInteger,
  type InventoryMovement,
  type NewInventoryMovement,
} from '@xangarro/domain';
import type { ExpensesRepository, InventoryMovementsRepository } from '@xangarro/data';
import type { UseCase } from '../_use-case.js';
import { UNLIMITED_QUOTA, type RecordQuota } from '../record-quota/record-quota.js';

export class RegistrarMovimientoInventarioUseCase implements UseCase<
  NewInventoryMovement,
  InventoryMovement
> {
  readonly #movements: Pick<InventoryMovementsRepository, 'create'>;
  readonly #expenses: Pick<ExpensesRepository, 'create'>;
  readonly #quota: RecordQuota;

  /** Only `create` of each: the portal (ADR-081) implements no more than it uses. */
  constructor(
    movements: Pick<InventoryMovementsRepository, 'create'>,
    expenses: Pick<ExpensesRepository, 'create'>,
    quota: RecordQuota = UNLIMITED_QUOTA,
  ) {
    this.#movements = movements;
    this.#expenses = expenses;
    this.#quota = quota;
  }

  async execute(input: NewInventoryMovement): Promise<InventoryMovement> {
    const parsed = NewInventoryMovementSchema.parse(input);
    await this.#quota.assertCanCreate();
    const movement = await this.#movements.create(parsed);
    if (parsed.tipo === 'entrada') {
      await this.#expenses.create({
        fecha: parsed.fecha,
        concepto: `Compra inventario: ${parsed.motivo}`,
        categoria: 'Inventario',
        monto: multiplyByInteger(parsed.costoUnitCentavos, parsed.cantidad),
        businessId: parsed.businessId,
      });
    }
    return movement;
  }
}
