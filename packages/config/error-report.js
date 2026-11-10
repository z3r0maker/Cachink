/**
 * What a server-side failure may say in a log line or to a third party (audit
 * F-14). One implementation for the portal and the console (CLAUDE.md §2.3).
 *
 * A failed query is the dangerous one. Drizzle's message is the SQL **and its
 * bound parameters** (`Failed query: … params: pedro@…, $2b$10$…`), Postgres'
 * `detail` quotes the row (`Key (email)=(pedro@…) already exists.`), and even
 * its primary message can quote a value (`invalid input syntax for type uuid:
 * "…"`). So a database error is described by its name, its SQLSTATE and the
 * names of the constraint, table, column and schema, and by nothing else. Any
 * other error keeps its message.
 *
 * Plain ESM with a `.d.ts` beside it, like `security.js`: both Next apps
 * already load this package at run time, and neither depends on
 * `@xangarro/observability`, where this would otherwise live.
 */

const MAX_DEPTH = 5;
/** A Postgres identifier, optionally schema-qualified: the only thing copied out of a driver error. */
const IDENTIFIER = /^[\w$.-]{1,128}$/;
const SQLSTATE = /^[0-9A-Z]{5}$/;
/** Error names the drivers and the query builder set. */
const DATABASE_NAMES = new Set([
  'PostgresError',
  'DatabaseError',
  'DrizzleError',
  'DrizzleQueryError',
  'SqliteError',
]);
/** The fields a driver names things by: postgres.js first, node-postgres second. */
const NAMED = /** @type {const} */ ([
  ['constraint', 'constraint_name'],
  ['table', 'table_name'],
  ['column', 'column_name'],
  ['schema', 'schema_name'],
]);

/** @param {unknown} value @returns {value is Record<string, unknown>} */
const isObject = (value) => typeof value === 'object' && value !== null;

/**
 * The error and its causes, outermost first, each once.
 * @param {unknown} error
 * @returns {Record<string, unknown>[]}
 */
function chain(error) {
  const links = [];
  for (let e = error; isObject(e) && links.length < MAX_DEPTH && !links.includes(e); e = e.cause) {
    links.push(e);
  }
  return links;
}

/**
 * A SQLSTATE, told apart from Node's own five-letter codes (`EPIPE`) by the
 * fields only a database server sends with one.
 * @param {Record<string, unknown>} e
 */
const hasSqlState = (e) =>
  typeof e.code === 'string' &&
  SQLSTATE.test(e.code) &&
  ['severity', 'severity_local', 'routine'].some((field) => field in e);

/**
 * A query builder's wrapper, by shape: a bundler may rename the class.
 * @param {Record<string, unknown>} e
 */
const carriesQuery = (e) =>
  typeof e.query === 'string' ||
  Array.isArray(e.params) ||
  Array.isArray(e.parameters) ||
  mentionsQuery(e.message);

/** @param {Record<string, unknown>} e */
const isDatabaseLink = (e) =>
  DATABASE_NAMES.has(String(e.name)) || hasSqlState(e) || carriesQuery(e);

/**
 * True for text that is, or quotes, a failed query.
 * @param {unknown} text
 */
export function mentionsQuery(text) {
  return typeof text === 'string' && /Failed query:|\bparams: /.test(text);
}

/**
 * True when the error, or anything in its `cause` chain, came from a database
 * driver or a query builder.
 * @param {unknown} error
 */
export function isDatabaseError(error) {
  return chain(error).some(isDatabaseLink);
}

/**
 * The first string code in the chain: a SQLSTATE, a Node code, a domain code.
 * @param {Record<string, unknown>[]} links
 */
function codeOf(links) {
  const code = links.map((e) => e.code).find((c) => typeof c === 'string');
  return typeof code === 'string' ? { code } : {};
}

/**
 * The identifiers a driver error names, and only when they are identifiers.
 * @param {Record<string, unknown>[]} links
 */
function namesOf(links) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const [key, driverKey] of NAMED) {
    const value = links.map((e) => e[driverKey] ?? e[key]).find((v) => v !== undefined);
    if (typeof value === 'string' && IDENTIFIER.test(value)) out[key] = value;
  }
  return out;
}

/**
 * The fields of a failure that are safe to write down.
 * @param {unknown} error
 */
export function describeError(error) {
  const links = chain(error);
  const outer = links[0];
  const name = typeof outer?.name === 'string' ? outer.name : typeof error;
  if (!links.some(isDatabaseLink)) {
    const message = typeof outer?.message === 'string' ? outer.message : String(error);
    return { name, message, ...codeOf(links) };
  }
  // The code is the driver's SQLSTATE when there is one, never a wrapper's own.
  const driver = links.filter(hasSqlState);
  return {
    name: name === 'Error' ? 'DatabaseError' : name,
    ...codeOf(driver.length > 0 ? driver : links),
    ...namesOf(links),
  };
}

/**
 * A database error in one line: `database error 23505 constraint=users_email_key`.
 * @param {unknown} error
 */
export function databaseSummary(error) {
  const { name: _name, message: _message, code, ...names } = describeError(error);
  const parts = Object.entries(names).map(([key, value]) => `${key}=${value}`);
  return ['database error', ...(code === undefined ? [] : [code]), ...parts].join(' ');
}

/**
 * The stack's frames without its first lines, which repeat the message.
 * @param {unknown} error
 * @returns {string[]}
 */
export function stackFrames(error) {
  const stack = isObject(error) && typeof error.stack === 'string' ? error.stack : '';
  return stack.split('\n').filter((line) => /^\s+at /.test(line));
}

/**
 * The error to hand to a third party (Sentry). A database error becomes a
 * copy that keeps the stack frames and carries exactly what `describeError`
 * says: no SQL, no parameters, no `detail`, no `cause`. Describing the copy
 * gives the same answer, so a second pass over it loses nothing. Anything
 * else is returned as it is.
 * @param {unknown} error
 */
export function redactError(error) {
  if (!isDatabaseError(error)) return error;
  const { name, message: _message, ...fields } = describeError(error);
  const safe = new Error(databaseSummary(error));
  safe.name = name;
  safe.stack = [`${name}: ${safe.message}`, ...stackFrames(error)].join('\n');
  return Object.assign(safe, fields);
}
