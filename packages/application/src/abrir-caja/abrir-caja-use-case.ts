/**
 * AbrirCajaUseCase — opens a new cash drawer turn.
 *
 * One open turno per caja (ADR-071 §3, M-18): a caja is one device, and its
 * repository holds that device's turnos, so an open turno of this business
 * blocks a second one whoever asks. Someone else's open turno is continued
 * or closed first, never doubled: sales attach to the caja's open turno.
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
} from '@xangarro/domain';
import type { CajaTurnosRepository } from '@xangarro/data';
import type { UseCase } from '../_use-case.js';

export class AbrirCajaUseCase implements UseCase<NewCajaTurno, CajaTurno> {
  readonly #turnos: CajaTurnosRepository;

  constructor(turnos: CajaTurnosRepository) {
    this.#turnos = turnos;
  }

  async execute(input: NewCajaTurno): Promise<CajaTurno> {
    const parsed = NewCajaTurnoSchema.parse(input);

    const open = await this.#turnos.findOpenByBusiness(parsed.businessId as BusinessId);
    if (open) {
      throw new TypeError(
        open.userId === parsed.userId
          ? 'Ya tienes un turno abierto. Ciérralo antes de abrir uno nuevo.'
          : 'Ya hay un turno abierto en esta caja. Síguelo o ciérralo antes de abrir uno nuevo.',
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
