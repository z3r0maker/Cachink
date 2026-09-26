import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { emparejar, mismoNombre } from '../src/lib/personas';

const op = (id: string, nombre: string | null, active = true) => ({ id, nombre, active });
const em = (id: string, nombre: string) => ({ id, nombre });

describe('Equipo y nómina: one person, whether they cobran, are on payroll, or both (ADR-107)', () => {
  it('matches names regardless of case, accents and extra spaces', () => {
    assert.ok(mismoNombre('Ana Robledo', '  ana  robledo '));
    assert.ok(mismoNombre('Jesús Pérez', 'Jesus Perez'));
    assert.ok(!mismoNombre('Ana Robledo', 'Ana Robles'));
  });

  it('pairs each operator with their payroll row, and lists who is only on payroll', () => {
    const r = emparejar(
      [op('o1', 'Ana Robledo'), op('o2', 'Luis Ortega')],
      [em('e1', 'Luis Ortega'), em('e2', 'Carmen Ruiz')],
    );
    assert.deepEqual(
      r.conCaja.map((p) => [p.operador.id, p.empleado?.id ?? null]),
      [
        ['o1', null],
        ['o2', 'e1'],
      ],
    );
    assert.deepEqual(
      r.soloNomina.map((e) => e.id),
      ['e2'],
    );
  });

  it('pairs a payroll row once, with the active operator first', () => {
    const r = emparejar(
      [op('viejo', 'Rosa Medina', false), op('nuevo', 'Rosa Medina', true)],
      [em('e1', 'Rosa Medina')],
    );
    assert.equal(r.conCaja.find((p) => p.operador.id === 'nuevo')?.empleado?.id, 'e1');
    assert.equal(r.conCaja.find((p) => p.operador.id === 'viejo')?.empleado, null);
    assert.deepEqual(r.soloNomina, []);
  });

  it('keeps the operators’ order', () => {
    const r = emparejar([op('b', 'Beto'), op('a', 'Alma')], []);
    assert.deepEqual(
      r.conCaja.map((p) => p.operador.id),
      ['b', 'a'],
    );
  });
});
