/**
 * SolicitarArcoUseCase (N-34) — an ARCO request becomes an `arco` inbox item
 * with its folio and the legal deadline to answer.
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';

import {
  RecordingSupportInbox,
  SolicitarArcoUseCase,
  SupportInboxError,
  type InboxItemRequest,
  type SupportInbox,
} from '../../src/support-inbox/index.js';

const SOLICITUD = {
  nombre: 'Ana López',
  correo: 'ana@example.mx',
  derecho: 'cancelacion',
  descripcion: 'Quiero que borren mi cuenta y mis datos.',
};
// Wed 23 Sep 2026, 11:00 in Mexico City.
const NOW = new Date('2026-09-23T17:00:00Z');

describe('SolicitarArcoUseCase', () => {
  let inbox: RecordingSupportInbox;
  let n: number;
  let useCase: SolicitarArcoUseCase;

  beforeEach(() => {
    inbox = new RecordingSupportInbox();
    n = 0;
    useCase = new SolicitarArcoUseCase({
      inbox,
      now: () => NOW,
      newFolio: () => `ARCO-${++n}`,
    });
  });

  it('files an arco item with the folio and the 20-día-hábil deadline', async () => {
    const result = await useCase.execute({ solicitud: SOLICITUD, businessId: null });
    assert.deepEqual(result, {
      ok: true,
      folio: 'ARCO-1',
      plazos: { recibida: '2026-09-23', responderA: '2026-10-21', ejecutarA: '2026-11-11' },
    });
    const [item] = inbox.items as InboxItemRequest[];
    assert.equal(item?.kind, 'arco');
    assert.equal(item?.dueAt, '2026-10-21T23:59:59-06:00');
    assert.equal(item?.sourceRef, 'ARCO-1');
    assert.equal(item?.businessId, null);
    assert.match(item?.title ?? '', /Cancelación · responder antes del 2026-10-21/);
    assert.match(item?.body ?? '', /Ana López <ana@example\.mx>/);
    assert.match(item?.body ?? '', /acreditar la identidad/);
  });

  it('carries the member’s business when filed from the portal', async () => {
    await useCase.execute({ solicitud: SOLICITUD, businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' });
    assert.equal(inbox.items[0]?.businessId, '01HZ8XQN9GZJXV8AKQ5X0C7BJZ');
  });

  it('refuses an invalid request, naming the field, and files nothing', async () => {
    const bad = await useCase.execute({
      solicitud: { ...SOLICITUD, correo: 'ana' },
      businessId: null,
    });
    assert.deepEqual(bad, { ok: false, code: 'ARCO_INVALID', field: 'correo' });
    const unknown = await useCase.execute({
      solicitud: { ...SOLICITUD, derecho: 'olvido' },
      businessId: null,
    });
    assert.equal(unknown.ok, false);
    assert.equal(inbox.items.length, 0);
  });

  it('refuses a request that is not an object at all', async () => {
    const result = await useCase.execute({ solicitud: null, businessId: null });
    assert.deepEqual(result, { ok: false, code: 'ARCO_INVALID', field: 'solicitud' });
  });

  it('lets an inbox failure through, so the titular is told it did not go', async () => {
    const failing: SupportInbox = {
      file: () => Promise.reject(new SupportInboxError('INBOX_UNAVAILABLE', '503', true)),
    };
    const broken = new SolicitarArcoUseCase({
      inbox: failing,
      now: () => NOW,
      newFolio: () => 'X',
    });
    await assert.rejects(
      broken.execute({ solicitud: SOLICITUD, businessId: null }),
      SupportInboxError,
    );
  });
});
