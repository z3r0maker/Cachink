import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { EmailSendError, InMemoryEmailSender } from '@xangarro/application/email';

import { deletionNotices } from '../src/server/cuenta/notices';

/** The account deletion emails as the portal sends them (ADR-136). */
const base = {
  email: 'pedro@example.mx',
  folio: 'EL-4C91D2',
  negocios: ['Taquería Don Pedro'],
  eraseAt: '2026-12-04T18:00:00.000Z',
};
const ORIGIN = 'https://app.xangarro.mx';

describe('deletion notices', () => {
  it('the acuse goes to the account with its own undo link, keyed by folio', async () => {
    const sender = new InMemoryEmailSender();
    const n = deletionNotices({ sender, origin: ORIGIN });
    const req = { ...base, requestedAt: '2026-11-05T00:42:00.000Z', undoToken: 'T'.repeat(43) };
    await n.requested(req);
    await n.requested(req);
    assert.equal(sender.sent.length, 1, 'once per folio');
    const [m] = sender.sent;
    assert.equal(m?.to, 'pedro@example.mx');
    assert.equal(m?.idempotencyKey, 'deletion-requested:EL-4C91D2');
    assert.match(m?.html ?? '', /href="https:\/\/app\.xangarro\.mx\/eliminacion\?t=T{43}"/);
  });

  it('the reminder carries a link of its own', async () => {
    const sender = new InMemoryEmailSender();
    await deletionNotices({ sender, origin: ORIGIN }).reminder({
      ...base,
      undoToken: 'R'.repeat(43),
    });
    assert.match(sender.sent[0]?.html ?? '', /eliminacion\?t=R{43}/);
    assert.equal(sender.sent[0]?.idempotencyKey, 'deletion-reminder:EL-4C91D2');
  });

  it('the last one has no link', async () => {
    const sender = new InMemoryEmailSender();
    await deletionNotices({ sender, origin: ORIGIN }).erased({
      ...base,
      blockedUntil: '2036-12-04T18:00:00.000Z',
    });
    assert.doesNotMatch(sender.sent[0]?.html ?? '', /eliminacion\?t=/);
  });

  it('a refused send throws, so the use case can report it', async () => {
    const sender = new InMemoryEmailSender();
    sender.failNext(new EmailSendError('EMAIL_REJECTED', 'nope'));
    await assert.rejects(
      deletionNotices({ sender, origin: ORIGIN }).erased({ ...base, blockedUntil: base.eraseAt }),
    );
  });

  it('the job is scheduled daily at 10:00 UTC', () => {
    const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
      crons?: { path: string; schedule: string }[];
    };
    assert.deepEqual(
      config.crons?.find((c) => c.path === '/api/cron/borrar-cuentas'),
      { path: '/api/cron/borrar-cuentas', schedule: '0 10 * * *' },
    );
  });
});
