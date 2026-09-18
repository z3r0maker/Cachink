import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { AuthCoreError } from './errors.js';

/**
 * AES-256-GCM for secrets that must be read back — a TOTP seed cannot be
 * hashed, because verifying a code needs the seed itself.
 *
 * Sealed form: `v1.<iv>.<ciphertext>.<tag>`, each part base64url. `context`
 * is bound as additional authenticated data (e.g. the owner's id), so a sealed
 * value copied onto another row fails to open instead of working there.
 */
const VERSION = 'v1';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

/** A 32-byte key from base64 or base64url (e.g. `openssl rand -base64 32`). */
export function parseSecretKey(raw: string | undefined): Buffer {
  const key = Buffer.from((raw ?? '').trim(), 'base64');
  if (key.length !== KEY_BYTES) {
    throw new AuthCoreError('INVALID_KEY', 'The key must be 32 bytes, base64-encoded.');
  }
  return key;
}

function assertKey(key: Uint8Array): void {
  if (key.length !== KEY_BYTES) {
    throw new AuthCoreError('INVALID_KEY', 'The key must be 32 bytes.');
  }
}

export function sealSecret(key: Uint8Array, plaintext: string, context: string): string {
  assertKey(key);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv).setAAD(Buffer.from(context));
  const body = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const parts = [iv, body, cipher.getAuthTag()].map((b) => b.toString('base64url'));
  return [VERSION, ...parts].join('.');
}

const INVALID = () =>
  new AuthCoreError(
    'INVALID_SEALED_SECRET',
    'The sealed secret is malformed or was tampered with.',
  );

export function openSecret(key: Uint8Array, sealed: string, context: string): string {
  assertKey(key);
  const [version, ivPart, bodyPart, tagPart, ...rest] = sealed.split('.');
  if (version !== VERSION || rest.length > 0 || !ivPart || !bodyPart || !tagPart) throw INVALID();
  const iv = Buffer.from(ivPart, 'base64url');
  const tag = Buffer.from(tagPart, 'base64url');
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) throw INVALID();
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv).setAAD(Buffer.from(context));
    decipher.setAuthTag(tag);
    const body = Buffer.from(bodyPart, 'base64url');
    return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
  } catch (cause) {
    throw new AuthCoreError('INVALID_SEALED_SECRET', 'The sealed secret failed to open.', {
      cause,
    });
  }
}
