import { createHash } from 'node:crypto';

/**
 * Throttling (ADR-079), without the storage. The counters live wherever a
 * `ThrottleStore` puts them — in production `xangarro.throttle` through
 * `@xangarro/data-pg`'s SECURITY DEFINER wrappers; in tests, memory.
 *
 * Every store call returns **seconds to wait**; 0 means go.
 */
export interface FailurePolicy {
  readonly max: number;
  /** Seconds the failures are counted over. */
  readonly window: number;
  /** Seconds the key is locked once `max` is reached. */
  readonly lockout: number;
}

/** The port. `@xangarro/data-pg`'s `throttleStore(db)` is the Postgres adapter. */
export interface ThrottleStore {
  wait(key: string): Promise<number>;
  fail(key: string, policy: FailurePolicy): Promise<number>;
  clear(key: string): Promise<void>;
}

/**
 * The stored key: SHA-256 of the parts joined by `:`, so the table never holds
 * an email or an IP — only `sha256("login:email:…")`. Callers prefix their
 * area (`throttleKey('admin', 'login', …)`) so apps sharing one table never
 * share a counter.
 */
export const throttleKey = (...parts: readonly string[]): string =>
  createHash('sha256').update(parts.join(':')).digest('hex');

export interface ThrottleSubject {
  readonly key: string;
  readonly policy: FailurePolicy;
  /**
   * Forget this subject's failures after a success. True for the account
   * itself; false for an IP, which may be shared by someone still guessing.
   */
  readonly clearOnSuccess: boolean;
}

export type Guarded<T> =
  | { readonly kind: 'ok'; readonly value: T }
  | { readonly kind: 'failed' }
  | { readonly kind: 'locked'; readonly wait: number };

async function longestWait(store: ThrottleStore, subjects: readonly ThrottleSubject[]) {
  const waits = await Promise.all(subjects.map((s) => store.wait(s.key)));
  return Math.max(0, ...waits);
}

/**
 * The sign-in shape the portal uses, as one function: refuse while any
 * subject is locked (before the credential is even checked), count a failure
 * against every subject, clear the account's counter on success.
 * `attempt` returns null for a wrong credential.
 */
export async function guardAttempt<T>(
  store: ThrottleStore,
  subjects: readonly ThrottleSubject[],
  attempt: () => Promise<T | null>,
): Promise<Guarded<T>> {
  const wait = await longestWait(store, subjects);
  if (wait > 0) return { kind: 'locked', wait };

  const value = await attempt();
  if (value === null) {
    const locks = await Promise.all(subjects.map((s) => store.fail(s.key, s.policy)));
    const locked = Math.max(0, ...locks);
    return locked > 0 ? { kind: 'locked', wait: locked } : { kind: 'failed' };
  }
  await Promise.all(subjects.filter((s) => s.clearOnSuccess).map((s) => store.clear(s.key)));
  return { kind: 'ok', value };
}
