/**
 * The ports of self-service account deletion (ADR-136). The portal implements
 * them over the `xangarro.account_*` definer functions, the account's password
 * check and the email sender; the tests use fakes. Times are ISO-8601.
 */

export interface DeletionRequested {
  readonly folio: string;
  readonly eraseAt: string;
  readonly businessIds: readonly string[];
  /** The undo link's token: it goes into the confirmation email and nowhere else. */
  readonly undoToken: string;
}

export interface DeletionView {
  readonly folio: string;
  readonly email: string;
  readonly eraseAt: string;
  readonly negocios: readonly string[];
  readonly estado: 'pendiente' | 'vencido';
}

export interface DeletionUndone {
  readonly folio: string;
  readonly userId: string;
  readonly businessIds: readonly string[];
  readonly stoppedRenewals: readonly string[];
}

export interface OpenDeletion {
  readonly folio: string;
  readonly email: string;
  readonly businessIds: readonly string[];
  readonly negocios: readonly string[];
  readonly stoppedRenewals: readonly string[];
  readonly eraseAt: string;
  readonly reminded: boolean;
}

export interface AccountDeletionStore {
  /** Close every business the account owns and record the folio. */
  request(input: {
    readonly userId: string;
    readonly email: string;
    readonly stoppedRenewals: readonly string[];
    readonly days: number;
  }): Promise<DeletionRequested>;
  peek(token: string): Promise<DeletionView | null>;
  /** Reopen the businesses, once, while the days last; `null` otherwise. */
  undo(token: string): Promise<DeletionUndone | null>;
  /** Open requests whose erase day is at or before `until`. */
  open(until: string): Promise<readonly OpenDeletion[]>;
  /** Record the reminder with a link of its own: its token, or `null` if already reminded. */
  markReminded(folio: string): Promise<string | null>;
  /** Erase a due request; returns until when its billing rows stay blocked. */
  erase(folio: string): Promise<string>;
}

export interface OwnedBusiness {
  readonly id: string;
  readonly nombre: string;
}

export interface AccountDirectory {
  /** Whether `password` is this account's. */
  passwordMatches(email: string, password: string): Promise<boolean>;
  /** The businesses the account owns, open ones only. */
  ownedBusinesses(userId: string): Promise<readonly OwnedBusiness[]>;
}

export interface DeletionEmail {
  readonly email: string;
  readonly folio: string;
  readonly negocios: readonly string[];
  readonly eraseAt: string;
}

/** The three emails of the flow; each implementation reports its own failures. */
export interface DeletionNotices {
  requested(
    n: DeletionEmail & { readonly requestedAt: string; readonly undoToken: string },
  ): Promise<void>;
  reminder(n: DeletionEmail & { readonly undoToken: string }): Promise<void>;
  erased(n: DeletionEmail & { readonly blockedUntil: string }): Promise<void>;
}
