/**
 * «Editar permisos» (P-05): what an operator may do on the phone beyond
 * selling — in v1, cancelling sales. A plan capability (`permisosPorUsuario`):
 * below it the editor is absent and the rule refuses regardless. `users` is
 * DOWN, so the repository logs the change for every phone.
 */

import {
  PermisosNoIncluidosError,
  UserPermissionsSchema,
  type BusinessId,
  type UserId,
  type UserPermissions,
} from '@xangarro/domain';
import type { UsersRepository } from '@xangarro/data';

import type { UseCase } from '../_use-case.js';
import { ownOperator } from './operadores-use-case.js';

export interface CambiarPermisosInput {
  readonly businessId: BusinessId;
  readonly operatorId: UserId;
  readonly permisos: UserPermissions;
  /** From the entitlement: `capabilities.permisosPorUsuario`. */
  readonly incluidoEnPlan: boolean;
}

export class CambiarPermisosOperadorUseCase implements UseCase<CambiarPermisosInput, void> {
  constructor(private readonly users: Pick<UsersRepository, 'findById' | 'update'>) {}

  async execute(input: CambiarPermisosInput): Promise<void> {
    if (!input.incluidoEnPlan) throw new PermisosNoIncluidosError();
    await ownOperator(this.users, input.businessId, input.operatorId);
    await this.users.update(input.operatorId, {
      permissions: UserPermissionsSchema.parse(input.permisos),
    });
  }
}
