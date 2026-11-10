/**
 * The fields of a failure that are safe to write down (audit F-14). A database
 * error has no `message`: its text can quote the SQL, its parameters or a row.
 */
export interface ErrorDescription {
  readonly name: string;
  readonly message?: string;
  /** A SQLSTATE, a Node code or a domain code. */
  readonly code?: string;
  readonly constraint?: string;
  readonly table?: string;
  readonly column?: string;
  readonly schema?: string;
}
export function describeError(error: unknown): ErrorDescription;
/** True when the error, or anything in its `cause` chain, came from a database driver or query builder. */
export function isDatabaseError(error: unknown): boolean;
/** True for text that is, or quotes, a failed query. */
export function mentionsQuery(text: unknown): boolean;
/** A database error in one line: `database error 23505 constraint=users_email_key`. */
export function databaseSummary(error: unknown): string;
/** The stack's frames without its first lines, which repeat the message. */
export function stackFrames(error: unknown): string[];
/** The error to hand to a third party: itself, or a database error's redacted copy. */
export function redactError(error: unknown): unknown;
