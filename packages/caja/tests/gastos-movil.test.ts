import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { Expense, RecurringExpense } from '@xangarro/domain';
import { hhmmLocal } from '../src/comun/fechas';
import { chipVence, gastosDelTurno, prefillDe } from '../src/gastos/derive';
import { RECURRENTE_PAGAR_FIXTURE } from '../src/gastos/fixture';
import type { RecurrentePorPagar } from '../src/gastos/types';

const T = (h: string) => `2026-09-26T${h}:00.000Z`;

const gasto = (over: Partial<Expense>): Expense => ({
  id: 'e-1',
  fecha: '2026-09-26',
  concepto: 'Carbón',
  categoria: 'Materia Prima',
  monto: 240_00n,
  proveedor: 'Carbonería La Flama',
  empleadoId: null,
  gastoRecurrenteId: null,
  cajaTurnoId: 'tu-1',
  businessId: 'biz',
  deviceId: 'dev',
  createdByUserId: null,
  createdAt: T('15:00'),
  updatedAt: T('15:00'),
  deletedAt: null,
  ...over,
});

describe('gastosDelTurno (las filas del teléfono como la lista del board)', () => {
  const filas = [
    gasto({
      id: 'e-2',
      createdAt: T('16:30'),
      concepto: 'Taxi por insumos',
      categoria: 'Logística',
      proveedor: 'Taxi del sitio',
    }),
    gasto({ id: 'e-1', createdAt: T('15:00') }),
    // Another turno's stamp and a deleted row stay out, unstamped ones ride along.
    gasto({ id: 'e-3', cajaTurnoId: 'tu-2', createdAt: T('17:00') }),
    gasto({ id: 'e-4', cajaTurnoId: null, createdAt: T('14:00'), concepto: 'Hielo' }),
    gasto({ id: 'e-5', deletedAt: T('18:00'), createdAt: T('18:00') }),
  ];

  it('lists the rows of the turno and the unstamped ones, newest first', () => {
    const lista = gastosDelTurno(filas, 'tu-1');
    assert.deepEqual(
      lista.map((g) => g.id),
      ['e-2', 'e-1', 'e-4'],
    );
  });

  it('dice la categoría y el detalle a la manera del operador, nunca un comprobante', () => {
    const [taxi, carbón] = gastosDelTurno(filas, 'tu-1');
    assert.equal(taxi?.categoria, 'Transporte');
    assert.equal(taxi?.detalle, 'Taxi del sitio');
    assert.equal(carbón?.detalle, 'Carbonería La Flama');
    const sinQuien = gastosDelTurno([gasto({ proveedor: null })], 'tu-1')[0];
    assert.equal(sinQuien?.detalle, 'Sin comprobante');
    assert.equal(sinQuien?.comprobante, false);
    assert.equal(sinQuien?.hora, hhmmLocal(T('15:00')));
  });

  it('sin turno, nada es «del turno»', () => {
    assert.deepEqual(gastosDelTurno(filas, null), []);
  });
});

describe('prefillDe (the pagar-recurrente prefill)', () => {
  const plantilla: RecurringExpense = {
    id: 'r-gas',
    concepto: 'Gas del local',
    categoria: 'Servicios',
    montoCentavos: 350_00n,
    proveedor: 'Gas Express',
    frecuencia: 'semanal',
    diaDelMes: null,
    diaDeLaSemana: 5,
    proximoDisparo: '2026-09-26',
    activo: true,
    businessId: 'biz',
    deviceId: 'dev',
    createdByUserId: null,
    createdAt: T('10:00'),
    updatedAt: T('10:00'),
    deletedAt: null,
  };

  it('opens the sheet with the words, amount and category of the template', () => {
    assert.deepEqual(prefillDe(plantilla), {
      recurrenteId: 'r-gas',
      concepto: 'Gas del local',
      monto: 350_00n,
      categoria: 'Servicios',
      proveedor: 'Gas Express',
    });
  });

  it('maps a stored category to the label of the operador and keeps a null supplier', () => {
    const p = prefillDe({ ...plantilla, categoria: 'Materia Prima', proveedor: null });
    assert.equal(p.categoria, 'Insumos');
    assert.equal(p.proveedor, null);
  });
});

describe('chipVence (the due chip)', () => {
  it('says today, and counts the late days in Spanish', () => {
    assert.equal(chipVence(0), 'Vence hoy');
    assert.equal(chipVence(-1), 'Atrasado 1 día');
    assert.equal(chipVence(-3), 'Atrasado 3 días');
  });
});

describe('RECURRENTE_PAGAR_FIXTURE', () => {
  it('pairs the row the list shows with what its sheet opens with', () => {
    const f: RecurrentePorPagar = RECURRENTE_PAGAR_FIXTURE;
    assert.equal(f.para.id, f.prefill.recurrenteId);
    assert.equal(f.para.concepto, f.prefill.concepto);
    assert.equal(BigInt(f.para.montoCentavos), f.prefill.monto);
    assert.equal(f.para.vence, 0);
  });
});
