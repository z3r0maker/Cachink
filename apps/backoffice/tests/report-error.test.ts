import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { DrizzleQueryError } from 'drizzle-orm/errors';
import { afterEach, describe, it, vi } from 'vitest';

import { reportError } from '@/server/observability/report';

/**
 * The console's failure line (audit F-14). It used to be `console.error(label,
 * error)` at each call site, which prints the whole object: for a failed query
 * that is the SQL, its bound parameters and Postgres' `detail`, in the
 * runtime logs. One reporter now, on the rule the portal's uses
 * (`@xangarro/config/error-report`).
 */
const line = vi.spyOn(console, 'error').mockImplementation(() => undefined);
afterEach(() => line.mockClear());

const logged = () => {
  assert.equal(line.mock.calls.length, 1, 'one line per failure');
  assert.equal(line.mock.calls[0]?.length, 1, 'a string, never the error object beside it');
  return JSON.parse(String(line.mock.calls[0]?.[0])) as Record<string, unknown>;
};

const failedQuery = () =>
  new DrizzleQueryError(
    'update "staff" set "totp_secret" = $1 where "email" = $2',
    ['JBSWY3DPEHPK3PXP', 'lupita@xangarro.mx'],
    Object.assign(new Error('value too long for type character varying(16)'), {
      name: 'PostgresError',
      code: '22001',
      severity: 'ERROR',
      detail: 'Failing row contains (lupita@xangarro.mx, JBSWY3DPEHPK3PXP).',
      table_name: 'staff',
      column_name: 'totp_secret',
    }),
  );

describe('reportError', () => {
  it('a failed query: where, the SQLSTATE and the names; never the SQL, a parameter or the row', () => {
    reportError(failedQuery(), 'cambiarFlag');
    const text = String(line.mock.calls[0]?.[0]);
    const { stack, ...rest } = logged();
    assert.deepEqual(rest, {
      evt: 'error',
      where: 'cambiarFlag',
      name: 'DatabaseError',
      code: '22001',
      table: 'staff',
      column: 'totp_secret',
    });
    assert.ok(Array.isArray(stack) && stack.length > 0, 'the frames still say where it broke');
    assert.doesNotMatch(text, /lupita|JBSWY|update "staff"|Failing row|params/);
  });

  it('any other failure keeps its message', () => {
    reportError(Object.assign(new Error('fetch failed'), { code: 'ECONNRESET' }), '[sat]');
    const { stack: _stack, ...rest } = logged();
    assert.deepEqual(rest, {
      evt: 'error',
      where: '[sat]',
      name: 'Error',
      message: 'fetch failed',
      code: 'ECONNRESET',
    });
  });

  it('a thrown value that is not an error still makes a line', () => {
    reportError('boom', 'inicio');
    assert.deepEqual(logged(), {
      evt: 'error',
      where: 'inicio',
      name: 'string',
      message: 'boom',
      stack: [],
    });
  });
});

describe('no call site prints an error object', () => {
  const SRC = path.resolve(import.meta.dirname, '../src');
  /** `console.error('label', error)`: a second argument is the object, printed whole. */
  const RAW = /console\.(?:error|warn|log)\((?:[^()]|\([^()]*\))*,\s*(?:error|err|e|cause)\s*\)/;

  /** The reporter itself, whose comment quotes the line it replaced. */
  const REPORTER = path.join('server', 'observability', 'report.ts');

  it('holds for every source file of the console', () => {
    const offenders = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
      .filter((file) => /\.tsx?$/.test(file) && file !== REPORTER)
      .filter((file) => RAW.test(readFileSync(path.join(SRC, file), 'utf8')));
    assert.deepEqual(offenders, [], 'use reportError from @/server/observability/report');
  });

  it('the rule catches what it guards against', () => {
    assert.equal(RAW.test("console.error('aplicarAjuste failed', error);"), true);
    assert.equal(RAW.test('console.error(`[mfa:${step}] infra ${f.cause}`, error);'), true);
    assert.equal(RAW.test('console.error(`[login] ${result.kind} ip=${ip}`);'), false);
    assert.equal(RAW.test('console.error(JSON.stringify({ evt: "error" }));'), false);
  });
});
