import assert from 'node:assert/strict';
import { DrizzleQueryError } from 'drizzle-orm/errors';
import { describe, it } from 'vitest';

import {
  databaseSummary,
  describeError,
  isDatabaseError,
  redactError,
  stackFrames,
} from '@xangarro/config/error-report';

/**
 * What a failure may say in a log line or to a third party (audit F-14).
 *
 * A failed query is the dangerous one: Drizzle's message is the SQL and its
 * bound parameters, and Postgres' `detail` quotes the row. So a database
 * error is described by its name, SQLSTATE and the names of the constraint,
 * table and column, and by nothing a user typed.
 */
const EMAIL = 'pedro@taqueria.mx';
const HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMye';

/** A unique violation, as postgres.js raises it. */
const duplicate = () =>
  Object.assign(new Error('duplicate key value violates unique constraint "users_email_key"'), {
    name: 'PostgresError',
    code: '23505',
    severity: 'ERROR',
    detail: `Key (email)=(${EMAIL}) already exists.`,
    schema_name: 'auth',
    table_name: 'users',
    constraint_name: 'users_email_key',
    routine: '_bt_check_unique',
  });

/** The same failure as Drizzle hands it to the caller. */
const failedQuery = () =>
  new DrizzleQueryError(
    'insert into "auth"."users" ("email", "encrypted_password") values ($1, $2)',
    [EMAIL, HASH],
    duplicate(),
  );

const leaks = (value: unknown) =>
  /pedro|taqueria|\$2b\$|insert into|Key \(email\)|params/i.test(JSON.stringify(value));

describe('describeError — a database error', () => {
  it('keeps the SQLSTATE and the names, and drops the SQL, the parameters and the detail', () => {
    const d = describeError(failedQuery());
    assert.deepEqual(d, {
      name: 'DatabaseError',
      code: '23505',
      constraint: 'users_email_key',
      table: 'users',
      schema: 'auth',
    });
    assert.equal(leaks(d), false);
  });

  it('drops a driver message too: Postgres quotes the value it could not read', () => {
    const bad = Object.assign(new Error(`invalid input syntax for type uuid: "${EMAIL}"`), {
      name: 'PostgresError',
      code: '22P02',
      severity: 'ERROR',
      routine: 'string_to_uuid',
    });
    assert.deepEqual(describeError(bad), { name: 'PostgresError', code: '22P02' });
  });

  it('names the column of a not-null violation', () => {
    const missing = Object.assign(new Error('null value in column "nombre" violates not-null'), {
      name: 'PostgresError',
      code: '23502',
      severity: 'ERROR',
      table_name: 'products',
      column_name: 'nombre',
      detail: `Failing row contains (01H, null, ${EMAIL}).`,
    });
    assert.deepEqual(describeError(missing), {
      name: 'PostgresError',
      code: '23502',
      table: 'products',
      column: 'nombre',
    });
  });

  it('is still a database error under a wrapper, whose own words are dropped with it', () => {
    const wrapped = new Error(`could not create the account of ${EMAIL}`, { cause: failedQuery() });
    assert.equal(isDatabaseError(wrapped), true);
    const d = describeError(wrapped);
    assert.equal(d.message, undefined);
    assert.equal(d.code, '23505');
    assert.equal(leaks(d), false);
  });

  it('ignores a name that is not one: only an identifier is copied', () => {
    const odd = Object.assign(duplicate(), { constraint_name: `x"; ${EMAIL}`, table_name: 42 });
    const d = describeError(odd);
    assert.equal(d.constraint, undefined);
    assert.equal(d.table, undefined);
    assert.equal(leaks(d), false);
  });

  it('recognises a query wrapper by its shape, whatever a bundler renamed its class to', () => {
    const minified = Object.assign(new Error(`Failed query: select 1\nparams: ${EMAIL}`), {
      query: 'select 1',
      params: [EMAIL],
    });
    assert.equal(isDatabaseError(minified), true);
    assert.equal(leaks(describeError(minified)), false);
  });
});

describe('describeError — anything else keeps its message', () => {
  it('a coded domain error', () => {
    const refusal = Object.assign(new Error('Los saldos ya están bloqueados.'), {
      name: 'SaldosError',
      code: 'SALDOS_BLOQUEADOS',
    });
    assert.deepEqual(describeError(refusal), {
      name: 'SaldosError',
      message: 'Los saldos ya están bloqueados.',
      code: 'SALDOS_BLOQUEADOS',
    });
  });

  it('a network failure whose five-letter code only looks like a SQLSTATE', () => {
    const pipe = Object.assign(new Error('write EPIPE'), { code: 'EPIPE' });
    assert.equal(isDatabaseError(pipe), false);
    assert.deepEqual(describeError(pipe), { name: 'Error', message: 'write EPIPE', code: 'EPIPE' });
  });

  it('a code that sits on the cause', () => {
    const outer = new Error('fetch failed', { cause: { code: 'ECONNREFUSED' } });
    assert.equal(describeError(outer).code, 'ECONNREFUSED');
  });

  it('a thrown value that is not an error at all', () => {
    assert.deepEqual(describeError('boom'), { name: 'string', message: 'boom' });
    assert.deepEqual(describeError(undefined), { name: 'undefined', message: 'undefined' });
    assert.deepEqual(describeError(null), { name: 'object', message: 'null' });
  });

  it('a cause chain that loops on itself', () => {
    const a: Error & { cause?: unknown } = new Error('a');
    a.cause = a;
    assert.equal(describeError(a).message, 'a');
  });
});

describe('redactError — what may be handed to a third party', () => {
  it('a database error becomes a copy that says only the summary, with its frames', () => {
    const original = failedQuery();
    const safe = redactError(original) as Error & { code?: string };
    assert.notEqual(safe, original);
    assert.equal(safe.name, 'DatabaseError');
    assert.equal(
      safe.message,
      'database error 23505 constraint=users_email_key table=users schema=auth',
    );
    assert.equal(safe.message, databaseSummary(original));
    assert.equal(safe.code, '23505');
    assert.equal(leaks([safe.message, safe.stack, { ...safe }]), false);
    assert.match(safe.stack ?? '', /^DatabaseError: database error 23505[^\n]*\n\s+at /);
    assert.equal((safe as { cause?: unknown }).cause, undefined);
  });

  it('describing the copy says what describing the original did', () => {
    const original = failedQuery();
    const safe = redactError(original);
    assert.deepEqual(describeError(safe), describeError(original));
    assert.equal(databaseSummary(safe), databaseSummary(original));
    assert.equal(redactError(safe) === safe, false, 'still a database error, redacted again');
    assert.deepEqual(describeError(redactError(safe)), describeError(original));
  });

  it('anything else is handed over as it is', () => {
    const plain = new Error('forced');
    assert.equal(redactError(plain), plain);
    assert.equal(redactError('boom'), 'boom');
  });

  it('stackFrames keeps the frames and never the message, however many lines it runs', () => {
    const frames = stackFrames(failedQuery());
    assert.ok(frames.length > 0);
    assert.equal(
      frames.every((line) => /^\s+at /.test(line)),
      true,
    );
    assert.equal(leaks(frames), false);
    assert.deepEqual(stackFrames('boom'), []);
  });
});
