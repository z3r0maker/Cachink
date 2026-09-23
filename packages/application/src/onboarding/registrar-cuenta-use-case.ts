/**
 * RegistrarCuentaUseCase — signup (P-03, reordered by N-13 / ADR-067).
 *
 * One call creates the portal identity, the business and the owner membership;
 * the store writes all three in one transaction. Plan and payment come later,
 * after the wizard. The business starts on RESICO with its seed ISR rate —
 * the most common régimen for a new emprendedor, editable in Negocio.
 */

import { hash } from 'bcryptjs';
import {
  AvisoVigenteSchema,
  ISR_DEFAULTS_SEED,
  RegistroConsentimientoSchema,
  consentimientosDeRegistro,
  newUlid,
  type AvisoVigente,
  type BusinessId,
} from '@xangarro/domain';
import { z } from 'zod';

import type { UseCase } from '../_use-case.js';
import { SignupError } from './errors.js';
import type { SignupStore } from './ports.js';

const BCRYPT_ROUNDS = 10;
const REGIMEN_INICIAL = 'RESICO' as const;

export const SignupInputSchema = z.object({
  /** The business's name — the wizard's first question is about the negocio. */
  nombre: z.string().trim().min(1).max(120),
  /** The person's own name (O-24), optional: an empty one is stored as null. */
  tuNombre: z.string().trim().max(120).optional(),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  /** bcrypt reads at most 72 bytes; longer would silently truncate. */
  password: z.string().min(8).max(72),
  /** The aviso act (N-34): checked separately so its refusal has its own code. */
  consentimiento: RegistroConsentimientoSchema.optional(),
});

export type SignupInput = z.input<typeof SignupInputSchema>;

export interface SignupResult {
  readonly userId: string;
  readonly businessId: BusinessId;
}

export class RegistrarCuentaUseCase implements UseCase<SignupInput, SignupResult> {
  readonly #store: SignupStore;
  readonly #newUserId: () => string;
  readonly #aviso: AvisoVigente;

  /**
   * `newUserId` mints an `auth.users` UUID; injected so this package stays
   * platform-free. `aviso` is the version and hash of the text the form shows:
   * the portal owns the text, the use case only records what was accepted.
   */
  constructor(store: SignupStore, newUserId: () => string, aviso: AvisoVigente) {
    this.#store = store;
    this.#newUserId = newUserId;
    this.#aviso = AvisoVigenteSchema.parse(aviso);
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
    const { nombre, tuNombre, email, password, consentimiento } = parsed.data;
    if (consentimiento === undefined || consentimiento.acepto !== true) {
      throw new SignupError(
        'CONSENT_REQUIRED',
        'Para crear tu cuenta necesitas aceptar el aviso de privacidad y los términos.',
      );
    }
    if (await this.#store.emailTaken(email)) {
      throw new SignupError('EMAIL_TAKEN', 'Ya existe una cuenta con ese correo.');
    }
    const owner = {
      userId: this.#newUserId(),
      email,
      passwordHash: await hash(password, BCRYPT_ROUNDS),
      nombre: tuNombre && tuNombre.length > 0 ? tuNombre : null,
      businessId: newUlid() as BusinessId,
      memberId: newUlid(),
      nombreNegocio: nombre,
      regimenFiscal: REGIMEN_INICIAL,
      isrTasa: ISR_DEFAULTS_SEED[REGIMEN_INICIAL],
      at: new Date().toISOString(),
      consentimientos: consentimientosDeRegistro(this.#aviso, consentimiento),
    };
    await this.#store.createOwner(owner);
    return { userId: owner.userId, businessId: owner.businessId };
  }
}
