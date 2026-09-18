import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { inboxHref, parseView, toListInput } from '@/app/(consola)/inbox/params';

import { STAFF } from './support/inbox';

describe('inbox URL state', () => {
  it('reads chips from the query string', () => {
    const view = parseView({ tipo: 'factura', estado: 'nuevo', urgente: '1', mias: '1' });
    assert.deepEqual(toListInput(view, STAFF, null), {
      kinds: ['factura'],
      statuses: ['nuevo'],
      urgent: true,
      ownerStaffId: STAFF,
    });
  });

  it('ignores unknown values instead of failing', () => {
    const view = parseView({ tipo: 'queja', estado: ['cerrado'], urgente: 'si', filtro: 'x' });
    assert.deepEqual(toListInput(view, STAFF, null), {});
  });

  it('lets «Pagos sin CFDI» replace the kind and status chips', () => {
    const view = parseView({ filtro: 'pagos_sin_cfdi', tipo: 'bug', estado: 'resuelto' });
    assert.deepEqual(toListInput(view, STAFF, 'c1'), {
      kinds: ['factura'],
      statuses: ['nuevo', 'en_curso'],
      cursor: 'c1',
    });
  });

  it('builds hrefs that round-trip and drop the cursor on a filter change', () => {
    const view = parseView({ tipo: 'bug', urgente: '1' });
    assert.equal(inboxHref(view), '/inbox?tipo=bug&urgente=1');
    assert.equal(inboxHref(view, { tipo: null, urgente: false }), '/inbox');
    assert.equal(inboxHref(view, {}, 'abc'), '/inbox?tipo=bug&urgente=1&cursor=abc');
  });
});
