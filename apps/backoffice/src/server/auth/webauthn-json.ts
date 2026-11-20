import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@xangarro/auth-core';
import { z } from 'zod';

/**
 * What a browser hands back from a passkey ceremony, parsed before anything
 * reads it (CLAUDE.md §2.8): a server action receives whatever the caller
 * sends. Field sizes are generous for real authenticators and small enough
 * that nobody can post megabytes into a verify. Extensions are not used, so
 * they are dropped.
 */
const b64u = (max: number) =>
  z
    .string()
    .max(max)
    .regex(/^[A-Za-z0-9_-]*$/);
const id = b64u(1400).min(16);
const shell = {
  id,
  rawId: id,
  type: z.literal('public-key'),
  clientExtensionResults: z.unknown().transform(() => ({})),
  authenticatorAttachment: z.enum(['platform', 'cross-platform']).optional(),
};

const AuthenticationSchema = z.object({
  ...shell,
  response: z.object({
    clientDataJSON: b64u(4096).min(1),
    authenticatorData: b64u(4096).min(1),
    // ML-DSA-87 (offered by default) signs in 4,627 bytes; ES256 in about 72.
    signature: b64u(8192).min(1),
    userHandle: b64u(128).optional(),
  }),
});

const RegistrationSchema = z.object({
  ...shell,
  response: z.object({
    clientDataJSON: b64u(4096).min(1),
    attestationObject: b64u(16384).min(1),
    authenticatorData: b64u(4096).optional(),
    transports: z
      .array(z.string().regex(/^[a-z-]{1,20}$/))
      .max(8)
      .optional(),
    publicKeyAlgorithm: z.number().int().optional(),
    // ML-DSA-87's public key is 2,592 bytes.
    publicKey: b64u(4096).optional(),
  }),
});

export function parseAuthentication(input: unknown): AuthenticationResponseJSON | null {
  const parsed = AuthenticationSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

export function parseRegistration(input: unknown): RegistrationResponseJSON | null {
  const parsed = RegistrationSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

/** Which fields a refused answer got wrong (paths and codes, never values), for the server log. */
export function answerIssues(input: unknown, kind: 'authentication' | 'registration'): string {
  const schema = kind === 'authentication' ? AuthenticationSchema : RegistrationSchema;
  const parsed = schema.safeParse(input);
  if (parsed.success) return 'none';
  return parsed.error.issues.map((i) => `${i.path.join('.')}:${i.code}`).join(',');
}
