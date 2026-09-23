import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { buildDailyDigest } from '@/server/alerts/digest';
import { OVER_LIMIT_CAP, overLimitSection, type OverLimitRow } from '@/server/alerts/over-limit';

/** N-10: the digest's «Negocios sobre su límite», which replaced its placeholder. */
const NOW = new Date('2026-09-23T14:00:00.000Z');
const URL = 'https://admin.xangarro.mx';
const row = (over: Partial<OverLimitRow>): OverLimitRow => ({
  nombre: 'Taquería Don Pedro',
  plan: 'Xangarrito',
  percent: 112,
  twoMonths: false,
  ...over,
});

describe('over-limit section', () => {
  it('lists the worst first, marks two months running, and links /uso', () => {
    const s = overLimitSection(
      {
        status: 'ok',
        partial: false,
        rows: [
          row({ nombre: 'B', percent: 104 }),
          row({ nombre: 'A', percent: 150, twoMonths: true }),
        ],
      },
      URL,
    );
    assert.equal(s.title, 'Negocios sobre su límite: 2');
    assert.deepEqual(s.lines, [
      'A · Xangarrito · 150 % · 2 meses seguidos',
      'B · Xangarrito · 104 %',
    ]);
    assert.match(s.note ?? '', /\/uso\?filtro=sobre/);
  });

  it('caps the list and says when the scan stopped early', () => {
    const rows = Array.from({ length: OVER_LIMIT_CAP + 3 }, (_, i) => row({ nombre: `N${i}` }));
    assert.equal(
      overLimitSection({ status: 'ok', partial: false, rows }, URL).lines.at(-1),
      'y 3 más',
    );
    const partial = overLimitSection({ status: 'ok', partial: true, rows: rows.slice(0, 2) }, URL);
    assert.equal(partial.title, 'Negocios sobre su límite: 2+');
    assert.equal(partial.lines.at(-1), 'y posiblemente más');
  });

  it('says «no disponible» when usage could not be read, and nothing when all is well', () => {
    assert.match(overLimitSection({ status: 'unavailable' }, URL).empty, /No disponible/);
    const none = overLimitSection({ status: 'ok', partial: false, rows: [] }, URL);
    assert.equal(none.lines.length, 0);
    assert.equal(none.note, undefined);
  });
});

describe('the digest with the section', () => {
  it('counts over-limit tenants in the subject and renders them in both parts', () => {
    const d = buildDailyDigest([], NOW, {
      consoleUrl: URL,
      overLimit: { status: 'ok', partial: false, rows: [row({})] },
    });
    assert.equal(d.counts.sobreLimite, 1);
    assert.match(d.subject, /1 sobre su límite/);
    assert.match(d.text, /Taquería Don Pedro · Xangarrito · 112 %/);
    assert.match(d.html, /Negocios sobre su límite: 1/);
    assert.doesNotMatch(d.text, /Pendiente: esta sección llega/);
  });

  it('still goes out, saying so, when usage is unavailable', () => {
    const d = buildDailyDigest([], NOW, { consoleUrl: URL });
    assert.equal(d.counts.sobreLimite, null);
    assert.match(d.text, /No disponible: no se pudo leer el uso del mes/);
  });
});
