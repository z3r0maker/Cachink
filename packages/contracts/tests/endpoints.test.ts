import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { ActivateRequestSchema, ActivationCodeSchema } from '../src/activate.js';
import { DeltaSchema, PushRequestSchema, PushResponseSchema } from '../src/sync-push.js';
import { PullQuerySchema, PullResponseSchema } from '../src/sync-pull.js';
import { MAX_PUSH_DELTAS } from '../src/transport.js';

const ROW = {
  id: '01HZ8XQN9GZJXV8AKQ5X0C7SA0',
  fecha: '2026-09-11',
  hora: null,
  concepto: 'x',
  categoria: 'Producto',
  monto: '100',
  metodo: 'Efectivo',
  clienteId: null,
  estadoPago: 'pagado',
  productoId: '01HZ8XQN9GZJXV8AKQ5X0C7PRD',
  cantidad: 1,
  efectivoRecibidoCentavos: null,
  cancelledByUserId: null,
  cancelMotivo: null,
  cancelledAt: null,
  cajaTurnoId: null,
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
  deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7DEV',
  createdByUserId: null,
  createdAt: '2026-09-11T18:30:00.000Z',
  updatedAt: '2026-09-11T18:30:00.000Z',
  deletedAt: null,
};
const delta = (over: Record<string, unknown> = {}) => ({
  table: 'sales',
  rowId: ROW.id,
  op: 'insert',
  clientSeq: 1,
  row: ROW,
  ...over,
});

describe('activate', () => {
  it('normalises the code (trim/uppercase) and the email (lowercase)', () => {
    const r = ActivateRequestSchema.parse({
      email: ' Dueno@Negocio.MX ',
      code: ' k7m3p9rw ',
      device: { name: 'iPhone', platform: 'ios', appVersion: '1.0.0', osVersion: '18.1' },
    });
    assert.equal(r.code, 'K7M3P9RW');
    assert.equal(r.email, 'dueno@negocio.mx');
  });
  it('rejects ambiguous glyphs, wrong length and unknown platforms', () => {
    assert.throws(() => ActivationCodeSchema.parse('K7M3P9R0'));
    assert.throws(() => ActivationCodeSchema.parse('K7M3P9R'));
    assert.throws(() =>
      ActivateRequestSchema.parse({
        email: 'a@b.mx',
        code: 'K7M3P9RW',
        device: { name: 'x', platform: 'web', appVersion: '1', osVersion: '1' },
      }),
    );
  });
});

describe('sync push', () => {
  it('accepts a wire-form delta and restores bigint money', () => {
    const d = DeltaSchema.parse(delta());
    assert.equal(d.table, 'sales');
    assert.equal((d.row as { monto: bigint }).monto, 100n);
  });
  it('rejects a down-only table at the schema level, so it can never be sent', () => {
    assert.throws(() => DeltaSchema.parse(delta({ table: 'users' })));
  });
  it('rejects an empty batch and a batch over the cap', () => {
    assert.throws(() => PushRequestSchema.parse({ deltas: [] }));
    assert.throws(() =>
      PushRequestSchema.parse({
        deltas: Array.from({ length: MAX_PUSH_DELTAS + 1 }, () => delta()),
      }),
    );
  });
  it('per-row responses carry a catalog code and retryability', () => {
    const r = PushResponseSchema.parse({
      accepted: [{ rowId: ROW.id, clientSeq: 1, serverSeq: 7 }],
      rejected: [
        {
          rowId: 'x',
          clientSeq: 2,
          code: 'FK_PRODUCT_MISSING',
          message: 'no product',
          retryable: false,
        },
      ],
      serverSeq: 7,
      serverTime: '2026-09-11T18:30:00.000Z',
    });
    assert.equal(r.rejected[0]?.code, 'FK_PRODUCT_MISSING');
    assert.throws(() =>
      PushResponseSchema.parse({
        accepted: [],
        rejected: [{ rowId: 'x', clientSeq: 2, code: 'MADE_UP', message: 'm', retryable: false }],
        serverSeq: 0,
        serverTime: '2026-09-11T18:30:00.000Z',
      }),
    );
  });
});

describe('sync pull', () => {
  it('coerces the since query and defaults it to a full bootstrap', () => {
    assert.equal(PullQuerySchema.parse({ since: '42' }).since, 42);
    assert.equal(PullQuerySchema.parse({}).since, 0);
  });
  it('requires acknowledgedThrough and a signed entitlement', () => {
    assert.throws(() =>
      PullResponseSchema.parse({
        serverSeq: 1,
        serverTime: '2026-09-11T18:30:00.000Z',
        tables: {},
      }),
    );
  });
});
