import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { NOTICES, bellUnreadCount, type Notice } from '../src/fixtures/notices';

const make = (over: Partial<Notice>): Notice => ({
  id: 'x',
  source: 'operacion',
  severity: 'info',
  title: 't',
  body: 'b',
  cta: 'c',
  href: '/',
  when: 'hoy',
  state: 'nuevo',
  ...over,
});

/**
 * One table serves Avisos and the Asesor feed, so the counting rule is the
 * thing that keeps them separate. ADR-060: the bell excludes `asesor`.
 */
describe('bellUnreadCount', () => {
  it('counts unread sistema and operacion notices', () => {
    assert.equal(bellUnreadCount([make({ source: 'operacion' }), make({ source: 'sistema' })]), 2);
  });

  it('never counts an Asesor insight, however unread', () => {
    assert.equal(bellUnreadCount([make({ source: 'asesor', state: 'nuevo' })]), 0);
  });

  it('ignores notices that are read, resolved or dismissed', () => {
    const rows = (['leido', 'listo', 'descartado'] as const).map((state) => make({ state }));
    assert.equal(bellUnreadCount(rows), 0);
  });

  it('is zero for an empty inbox', () => {
    assert.equal(bellUnreadCount([]), 0);
  });

  it('agrees with the fixture data the shell renders', () => {
    const expected = NOTICES.filter((n) => n.source !== 'asesor' && n.state === 'nuevo').length;
    assert.equal(bellUnreadCount(NOTICES), expected);
    assert.ok(expected > 0, 'the fixture should exercise a non-empty badge');
  });
});
