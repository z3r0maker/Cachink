import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { calculoDe } from '../src/server/empresa/presupuesto-calculo';
import { prepararDe, revisionDe } from '../src/server/empresa/presupuesto-paneles';
import { efectoEnElMes } from '../src/server/empresa/presupuesto-view';
import { APROBADO, datos, PENDIENTE_1T } from './presupuesto-fixture';

/** Presupuesto's panels as board CD-15e shows them (E-22). */
describe('Presupuesto · preparar', () => {
  it('starts the next quarter from the budget in force', () => {
    const v = prepararDe(calculoDe(datos()), '2027-T1', 'Fundador 2');
    assert.equal(v.nombre, '1T 2027');
    assert.deepEqual(
      v.campos.map((c) => [c.nombre, c.inicial, c.hint]),
      [
        ['Costo del servicio', '8500.00', 'En el 4T 2026: $8,500.00 al mes'],
        ['Ventas y marketing', '12000.00', 'En el 4T 2026: $12,000.00 al mes'],
        ['Desarrollo', '5000.00', 'En el 4T 2026: $5,000.00 al mes'],
        ['Administración', '5500.00', 'En el 4T 2026: $5,500.00 al mes'],
      ],
    );
    assert.equal(v.antes, 'el 4T 2026 fue de $31,000.00 al mes');
    assert.equal(v.pasos[0], 'Le avisamos a Fundador 2 por correo para que lo apruebe.');
    assert.match(v.pasos[1] ?? '', /^Cuenta desde el 1 de enero/);
  });

  it('starts a quarter with no budget from what the last one spent', () => {
    const v = prepararDe(calculoDe(datos({ presupuestos: [] })), '2026-T4', 'Fundador 2');
    assert.deepEqual(
      v.campos.map((c) => c.inicial),
      ['4000.00', '10000.00', '', '5000.00'],
    );
    assert.equal(v.campos[2]?.hint, 'En el 3T 2026 se gastaron $0.00 al mes');
    assert.equal(v.antes, null);
    assert.equal(v.pasos[1], 'Cuenta desde que lo apruebe.');
  });
});

describe('Presupuesto · aprobar', () => {
  it('sets each proposed amount beside this quarter’s budget and its monthly projection', () => {
    const c = calculoDe(datos({ presupuestos: [APROBADO, PENDIENTE_1T] }));
    const r = revisionDe(c, PENDIENTE_1T, [APROBADO, PENDIENTE_1T]);
    assert.equal(r.ref, '4T 2026');
    assert.deepEqual(
      [r.filas[1]?.propuesto, r.filas[1]?.antes, r.filas[1]?.real],
      ['$13,000.00', '$12,000.00', '$8,833.33'],
    );
    assert.deepEqual(
      [r.total.propuesto, r.total.antes, r.total.real],
      ['$33,000.00', '$31,000.00', '$25,286.65'],
    );
  });

  it('compares a budget for this quarter with the last one, which had none', () => {
    const actual = { ...PENDIENTE_1T, id: 'p4b', trimestre: '2026-T4' };
    const c = calculoDe(datos({ presupuestos: [actual] }));
    const r = revisionDe(c, actual, [actual]);
    assert.equal(r.ref, '3T 2026');
    assert.equal(r.total.antes, '—');
    assert.equal(r.total.real, '$19,000.00');
  });
});

describe('Presupuesto · el efecto de un gasto en el mes', () => {
  it('says the month’s close without a budget, within it, and above it', () => {
    const base = { mes: '2026-11', proyeccion: 32_050_00n, monto: 3_000_00n };
    assert.equal(
      efectoEnElMes({ ...base, presupuesto: null }),
      'Con este gasto, noviembre cerraría en $35,050.00.',
    );
    assert.equal(
      efectoEnElMes({ ...base, presupuesto: 40_000_00n }),
      'Con este gasto, noviembre cerraría en $35,050.00, dentro del presupuesto.',
    );
    assert.equal(
      efectoEnElMes({ ...base, presupuesto: 31_000_00n, inicio: 'Con $3,000.00' }),
      'Con $3,000.00, noviembre cerraría en $35,050.00, 13 % sobre el presupuesto.',
    );
  });
});
