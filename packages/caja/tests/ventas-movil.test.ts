import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { VENTAS_FIXTURE } from '../src/ventas/fixture';
import { DETALLE_CANCELADA, detalleDeFila } from '../src/ventas/detalle/fixture';
import {
  MOTIVOS_CANCELAR,
  avisoCancelada,
  avisoCancelar,
  categoriaDeNombre,
  folioVisto,
  marcarCancelada,
  ventaDetalleDe,
  ventaTurnoDe,
} from '../src/ventas/movil';
import type { VentaTurno } from '../src/ventas/types';

const ventas = VENTAS_FIXTURE.ventas;

describe('marcarCancelada', () => {
  it('keeps the sale listed, marked with its motivo', () => {
    const marcadas = marcarCancelada(ventas, 'V-0412', 'Error de captura');
    assert.equal(marcadas.length, ventas.length);
    const v0412 = marcadas.find((v) => v.folio === 'V-0412');
    assert.deepEqual(v0412?.cancelada, { motivo: 'Error de captura' });
  });

  it('leaves every other row untouched and the original array intact', () => {
    const antes = ventas.map((v) => v.cancelada).join('|');
    const marcadas = marcarCancelada(ventas, 'V-0401', 'Cobro duplicado');
    assert.equal(marcadas.find((v) => v.folio === 'V-0405')?.cancelada?.motivo, 'error de captura');
    assert.equal(ventas.map((v) => v.cancelada).join('|'), antes);
    assert.equal(ventas.find((v) => v.folio === 'V-0401')?.cancelada, undefined);
  });

  it('marks nothing when the folio is not in the turno', () => {
    assert.deepEqual(marcarCancelada(ventas, 'V-9999', 'x'), ventas);
  });
});

describe('avisoCancelada (the toast the board words)', () => {
  it('says the folio, the amount, the motivo, and where it stays', () => {
    const v: VentaTurno = {
      folio: 'V-0412',
      concepto: 'x',
      monto: 160_00n,
      metodo: 'Efectivo',
      hora: '14:52',
    };
    assert.equal(
      avisoCancelada({ ...v, cancelada: { motivo: 'Error de captura' } }),
      'V-0412 por $160.00 · Error de captura. Queda visible en tu turno y en el corte.',
    );
  });
});

describe('avisoCancelar (the dialog consequence)', () => {
  it('for a cash sale: not deleted, and the amount leaves the expected cash', () => {
    assert.equal(
      avisoCancelar('Efectivo', 160_00n),
      'La venta no se borra: queda marcada como cancelada, con tu nombre y el motivo. ' +
        'Si fue en efectivo, el monto sale de lo esperado en tu caja al cerrar el turno.',
    );
  });

  it('for a fiado sale: the client balance drops, and an abono stays in their favor', () => {
    const texto = avisoCancelar('Fiado', 90_00n, 'Doña Mari de la tienda', 'Pedro');
    assert.match(texto, /saldo de Doña Mari de la tienda baja \$90\.00/);
    assert.match(texto, /saldo a favor suyo/);
    assert.match(texto, /Pedro lo ve marcado en su portal/);
  });

  it('for tarjeta: only that it leaves the turno and the owner sees it', () => {
    assert.equal(
      avisoCancelar('Tarjeta', 396_00n, undefined, 'Lupita'),
      'Sale de tus ventas del turno y Lupita lo ve en su portal. ' +
        'Si hay que devolver el dinero, se hace por el mismo medio.',
    );
  });
});

describe('folioVisto', () => {
  it('pads to the four the operator says', () => {
    assert.equal(folioVisto(412), 'V-0412');
    assert.equal(folioVisto(12034), 'V-12034');
  });
});

describe('categoriaDeNombre', () => {
  it("says the catalogue's four families from the line's words", () => {
    assert.equal(categoriaDeNombre('Taco de pastor'), 'Tacos');
    assert.equal(categoriaDeNombre('Gringa'), 'Guisados');
    assert.equal(categoriaDeNombre('Orden de pastor'), 'Guisados');
    assert.equal(categoriaDeNombre('Agua de horchata'), 'Bebidas');
    assert.equal(categoriaDeNombre('Refresco 600 ml'), 'Bebidas');
    assert.equal(categoriaDeNombre('Consomé'), 'Extras');
  });
});

const TICKET = {
  id: 't-1',
  folio: 412,
  fecha: '2026-05-14',
  hora: '14:52',
  concepto: '3 pastor · 1 gringa · 1 horchata',
  metodo: 'Efectivo',
  efectivoRecibidoCentavos: 200_00n,
  cancelMotivo: null,
};

const LINEAS = [
  { concepto: 'Taco de pastor', productoId: 'p-1', cantidad: 3, monto: 75_00n },
  { concepto: 'Gringa', productoId: 'p-2', cantidad: 1, monto: 60_00n },
];

describe('ventaTurnoDe', () => {
  it('builds the row: folio seen, lines summed, method said like the operator', () => {
    const v = ventaTurnoDe(TICKET, LINEAS);
    assert.equal(v.id, 't-1');
    assert.equal(v.folio, 'V-0412');
    assert.equal(v.monto, 135_00n);
    assert.equal(v.metodo, 'Efectivo');
    assert.equal(v.hora, '14:52');
    assert.equal(v.cliente, undefined);
  });

  it('Crédito reads as Fiado with its client; the motivo survives', () => {
    const v = ventaTurnoDe(
      { ...TICKET, metodo: 'Crédito', cancelMotivo: 'Error de captura' },
      LINEAS,
      'Taller de Chuy',
    );
    assert.equal(v.metodo, 'Fiado');
    assert.equal(v.cliente, 'Taller de Chuy');
    assert.deepEqual(v.cancelada, { motivo: 'Error de captura' });
  });

  it('an empty hora reads as an empty string, never null', () => {
    const v = ventaTurnoDe({ ...TICKET, hora: null }, []);
    assert.equal(v.hora, '');
    assert.equal(v.monto, 0n);
  });
});

describe('ventaDetalleDe', () => {
  it('builds the drawer ticket: priced lines, cash received, «Hoy» when it is today', () => {
    const d = ventaDetalleDe(TICKET, LINEAS, { hoy: '2026-05-14' });
    assert.equal(d.folio, 'V-0412');
    assert.equal(d.cuando, 'Hoy 14:52');
    assert.equal(d.recibido, 200_00n);
    assert.equal(d.lineas.length, 2);
    const pastor = d.lineas[0];
    assert.equal(pastor?.precio, 25_00n);
    assert.equal(pastor?.categoria, 'Tacos');
  });

  it('another day reads as its short date, and a line that does not divide keeps no unit price', () => {
    const d = ventaDetalleDe(
      TICKET,
      [{ concepto: 'Orden mixta', productoId: 'p-9', cantidad: 3, monto: 100_00n }],
      { hoy: '2026-06-01' },
    );
    assert.equal(d.cuando, '14 may');
    assert.equal(d.lineas[0]?.precio, undefined);
    assert.equal(d.total, 100_00n);
  });

  it('a fiado ticket carries its client and saldo; a cancelled one its motivo', () => {
    const fiado = ventaDetalleDe(
      { ...TICKET, metodo: 'Crédito', efectivoRecibidoCentavos: null },
      LINEAS,
      { hoy: '2026-05-14', cliente: { nombre: 'Doña Mari de la tienda', saldo: 340_00n } },
    );
    assert.deepEqual(fiado.fiado, { cliente: 'Doña Mari de la tienda', saldo: 340_00n });
    assert.equal(fiado.recibido, undefined);

    const cancelada = ventaDetalleDe({ ...TICKET, cancelMotivo: 'Cobro duplicado' }, LINEAS, {
      hoy: '2026-05-14',
    });
    assert.deepEqual(cancelada.cancelada, { motivo: 'Cobro duplicado' });
  });

  it('agrees with the fixture for V-0405: cancelled, sixty pesos, one gringa', () => {
    const fila = ventas.find((v) => v.folio === 'V-0405');
    assert.ok(fila);
    const base = detalleDeFila(fila);
    assert.equal(DETALLE_CANCELADA.folio, base.folio);
    assert.equal(DETALLE_CANCELADA.total, base.total);
    assert.deepEqual(DETALLE_CANCELADA.cancelada, fila.cancelada);
  });
});

describe('MOTIVOS_CANCELAR', () => {
  it("is the board's four, verbatim", () => {
    assert.deepEqual(MOTIVOS_CANCELAR, [
      'Error de captura',
      'El cliente se arrepintió',
      'Producto equivocado',
      'Cobro duplicado',
    ]);
  });
});
