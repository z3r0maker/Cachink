/**
 * Operator management (B-13): create, reset a PIN, deactivate.
 *
 * Operators are the people who sign in to a phone with a name and a PIN. They
 * are managed from outside the phone — `users` is a DOWN table — so these rules
 * live here, in the layer every client shares, rather than in the portal that
 * happens to call them first.
 *
 * "Active operator" means `role === 'operativo' && active`. Directors are not
 * operators and do not spend the plan's operator allowance.
 */

import { randomBytes } from 'node:crypto';
import { hash } from 'bcryptjs';
import {
  DuplicateOperatorError,
  InvalidPinError,
  OperatorLimitError,
  OperatorNotFoundError,
  isValidPin,
  type BusinessId,
  type User,
  type UserId,
} from '@xangarro/domain';
import type { UsersRepository } from '@xangarro/data';
import type { UseCase } from '../_use-case.js';

const BCRYPT_ROUNDS = 10;
const AVATAR_COLORS = ['#3B6FFF', '#00C896', '#FF6B35', '#9B59B6', '#E91E63', '#F5A623'] as const;

const isActiveOperator = (u: User): boolean => u.role === 'operativo' && u.active;

async function activeOperators(users: UsersRepository, businessId: BusinessId): Promise<number> {
  return (await users.findAllByBusiness(businessId)).filter(isActiveOperator).length;
}

/** Found, and in this business — another business's operator is "not found", not "forbidden". */
async function ownOperator(
  users: UsersRepository,
  businessId: BusinessId,
  id: UserId,
): Promise<User> {
  const user = await users.findById(id);
  if (user === null || user.businessId !== businessId) throw new OperatorNotFoundError();
  return user;
}

export interface CrearOperadorInput {
  readonly businessId: BusinessId;
  readonly nombre: string;
  readonly pin: string;
  /** From the entitlement — the rule is here, the number is the plan's. */
  readonly operatorLimit: number;
}

export class CrearOperadorUseCase implements UseCase<CrearOperadorInput, User> {
  readonly #users: UsersRepository;
  constructor(users: UsersRepository) {
    this.#users = users;
  }

  async execute(input: CrearOperadorInput): Promise<User> {
    if (!isValidPin(input.pin)) throw new InvalidPinError();
    const nombre = input.nombre.trim();
    if ((await activeOperators(this.#users, input.businessId)) >= input.operatorLimit) {
      throw new OperatorLimitError(input.operatorLimit);
    }
    if (await this.#users.findByNombre(nombre, input.businessId)) {
      throw new DuplicateOperatorError(nombre);
    }
    // Operators never use password recovery — the portal resets their PIN
    // instead — but the column is NOT NULL until ADR-058 §4 drops it. A hash of
    // random bytes nobody knows is honestly unusable, unlike a guessable default.
    const [pinHash, recoveryPasswordHash] = await Promise.all([
      hash(input.pin, BCRYPT_ROUNDS),
      hash(randomBytes(32).toString('hex'), BCRYPT_ROUNDS),
    ]);
    return this.#users.create({
      nombre,
      email: null,
      pinHash,
      recoveryPasswordHash,
      role: 'operativo',
      mustChangePin: false,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] ?? '#3B6FFF',
      businessId: input.businessId,
    });
  }
}

export interface RestablecerPinInput {
  readonly businessId: BusinessId;
  readonly operatorId: UserId;
  readonly pin: string;
}

/** An administrator resets a forgotten PIN — unlike `CambiarPinUseCase`, no old PIN needed. */
export class RestablecerPinOperadorUseCase implements UseCase<RestablecerPinInput, void> {
  readonly #users: UsersRepository;
  constructor(users: UsersRepository) {
    this.#users = users;
  }

  async execute(input: RestablecerPinInput): Promise<void> {
    if (!isValidPin(input.pin)) throw new InvalidPinError();
    await ownOperator(this.#users, input.businessId, input.operatorId);
    await this.#users.update(input.operatorId, { pinHash: await hash(input.pin, BCRYPT_ROUNDS) });
  }
}

export interface DesactivarInput {
  readonly businessId: BusinessId;
  readonly operatorId: UserId;
}

export interface DesactivarResult {
  /** True when no active operator remains — nobody can sign in to a phone now. */
  readonly lastActive: boolean;
}

/**
 * Deactivate, never delete: sales and cancellations name operators by id.
 * Deactivating the last active operator is allowed — a business may pause every
 * phone — but the result says so, and the portal must warn.
 */
export class DesactivarOperadorUseCase implements UseCase<DesactivarInput, DesactivarResult> {
  readonly #users: UsersRepository;
  constructor(users: UsersRepository) {
    this.#users = users;
  }

  async execute(input: DesactivarInput): Promise<DesactivarResult> {
    await ownOperator(this.#users, input.businessId, input.operatorId);
    await this.#users.update(input.operatorId, { active: false });
    return { lastActive: (await activeOperators(this.#users, input.businessId)) === 0 };
  }
}
