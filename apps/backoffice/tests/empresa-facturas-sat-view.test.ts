import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { facturasHref } from '../src/server/empresa/facturas-rutas';
import { filaFactura } from '../src/server/empresa/facturas-view';
import { pagoFactura } from '../src/server/empresa/pago-factura-view';
import { mensajeConsultaSat } from '../src/server/empresa/sat-fila-view';
import { delMes, despacho, factura } from './empresa-facturas-fixture';

/** E-11, board CD-06g: what the «Estado SAT» column offers beyond its tag. */
const sinVerificar = delMes(factura({ fecha: '2026-10-27' }, { estadoSat: 'sin_verificar' }));
const uuid = sinVerificar.factura.cfdi.uuid;

describe('the SAT column of a received invoice (board CD-06g)', () => {
  it('offers «Consultar al SAT» on a registered invoice the SAT did not answer for', () => {
    const f = filaFactura(sinVerificar);
    assert.equal(f.estado, 'Sin verificar');
    assert.deepEqual(f.sat, { tipo: 'consultar', uuid, mes: '2026-10' });
  });

  it('says the SAT confirmed it today, only on the invoice just asked about', () => {
    const vigente = delMes({ ...sinVerificar.factura, estadoSat: 'vigente' });
    assert.deepEqual(filaFactura(vigente, uuid).sat, { tipo: 'confirmada' });
    assert.deepEqual(filaFactura(vigente).sat, { tipo: 'nada' });
    assert.deepEqual(filaFactura(vigente, 'otra').sat, { tipo: 'nada' });
  });

  it('warns about one still owed that the SAT says is cancelled, offering to cancel it', () => {
    const f = filaFactura(delMes({ ...despacho.factura, estadoSat: 'cancelado' }));
    assert.equal(f.estado, 'Cancelada en el SAT');
    assert.deepEqual(f.sat, {
      tipo: 'aviso',
      pago: pagoFactura(despacho.factura),
      cancelable: true,
    });
    // Not paid any more: its warning offers to cancel it.
    assert.deepEqual(f.destino, {
      tipo: 'enlace',
      href: '/empresa/movimientos/e2',
      texto: 'Administración',
    });
  });

  it('only warns about a paid one: its money did leave the bank (owner, 2026-10-31)', () => {
    const pagada = delMes({ ...despacho.factura, estadoSat: 'cancelado', pagoEntryId: 'p1' });
    assert.deepEqual(filaFactura(pagada).sat, {
      tipo: 'aviso',
      pago: pagoFactura(despacho.factura),
      cancelable: false,
    });
    const contado = delMes(factura({ fecha: '2026-10-15' }, { estadoSat: 'cancelado' }));
    const sat = filaFactura(contado).sat;
    assert.ok(sat.tipo === 'aviso' && !sat.cancelable);
  });

  it('stops warning once its expense is reversed, and never offers to ask again', () => {
    const revertida = delMes({ ...despacho.factura, estadoSat: 'cancelado' }, true);
    assert.deepEqual(filaFactura(revertida).sat, { tipo: 'nada' });
    const cancelada = delMes({ ...sinVerificar.factura, estado: 'cancelada' }, true);
    assert.equal(filaFactura(cancelada).estado, 'Cancelada');
    assert.deepEqual(filaFactura(cancelada).sat, { tipo: 'nada' });
  });
});

describe('facturasHref', () => {
  it('goes back to the invoice’s month with what the page says next', () => {
    assert.equal(
      facturasHref('2026-10', { consultada: uuid }),
      `/empresa/facturas?mes=2026-10&consultada=${uuid}`,
    );
    assert.equal(facturasHref('2026-10', {}), '/empresa/facturas?mes=2026-10');
  });

  it('drops a month that is not one', () => {
    assert.equal(
      facturasHref('2026-13', { aviso: 'cancelada' }),
      '/empresa/facturas?aviso=cancelada',
    );
    assert.equal(facturasHref('', {}), '/empresa/facturas');
  });
});

describe('mensajeConsultaSat', () => {
  it('names why the invoice is still unverified', () => {
    assert.equal(
      mensajeConsultaSat('sin_respuesta'),
      'El SAT no respondió. Intenta en unos minutos.',
    );
    assert.equal(
      mensajeConsultaSat('no_encontrado'),
      'El SAT todavía no la encuentra. Intenta mañana.',
    );
    assert.equal(mensajeConsultaSat('vigente'), null);
    assert.equal(mensajeConsultaSat('cancelado'), null);
  });
});
