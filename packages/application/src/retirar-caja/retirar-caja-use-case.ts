/**
 * RetirarCajaUseCase — withdraw cash from the open drawer.
 *
 * Creates a CajaMovimiento of tipo='retiro'. Validates the turn
 * exists and is still open.
 */

import {
  NewCajaMovimientoSchema,
  type CajaMovimiento,
  type NewCajaMovimiento,
} from '@cachink/domain';
import type {
  CajaMovimientosRepository,
  CajaTurnosRepository,
} from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export class RetirarCajaUseCase
  implements UseCase<NewCajaMovimiento, CajaMovimiento>
{
  readonly #movimientos: CajaMovimientosRepository;
  readonly #turnos: CajaTurnosRepository;

  constructor(
    movimientos: CajaMovimientosRepository,
    turnos: CajaTurnosRepository,
  ) {
    this.#movimientos = movimientos;
    this.#turnos = turnos;
  }

  async execute(input: NewCajaMovimiento): Promise<CajaMovimiento> {
    const parsed = NewCajaMovimientoSchema.parse({
      ...input,
      tipo: 'retiro',
    });

    const turno = await this.#turnos.findById(parsed.turnoId);
    if (!turno) throw new TypeError('Turno no encontrado');
    if (turno.cierreAt !== null) {
      throw new TypeError('No se puede retirar de un turno cerrado');
    }

    return this.#movimientos.create(parsed);
  }
}
