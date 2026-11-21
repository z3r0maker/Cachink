import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

import { RecordingSupportInbox, SupportInboxError } from '@xangarro/application/support-inbox';

/**
 * Ayuda's two ways to write to the team (P-48, ADR-162 §8). «Tengo una duda»
 * files what it always filed. «Algo no funciona» files a `bug` that carries
 * the screen, the browser and the session's last error, none of which the
 * form sends: the action reads them on the server.
 */
const requireMember = vi.fn();
const reportError = vi.fn();
const keepLastError = vi.fn();
const lastErrorOfSession = vi.fn();
const supportInboxFromEnv = vi.fn();
const headers = vi.fn();

vi.mock('next/headers', () => ({ headers }));
vi.mock('../../src/server/auth', () => ({ requireMember }));
vi.mock('../../src/server/observability/report', () => ({ reportError }));
vi.mock('../../src/server/observability/last-error', () => ({ keepLastError, lastErrorOfSession }));
vi.mock('../../src/server/support-inbox', () => ({ supportInboxFromEnv }));

const { enviarAyuda, reportarFalla } = await import('../../src/server/actions/ayuda');

const SESSION = {
  sub: '6f1d2c3b-4a59-4e68-9f70-8a1b2c3d4e5f',
  email: 'pedro@taqueriadonpedro.mx',
  business_id: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
  member_role: 'viewer',
};
const CHROME = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/142.0.0.0 Safari/537.36';
const EVENT = 'a3f1c2d4e5b60718293a4b5c6d7e8f90';
const FALLA = {
  pantalla: '/movimientos',
  mensaje: '',
  urgente: false,
  intento: '0b9f8e7d-6c5b-4a39-8f27-1e0d9c8b7a6f',
};

const notPermitted = (message: string) =>
  Object.assign(new Error(message), { code: 'NOT_PERMITTED' });

let inbox: RecordingSupportInbox;

beforeEach(() => {
  vi.clearAllMocks();
  inbox = new RecordingSupportInbox();
  requireMember.mockResolvedValue(SESSION);
  supportInboxFromEnv.mockReturnValue(inbox);
  lastErrorOfSession.mockResolvedValue(null);
  headers.mockResolvedValue(new Headers({ 'user-agent': CHROME }));
});

describe('reportarFalla', () => {
  it('two taps file a bug that names the screen, the browser and the session’s last error', async () => {
    lastErrorOfSession.mockResolvedValue({ eventId: EVENT, at: '2026-11-20T18:03:11.000Z' });
    assert.deepEqual(await reportarFalla(FALLA), { ok: true });
    const [item] = inbox.items;
    assert.equal(inbox.items.length, 1);
    assert.equal(item?.kind, 'bug');
    assert.equal(item?.businessId, SESSION.business_id);
    assert.equal(item?.title, 'Algo no funciona: Ventas y gastos');
    assert.equal(item?.eventId, EVENT);
    for (const said of ['Pantalla: Ventas y gastos (/movimientos)', `Navegador: ${CHROME}`]) {
      assert.ok(item?.body.includes(said), `the body says «${said}»`);
    }
  });

  it('any member may report, a read-only one included', async () => {
    await reportarFalla(FALLA);
    assert.deepEqual(requireMember.mock.calls, [['viewer']]);
  });

  it('without a session it says so, files nothing and reports no incident', async () => {
    requireMember.mockRejectedValue(notPermitted('Inicia sesión para continuar.'));
    assert.deepEqual(await reportarFalla(FALLA), {
      ok: false,
      message: 'Inicia sesión para continuar.',
    });
    assert.equal(inbox.items.length, 0);
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('with neither a screen nor a sentence it asks for one, and files nothing', async () => {
    assert.deepEqual(await reportarFalla({ ...FALLA, pantalla: null, mensaje: '  ' }), {
      ok: false,
      message: 'Dinos en qué pantalla fue o cuéntanos qué pasó.',
    });
    assert.equal(inbox.items.length, 0);
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('the console’s ingest down is said to the person and reported: nothing is lost silently', async () => {
    const down = new SupportInboxError('INBOX_UNAVAILABLE', 'Consola no disponible (502)', true);
    supportInboxFromEnv.mockReturnValue({ file: () => Promise.reject(down) });
    assert.deepEqual(await reportarFalla(FALLA), {
      ok: false,
      message: 'No pudimos enviar tu reporte. Intenta de nuevo.',
    });
    assert.deepEqual(reportError.mock.calls, [[down, { endpoint: 'reportarFalla' }]]);
    // Its own failed send must not become «the last error» the retry names.
    assert.equal(keepLastError.mock.calls.length, 0);
  });

  it('the retry of that same attempt files it once the ingest is back', async () => {
    supportInboxFromEnv.mockReturnValueOnce({ file: () => Promise.reject(new Error('502')) });
    assert.equal((await reportarFalla(FALLA)).ok, false);
    assert.equal((await reportarFalla(FALLA)).ok, true);
    assert.equal((await reportarFalla(FALLA)).ok, true);
    assert.equal(inbox.items.length, 1, 'one attempt, one item');
  });

  it('a form that is not a form is refused in words, not reported as an incident', async () => {
    const junk = { pantalla: 7, mensaje: null } as unknown as typeof FALLA;
    assert.deepEqual(await reportarFalla(junk), {
      ok: false,
      message: 'Revisa lo que escribiste e intenta de nuevo.',
    });
    assert.equal(inbox.items.length, 0);
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('a browser that names itself with nothing is filed as unknown', async () => {
    headers.mockResolvedValue(new Headers());
    await reportarFalla(FALLA);
    assert.ok(inbox.items[0]?.body.includes('Navegador: desconocido'));
  });
});

describe('enviarAyuda — «Tengo una duda» files what it always filed', () => {
  const DUDA = {
    asunto: ' No veo el corte de ayer ',
    mensaje: 'Cerré el corte y no aparece.',
    urgente: true,
  };

  it('files an `ayuda` item with the subject, the message and the urgency', async () => {
    assert.deepEqual(await enviarAyuda(DUDA), { ok: true });
    const [item] = inbox.items;
    assert.equal(inbox.items.length, 1);
    const { sourceRef, ...fields } = item ?? { sourceRef: '' };
    assert.deepEqual(fields, {
      kind: 'ayuda',
      urgent: true,
      businessId: SESSION.business_id,
      title: 'No veo el corte de ayer',
      body: 'Cerré el corte y no aparece.',
      source: 'portal-ayuda',
      paymentRef: null,
    });
    assert.match(sourceRef, /^ayuda:/);
    assert.equal(lastErrorOfSession.mock.calls.length, 0, 'a question carries no error');
  });

  it('refuses an empty subject and an empty message, each with its reason', async () => {
    assert.deepEqual(await enviarAyuda({ ...DUDA, asunto: ' ' }), {
      ok: false,
      message: 'Escribe un asunto de hasta 120 caracteres.',
    });
    assert.deepEqual(await enviarAyuda({ ...DUDA, mensaje: '' }), {
      ok: false,
      message: 'Escribe tu mensaje (hasta 4000 caracteres).',
    });
    assert.equal(inbox.items.length, 0);
  });

  it('an ingest that is down is said and reported', async () => {
    supportInboxFromEnv.mockReturnValue({ file: () => Promise.reject(new Error('502')) });
    assert.deepEqual(await enviarAyuda(DUDA), {
      ok: false,
      message: 'No pudimos enviar tu mensaje. Intenta de nuevo.',
    });
    assert.equal(reportError.mock.calls.length, 1);
  });
});
