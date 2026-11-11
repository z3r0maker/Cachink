import type { ThrottleStore } from '@xangarro/auth-core';
import type {
  LinkKind,
  LinkPeek,
  PortalSecondFactorRepo,
  SecondFactorStatus,
} from '@xangarro/data-pg';

/**
 * What the portal's access use cases need from the outside world (N-83,
 * ADR-142): confirming a new address, the second factor, and the re-ask. The
 * Postgres and cookie adapters are in `live.ts`; tests use
 * `tests/acceso/mundo.ts`. The use cases themselves are pure over these, like
 * the console's (`apps/backoffice/src/server/auth`).
 */
export interface AccessLinks {
  /** A fresh token for `email`'s account, or null when no account has that address. */
  issue(email: string, kind: LinkKind, ttlSeconds: number): Promise<string | null>;
  /** What a link is now, without spending it. */
  peek(token: string, kind: LinkKind): Promise<LinkPeek | null>;
  consume(token: string, kind: 'magic' | 'challenge'): Promise<string | null>;
  /** Spend a `confirm` link and stamp the address; the account's id, or null. */
  confirm(token: string): Promise<string | null>;
}

export interface AccessAccounts {
  /** Null when there is no such account. */
  confirmed(userId: string): Promise<boolean | null>;
  /** Confirm by possession of the inbox: the password and sessions of whoever registered go. */
  claim(userId: string, keepPassword: boolean): Promise<boolean>;
  changeEmail(userId: string, email: string): Promise<boolean>;
  /** The account, if the password is its. */
  passwordMatches(
    email: string,
    password: string,
  ): Promise<{ readonly id: string; readonly email: string } | null>;
  /** The account's first business, for the emails' wording; null when it has none. */
  negocio(userId: string): Promise<{ readonly id: string; readonly nombre: string } | null>;
}

export interface AccessMail {
  confirmacion(m: {
    readonly to: string;
    readonly token: string;
    readonly nombre: string | null;
    readonly negocio: string;
  }): Promise<void>;
  bienvenida(m: {
    readonly to: string;
    readonly nombre: string | null;
    readonly negocio: string;
    readonly businessId: string;
  }): Promise<void>;
}

/** The browser's portal session. */
export interface AccessSessions {
  /** Open it on the account's first business; false when the account has none. */
  open(userId: string): Promise<boolean>;
  /** Stamp it as having just proven the second factor. */
  stepUp(): Promise<void>;
  /** Whether that proof is younger than `windowSeconds`. */
  steppedUp(windowSeconds: number): Promise<boolean>;
}

export interface AccessFactor extends PortalSecondFactorRepo {
  status(userId: string): Promise<SecondFactorStatus | null>;
}

export interface AccessDeps {
  readonly accounts: AccessAccounts;
  readonly links: AccessLinks;
  readonly mail: AccessMail;
  readonly sessions: AccessSessions;
  readonly factor: AccessFactor;
  readonly throttle: ThrottleStore;
  /** A fixed-window allowance (`xangarro.throttle_take`): 0 means go, else seconds left. */
  take(key: string, max: number, windowSeconds: number): Promise<number>;
  /** The 32-byte key that seals TOTP seeds; read only when a seed is touched. */
  totpKey(): Uint8Array;
  now(): Date;
}

/** Who a use case acts for: the session's account, or the one a link names. */
export interface Cuenta {
  readonly id: string;
  readonly email: string;
}
