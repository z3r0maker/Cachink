import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { formatMoney } from '@xangarro/domain';
import { reservaMinima } from '@xangarro/domain/corp';

import { graficaDe, parseEscenario, textosDe } from '../src/server/empresa/caja-grafica';
import { pagosDe } from '../src/server/empresa/caja-pagos';
import { flujoDe, fondeoDe, prestamosDe } from '../src/server/empresa/caja-paneles';
import { avisoDe, tilesDe } from '../src/server/empresa/caja-view';
import { autonomiaDeHoy } from '../src/server/empresa/resumen-hero';
import { caja, LLAMADA, MOVS } from './caja-fixture';

/** Caja as board CD-15c shows it (E-23). */
const d = caja();
const a = autonomiaDeHoy(d.movs, d.hoy);

describe('the five tiles', () => {
  it('read cash, where it sits, the spending a month and how long it lasts', () => {
    const t = tilesDe(d, a);
    assert.deepEqual(
      t.map((x) => x.label),
      ['Caja', 'Bancos', 'Stripe por depositar', 'Gasto al mes', 'Meses de caja'],
    );
    assert.equal(t[0]?.valor, formatMoney(130_859_27n));
    assert.equal(t[1]?.nota, 'Confirmado al 31 de octubre en el cierre: $48,210.55');
    assert.deepEqual(t[1]?.enlace, {
      texto: 'Ver el cierre de octubre',
      href: '/empresa/cierre?mes=2026-10',
    });
    assert.equal(t[3]?.nota, 'Promedio de ago a oct, sin el dinero de los socios');
    assert.match(t[4]?.nota ?? '', /^Caja ÷ consumo de \$[\d,]+\.\d\d al mes$/);
  });

  it('say «Sin consumo» when what comes in covers what goes out, and when nothing is confirmed', () => {
    const sobra = caja({
      movs: [
        ...MOVS,
        { entryId: 'x', fecha: '2026-10-20', importe: 60_000_00n, kind: 'cobro', socios: false },
      ],
    });
    const t = tilesDe(sobra, autonomiaDeHoy(sobra.movs, sobra.hoy));
    assert.equal(t[4]?.valor, 'Sin consumo');
    const sin = tilesDe(caja({ confirmado: null }), a);
    assert.equal(sin[1]?.nota, 'Aún sin confirmar en un cierre del mes');
  });
});

describe('the reserve warning', () => {
  it('stays quiet above three months of spending', () => {
    assert.ok(a.caja >= reservaMinima(a.sale));
    assert.equal(avisoDe(d, a), null);
  });

  it('names the open funding call and whose half is missing below it', () => {
    // Without September's funding, and a $10,000.00 expense this month.
    const corta = caja({
      movs: [
        ...MOVS.filter((m) => m.kind !== 'fondeo_mitades'),
        { entryId: 'x', fecha: '2026-11-05', importe: -10_000_00n, kind: 'gasto', socios: false },
      ],
    });
    const ac = autonomiaDeHoy(corta.movs, corta.hoy);
    const aviso = avisoDe(corta, ac);
    assert.equal(aviso?.enlace, 'Ver el fondeo');
    assert.match(aviso?.texto ?? '', /espera la mitad de Fundador 2 · Beto\.$/);
    assert.equal(avisoDe(caja({ ...corta, calls: [] }), ac)?.enlace, 'Pedir fondeo');
  });
});

describe('the chart', () => {
  it('draws the real months from August, then six projected, under the reserve line', () => {
    const g = graficaDe(d.movs, a, 'mantener', d.hoy);
    assert.deepEqual(
      g.barras.map((b) => [b.label, b.real]),
      [
        ['Ago', true],
        ['Sep', true],
        ['Oct', true],
        ['Nov', true],
        ['Dic', false],
        ['Ene', false],
        ['Feb', false],
        ['Mar', false],
        ['Abr', false],
        ['May', false],
      ],
    );
    assert.ok(g.barras.every((b) => b.alto >= 0 && b.alto <= 100));
    assert.ok(g.reservaAlto > 0 && g.reservaAlto < 100);
  });

  it('words the three scenarios as the Resumen does', () => {
    assert.match(textosDe(a, 'mantener', d.hoy)[0], /^Alcanza [\d.]+ meses al ritmo de hoy$/);
    assert.match(
      textosDe(a, 'equilibrio', d.hoy)[1],
      /faltan \$[\d,.]+ al mes para el punto de equilibrio\.$/,
    );
    assert.match(
      textosDe(a, 'detener', d.hoy)[1],
      /bajaría de la reserva mínima en \w+ de \d{4}\.$/,
    );
    assert.equal(parseEscenario('detener'), 'detener');
    assert.equal(parseEscenario('otro'), 'mantener');
  });
});

describe('the panels', () => {
  it('reads last month by kind, partner money apart', () => {
    const f = flujoDe(d);
    assert.equal(f.mes, '2026-10');
    assert.deepEqual(
      f.renglones.map((r) => [r.label, r.valor]),
      [
        ['Cobros de clientes (con IVA)', '+$21,630.00'],
        ['Gastos de operación (con IVA)', formatMoney(-24_118_00n)],
        ['Impuestos pagados', formatMoney(-1_135_33n)],
        ['Comisiones del banco y de Stripe', formatMoney(-17_40n)],
        ['Cambio en la operación', formatMoney(21_630_00n - 24_118_00n - 1_135_33n - 17_40n)],
        ['Aparte: dinero de los socios en octubre', formatMoney(0n)],
      ],
    );
  });

  it('shows the open call’s halves and the loan still owed', () => {
    const f = fondeoDe(d);
    assert.equal(f?.titulo, `${LLAMADA.concepto} · $40,000.00`);
    assert.deepEqual(
      f?.mitades.map((x) => x.pagada),
      [true, false],
    );
    const [p] = prestamosDe(d, a);
    assert.equal(p?.titulo, 'Préstamo de Fundador 1 · Ana');
    assert.match(p?.nota ?? '', /se podría devolver sin bajar de la reserva mínima/);
    assert.equal(fondeoDe(caja({ calls: [] })), null);
  });

  it('lists the next 30 days: charges not yet registered and the ISR e IVA due', () => {
    const p = pagosDe(d);
    assert.deepEqual(
      p.pagos.map((x) => [x.dia, x.nombre, x.monto]),
      [
        ['17 nov', 'ISR e IVA de octubre', p.pagos[0]?.monto],
        ['28 nov', 'Vercel', 'USD 20.00'],
        ['1 dic', 'Contador', '$3,500.00'],
      ],
    );
    assert.match(p.pagos[0]?.fuente ?? '', /^Estimado en Impuestos/);
    assert.match(p.total, / \+ USD 20\.00$/);
  });
});
