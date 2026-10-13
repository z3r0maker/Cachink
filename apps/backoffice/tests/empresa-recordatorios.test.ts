import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { agendaDe } from '@xangarro/application/corp';
import { InMemoryEmailSender } from '@xangarro/application/email';
import { CATALOGO } from '@xangarro/domain/corp';

import { handleAgendaCron, type AgendaCronDeps } from '../src/server/empresa/cron-agenda';
import { correoDe, recordatoriosDe } from '../src/server/empresa/recordatorios';

/** E-04's reminders: 7, 3 and 1 days before, to each founder, once a day. */
const vistas = agendaDe({
  catalogo: CATALOGO,
  inscripcion: '2026-09-04',
  guardadas: [],
  hasta: '2026-12-31',
});

describe('recordatoriosDe', () => {
  it('picks what falls due in exactly 7, 3 or 1 days', () => {
    // ISR and IVA of September are due Monday 19 Oct: 7 days after the 12th.
    const r = recordatoriosDe(vistas, '2026-10-12');
    assert.deepEqual(
      r.map((x) => [x.titulo, x.dias]),
      [
        ['ISR provisional de septiembre de 2026', 7],
        ['IVA mensual de septiembre de 2026', 7],
      ],
    );
  });

  it('says nothing on the other days, nor for what is done', () => {
    assert.deepEqual(recordatoriosDe(vistas, '2026-10-13'), []);
    const done = vistas.map((o) => ({ ...o, cumplida: true }));
    assert.deepEqual(recordatoriosDe(done, '2026-10-12'), []);
  });

  it('writes one subject for one item and a count for several', () => {
    const r = recordatoriosDe(vistas, '2026-10-18');
    assert.equal(correoDe(r, 'https://admin.x').subject, 'MEXIA: 2 obligaciones vencen pronto');
    assert.equal(
      correoDe(r.slice(0, 1), 'https://admin.x').subject,
      'MEXIA: ISR provisional de septiembre de 2026 vence mañana',
    );
  });
});

describe('handleAgendaCron', () => {
  const deps = (
    over: Partial<Omit<AgendaCronDeps, 'sender'>> = {},
  ): AgendaCronDeps & { sender: InMemoryEmailSender } => ({
    secret: 's3cret',
    hoy: () => '2026-10-12',
    leer: async () => vistas,
    destinatarios: async () => [
      { founderId: 'f1', email: 'uno@mexia.mx' },
      { founderId: 'f2', email: 'dos@mexia.mx' },
    ],
    consoleUrl: 'https://admin.x',
    log: () => {},
    ...over,
    sender: new InMemoryEmailSender(),
  });
  const req = (token = 's3cret') =>
    new Request('https://admin.x/api/cron/agenda', {
      headers: { authorization: `Bearer ${token}` },
    });

  it('sends each founder one email, keyed by the day', async () => {
    const d = deps();
    const res = await handleAgendaCron(req(), d);
    assert.equal(res.status, 200);
    assert.deepEqual(
      d.sender.sent.map((m) => [m.to, m.idempotencyKey]),
      [
        ['uno@mexia.mx', 'corp-agenda:f1:2026-10-12'],
        ['dos@mexia.mx', 'corp-agenda:f2:2026-10-12'],
      ],
    );
  });

  it('refuses a call without the secret, and stays shut without one configured', async () => {
    assert.equal((await handleAgendaCron(req('nope'), deps())).status, 401);
    assert.equal((await handleAgendaCron(req(), deps({ secret: undefined }))).status, 503);
  });

  it('sends nothing on a quiet day, or without the corp database', async () => {
    const quiet = deps({ hoy: () => '2026-10-13' });
    assert.equal((await handleAgendaCron(req(), quiet)).status, 200);
    assert.equal(quiet.sender.sent.length, 0);
    const off = deps({ leer: null });
    assert.equal((await handleAgendaCron(req(), off)).status, 200);
  });

  it('answers 500 when the agenda cannot be read', async () => {
    const d = deps({
      leer: async () => {
        throw new Error('down');
      },
    });
    assert.equal((await handleAgendaCron(req(), d)).status, 500);
  });
});
