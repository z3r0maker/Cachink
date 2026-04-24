/**
 * RegistrarMovimientoInventarioUseCase (P1B-M6-T03).
 *
 * Per CLAUDE.md §10 an `entrada` movement also creates an Egreso with
 * `categoria='Inventario'` and `monto = cantidad × costoUnit`. The
 * two writes happen in sequence — contract tests verify both rows
 * land — but not inside a transaction (the InMemory and Drizzle
 * backends have different tx surfaces; the UI will refresh both
 * lists from the same repositories).
 *
 * Salida movements don't touch egresos — they model stock leaving the
 * business (sale, merma, producción) which the caller has already
 * accounted for via a Venta or a different Egreso.
 */

import {
  NewInventoryMovementSchema,
  multiplyByInteger,
  type InventoryMovement,
  type NewInventoryMovement,
} from '@cachink/domain';
import type {
  ExpensesRepository,
  InventoryMovementsRepository,
} from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export class RegistrarMovimientoInventarioUseCase
  implements UseCase<NewInventoryMovement, InventoryMovement>
{
  readonly #movements: InventoryMovementsRepository;
  readonly #expenses: ExpensesRepository;

  constructor(
    movements: InventoryMovementsRepository,
    expenses: ExpensesRepository,
  ) {
    this.#movements = movements;
    this.#expenses = expenses;
  }

  async execute(input: NewInventoryMovement): Promise<InventoryMovement> {
    const parsed = NewInventoryMovementSchema.parse(input);
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
