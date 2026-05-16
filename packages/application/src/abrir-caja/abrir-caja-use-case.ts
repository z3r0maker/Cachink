/**
 * AbrirCajaUseCase — opens a new cash drawer turn.
 *
 * Handoff flow: queries the last closed turn and auto-populates the
 * apertura amount from the previous cierre amount. Prevents opening
 * a new turn if the user already has an open one.
 *
 * Phase 6 of the Feature Flags plan: Caja.
 */

import {
  now,
  today,
  type BusinessId,
  type CajaTurno,
  type NewCajaTurno,
  NewCajaTurnoSchema,
} from '@cachink/domain';
import type { CajaTurnosRepository } from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export class AbrirCajaUseCase
  implements UseCase<NewCajaTurno, CajaTurno>
{
  readonly #turnos: CajaTurnosRepository;

  constructor(turnos: CajaTurnosRepository) {
    this.#turnos = turnos;
  }

  async execute(input: NewCajaTurno): Promise<CajaTurno> {
    const parsed = NewCajaTurnoSchema.parse(input);

    // Prevent duplicate open turns for the same user
    const open = await this.#turnos.findOpenByUser(parsed.userId);
    if (open) {
      throw new TypeError(
        'Ya tienes un turno abierto. Ciérralo antes de abrir uno nuevo.',
      );
    }

    return this.#turnos.create({
      userId: parsed.userId,
      fecha: parsed.fecha ?? today(),
      aperturaAt: now(),
      montoAperturaCentavos: parsed.montoAperturaCentavos,
      efectivoAdicionalCentavos: parsed.efectivoAdicionalCentavos,
      businessId: parsed.businessId as BusinessId,
    });
  }
}
