/**
 * Archive the business (P-08): «Se archivan tus registros y se desvinculan
 * todos los dispositivos. No se borra nada.» Owner-only at the caller.
 *
 * The owner types the name to confirm, and a subscription that will keep
 * charging blocks it — archiving must never leave a card billed for a business
 * nobody can open. The archive itself (soft delete, devices revoked, sessions
 * ended) is one database call behind the port.
 */

import {
  ConfirmacionNombreError,
  confirmaNombre,
  SuscripcionActivaError,
  suscripcionImpideArchivar,
  type SuscripcionHecho,
} from '@xangarro/domain';

import type { UseCase } from '../_use-case.js';

export interface ArchivarNegocioPorts {
  readonly subscriptions: () => Promise<readonly SuscripcionHecho[]>;
  readonly archive: () => Promise<void>;
}

export interface ArchivarNegocioInput {
  readonly nombre: string;
  readonly confirmacion: string;
}

export class ArchivarNegocioUseCase implements UseCase<ArchivarNegocioInput, void> {
  constructor(private readonly ports: ArchivarNegocioPorts) {}

  async execute(input: ArchivarNegocioInput): Promise<void> {
    if (!confirmaNombre(input.nombre, input.confirmacion)) throw new ConfirmacionNombreError();
    if (suscripcionImpideArchivar(await this.ports.subscriptions())) {
      throw new SuscripcionActivaError();
    }
    await this.ports.archive();
  }
}
