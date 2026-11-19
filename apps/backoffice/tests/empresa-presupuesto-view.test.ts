import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { calculoDe } from '../src/server/empresa/presupuesto-calculo';
import { avanceDelTrimestre, encabezadoDe } from '../src/server/empresa/presupuesto-encabezado';
import { fueraDe, limiteDe } from '../src/server/empresa/presupuesto-fuera';
import { lineasDe, tilesDe } from '../src/server/empresa/presupuesto-tablero';
import { APROBADO, datos, IMPORTES, PENDIENTE_1T } from './presupuesto-fixture';

/** Presupuesto's page as board CD-15d shows it (E-22). */
const c = calculoDe(datos());
const valores = (vista: 'mes' | 'trimestre') =>
  tilesDe(c, APROBADO, datos().solicitudes, vista, avanceDelTrimestre(c)).map((t) => [
    t.label,
    t.valor,
    t.nota,
  ]);

describe('Presupuesto · el mes contra su presupuesto', () => {
  it('shows the four tiles of board CD-15d', () => {
    assert.deepEqual(valores('mes'), [
      ['Presupuesto de noviembre', '$31,000.00', '4 categorías'],
      ['Gastado al 19 nov', '$18,240.00', '59 % del presupuesto en 63 % del mes'],
      ['Proyección a fin de mes', '$32,050.00', 'Se pasaría por $1,050.00 (Ventas y marketing)'],
      ['Fuera del presupuesto', '$4,279.00', '2 gastos · 1 solicitud por aprobar'],
    ]);
  });

  it('draws each category with its spent, projection and budget, bank fees left out', () => {
    const [costo, ventas] = lineasDe(c, APROBADO, 'mes');
    assert.equal(costo?.cifras, '$6,010.00 de $8,500.00');
    assert.equal(costo?.nota, 'Proyección $8,500.00 · dentro');
    assert.equal(ventas?.nota, 'Proyección $13,050.00 · se pasaría por $1,050.00');
    assert.equal(ventas?.sobre, true);
    assert.equal(ventas?.proyeccion, 100);
    assert.equal(ventas?.href, '/empresa/movimientos?mes=2026-11&ver=gastos&cat=ventas_marketing');
  });

  it('says who approved the budget and offers the next quarter', () => {
    const e = encabezadoDe(c, datos().socios, 'f1', 'mes');
    assert.equal(e.sub, 'Noviembre de 2026 · al día 19 · 4T 2026');
    assert.equal(
      e.aprobado,
      'Presupuesto del 4T 2026 · aprobado por Fundador 1 y Fundador 2 el 2 oct · $31,000.00 al mes',
    );
    assert.equal(e.preparar?.texto, 'Preparar el presupuesto del 1T 2027');
    assert.equal(e.aviso, null);
    assert.equal(e.vacio, null);
  });
});

describe('Presupuesto · el trimestre completo', () => {
  it('projects the months ahead with their recurring charges and the average of the rest', () => {
    assert.deepEqual(valores('trimestre'), [
      ['Presupuesto del 4T 2026', '$93,000.00', '$31,000.00 al mes · 4 categorías'],
      ['Gastado al 19 nov', '$30,240.00', 'Octubre completo y noviembre al día 19'],
      ['Proyección al 31 dic', '$75,860.00', 'Se pasaría por $9,130.00 (Desarrollo)'],
      ['Fuera del presupuesto', '$4,279.00', '2 gastos en el trimestre · 1 solicitud por aprobar'],
    ]);
  });

  it('names the quarter and its months under the title', () => {
    const e = encabezadoDe(c, datos().socios, 'f1', 'trimestre');
    assert.equal(e.sub, '4T 2026 · octubre a diciembre, al 19 de noviembre');
  });
});

describe('Presupuesto · el Límite de cada socio', () => {
  it('is 10 % of the average income without IVA, with what each used', () => {
    const l = limiteDe(c, datos().solicitudes, datos().socios, 'f1');
    assert.equal(l.monto, '$1,560.00');
    assert.match(l.texto, /\(\$15,600\.00\)/);
    assert.deepEqual(
      l.socios.map((s) => [s.nombre, s.usado, s.detalle]),
      [
        ['Fundador 1', '$279.00', 'Canva el 12 nov. Te quedan $1,281.00 este mes.'],
        ['Fundador 2', '$0.00', 'Tiene una solicitud de $6,000.00 esperando tu aprobación.'],
      ],
    );
  });

  it('falls to the fixed $1,000.00 with no income', () => {
    const sin = calculoDe(datos({ importes: IMPORTES.filter((i) => i.cuenta !== 'ingresos') }));
    const l = limiteDe(sin, [], datos().socios, 'f1');
    assert.equal(l.monto, '$1,000.00');
    assert.match(l.texto, /^Sin ingresos en los últimos 3 meses aplica el mínimo/);
  });
});

describe('Presupuesto · fuera del presupuesto', () => {
  it('asks this founder for the other one’s request, with its effect on the month', () => {
    const f = fueraDe(c, datos().solicitudes, datos().socios, 'f1', 'mes');
    assert.deepEqual(
      f.porAprobar.map((s) => [s.concepto, s.monto, s.efecto]),
      [
        [
          'Campaña de video para Instagram',
          '$6,000.00',
          'Con este gasto, noviembre cerraría en $38,050.00, 23 % sobre el presupuesto.',
        ],
      ],
    );
    assert.deepEqual(
      f.filas.map((x) => [x.concepto, x.estado, x.detalle]),
      [
        [
          'Canva',
          'Sin aprobación',
          'Fundador 1 · 12 nov · dentro de su límite, no requirió aprobación',
        ],
        [
          'Dominio xangarro.com.mx por 5 años',
          'Aprobado',
          'Fundador 2 · 4 nov · aprobado por Fundador 1 el 5 nov',
        ],
      ],
    );
  });

  it('shows the requester their own request waiting, not the buttons', () => {
    const f = fueraDe(c, datos().solicitudes, datos().socios, 'f2', 'mes');
    assert.equal(f.porAprobar.length, 0);
    assert.equal(f.filas[0]?.estado, 'Por aprobar');
  });
});

describe('Presupuesto · sin presupuesto o por aprobar', () => {
  it('offers this quarter, from the last one’s spending, when it has no budget', () => {
    const sin = calculoDe(datos({ presupuestos: [] }));
    const e = encabezadoDe(sin, datos().socios, 'f1', 'mes');
    assert.equal(e.vacio?.titulo, 'El 4T 2026 aún no tiene presupuesto');
    assert.match(e.vacio?.texto ?? '', /gastado en el 3T .*\$19,000\.00 al mes en promedio/);
    assert.equal(e.preparar?.texto, 'Preparar el presupuesto del 4T 2026');
  });

  it('asks the other founder to review a budget waiting on them', () => {
    const p = calculoDe(datos({ presupuestos: [APROBADO, PENDIENTE_1T] }));
    const otro = encabezadoDe(p, datos().socios, 'f2', 'mes');
    assert.equal(
      otro.aviso?.titulo,
      'Fundador 1 preparó el presupuesto del 1T 2027: $33,000.00 al mes',
    );
    assert.equal(
      otro.aviso?.texto,
      'Enviado el 18 nov. Empieza a contar el 1 de enero, cuando lo apruebes.',
    );
    assert.equal(otro.aviso?.href, '/empresa/presupuesto?panel=aprobar');
    assert.equal(otro.preparar, null);
    const mio = encabezadoDe(p, datos().socios, 'f1', 'mes');
    assert.equal(mio.aviso?.href, null);
    assert.match(mio.aviso?.titulo ?? '', /^Enviaste el presupuesto del 1T 2027 a Fundador 2/);
  });
});
