/**
 * The ports and results of the passkey ceremonies (`passkey.ts`, ADR-160).
 */
export interface RelyingParty {
  /** The registrable domain the passkey is bound to (`admin.xangarro.mx`). */
  readonly id: string;
  readonly name: string;
  /** The exact origin every response must come from. */
  readonly origin: string;
}

export interface ChallengeStore {
  save(challengeHash: string, purpose: string, ttlSeconds: number): Promise<void>;
  /** True once: while unexpired, for this purpose, never again after. */
  take(challengeHash: string, purpose: string): Promise<boolean>;
}

export interface StoredPasskey<Id extends string = string> {
  readonly id: string;
  readonly ownerId: Id;
  /** COSE_Key bytes. */
  readonly publicKey: Uint8Array;
  readonly counter: number;
  readonly transports: readonly string[];
}

export interface PasskeyRepo<Id extends string = string> {
  /** A live passkey (its owner live too), or null. */
  find(credentialId: string): Promise<StoredPasskey<Id> | null>;
  /** Stores the new counter and last use; false if the passkey is gone. */
  recordUse(credentialId: string, counter: number): Promise<boolean>;
}

export interface PasskeyDeps<Id extends string = string> {
  readonly rp: RelyingParty;
  readonly challenges: ChallengeStore;
  readonly passkeys: PasskeyRepo<Id>;
}

export interface PasskeyRef {
  readonly id: string;
  readonly transports?: readonly string[];
}

/** What a registration hands the app to store. */
export interface NewPasskey extends PasskeyRef {
  readonly publicKey: Uint8Array;
  readonly counter: number;
  readonly transports: readonly string[];
  readonly aaguid: string;
  /** Synced (iCloud Keychain, Google Password Manager) rather than bound to one device. */
  readonly backedUp: boolean;
}

export type RegistrationResult =
  | { readonly ok: true; readonly passkey: NewPasskey }
  | { readonly ok: false; readonly reason: 'challenge' | 'invalid' };

export type AssertionResult<Id extends string = string> =
  | { readonly ok: true; readonly ownerId: Id; readonly credentialId: string }
  | { readonly ok: false; readonly reason: 'challenge' | 'invalid' | 'unknown' }
  | {
      readonly ok: false;
      readonly reason: 'counter';
      readonly ownerId: Id;
      readonly credentialId: string;
    };

/** The wire shapes, re-exported so the apps never import the library directly. */
export type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
