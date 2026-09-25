import 'server-only';

import { reportError } from './observability/report';

/**
 * The one way a server action turns its failure into what the owner reads.
 *
 * An expected refusal carries a `code` and a Spanish sentence already written
 * for a person — a role `requireMember` refused, a domain rule, a malformed
 * amount. It is the owner's to fix, not an incident: shown as it is (or in the
 * action's own `copy`) and never reported. A schema refusal (a ZodError) is
 * named by its field, when the action says how.
 *
 * Anything else is a bug or an outage. It goes to `reportError` and the owner
 * gets the action's retry line — never the error's own text, which for a
 * database failure is the database's words, and for a TypeError is a bug's.
 */
export type Failure = { ok: false; message: string };

export interface FailurePolicy {
  /**
   * Codes whose message is written for the owner; `'SALDOS_*'` matches a
   * prefix. `NOT_PERMITTED` and a `refusal()` are always shown.
   */
  readonly shown?: readonly string[];
  /** Per-code copy where the error's own message is written for logs, not people. */
  readonly copy?: Readonly<Record<string, string>>;
  /** A schema refusal, by the first field at fault. Without it, a ZodError is an incident. */
  readonly invalid?: (field: string) => string;
  /** What an incident shows. */
  readonly retry?: string;
  /** Tags the report; undefined when the failure came before the session was read. */
  readonly businessId?: string | undefined;
}

export const RETRY = 'No pudimos guardar. Intenta de nuevo.';

/** `requireMember`'s refusal: a sentence about the member's role, every action's. */
const ALWAYS_SHOWN = ['NOT_PERMITTED'] as const;

class Refusal extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'Refusal';
  }
}

/**
 * An action's own refusal — a sentence for the owner, with the code that
 * keeps `failure` from reporting it. Throw it where the refusal is found, deep
 * in a transaction, and the action's catch shows it without being told to.
 */
export function refusal(code: string, message: string): Error {
  return new Refusal(code, message);
}

function shownCode(error: unknown, shown: readonly string[]): string | undefined {
  if (!(error instanceof Error)) return undefined;
  const code = (error as { code?: unknown }).code;
  if (typeof code !== 'string') return undefined;
  if (error instanceof Refusal) return code;
  const matches = (s: string) => (s.endsWith('*') ? code.startsWith(s.slice(0, -1)) : code === s);
  return [...ALWAYS_SHOWN, ...shown].some(matches) ? code : undefined;
}

type SchemaRefusal = { name?: unknown; issues?: readonly { path?: readonly unknown[] }[] };

/** A ZodError's first field at fault (`''` for the object itself); undefined for anything else. */
function schemaField(error: unknown): string | undefined {
  const schema = (error ?? {}) as SchemaRefusal;
  if (schema.name !== 'ZodError') return undefined;
  return String(schema.issues?.[0]?.path?.[0] ?? '');
}

export function failure(error: unknown, endpoint: string, policy: FailurePolicy = {}): Failure {
  const code = shownCode(error, policy.shown ?? []);
  if (code !== undefined) {
    return { ok: false, message: policy.copy?.[code] ?? (error as Error).message };
  }
  const field = schemaField(error);
  if (policy.invalid !== undefined && field !== undefined) {
    return { ok: false, message: policy.invalid(field) };
  }
  const { businessId } = policy;
  reportError(error, { endpoint, ...(businessId === undefined ? {} : { businessId }) });
  return { ok: false, message: policy.retry ?? RETRY };
}
