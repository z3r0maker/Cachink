/**
 * CrearUsuarioUseCase — creates a new user account.
 *
 * Only a Director can create users. Validates input, hashes PIN
 * and recovery password with bcryptjs, and persists via UsersRepository.
 *
 * ADR-049: PIN for daily login, Password for recovery.
 */

import { hash } from 'bcryptjs';
import { NewUserSchema, type NewUser, type User } from '@cachink/domain';
import type { UsersRepository } from '@cachink/data';
import type { UseCase } from '../_use-case.js';

const BCRYPT_ROUNDS = 10;

export class CrearUsuarioUseCase implements UseCase<NewUser, User> {
  readonly #users: UsersRepository;

  constructor(users: UsersRepository) {
    this.#users = users;
  }

  async execute(input: NewUser): Promise<User> {
    const parsed = NewUserSchema.parse(input);

    const existing = await this.#users.findByNombre(
      parsed.nombre,
      parsed.businessId,
    );
    if (existing) {
      throw new TypeError(
        `Ya existe un usuario con el nombre "${parsed.nombre}"`,
      );
    }

    const [pinHash, recoveryPasswordHash] = await Promise.all([
      hash(parsed.pin, BCRYPT_ROUNDS),
      hash(parsed.recoveryPassword, BCRYPT_ROUNDS),
    ]);

    return this.#users.create({
      nombre: parsed.nombre,
      email: parsed.email ?? null,
      pinHash,
      recoveryPasswordHash,
      role: parsed.role,
      mustChangePin: parsed.mustChangePin,
      avatarColor: this.#pickColor(),
      businessId: parsed.businessId,
    });
  }

  #pickColor(): string {
    const colors = [
      'blue',
      'green',
      'red',
      'purple',
      'cyan',
      'slate',
    ] as const;
    return colors[Math.floor(Math.random() * colors.length)]!;
  }
}
