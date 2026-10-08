/**
 * Migration error types — typed errors for the migration runner.
 *
 * {@link MigrationError} wraps a per-migration failure so the caller
 * knows which tag crashed and can log / surface it.
 *
 * {@link SchemaVersionError} is thrown when the database schema version
 * is ahead of the app version — the user needs to update the app.
 */

/**
 * The driver's own message plus its innermost cause. Drizzle wraps the native
 * error («Failed to run the query …»), so without the chain the real SQLite
 * reason (locked table, missing table) never reaches the log.
 */
function describeCause(cause: unknown): string {
  if (!(cause instanceof Error)) return String(cause);
  let root: unknown = cause;
  for (let i = 0; i < 5 && root instanceof Error && root.cause !== undefined; i++)
    root = root.cause;
  if (root === cause) return cause.message;
  return `${cause.message} (${root instanceof Error ? root.message : String(root)})`;
}

export class MigrationError extends Error {
  readonly migrationTag: string;
  override readonly cause: unknown;

  constructor(tag: string, cause: unknown) {
    super(`Migration '${tag}' failed: ${describeCause(cause)}`);
    this.name = 'MigrationError';
    this.migrationTag = tag;
    this.cause = cause;
  }
}

export class SchemaVersionError extends Error {
  readonly dbVersion: number;
  readonly appVersion: number;

  constructor(dbVersion: number, appVersion: number) {
    super(
      `Database is at schema version ${dbVersion} but this app only supports version ${appVersion}. Please update the app.`,
    );
    this.name = 'SchemaVersionError';
    this.dbVersion = dbVersion;
    this.appVersion = appVersion;
  }
}
