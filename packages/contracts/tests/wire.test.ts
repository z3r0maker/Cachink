import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { SaleSchema } from '@xangarro/domain';
import { bigintKeys, decodeJson, encodeJson, wireSchema } from '../src/wire.js';

const SALE = {
  id: '01HZ8XQN9GZJXV8AKQ5X0C7SA0',
  fecha: '2026-09-11',
  hora: '12:30',
  concepto: 'Tacos x3',
  categoria: 'Producto',
  monto: 4500n,
  metodo: 'Efectivo',
  clienteId: null,
  estadoPago: 'pagado',
  productoId: '01HZ8XQN9GZJXV8AKQ5X0C7PRD',
  cantidad: 3,
  efectivoRecibidoCentavos: 5000n,
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

describe('wire codec', () => {
  it('finds the bigint keys from the schema, including nullable/default wrappers', () => {
    assert.deepEqual([...bigintKeys(SaleSchema)].sort(), ['efectivoRecibidoCentavos', 'monto']);
  });

  it('round-trips a sale through JSON with bigints as decimal strings', () => {
    const text = encodeJson(SALE);
    assert.match(text, /"monto":"4500"/);
    const back = wireSchema(SaleSchema).parse(decodeJson(text));
    assert.equal(back.monto, 4500n);
    assert.equal(back.efectivoRecibidoCentavos, 5000n);
  });

  it('accepts real bigints in-process and still validates the rest', () => {
    const parsed = wireSchema(SaleSchema).parse(SALE);
    assert.equal(parsed.cantidad, 3);
  });

  it('rejects a non-decimal string in a bigint field', () => {
    assert.throws(() => wireSchema(SaleSchema).parse({ ...SALE, monto: '45.00' }));
  });

  it('rejects a bigint field that is missing', () => {
    const { monto: _m, ...noMonto } = SALE;
    assert.throws(() => wireSchema(SaleSchema).parse(noMonto));
  });
});
