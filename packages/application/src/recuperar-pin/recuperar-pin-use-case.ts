/**
 * RecuperarPinUseCase — resets a user's login PIN via recovery password.
 *
 * Verifies the recovery password hash, then resets the PIN.
 * Sets `mustChangePin: false` since the user just chose a new one.
 *
 * ADR-049: PIN for daily login, Password for recovery.
 */

import { compare, hash } from 'bcryptjs';
import type { UserId } from '@cachink/domain';
import type { UsersRepository } from '@cachink/data';
import type { UseCase } from '../_use-case.js';

const BCRYPT_ROUNDS = 10;

export interface RecuperarPinInput {
  readonly userId: UserId;
  readonly recoveryPassword: string;
  readonly newPin: string;
}

export class RecuperarPinUseCase
  implements UseCase<RecuperarPinInput, void>
{
  readonly #users: UsersRepository;

  constructor(users: UsersRepository) {
    this.#users = users;
  }

  async execute(input: RecuperarPinInput): Promise<void> {
    if (!/^\d{6}$/.test(input.newPin)) {
      throw new TypeError(
        'El nuevo PIN debe ser de 6 dígitos',
      );
    }

    const user = await this.#users.findById(input.userId);
    if (!user) {
      throw new TypeError('Usuario no encontrado');
    }

    const matches = await compare(
      input.recoveryPassword,
      user.recoveryPasswordHash,
    );
    if (!matches) {
      throw new TypeError('La contraseña de recuperación es incorrecta');
    }

    const newHash = await hash(input.newPin, BCRYPT_ROUNDS);
    await this.#users.update(input.userId, {
      pinHash: newHash,
      mustChangePin: false,
    });
  }
}
