/**
 * EliminarUsuarioUseCase — soft-deletes a user.
 *
 * Director only. Prevents deleting the last Director to ensure
 * there is always at least one Director who can manage the business.
 */

import type { UserId } from '@cachink/domain';
import type { UsersRepository } from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export interface EliminarUsuarioInput {
  readonly userId: UserId;
}

export class EliminarUsuarioUseCase
  implements UseCase<EliminarUsuarioInput, void>
{
  readonly #users: UsersRepository;

  constructor(users: UsersRepository) {
    this.#users = users;
  }

  async execute(input: EliminarUsuarioInput): Promise<void> {
    const user = await this.#users.findById(input.userId);
    if (!user) {
      throw new TypeError('Usuario no encontrado');
    }

    if (user.role === 'director') {
      const directorCount = await this.#users.countDirectors(
        user.businessId,
      );
      if (directorCount <= 1) {
        throw new TypeError(
          'No se puede eliminar al último Director del negocio',
        );
      }
    }

    await this.#users.delete(input.userId);
  }
}
