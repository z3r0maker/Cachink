import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { diaSiguiente, fechaEnDias } from '../src/queries/rango-fechas';

/** The exclusive upper bound behind every sargable day range (DB2-QRY-04). */
describe('diaSiguiente', () => {
  it('crosses months, leap days and years', () => {
    assert.equal(diaSiguiente('2026-05-31'), '2026-06-01');
    assert.equal(diaSiguiente('2028-02-28'), '2028-02-29');
    assert.equal(diaSiguiente('2026-12-31'), '2027-01-01');
  });

  it('has no bound after the last representable day', () => {
    assert.equal(diaSiguiente('9999-12-31'), null);
  });

  it('refuses what is not a day', () => {
    assert.throws(() => diaSiguiente('2026-05-31T10:00:00Z'), TypeError);
    assert.throws(() => diaSiguiente(''), TypeError);
    assert.throws(() => diaSiguiente('31/05/2026'), TypeError);
  });
});

describe('fechaEnDias', () => {
  const render = (q: ReturnType<typeof fechaEnDias>) => new PgDialect().sqlToQuery(q);

  it('compares the bare column, so an index can serve it', () => {
    const q = render(fechaEnDias(sql`s.fecha`, '2026-05-01', '2026-05-31'));
    assert.equal(q.sql, 's.fecha >= $1 AND s.fecha < $2');
    assert.deepEqual(q.params, ['2026-05-01', '2026-06-01']);
    assert.doesNotMatch(q.sql, /left\(/);
  });

  it('leaves an absent side open', () => {
    assert.equal(render(fechaEnDias(sql`f`, '2026-05-01')).sql, 'f >= $1');
    assert.equal(render(fechaEnDias(sql`f`, null, '2026-05-31')).sql, 'f < $1');
    assert.equal(render(fechaEnDias(sql`f`)).sql, 'true');
    assert.equal(render(fechaEnDias(sql`f`, '0000-01-01', '9999-12-31')).sql, 'f >= $1');
  });

  it('refuses a malformed start too', () => {
    assert.throws(() => fechaEnDias(sql`f`, 'ayer', '2026-05-31'), TypeError);
  });
});
