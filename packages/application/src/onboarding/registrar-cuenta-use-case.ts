/**
 * RegistrarCuentaUseCase — signup (P-03, reordered by N-13 / ADR-067).
 *
 * One call creates the portal identity, the business and the owner membership;
 * the store writes all three in one transaction. Plan and payment come later,
 * after the wizard. The business starts on RESICO with its seed ISR rate —
 * the most common régimen for a new emprendedor, editable in Negocio.
 */

import { hash } from 'bcryptjs';
import { ISR_DEFAULTS_SEED, newUlid, type BusinessId } from '@xangarro/domain';
import { z } from 'zod';

import type { UseCase } from '../_use-case.js';
import { SignupError } from './errors.js';
import type { SignupStore } from './ports.js';

const BCRYPT_ROUNDS = 10;
const REGIMEN_INICIAL = 'RESICO' as const;

export const SignupInputSchema = z.object({
  nombre: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  /** bcrypt reads at most 72 bytes; longer would silently truncate. */
  password: z.string().min(8).max(72),
});

export type SignupInput = z.input<typeof SignupInputSchema>;

export interface SignupResult {
  readonly userId: string;
  readonly businessId: BusinessId;
}

export class RegistrarCuentaUseCase implements UseCase<SignupInput, SignupResult> {
  readonly #store: SignupStore;
  readonly #newUserId: () => string;

  /** `newUserId` mints an `auth.users` UUID; injected so this package stays platform-free. */
  constructor(store: SignupStore, newUserId: () => string) {
    this.#store = store;
    this.#newUserId = newUserId;
  }

  async execute(input: SignupInput): Promise<SignupResult> {
    const parsed = SignupInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new SignupError(
        'INVALID_SIGNUP',
        'Revisa tu nombre, tu correo y tu contraseña (mínimo 8 caracteres).',
        parsed.error.issues.map((i) => i.path.join('.')),
      );
    }
    const { nombre, email, password } = parsed.data;
    if (await this.#store.emailTaken(email)) {
      throw new SignupError('EMAIL_TAKEN', 'Ya existe una cuenta con ese correo.');
    }
    const owner = {
      userId: this.#newUserId(),
      email,
      passwordHash: await hash(password, BCRYPT_ROUNDS),
      businessId: newUlid() as BusinessId,
      memberId: newUlid(),
      nombreNegocio: nombre,
      regimenFiscal: REGIMEN_INICIAL,
      isrTasa: ISR_DEFAULTS_SEED[REGIMEN_INICIAL],
      at: new Date().toISOString(),
    };
    await this.#store.createOwner(owner);
    return { userId: owner.userId, businessId: owner.businessId };
  }
}
