import assert from 'node:assert/strict';
import type { Autonomia, Certificado } from '@xangarro/domain/corp';
import { describe, it } from 'vitest';

import type { ItemAgenda } from '../src/server/empresa/agenda-view';
import { proximos, senalesDe } from '../src/server/empresa/resumen-senales';

/** Resumen's «Señales» and «Próximos vencimientos» (E-16, board CD-12b). */
const AUTONOMIA: Autonomia = {
  caja: 112_640_50n,
  mesesConDatos: 3,
  entra: 4_180_00n,
  sale: 21_350_00n,
  neto: -17_170_00n,
  autosuficiente: false,
  enDoceMeses: null,
  caidaMaximaBps: null,
  equilibrio: 21_350_00n,
  mesesDeCaja: 6.5,
  mesesSinIngresos: 5.2,
};

const csd = (dias: number): { certificado: Certificado; dias: number } => ({
  certificado: {
    id: 'c1',
    tipo: 'csd',
    titular: 'mexia',
    serie: '00001000000512344821',
    vence: '',
  },
  dias,
});

const item = (titulo: string, fecha: string, tarde: boolean): ItemAgenda & { vence: string } => ({
  key: titulo,
  href: '/empresa/agenda/x/2026-10',
  titulo,
  fundamento: 'CFF',
  autoridad: 'SAT',
  fecha,
  falta: tarde ? 'vencida hace 3 días' : 'en 17 días',
  tarde,
  estado: 'Pendiente',
  tono: tarde ? 'bad' : 'off',
  vence: '',
});

const base = {
  margenBruto: 6200 as number | null,
  periodo: '2026-10',
  autonomia: AUTONOMIA,
  certificados: [csd(41)],
  vencidas: [item('Buzón tributario', '30 oct', true)],
};

describe('senalesDe', () => {
  it('lights the board’s three signals in its order', () => {
    const s = senalesDe(base);
    assert.deepEqual(
      s.map((x) => [x.titulo, x.tono, x.accion, x.href]),
      [
        [
          'El margen bruto está en 62 %',
          'info',
          'Ver resultados',
          '/empresa/resultados?periodo=2026-10',
        ],
        ['El CSD vence en 41 días', 'warn', 'Ver certificados', '/empresa/corporativo'],
        ['Buzón tributario', 'bad', 'Ver agenda', '/empresa/agenda'],
      ],
    );
    assert.equal(
      s[0]?.porque,
      'La señal se enciende abajo de 70 %. El costo del servicio es 38 % de los ingresos.',
    );
    assert.equal(s[1]?.porque, 'Si vence, no se puede facturar.');
    assert.equal(s[2]?.porque, 'Vencida desde el 30 oct.');
  });

  it('lights runway under six months', () => {
    const s = senalesDe({ ...base, autonomia: { ...AUTONOMIA, mesesDeCaja: 4.2 } });
    const runway = s.find((x) => x.titulo === 'La caja alcanza para 4.2 meses');
    assert.ok(runway);
    assert.equal(runway.tono, 'bad');
    assert.match(runway.porque, /abajo de 6 meses\. Cada mes salen \$17,170 más/);
  });

  it('stays dark at the thresholds and without data', () => {
    const s = senalesDe({
      margenBruto: 7000,
      periodo: '2026-10',
      autonomia: { ...AUTONOMIA, mesesDeCaja: 6 },
      certificados: [],
      vencidas: [],
    });
    assert.deepEqual(s, []);
    assert.deepEqual(senalesDe({ ...base, margenBruto: null, certificados: [], vencidas: [] }), []);
  });

  it('turns an expired certificate red and names an e.firma’s holder', () => {
    const efirma = {
      certificado: { ...csd(0).certificado, tipo: 'efirma' as const, titular: 'f2' as const },
      dias: 1,
    };
    const s = senalesDe({
      ...base,
      margenBruto: null,
      vencidas: [],
      certificados: [csd(-3), efirma],
    });
    assert.deepEqual(
      s.map((x) => [x.titulo, x.tono]),
      [
        ['El CSD venció hace 3 días', 'bad'],
        ['La e.firma del Fundador 2 vence mañana', 'warn'],
      ],
    );
  });

  it('gathers several overdue items into one signal', () => {
    const s = senalesDe({
      ...base,
      margenBruto: null,
      certificados: [],
      vencidas: [
        item('ISR de septiembre', '17 oct', true),
        item('Buzón tributario', '30 oct', true),
      ],
    });
    assert.equal(s.length, 1);
    assert.equal(s[0]?.titulo, '2 obligaciones vencidas');
    assert.equal(s[0]?.porque, 'La más antigua, ISR de septiembre, venció el 17 oct.');
  });
});

describe('proximos', () => {
  it('keeps the next three open items and leaves the late ones to the signals', () => {
    const grupos = [
      { label: 'Vencidas' as const, items: [item('Tarde', '1 oct', true)] },
      {
        label: 'Esta semana y la siguiente' as const,
        items: [item('A', '5 nov', false), item('B', '6 nov', false)],
      },
      {
        label: 'Más adelante' as const,
        items: [item('C', '1 dic', false), item('D', '2 dic', false)],
      },
    ];
    assert.deepEqual(
      proximos(grupos).map((i) => i.titulo),
      ['A', 'B', 'C'],
    );
  });
});
