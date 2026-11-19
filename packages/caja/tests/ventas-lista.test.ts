import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { VENTAS_FIXTURE } from '../src/ventas/fixture';
import {
  cifrasVentas,
  clienteDeFila,
  enTuTurno,
  etiquetaFila,
  lineasResumen,
} from '../src/ventas/lista';
import type { VentaTurno } from '../src/ventas/types';

const ventas = VENTAS_FIXTURE.ventas;

const linea = (concepto: string, cantidad: number, productoId = concepto) => ({
  concepto,
  productoId,
  cantidad,
});

describe('lineasResumen (the row says every product, MvVentas)', () => {
  it('names each line with its pieces, in the order sold', () => {
    assert.equal(
      lineasResumen([linea('Alambre', 2), linea('Agua de horchata', 2), linea('Café', 1)]),
      '2 Alambre · 2 Agua de horchata · 1 Café',
    );
  });

  it('counts a product rung up on two lines once, with its pieces summed', () => {
    assert.equal(
      lineasResumen([
        linea('Taco de pastor', 3, 'p-1'),
        linea('Gringa', 1, 'p-2'),
        linea('Taco de pastor', 2, 'p-1'),
      ]),
      '5 Taco de pastor · 1 Gringa',
    );
  });

  it('a single-piece ticket still says its one', () => {
    assert.equal(lineasResumen([linea('Cerveza', 1)]), '1 Cerveza');
  });

  it('no lines say nothing', () => {
    assert.equal(lineasResumen([]), '');
  });

  it('a line without a product id groups by its words', () => {
    assert.equal(lineasResumen([linea('Café', 1, ''), linea('Café', 1, '')]), '2 Café');
  });

  it('two lines that share only an id keep their own names', () => {
    assert.equal(
      lineasResumen([linea('Volcán', 1, 'p-1'), linea('Consomé', 1, 'p-1')]),
      '1 Volcán · 1 Consomé',
    );
  });
});

describe('enTuTurno (the title line)', () => {
  it('says the active sales and when the turno opened', () => {
    assert.equal(enTuTurno(12, '08:15'), '12 en tu turno, desde las 08:15');
  });

  it('one sale reads the same way', () => {
    assert.equal(enTuTurno(1, '09:00'), '1 en tu turno, desde las 09:00');
  });

  it('without an opening hour it drops the «desde»', () => {
    assert.equal(enTuTurno(3, ''), '3 en tu turno');
  });
});

describe('cifrasVentas (the compact summary)', () => {
  it("is the board's three, agreeing with the fixture turno", () => {
    assert.deepEqual(cifrasVentas(ventas), [
      { k: 'Cobrado', v: '$3,120.00', tono: 'neutro' },
      { k: 'En efectivo', v: '$1,980.00', tono: 'efectivo' },
      { k: 'Canceladas', v: '1', tono: 'neutro' },
    ]);
  });

  it('a cancelled sale counts nowhere but in Canceladas', () => {
    const una: VentaTurno = {
      folio: 'V-0001',
      concepto: '1 Taco',
      monto: 25_00n,
      metodo: 'Efectivo',
      hora: '09:00',
      cancelada: { motivo: 'Error de captura' },
    };
    assert.deepEqual(
      cifrasVentas([una]).map((c) => c.v),
      ['$0.00', '$0.00', '1'],
    );
  });

  it('an empty turno reads zero everywhere', () => {
    assert.deepEqual(
      cifrasVentas([]).map((c) => c.v),
      ['$0.00', '$0.00', '0'],
    );
  });
});

const base: VentaTurno = {
  folio: 'V-0412',
  concepto: '3 Taco de pastor',
  monto: 160_00n,
  metodo: 'Efectivo',
  hora: '14:52',
};

describe('clienteDeFila (the client only on a fiado sale)', () => {
  it('a fiado row says its client', () => {
    assert.equal(
      clienteDeFila({ ...base, metodo: 'Fiado', cliente: 'Taller de Chuy' }),
      'Taller de Chuy',
    );
  });

  it('a paid sale keeps its client off the row', () => {
    assert.equal(clienteDeFila({ ...base, cliente: 'Taller de Chuy' }), null);
  });

  it('a fiado row without a client name says nothing', () => {
    assert.equal(clienteDeFila({ ...base, metodo: 'Fiado' }), null);
  });
});

describe('etiquetaFila (what VoiceOver reads, and what the flows match)', () => {
  it('names the folio, the amount and the method', () => {
    assert.equal(etiquetaFila(base), 'Ver venta V-0412, $160.00, Efectivo');
  });

  it('a fiado sale adds its client, a cancelled one says so', () => {
    assert.equal(
      etiquetaFila({
        ...base,
        monto: 35_00n,
        metodo: 'Fiado',
        cliente: 'Don Pedro',
        cancelada: { motivo: 'Error de captura' },
      }),
      'Ver venta V-0412, $35.00, Fiado, Don Pedro, cancelada',
    );
  });

  it('a paid sale never reads a client', () => {
    assert.equal(
      etiquetaFila({ ...base, cliente: 'Don Pedro' }),
      'Ver venta V-0412, $160.00, Efectivo',
    );
  });
});
