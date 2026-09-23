import type { Diagnostics } from './login-message';

/**
 * Why a sign-in died before it could reach a verdict.
 *
 * `loginRefusalMessage` answers "we refused you"; this answers "we never got
 * to ask". A missing `ADMIN_TOTP_KEY` or a `DATABASE_URL` the database
 * rejects is nobody's typo, and the form has no way to recover from it — so
 * it is worth its own banner instead of an unhandled throw and Next's
 * generic error page (which redacts the cause in production anyway).
 */
export type InfraCause =
  | 'migration-missing'
  | 'totp-key'
  | 'db-credentials'
  | 'db-unreachable'
  | 'db-missing'
  | 'unknown';

export interface InfraFailure {
  readonly cause: InfraCause;
  /** The code that identified it (`28P01`, `INVALID_KEY`), or the error's name. */
  readonly detail: string;
}

/**
 * SQLSTATEs and Node connection codes worth telling apart. `28P01` (bad
 * password) and `ENOTFOUND` (wrong host) both read as "the database is
 * broken" from the outside, and the fix for each is a different variable.
 */
const CODES_BY_CAUSE = {
  // 42883 undefined_function, 42P01 undefined_table: a deployment that shipped
  // before `db:migrate:hosted` ran. Worth its own cause because the symptom is
  // an empty screen, which reads as "no data" rather than "not installed".
  'migration-missing': ['42883', '42P01'],
  'totp-key': ['INVALID_KEY'],
  'db-credentials': ['28P01', '28000'],
  'db-missing': ['3D000'],
  'db-unreachable': ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN'],
} as const satisfies Record<Exclude<InfraCause, 'unknown'>, readonly string[]>;

function causeOf(code: string): InfraCause | undefined {
  for (const [cause, codes] of Object.entries(CODES_BY_CAUSE)) {
    if ((codes as readonly string[]).includes(code)) return cause as InfraCause;
  }
  return undefined;
}

/** Drivers wrap: `postgres` reports the SQLSTATE on the `cause` of its own Error. */
const MAX_CAUSE_DEPTH = 5;

function* codesOf(error: unknown): Generator<string> {
  let current = error;
  for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth += 1) {
    if (current === null || typeof current !== 'object') return;
    const { code, cause } = current as { code?: unknown; cause?: unknown };
    if (typeof code === 'string') yield code;
    if (cause === current) return;
    current = cause;
  }
}

/** The error's name only: its message can quote query text and parameters. */
function nameOf(error: unknown): string {
  return error instanceof Error ? error.name : 'unknown';
}

export function classifyInfraFailure(error: unknown): InfraFailure {
  for (const code of codesOf(error)) {
    const cause = causeOf(code);
    if (cause !== undefined) return { cause, detail: code };
  }
  return { cause: 'unknown', detail: nameOf(error) };
}

const GENERIC = 'El servicio no está disponible. Intenta más tarde.';

/**
 * Off (production): the same sentence for every cause — which variable is
 * wrong is not something a login page tells the public. On
 * (`ADMIN_DIAGNOSTICS=1`, dev phase only): the variable to fix and the
 * database consulted, the pair that makes a misconfigured deployment
 * obvious. The full error is logged server-side either way.
 */
export function infraFailureMessage(failure: InfraFailure, diag: Diagnostics): string {
  if (!diag.on) return GENERIC;
  switch (failure.cause) {
    case 'migration-missing':
      return `Configuración: faltan migraciones en ${diag.db} — corre \`pnpm --filter @xangarro/data-pg db:migrate:hosted\` (${failure.detail}).`;
    case 'totp-key':
      return 'Configuración: ADMIN_TOTP_KEY falta o no es una llave de 32 bytes en base64.';
    case 'db-credentials':
      return `Configuración: ${diag.db} rechazó las credenciales — revisa DATABASE_URL.`;
    case 'db-unreachable':
      return `Configuración: no hay conexión con ${diag.db} (${failure.detail}).`;
    case 'db-missing':
      return `Configuración: la base de datos ${diag.db} no existe.`;
    default:
      return `${GENERIC} Error inesperado (${failure.detail}); revisa los logs del servidor.`;
  }
}
