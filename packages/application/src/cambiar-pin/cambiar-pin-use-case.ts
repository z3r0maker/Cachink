/**
 * CambiarPinUseCase — changes a user's login PIN.
 *
 * Verifies the current PIN before accepting the new one.
 * Clears the `mustChangePin` flag on success.
 *
 * ADR-049: PIN for daily login, Password for recovery.
 */

import { compare, hash } from 'bcryptjs';
import type { UserId } from '@cachink/domain';
import type { UsersRepository } from '@cachink/data';
import type { UseCase } from '../_use-case.js';

const BCRYPT_ROUNDS = 10;

export interface CambiarPinInput {
  readonly userId: UserId;
  readonly currentPin: string;
  readonly newPin: string;
}

export class CambiarPinUseCase
  implements UseCase<CambiarPinInput, void>
{
  readonly #users: UsersRepository;

  constructor(users: UsersRepository) {
    this.#users = users;
  }

  async execute(input: CambiarPinInput): Promise<void> {
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
      input.currentPin,
      user.pinHash,
    );
    if (!matches) {
      throw new TypeError('PIN actual incorrecto');
    }

    const newHash = await hash(input.newPin, BCRYPT_ROUNDS);
    await this.#users.update(input.userId, {
      pinHash: newHash,
      mustChangePin: false,
    });
  }
}
