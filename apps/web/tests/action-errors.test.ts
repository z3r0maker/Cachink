import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';
import { z } from 'zod';

/**
 * The one mapping from a server action's failure to what the owner reads.
 * Every action rests on it, so its two promises are pinned here: a refusal
 * written for a person is shown and never reported; anything else is
 * reported and never shown in its own words.
 */

const reportError = vi.fn();
vi.mock('../src/server/observability/report', () => ({ reportError }));

const { failure, refusal, RETRY } = await import('../src/server/action-errors');

const coded = (code: string, message: string) => Object.assign(new Error(message), { code });

/** A real schema refusal: `precio` is not a number. */
const zodError = (): unknown => {
  const r = z.object({ precio: z.number() }).safeParse({ precio: 'diez' });
  assert.equal(r.success, false);
  return r.error;
};

beforeEach(() => {
  reportError.mockClear();
});

describe('failure — the owner’s to fix: shown, not reported', () => {
  it('shows a listed code in its own words', () => {
    const r = failure(coded('OPERATOR_LIMIT', 'Tu plan incluye 2 operadores.'), 'crearOperador', {
      shown: ['OPERATOR_LIMIT'],
    });
    assert.deepEqual(r, { ok: false, message: 'Tu plan incluye 2 operadores.' });
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('shows NOT_PERMITTED for every action, listed or not', () => {
    const r = failure(coded('NOT_PERMITTED', 'Solo el dueño puede hacer esto.'), 'cualquiera');
    assert.deepEqual(r, { ok: false, message: 'Solo el dueño puede hacer esto.' });
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('matches a `PREFIX_*` entry by prefix', () => {
    const r = failure(coded('SALDOS_BLOQUEADOS', 'Los saldos ya están bloqueados.'), 'saldos', {
      shown: ['SALDOS_*'],
    });
    assert.equal(r.message, 'Los saldos ya están bloqueados.');
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('prefers the action’s copy for a code whose message is written for logs', () => {
    const r = failure(coded('INVALID_WIZARD_ANSWERS', 'answers.giro: expected enum'), 'paso', {
      shown: ['INVALID_WIZARD_ANSWERS'],
      copy: { INVALID_WIZARD_ANSWERS: 'Revisa tu respuesta.' },
    });
    assert.equal(r.message, 'Revisa tu respuesta.');
  });

  it('shows a refusal() without being told to', () => {
    const r = failure(refusal('MONTO_INVALIDO', '«abc» no es un monto.'), 'saldos');
    assert.equal(r.message, '«abc» no es un monto.');
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('names a schema refusal by its field when the action says how', () => {
    const r = failure(zodError(), 'editarProducto', {
      invalid: (campo) => (campo === 'precio' ? 'Revisa el precio.' : 'Revisa los datos.'),
    });
    assert.deepEqual(r, { ok: false, message: 'Revisa el precio.' });
    assert.equal(reportError.mock.calls.length, 0);
  });
});

describe('failure — an incident: reported, never shown in its own words', () => {
  it('reports an uncoded Error and shows the default retry line, not its text', () => {
    const error = new Error('connect ECONNREFUSED 10.0.0.5:5432');
    const r = failure(error, 'guardarNegocio');
    assert.deepEqual(r, { ok: false, message: RETRY });
    assert.deepEqual(reportError.mock.calls, [[error, { endpoint: 'guardarNegocio' }]]);
  });

  it('reports a coded error the action did not list — a Postgres SQLSTATE is not a sentence', () => {
    const error = coded('23505', 'duplicate key value violates unique constraint "codes_pkey"');
    const r = failure(error, 'generarCodigo', { shown: ['OPERATOR_LIMIT'], retry: 'Otra vez.' });
    assert.equal(r.message, 'Otra vez.');
    assert.equal(reportError.mock.calls.length, 1);
  });

  it('does not let a prefix entry match a code merely starting with its letters', () => {
    const r = failure(coded('SALDOSX', 'interno'), 'saldos', { shown: ['SALDOS_*'] });
    assert.equal(r.message, RETRY);
    assert.equal(reportError.mock.calls.length, 1);
  });

  it('reports a TypeError — a bug, whatever its message says', () => {
    const r = failure(new TypeError("Cannot read properties of undefined (reading 'id')"), 'x', {
      shown: ['AVISO_TRANSICION'],
    });
    assert.equal(r.message, RETRY);
    assert.equal(reportError.mock.calls.length, 1);
  });

  it('reports a thrown non-Error even when it carries a listed code', () => {
    const r = failure({ code: 'NOT_PERMITTED', message: 'fingido' }, 'x');
    assert.equal(r.message, RETRY);
    assert.equal(reportError.mock.calls.length, 1);
  });

  it('reports a thrown string and a thrown null', () => {
    assert.equal(failure('boom', 'x').message, RETRY);
    assert.equal(failure(null, 'x').message, RETRY);
    assert.equal(reportError.mock.calls.length, 2);
  });

  it('reports a schema refusal the action has no words for', () => {
    const r = failure(zodError(), 'x', { retry: 'Intenta de nuevo.' });
    assert.equal(r.message, 'Intenta de nuevo.');
    assert.equal(reportError.mock.calls.length, 1);
  });

  it('tags the report with the business when the action knows it', () => {
    failure(new Error('x'), 'guardarPaso', { businessId: 'biz-1' });
    failure(new Error('y'), 'guardarPaso', { businessId: undefined });
    assert.deepEqual(reportError.mock.calls[0]?.[1], {
      endpoint: 'guardarPaso',
      businessId: 'biz-1',
    });
    assert.deepEqual(reportError.mock.calls[1]?.[1], { endpoint: 'guardarPaso' });
  });
});
