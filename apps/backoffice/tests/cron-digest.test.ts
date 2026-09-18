import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { handleDigestCron } from '@/server/alerts/cron-digest';
import { logMailer, type DigestEmail, type Mailer } from '@/server/alerts/email';
import type { RejectionCount, RejectionSource } from '@/server/alerts/rejections';

import { brokenRepo, item, seeded } from './support/inbox';

const SECRET = 'cron-secret-0123456789abcdef';
const RUN = new Date('2026-09-17T14:00:00.000Z');
const URL_ = 'https://admin.xangarro.mx/api/cron/digest';

function request(auth: string | null = `Bearer ${SECRET}`): Request {
  const headers = new Headers();
  if (auth !== null) headers.set('authorization', auth);
  return new Request(URL_, { headers });
}

function recordingMailer(fail = false): Mailer & { sent: DigestEmail[] } {
  const sent: DigestEmail[] = [];
  return {
    sent,
    send: async (m) => {
      if (fail) throw new Error('smtp down');
      sent.push(m);
    },
  };
}

function rejectionsFrom(rows: readonly RejectionCount[]): RejectionSource & { since_: string[] } {
  const since_: string[] = [];
  return {
    since_,
    since: async (iso) => {
      since_.push(iso);
      return rows;
    },
  };
}

const brokenRejections: RejectionSource = {
  since: async () => {
    throw new Error('permission denied for table sync_rejections');
  },
};

function deps(over: Partial<Parameters<typeof handleDigestCron>[1]> = {}) {
  return {
    secret: SECRET,
    now: () => RUN,
    repo: seeded(item({ createdAt: '2026-09-16T12:00:00.000Z', urgent: true })),
    mailer: recordingMailer(),
    rejections: rejectionsFrom([{ code: 'FK_PRODUCT_MISSING', n: 2 }]),
    to: 'soporte@xangarro.mx',
    log: () => undefined,
    ...over,
  };
}

describe('GET /api/cron/digest', () => {
  it('builds the digest and hands it to the mailer', async () => {
    const mailer = recordingMailer();
    const res = await handleDigestCron(request(), deps({ mailer }));
    assert.equal(res.status, 200);
    assert.equal(mailer.sent.length, 1);
    const [mail] = mailer.sent;
    assert.equal(mail?.to, 'soporte@xangarro.mx');
    assert.match(mail?.subject ?? '', /1 nuevo · 1 urgente/);
    assert.match(mail?.html ?? '', /<html/);
    const body = (await res.json()) as { counts: { nuevos: number } };
    assert.equal(body.counts.nuevos, 1);
  });

  it('reads rejections since 24 h before the run and reports them', async () => {
    const mailer = recordingMailer();
    const rejections = rejectionsFrom([{ code: 'FK_PRODUCT_MISSING', n: 2 }]);
    const res = await handleDigestCron(request(), deps({ mailer, rejections }));
    assert.deepEqual(rejections.since_, ['2026-09-16T14:00:00.000Z']);
    assert.match(mailer.sent[0]?.text ?? '', /FK_PRODUCT_MISSING: 2/);
    const body = (await res.json()) as { counts: { rechazos: number | null } };
    assert.equal(body.counts.rechazos, 2);
  });

  it('still sends the digest, marked «no disponible», when rejections cannot be read', async () => {
    const mailer = recordingMailer();
    const logged: string[] = [];
    const res = await handleDigestCron(
      request(),
      deps({ mailer, rejections: brokenRejections, log: (m) => logged.push(m) }),
    );
    assert.equal(res.status, 200);
    assert.match(mailer.sent[0]?.text ?? '', /No disponible/);
    assert.deepEqual(logged, ['digest: reading sync rejections failed']);
  });

  it('treats a malformed count from the source as unreadable, not as zero', async () => {
    const mailer = recordingMailer();
    const rejections = rejectionsFrom([{ code: 'X', n: -3 }]);
    const res = await handleDigestCron(request(), deps({ mailer, rejections }));
    const body = (await res.json()) as { counts: { rechazos: number | null } };
    assert.equal(body.counts.rechazos, null);
  });

  it('refuses a missing or wrong bearer token with 401 and sends nothing', async () => {
    const mailer = recordingMailer();
    for (const auth of [null, `Bearer ${SECRET}x`, SECRET, 'Bearer ']) {
      assert.equal(
        (await handleDigestCron(request(auth), deps({ mailer }))).status,
        401,
        String(auth),
      );
    }
    assert.equal(mailer.sent.length, 0);
  });

  it('is closed (503) when CRON_SECRET is not configured', async () => {
    assert.equal(
      (await handleDigestCron(request('Bearer '), deps({ secret: undefined }))).status,
      503,
    );
    assert.equal((await handleDigestCron(request('Bearer '), deps({ secret: '' }))).status, 503);
  });

  it('answers 500 when the inbox cannot be read', async () => {
    assert.equal((await handleDigestCron(request(), deps({ repo: brokenRepo() }))).status, 500);
  });

  it('answers 502 when the mailer fails', async () => {
    const res = await handleDigestCron(request(), deps({ mailer: recordingMailer(true) }));
    assert.equal(res.status, 502);
  });
});

describe('logMailer (email disabled)', () => {
  it('logs the envelope, not the body', async () => {
    const lines: string[] = [];
    await logMailer((m) => lines.push(m)).send({
      to: 'soporte@xangarro.mx',
      subject: 'Resumen',
      text: 'RFC XAXX010101000',
      html: '<p>RFC XAXX010101000</p>',
    });
    assert.equal(lines.length, 1);
    assert.match(lines[0] ?? '', /Resumen/);
    assert.doesNotMatch(lines[0] ?? '', /XAXX010101000/);
  });
});
