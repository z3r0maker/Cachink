import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  RecordingSupportInbox,
  SupportInboxError,
  type InboxItemRequest,
  type SupportInbox,
} from '@xangarro/application/support-inbox';
import { SUPPORT_ITEM_BODY_MAX, SupportItemSchema } from '@xangarro/domain';

import {
  PORTAL_REPORT_MESSAGE_MAX,
  filePortalReport,
  type PortalReportContext,
  type PortalReportForm,
} from '../src/server/support/portal-report';

/**
 * «Algo no funciona» in the portal's Ayuda (P-48, ADR-162 §8): a `bug` item
 * in the staff inbox that carries by itself the screen, the browser and the
 * last error of the session. Who files it is the session's, never the form's.
 */
const CALLER = {
  userId: '6f1d2c3b-4a59-4e68-9f70-8a1b2c3d4e5f',
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
  email: 'pedro@taqueriadonpedro.mx',
};
const INTENTO = '0b9f8e7d-6c5b-4a39-8f27-1e0d9c8b7a6f';
const FORM: PortalReportForm = {
  pantalla: '/movimientos',
  mensaje: 'Quise descargar el Excel de ventas y no bajó nada',
  urgente: false,
  intento: INTENTO,
};
const CONTEXT: PortalReportContext = {
  navegador: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/142.0.0.0 Safari/537.36',
  ultimoError: null,
  enviado: '2026-11-20T18:05:00.000Z',
};
const EVENT_ID = 'a3f1c2d4e5b60718293a4b5c6d7e8f90';

function theOnlyItem(inbox: RecordingSupportInbox): InboxItemRequest {
  const [item] = inbox.items;
  assert.equal(inbox.items.length, 1);
  assert.ok(item);
  return item;
}

const file = (
  inbox: SupportInbox,
  form: Partial<PortalReportForm> = {},
  context: Partial<PortalReportContext> = {},
) => filePortalReport(CALLER, { ...FORM, ...form }, { ...CONTEXT, ...context }, inbox);

describe('filePortalReport', () => {
  it('files a bug under the session’s business, naming the screen, the browser and the account', async () => {
    const inbox = new RecordingSupportInbox();
    assert.deepEqual(await file(inbox), { kind: 'accepted' });
    const { body, ...fields } = theOnlyItem(inbox);
    assert.deepEqual(fields, {
      kind: 'bug',
      urgent: false,
      businessId: CALLER.businessId,
      title: 'Algo no funciona: Ventas y gastos',
      source: 'portal-ayuda',
      sourceRef: `falla:${CALLER.userId}:${INTENTO}`,
      paymentRef: null,
    });
    assert.deepEqual(body.split('\n'), [
      'Quise descargar el Excel de ventas y no bajó nada',
      'Pantalla: Ventas y gastos (/movimientos)',
      `Navegador: ${CONTEXT.navegador}`,
      'Cuenta: pedro@taqueriadonpedro.mx',
      'Enviado: 2026-11-20T18:05:00.000Z',
    ]);
  });

  it('two taps and no typing are a report: the screen alone is enough', async () => {
    const inbox = new RecordingSupportInbox();
    assert.deepEqual(await file(inbox, { mensaje: '   ' }), { kind: 'accepted' });
    const { title, body } = theOnlyItem(inbox);
    assert.equal(title, 'Algo no funciona: Ventas y gastos');
    assert.equal(body.split('\n')[0], 'Pantalla: Ventas y gastos (/movimientos)');
  });

  it('a sentence alone is enough too, and the item says no screen was named', async () => {
    const inbox = new RecordingSupportInbox();
    assert.deepEqual(await file(inbox, { pantalla: null }), { kind: 'accepted' });
    const { title, body } = theOnlyItem(inbox);
    assert.equal(title, 'Algo no funciona en el portal');
    assert.ok(body.includes('Pantalla: no la indicó'));
  });

  it('carries the session’s last error as the item’s own field, and when it happened', async () => {
    const inbox = new RecordingSupportInbox();
    const ultimoError = { eventId: EVENT_ID, at: '2026-11-20T18:03:11.000Z' };
    await file(inbox, { urgente: true }, { ultimoError });
    const item = theOnlyItem(inbox);
    assert.equal(item.eventId, EVENT_ID);
    assert.equal(item.urgent, true);
    assert.ok(item.body.includes('Último error de la sesión: 2026-11-20T18:03:11.000Z'));
    assert.equal(item.body.includes(EVENT_ID), false, 'the id is the field, not prose');
  });

  it('a session that saw no error files no event id at all', async () => {
    const inbox = new RecordingSupportInbox();
    await file(inbox);
    const item = theOnlyItem(inbox);
    assert.equal('eventId' in item, false);
    assert.equal('category' in item, false);
    assert.equal(item.body.includes('Último error'), false);
  });

  it('files an item the console accepts: the domain’s own rules, at the longest report', async () => {
    const inbox = new RecordingSupportInbox();
    const outcome = await file(
      inbox,
      { mensaje: '🙂'.repeat(PORTAL_REPORT_MESSAGE_MAX / 2) },
      { navegador: 'N'.repeat(5_000), ultimoError: { eventId: EVENT_ID, at: CONTEXT.enviado } },
    );
    assert.deepEqual(outcome, { kind: 'accepted' });
    const item = theOnlyItem(inbox);
    assert.ok(item.body.length <= SUPPORT_ITEM_BODY_MAX);
    const browser = item.body.split('\n').find((line) => line.startsWith('Navegador: '));
    assert.equal(
      browser?.length,
      'Navegador: '.length + 300,
      'a browser’s name is cut, not trusted',
    );
    // What the console builds around a source's fields (`inbox/create.ts`).
    const asStored = SupportItemSchema.safeParse({
      ...item,
      attachments: [],
      dueAt: null,
      id: '01HZ8XQN9GZJXV8AKQ5X0C7SPT',
      status: 'nuevo',
      ownerStaffId: null,
      cfdiUuid: null,
      createdAt: CONTEXT.enviado,
      updatedAt: CONTEXT.enviado,
      resolvedAt: null,
    });
    assert.equal(asStored.success, true, JSON.stringify(asStored.error?.issues));
  });

  it('the same attempt sent twice is one item: a retry never files a second', async () => {
    const inbox = new RecordingSupportInbox();
    await file(inbox);
    await file(inbox);
    assert.equal(inbox.items.length, 1);
    await file(inbox, { intento: '1b9f8e7d-6c5b-4a39-8f27-1e0d9c8b7a6f' });
    assert.equal(inbox.items.length, 2);
  });

  it('refuses a report with neither a screen nor a sentence, and files nothing', async () => {
    const inbox = new RecordingSupportInbox();
    assert.deepEqual(await file(inbox, { pantalla: null, mensaje: ' \n ' }), {
      kind: 'invalid',
      message: 'Dinos en qué pantalla fue o cuéntanos qué pasó.',
    });
    assert.equal(inbox.items.length, 0);
  });

  it('a screen the portal does not have is no screen: only its own names are filed', async () => {
    const inbox = new RecordingSupportInbox();
    const made = '/movimientos\nCuenta: otra@persona.mx';
    assert.equal((await file(inbox, { pantalla: made, mensaje: '' })).kind, 'invalid');
    assert.equal((await file(inbox, { pantalla: '/ayuda', mensaje: '' })).kind, 'invalid');
    assert.equal(inbox.items.length, 0);
    assert.deepEqual(await file(inbox, { pantalla: made }), { kind: 'accepted' });
    assert.ok(theOnlyItem(inbox).body.includes('Pantalla: no la indicó'));
  });

  it('refuses a sentence longer than the form allows', async () => {
    const inbox = new RecordingSupportInbox();
    const outcome = await file(inbox, { mensaje: 'a'.repeat(PORTAL_REPORT_MESSAGE_MAX + 1) });
    assert.deepEqual(outcome, {
      kind: 'invalid',
      message: 'Cuéntanos qué pasó en hasta 4000 caracteres.',
    });
    assert.equal(inbox.items.length, 0);
  });

  it('refuses an attempt id that is not one, so nothing odd becomes an idempotency key', async () => {
    const inbox = new RecordingSupportInbox();
    for (const intento of ['', 'x'.repeat(36), `${INTENTO}:otro`]) {
      assert.equal((await file(inbox, { intento })).kind, 'invalid');
    }
    assert.equal(inbox.items.length, 0);
  });

  it('an inbox that is down is the caller’s to say: it throws and nothing reads as sent', async () => {
    const down: SupportInbox = {
      file: () => Promise.reject(new SupportInboxError('INBOX_UNAVAILABLE', 'down', true)),
    };
    await assert.rejects(() => file(down), /down/);
  });
});
