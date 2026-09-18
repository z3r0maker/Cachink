import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import type { SupportItem, SupportItemId } from '@xangarro/domain';

import { buildDailyDigest } from '@/server/alerts/digest';
import { digestWindow, mxDayStart } from '@/server/alerts/mx-day';

import { CFDI, item } from './support/inbox';

/** The cron fires at 14:00 UTC = 08:00 in Mexico City (UTC-6, no DST since 2022). */
const RUN = new Date('2026-09-17T14:00:00.000Z');
const id = (n: number) => `01HZ8XQN9GZJXV8AKQ5X0C${String(n).padStart(4, '0')}` as SupportItemId;
const at = (iso: string, n: number, o: Partial<SupportItem> = {}) =>
  item({ id: id(n), createdAt: iso, updatedAt: iso, sourceRef: `r${n}`, ...o });

describe('Mexico City day boundaries', () => {
  it('starts the CDMX day at 06:00 UTC', () => {
    assert.equal(mxDayStart(RUN).toISOString(), '2026-09-17T06:00:00.000Z');
    assert.equal(
      mxDayStart(new Date('2026-09-17T05:59:59.999Z')).toISOString(),
      '2026-09-16T06:00:00.000Z',
    );
  });

  it('covers yesterday, CDMX time, at the 08:00 run', () => {
    const w = digestWindow(RUN);
    assert.equal(w.start.toISOString(), '2026-09-16T06:00:00.000Z');
    assert.equal(w.end.toISOString(), '2026-09-17T06:00:00.000Z');
  });
});

describe('buildDailyDigest', () => {
  it('renders an explicit «sin novedades» digest with zero items', () => {
    const d = buildDailyDigest([], RUN);
    assert.match(d.subject, /sin novedades/);
    assert.match(d.subject, /16 sept?\.? 2026/);
    assert.deepEqual(d.counts, { nuevos: 0, urgentesAbiertos: 0, pagosSinCfdi: 0 });
    assert.match(d.text, /No llegaron items nuevos/);
    assert.match(d.html, /<html/);
    assert.match(d.text, /límite/i);
  });

  it('counts only yesterday’s items as new, by CDMX midnight', () => {
    const items = [
      at('2026-09-16T05:59:59.000Z', 1), // 23:59 of the 15th in CDMX
      at('2026-09-16T06:00:00.000Z', 2, { kind: 'migracion' }),
      at('2026-09-17T05:59:59.000Z', 3),
      at('2026-09-17T06:00:00.000Z', 4), // today: tomorrow's digest
    ];
    const d = buildDailyDigest(items, RUN);
    assert.equal(d.counts.nuevos, 2);
    assert.deepEqual(
      d.newByKind.map((g) => [g.kind, g.items.map((i) => i.id)]),
      [
        ['bug', [id(3)]],
        ['migracion', [id(2)]],
      ],
    );
  });

  it('lists every open urgent item and counts pagos sin CFDI, whenever filed', () => {
    const items = [
      at('2026-09-01T12:00:00.000Z', 1, { urgent: true, title: 'Cobro caído' }),
      at('2026-09-01T12:00:00.000Z', 2, {
        urgent: true,
        status: 'resuelto',
        resolvedAt: RUN.toISOString(),
      }),
      at('2026-09-02T12:00:00.000Z', 3, { kind: 'factura', paymentRef: 'in_3' }),
      at('2026-09-02T12:00:00.000Z', 4, {
        kind: 'factura',
        paymentRef: 'in_4',
        status: 'resuelto',
        cfdiUuid: CFDI,
        resolvedAt: RUN.toISOString(),
      }),
    ];
    const d = buildDailyDigest(items, RUN);
    assert.deepEqual(d.counts, { nuevos: 0, urgentesAbiertos: 1, pagosSinCfdi: 1 });
    assert.match(d.subject, /1 urgente/);
    assert.match(d.subject, /1 pago sin CFDI/);
    assert.match(d.text, /Cobro caído/);
    assert.ok(d.text.includes(`/inbox/${id(1)}`));
  });

  it('caps a long section and says how many more there are', () => {
    const many = Array.from({ length: 45 }, (_, n) => at('2026-09-16T12:00:00.000Z', n + 1));
    const d = buildDailyDigest(many, RUN);
    assert.equal(d.counts.nuevos, 45);
    assert.match(d.subject, /45 nuevos/);
    assert.match(d.text, /y 25 más/);
    assert.equal((d.text.match(/\/inbox\//g) ?? []).length, 20);
  });

  it('escapes customer text in the HTML', () => {
    const d = buildDailyDigest(
      [at('2026-09-16T12:00:00.000Z', 1, { title: '<script>x</script> & "y"' })],
      RUN,
    );
    assert.doesNotMatch(d.html, /<script>/);
    assert.match(d.html, /&lt;script&gt;x&lt;\/script&gt; &amp; &quot;y&quot;/);
  });
});
