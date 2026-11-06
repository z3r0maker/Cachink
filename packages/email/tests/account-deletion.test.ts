/** The account deletion emails (ADR-136): the lines the flow promises, asserted; the rest pinned. */
import assert from 'node:assert/strict';
import { describe, expect, it } from 'vitest';

import {
  renderDeletionErasedEmail,
  renderDeletionReminderEmail,
  renderDeletionRequestedEmail,
} from '../src/index.js';

const base = {
  negocios: ['Taquería Don Pedro', 'Tortas La Güera'],
  folio: 'EL-4C91D2',
  eraseAt: '2026-12-04T18:00:00.000Z',
} as const;
const UNDO = 'https://app.xangarro.mx/eliminacion?t=abc';

describe('account deletion emails', () => {
  it('the acuse: folio, both businesses, the moment, the erase day and the undo link', async () => {
    const e = await renderDeletionRequestedEmail({
      ...base,
      requestedAt: '2026-11-05T00:42:00.000Z', // 4 Nov, 18:42 in Mexico City
      undoUrl: UNDO,
    });
    assert.equal(e.subject, 'Tu cuenta de Xangarro se eliminará el 4 de diciembre');
    assert.match(e.text, /EL-4C91D2/);
    assert.match(e.text, /Taquería Don Pedro, Tortas La Güera/);
    assert.match(e.text, /4 de noviembre de 2026, 18:42/);
    assert.match(e.text, /bloqueados 10 años/);
    assert.match(e.html, /href="https:\/\/app\.xangarro\.mx\/eliminacion\?t=abc"/);
    assert.match(e.text, /MEXIA, S\.A\.S\./);
    expect(e).toMatchSnapshot();
  });

  it('the reminder: three days, the same link', async () => {
    const e = await renderDeletionReminderEmail({ ...base, undoUrl: UNDO });
    assert.equal(e.subject, 'En 3 días borramos tu cuenta de Xangarro');
    assert.match(e.text, /El 4 de diciembre borramos tu cuenta/i);
    assert.match(e.html, /eliminacion\?t=abc/);
  });

  it('the last one: no link, and the day the blocked rows erase themselves', async () => {
    const e = await renderDeletionErasedEmail({
      ...base,
      blockedUntil: '2036-12-04T18:00:00.000Z',
    });
    assert.equal(e.subject, 'Eliminamos tu cuenta de Xangarro');
    assert.match(e.text, /bloqueados hasta el 4 de diciembre de 2036/);
    assert.doesNotMatch(e.html, /eliminacion\?t=/);
    expect(e).toMatchSnapshot();
  });

  it('one business reads as one', async () => {
    const e = await renderDeletionReminderEmail({
      ...base,
      negocios: ['Taquería Don Pedro'],
      undoUrl: UNDO,
    });
    assert.doesNotMatch(e.text, /, Tortas/);
  });
});
