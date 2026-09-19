import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  ActivateRequestSchema,
  ActivationCodeSchema,
  ReferenceTablesSchema,
} from '../src/activate.js';
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
  it('accepts the browser register as a platform (C-16, ADR-071)', () => {
    const r = ActivateRequestSchema.parse({
      email: 'a@b.mx',
      code: 'K7M3P9RW',
      device: { name: 'Caja 1', platform: 'web', appVersion: '1.0.0', osVersion: 'Mac OS 15' },
    });
    assert.equal(r.device.platform, 'web');
  });
  it('rejects ambiguous glyphs, wrong length and unknown platforms', () => {
    assert.throws(() => ActivationCodeSchema.parse('K7M3P9R0'));
    assert.throws(() => ActivationCodeSchema.parse('K7M3P9R'));
    assert.throws(() =>
      ActivateRequestSchema.parse({
        email: 'a@b.mx',
        code: 'K7M3P9RW',
        device: { name: 'x', platform: 'windows', appVersion: '1', osVersion: '1' },
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
  it('carries an operator reply as one UP delta (C-19, ADR-075)', () => {
    const d = DeltaSchema.parse({
      table: 'respuestas_operador',
      rowId: '01HZ8XQN9GZJXV8AKQ5X0C7RS1',
      op: 'insert',
      clientSeq: 9,
      row: {
        id: '01HZ8XQN9GZJXV8AKQ5X0C7RS1',
        mensajeId: '01HZ8XQN9GZJXV8AKQ5X0C7MS1',
        texto: 'Faltó cambio del billete de $500',
        businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
        deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7DEV',
        createdByUserId: '01HZ8XQN9GZJXV8AKQ5X0C7TA1',
        createdAt: '2026-09-11T18:30:00.000Z',
        updatedAt: '2026-09-11T18:30:00.000Z',
        deletedAt: null,
      },
    });
    assert.equal(d.table, 'respuestas_operador');
  });
  it('never lets a message itself be pushed — it is DOWN (C-19)', () => {
    assert.throws(() =>
      DeltaSchema.parse({
        table: 'mensajes_operador',
        rowId: '01HZ8XQN9GZJXV8AKQ5X0C7MS1',
        op: 'insert',
        clientSeq: 1,
        row: { id: '01HZ8XQN9GZJXV8AKQ5X0C7MS1' },
      }),
    );
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
  it('serves owner messages in the tables, defaulting to none for old servers (C-19)', () => {
    const mensaje = {
      id: '01HZ8XQN9GZJXV8AKQ5X0C7MS1',
      operadorId: '01HZ8XQN9GZJXV8AKQ5X0C7TA1',
      cajaTurnoId: null,
      severidad: 'info',
      cuerpo: 'La gringa sube a $65 desde mañana',
      businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
      deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7DEV',
      createdByUserId: null,
      createdAt: '2026-09-11T18:30:00.000Z',
      updatedAt: '2026-09-11T18:30:00.000Z',
      deletedAt: null,
    };
    const base = {
      businesses: [],
      products: [],
      clients: [],
      users: [],
      employees: [],
      recurring_expenses: [],
      feature_flags: {},
    };
    const tables = ReferenceTablesSchema.parse({ ...base, mensajes_operador: [mensaje] });
    assert.equal(tables.mensajes_operador?.length, 1);
    assert.deepEqual(ReferenceTablesSchema.parse(base).mensajes_operador, []);
  });
});
