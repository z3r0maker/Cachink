import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  facturaDelNegocio,
  FacturaError,
  facturaParaCliente,
  facturasDelNegocio,
  type FacturaRegistrada,
} from '../../src/cfdi/index.js';
import { registrada } from './support/facturas.js';

const source = (rows: readonly FacturaRegistrada[]) => () => Promise.resolve(rows);
const rejectsWith = (p: Promise<unknown>, code: string) =>
  assert.rejects(p, (e: unknown) => e instanceof FacturaError && e.code === code);

describe('facturaParaCliente: the CFDI_MODE rules', () => {
  it('test/live: a PAC-stamped payment downloads as PDF and XML', () => {
    const f = facturaParaCliente(registrada(), 'live');
    assert.equal(f.estado, 'timbrada');
    assert.equal(f.pdfDisponible && f.xmlDisponible, true);
    assert.equal(f.puedeSolicitarNominal, false);
  });

  it('off: a payment not yet marked stays pendiente, with nothing to download', () => {
    const f = facturaParaCliente(
      registrada({
        estado: 'pendiente',
        cfdiUuid: null,
        pdfDisponible: false,
        xmlDisponible: false,
      }),
      'off',
    );
    assert.equal(f.estado, 'pendiente');
    assert.equal(f.pdfDisponible || f.xmlDisponible, false);
  });

  it('off: marked with its UUID in the backoffice → timbrada, emitidaManual, no download', () => {
    const f = facturaParaCliente(
      registrada({ emitidaManual: true, pdfDisponible: false, xmlDisponible: false }),
      'off',
    );
    assert.equal(f.estado, 'timbrada');
    assert.equal(f.emitidaManual, true);
    assert.equal(f.pdfDisponible || f.xmlDisponible, false);
  });

  it('off: even a PAC document from an earlier test/live run is not offered', () => {
    const f = facturaParaCliente(registrada(), 'off');
    assert.equal(f.pdfDisponible || f.xmlDisponible, false);
  });

  it('only en_global can ask for a nominative CFDI', () => {
    assert.equal(
      facturaParaCliente(registrada({ estado: 'en_global' }), 'off').puedeSolicitarNominal,
      true,
    );
    assert.equal(
      facturaParaCliente(registrada({ estado: 'error' }), 'test').puedeSolicitarNominal,
      false,
    );
  });

  it('refuses a state the customer screen does not know', () => {
    const odd = registrada({ estado: 'stamped' as never });
    assert.throws(
      () => facturaParaCliente(odd, 'test'),
      (e: unknown) => e instanceof FacturaError,
    );
  });
});

describe('facturasDelNegocio', () => {
  it('asks the source for the business and maps every row, order kept', async () => {
    const asked: string[] = [];
    const rows = [registrada({ paymentId: 'in_2' }), registrada({ paymentId: 'in_1' })];
    const list = await facturasDelNegocio(
      {
        mode: 'test',
        source: (id) => {
          asked.push(id);
          return Promise.resolve(rows);
        },
      },
      'BIZ',
    );
    assert.deepEqual(asked, ['BIZ']);
    assert.deepEqual(
      list.map((f) => f.paymentId),
      ['in_2', 'in_1'],
    );
  });

  it('refuses an empty business id without asking the database', async () => {
    await rejectsWith(
      facturasDelNegocio({ mode: 'off', source: source([]) }, ' '),
      'DATO_INVALIDO',
    );
  });

  it('propagates a database failure', async () => {
    const broken = () => Promise.reject(new Error('connection refused'));
    await assert.rejects(facturasDelNegocio({ mode: 'off', source: broken }, 'BIZ'), /refused/);
  });

  it('facturaDelNegocio: a payment not in the business list is NO_ENCONTRADA', async () => {
    const deps = { mode: 'off' as const, source: source([registrada()]) };
    assert.equal((await facturaDelNegocio(deps, 'BIZ', 'in_1')).paymentId, 'in_1');
    await rejectsWith(facturaDelNegocio(deps, 'BIZ', 'in_otro'), 'NO_ENCONTRADA');
  });
});
