import { createHash, generateKeyPairSync, randomBytes, sign, type KeyObject } from 'node:crypto';

import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { isoCBOR } from '@simplewebauthn/server/helpers';

/**
 * A software authenticator for tests (ADR-160): it answers the options a
 * relying party hands out with the bytes a real platform authenticator would
 * — `none` attestation, a P-256 key, ES256 signatures over
 * `authData ‖ sha256(clientDataJSON)` — so the real verification runs on the
 * other side. Every knob a test needs to break a ceremony is an override.
 * Never imported by production code.
 */

/** iCloud Keychain's AAGUID: a synced platform passkey, the common case. */
export const ICLOUD_AAGUID = 'fbfc3007-154e-4ecc-8c0b-6e020557d7bd';

export interface SoftPasskey {
  /** Credential id, base64url. */
  readonly id: string;
  /** The `user.id` it was created for, base64url. */
  readonly userHandle: string;
  /** COSE_Key bytes: what a relying party stores. */
  readonly cosePublicKey: Uint8Array;
  /** PKCS#8, base64: what Chrome's virtual authenticator takes. */
  readonly pkcs8: string;
  readonly privateKey: KeyObject;
  counter: number;
}

export interface SoftOptions {
  readonly origin: string;
  readonly aaguid?: string;
  /** Backup-eligible and backed up (a synced passkey). Default true. */
  readonly backedUp?: boolean;
}

export interface CeremonyOverrides {
  readonly origin?: string;
  readonly challenge?: string;
  readonly userVerified?: boolean;
  /** For an assertion: the counter to report (default: one more than the last). */
  readonly counter?: number;
  readonly userHandle?: string | null;
}

const b64u = (bytes: Uint8Array | string): string => Buffer.from(bytes).toString('base64url');
const sha256 = (bytes: Uint8Array | string): Buffer => createHash('sha256').update(bytes).digest();

function u32(n: number): Buffer {
  const out = Buffer.alloc(4);
  out.writeUInt32BE(n);
  return out;
}

function flags(uv: boolean, backedUp: boolean, attested: boolean): number {
  return 0x01 | (uv ? 0x04 : 0) | (backedUp ? 0x18 : 0) | (attested ? 0x40 : 0);
}

function coseKey(publicKey: KeyObject): Uint8Array {
  const jwk = publicKey.export({ format: 'jwk' });
  const coord = (c: string | undefined) => Buffer.from(c ?? '', 'base64url');
  return isoCBOR.encode(
    new Map<number, number | Uint8Array>([
      [1, 2],
      [3, -7],
      [-1, 1],
      [-2, coord(jwk.x)],
      [-3, coord(jwk.y)],
    ]),
  );
}

/** A key pair and an id, ready to be stored or handed to a virtual authenticator. */
export function softPasskey(userHandle: string, id: string = b64u(randomBytes(16))): SoftPasskey {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const pkcs8 = privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64');
  return { id, userHandle, cosePublicKey: coseKey(publicKey), pkcs8, privateKey, counter: 0 };
}

function clientData(type: string, challenge: string, origin: string): string {
  return b64u(JSON.stringify({ type, challenge, origin, crossOrigin: false }));
}

interface Soft {
  readonly origin: string;
  readonly aaguid: Buffer;
  readonly backedUp: boolean;
}

const SHELL = {
  type: 'public-key',
  clientExtensionResults: {},
  authenticatorAttachment: 'platform',
} as const;

function attestedData(soft: Soft, passkey: SoftPasskey): Buffer {
  const idBytes = Buffer.from(passkey.id, 'base64url');
  const idLen = Buffer.alloc(2);
  idLen.writeUInt16BE(idBytes.length);
  return Buffer.concat([soft.aaguid, idLen, idBytes, Buffer.from(passkey.cosePublicKey)]);
}

function create(
  soft: Soft,
  options: PublicKeyCredentialCreationOptionsJSON,
  over: CeremonyOverrides,
): { response: RegistrationResponseJSON; passkey: SoftPasskey } {
  const passkey = softPasskey(options.user.id);
  const authData = Buffer.concat([
    sha256(options.rp.id ?? ''),
    Buffer.from([flags(over.userVerified ?? true, soft.backedUp, true)]),
    u32(0),
    attestedData(soft, passkey),
  ]);
  const attestationObject = isoCBOR.encode(
    new Map<string, string | Map<string, never> | Uint8Array>([
      ['fmt', 'none'],
      ['attStmt', new Map<string, never>()],
      ['authData', authData],
    ]),
  );
  const challenge = over.challenge ?? options.challenge;
  const response: RegistrationResponseJSON = {
    ...SHELL,
    id: passkey.id,
    rawId: passkey.id,
    response: {
      clientDataJSON: clientData('webauthn.create', challenge, over.origin ?? soft.origin),
      attestationObject: b64u(attestationObject),
      transports: ['internal', 'hybrid'],
    },
  };
  return { response, passkey };
}

function get(
  soft: Soft,
  options: PublicKeyCredentialRequestOptionsJSON,
  passkey: SoftPasskey,
  over: CeremonyOverrides,
): AuthenticationResponseJSON {
  passkey.counter = over.counter ?? passkey.counter + 1;
  const authData = Buffer.concat([
    sha256(options.rpId ?? ''),
    Buffer.from([flags(over.userVerified ?? true, soft.backedUp, false)]),
    u32(passkey.counter),
  ]);
  const challenge = over.challenge ?? options.challenge;
  const cdj = clientData('webauthn.get', challenge, over.origin ?? soft.origin);
  const signed = Buffer.concat([authData, sha256(Buffer.from(cdj, 'base64url'))]);
  const signature = sign('sha256', signed, passkey.privateKey);
  const userHandle = over.userHandle === undefined ? passkey.userHandle : over.userHandle;
  return {
    ...SHELL,
    id: passkey.id,
    rawId: passkey.id,
    response: {
      clientDataJSON: cdj,
      authenticatorData: b64u(authData),
      signature: b64u(signature),
      ...(userHandle === null ? {} : { userHandle }),
    },
  };
}

export function softAuthenticator(opts: SoftOptions) {
  const soft: Soft = {
    origin: opts.origin,
    aaguid: Buffer.from((opts.aaguid ?? ICLOUD_AAGUID).replaceAll('-', ''), 'hex'),
    backedUp: opts.backedUp ?? true,
  };
  return {
    create: (options: PublicKeyCredentialCreationOptionsJSON, over: CeremonyOverrides = {}) =>
      create(soft, options, over),
    get: (
      options: PublicKeyCredentialRequestOptionsJSON,
      passkey: SoftPasskey,
      over: CeremonyOverrides = {},
    ) => get(soft, options, passkey, over),
  };
}
