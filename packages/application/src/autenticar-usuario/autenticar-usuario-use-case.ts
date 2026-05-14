/**
 * AutenticarUsuarioUseCase — authenticates a user by nombre + PIN.
 *
 * Returns an AuthResult indicating success, the userId, the role, and
 * whether the user must change their PIN on first login.
 *
 * ADR-049: PIN for daily login, Password for recovery.
 */

import { compare } from 'bcryptjs';
import {
  authFailure,
  authSuccess,
  type AuthResult,
} from '@cachink/domain';
import type { BusinessId } from '@cachink/domain';
import type { UsersRepository } from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export interface AuthInput {
  readonly nombre: string;
  readonly pin: string;
  readonly businessId: BusinessId;
}

export class AutenticarUsuarioUseCase
  implements UseCase<AuthInput, AuthResult>
{
  readonly #users: UsersRepository;

  constructor(users: UsersRepository) {
    this.#users = users;
  }

  async execute(input: AuthInput): Promise<AuthResult> {
    const user = await this.#users.findByNombre(
      input.nombre,
      input.businessId,
    );
    if (!user) return authFailure();

    const matches = await compare(input.pin, user.pinHash);
    if (!matches) return authFailure();

    return authSuccess(
      user.id,
      user.role,
      user.mustChangePin,
    );
  }
}
