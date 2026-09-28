/**
 * Gastos del turno (Track M, M-08; MvGastos): the rows, the turno's list,
 * the recurring gasto's prefill and the form behind «Registrar gasto».
 */
import { describe, expect, it } from 'vitest';
import type { BusinessId, Expense, IsoDate, RecurringExpense } from '@xangarro/domain';
import {
  diasHasta,
  egresoDe,
  gastoDeEgreso,
  gastosDelTurno,
  prefillDe,
  recurrenteParaDe,
  venceTexto,
} from '../../../src/screens/Egresos/gastos-lectura';
import {
  faltante,
  formInicial,
  montoDe,
  nuevoDe,
  teclear,
} from '../../../src/screens/Egresos/gasto-form';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const TURNO = { id: '01HZ8XQN9GZJXV8AKQ5X0C7TU1', aperturaAt: '2026-09-28T14:15:00.000Z' };

function egreso(id: string, over: Partial<Expense> = {}): Expense {
  return {
    id,
    fecha: '2026-09-28',
    concepto: 'Carbón',
    categoria: 'Materia Prima',
    monto: 240_00n,
    proveedor: 'La Flama',
    cajaTurnoId: TURNO.id,
    createdAt: '2026-09-28T15:18:00.000Z',
    ...over,
  } as Expense;
}

const recurrente = {
  id: '01HZ8XQN9GZJXV8AKQ5X0C7RE1',
  concepto: 'Agua',
  categoria: 'Servicios',
  montoCentavos: 45_00n,
  proveedor: 'Aguas Puras',
  frecuencia: 'mensual',
  diaDelMes: 15,
  proximoDisparo: '2026-09-26',
} as RecurringExpense;

describe('the turno list', () => {
  it('says the operator’s category and the supplier', () => {
    const g = gastoDeEgreso(egreso('a'));
    expect(g).toMatchObject({ categoria: 'Insumos', detalle: 'La Flama', comprobante: false });
    expect(gastoDeEgreso(egreso('b', { categoria: 'Inventario', proveedor: null })).categoria).toBe(
      'Otros',
    );
  });

  it('adds today’s unscoped egresos since the turno opened, once, newest first', () => {
    const scoped = egreso('a');
    const compra = egreso('b', { cajaTurnoId: null, createdAt: '2026-09-28T16:00:00.000Z' });
    const antes = egreso('c', { cajaTurnoId: null, createdAt: '2026-09-28T13:00:00.000Z' });
    const out = gastosDelTurno([scoped], [scoped, compra, antes], TURNO);
    expect(out.map((e) => e.id)).toEqual(['b', 'a']);
  });

  it('lists all of today without a turno', () => {
    expect(gastosDelTurno([], [egreso('a'), egreso('b')], null)).toHaveLength(2);
  });
});

describe('the write', () => {
  it('scopes the gasto to the turno in the domain’s category', () => {
    const n = {
      monto: 450_00n,
      concepto: 'Gas',
      categoria: 'Servicios' as const,
      proveedor: null,
      foto: null,
    };
    const e = egresoDe(n, { businessId: BIZ, fecha: '2026-09-28' as IsoDate, turnoId: TURNO.id });
    expect(e).toMatchObject({ categoria: 'Servicios', monto: 450_00n, cajaTurnoId: TURNO.id });
    expect('proveedor' in e).toBe(false);
  });

  it('maps Insumos and Transporte to the stored values', () => {
    const base = { monto: 1n, concepto: 'x', proveedor: 'Don Beto', foto: null };
    const ctx = { businessId: BIZ, fecha: '2026-09-28' as IsoDate, turnoId: null };
    expect(egresoDe({ ...base, categoria: 'Insumos' }, ctx).categoria).toBe('Materia Prima');
    const t = egresoDe({ ...base, categoria: 'Transporte' }, ctx);
    expect(t).toMatchObject({ categoria: 'Logística', proveedor: 'Don Beto' });
    expect('cajaTurnoId' in t).toBe(false);
  });
});

describe('a recurring gasto', () => {
  it('fills the sheet from its template', () => {
    expect(prefillDe(recurrente)).toEqual({
      recurrenteId: recurrente.id,
      concepto: 'Agua',
      monto: 45_00n,
      categoria: 'Servicios',
      proveedor: 'Aguas Puras',
    });
  });

  it('counts how late it is', () => {
    expect(diasHasta('2026-09-28', '2026-09-26')).toBe(-2);
    expect(recurrenteParaDe(recurrente, '2026-09-28').vence).toBe(-2);
    expect(venceTexto(0)).toBe('Vence hoy');
    expect(venceTexto(-1)).toBe('Atrasado 1 día');
    expect(venceTexto(-2)).toBe('Atrasado 2 días');
  });
});

describe('the form', () => {
  it('asks for the amount, the concept and the category, in that order', () => {
    let f = formInicial(null);
    expect(faltante(f)).toBe('Escribe cuánto fue.');
    f = teclear(teclear(f, '4'), '5');
    expect(montoDe(f)).toBe(45_00n);
    expect(faltante(f)).toBe('Escribe qué compraste.');
    f = { ...f, concepto: ' Hielo ' };
    expect(faltante(f)).toBe('Elige una categoría.');
    expect(nuevoDe(f)).toBeNull();
    f = { ...f, categoria: 'Otros' };
    expect(nuevoDe(f)).toEqual({
      monto: 45_00n,
      concepto: 'Hielo',
      categoria: 'Otros',
      proveedor: null,
      foto: null,
    });
  });

  it('takes a zero amount as missing', () => {
    expect(montoDe(teclear(formInicial(null), '0'))).toBeNull();
  });

  it('opens filled from a recurring gasto and keeps its id', () => {
    const f = formInicial(prefillDe(recurrente));
    expect(f.monto.raw).toBe('45.00');
    expect(nuevoDe(f)).toMatchObject({ recurrenteId: recurrente.id, proveedor: 'Aguas Puras' });
  });

  it('starts over when a digit follows the prefilled amount', () => {
    const f = teclear(formInicial(prefillDe(recurrente)), '5');
    expect(montoDe(f)).toBe(5_00n);
  });
});
