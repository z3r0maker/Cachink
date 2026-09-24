import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { EmailSendError, InMemoryEmailSender } from '@xangarro/application/email';
import type { SupportItem } from '@xangarro/domain';

import { handleDigestCron } from '@/server/alerts/cron-digest';
import { buildDailyDigest } from '@/server/alerts/digest';
import { transactionalMailer } from '@/server/alerts/email';

import { item, seeded } from './support/inbox';

const RUN = new Date('2026-09-17T14:00:00.000Z');
// Named for `.gitleaks.toml`'s allowlist: a random-looking cron secret reads
// as a live credential to gitleaks' generic-api-key rule. The value is only
// ever compared with itself, so every assertion is unchanged.
const SECRET = 'ci-only-not-a-real-secret';

function run(sender: InMemoryEmailSender) {
  return handleDigestCron(
    new Request('https://admin.xangarro.mx/api/cron/digest', {
      headers: { authorization: `Bearer ${SECRET}` },
    }),
    {
      secret: SECRET,
      now: () => RUN,
      repo: seeded(item({ createdAt: '2026-09-16T12:00:00.000Z', urgent: true })),
      rejections: { since: async () => [{ code: 'FK_PRODUCT_MISSING', n: 2 }] },
      mailer: transactionalMailer(sender),
      to: 'soporte@xangarro.mx',
      log: () => undefined,
    },
  );
}

describe('transactionalMailer (B-14 → N-10)', () => {
  it('sends the staff-digest template with the digest text as the plain part', async () => {
    const sender = new InMemoryEmailSender();
    const res = await run(sender);
    assert.equal(res.status, 200);
    const sent = sender.sent[0];
    assert.equal(sent?.to, 'soporte@xangarro.mx');
    assert.match(sent?.html ?? '', /Xangarro!/); // the shared layout
    assert.match(sent?.html ?? '', /URGENTE/);
    assert.match(sent?.text ?? '', /FK_PRODUCT_MISSING: 2/);
    assert.deepEqual(sent?.tags, [{ name: 'kind', value: 'staff-digest' }]);
  });

  it('keys the email by digest window, so a re-run cron sends once', async () => {
    const sender = new InMemoryEmailSender();
    await run(sender);
    await run(sender);
    assert.equal(sender.sent.length, 1);
    assert.match(sender.sent[0]?.idempotencyKey ?? '', /^staff-digest:2026-09-16T/);
  });

  it('answers 502 when the provider refuses', async () => {
    const sender = new InMemoryEmailSender();
    sender.failNext(EmailSendError.fromStatus(403, 'domain not verified'));
    assert.equal((await run(sender)).status, 502);
  });

  it('renders zero-item and many-item digests into sections', () => {
    const empty = buildDailyDigest([], RUN);
    assert.ok(empty.emailSections.some((s) => s.empty === 'No llegaron items nuevos ayer.'));
    const many = buildDailyDigest(
      Array.from({ length: 25 }, (_, i) =>
        item({ id: `i${i}` as SupportItem['id'], createdAt: '2026-09-16T12:00:00.000Z' }),
      ),
      RUN,
    );
    const first = many.emailSections[0];
    assert.equal(first?.lines.length, 21); // 20 shown + «y 5 más»
    assert.equal(first?.lines.at(-1)?.label, 'y 5 más');
  });

  it('falls back to the given HTML when no sections are passed', async () => {
    const sender = new InMemoryEmailSender();
    await transactionalMailer(sender).send({
      to: 'soporte@xangarro.mx',
      subject: 'Resumen',
      text: 'texto',
      html: '<p>hecho a mano</p>',
    });
    assert.equal(sender.sent[0]?.html, '<p>hecho a mano</p>');
    assert.equal(sender.sent[0]?.idempotencyKey, 'staff-digest:Resumen');
  });
});
