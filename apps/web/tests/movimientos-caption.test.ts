import { describe, expect, it } from 'vitest';
import type { IsoDate } from '@xangarro/domain';

import {
  limitesDeFecha,
  periodoCaption,
  personalizadoAbierto,
  tramo,
  vacioDeBusqueda,
} from '@/app/(portal)/movimientos/caption';

const hoy = '2026-05-12' as IsoDate;
const r = (desde: string, hasta: string) => ({ desde: desde as IsoDate, hasta: hasta as IsoDate });

describe('periodoCaption (DS-01)', () => {
  it('names Hoy and Esta semana, and spells a month out', () => {
    expect(periodoCaption('hoy', r('2026-05-12', '2026-05-12'), hoy, '')).toBe('Periodo: Hoy');
    expect(periodoCaption('semana', r('2026-05-11', '2026-05-17'), hoy, '')).toBe(
      'Periodo: Esta semana',
    );
    expect(periodoCaption('mes', r('2026-05-01', '2026-05-31'), hoy, '')).toBe('Periodo: 1–31 may');
  });

  it('adds the search the numbers follow', () => {
    expect(periodoCaption('mes', r('2026-05-01', '2026-05-31'), hoy, '412')).toBe(
      'Periodo: 1–31 may · con la búsqueda «412»',
    );
  });
});

describe('tramo', () => {
  it('crosses months and years, with the year only when it is not this one', () => {
    expect(tramo(r('2026-04-28', '2026-05-03'), hoy)).toBe('28 abr–3 may');
    expect(tramo(r('2025-12-28', '2026-01-03'), hoy)).toBe('28 dic 2025–3 ene 2026');
    expect(tramo(r('2025-03-01', '2025-03-31'), hoy)).toBe('1–31 mar 2025');
    expect(tramo(r('2026-05-09', '2026-05-09'), hoy)).toBe('9 may');
  });

  it('says so when Personalizado leaves a side open', () => {
    expect(tramo(r('0000-01-01', '9999-12-31'), hoy)).toBe('todo tu historial');
    expect(tramo(r('2026-05-01', '9999-12-31'), hoy)).toBe('desde el 1 may 2026');
    expect(tramo(r('0000-01-01', '2026-05-01'), hoy)).toBe('hasta el 1 may 2026');
  });
});

describe('vacioDeBusqueda', () => {
  it('names a folio exactly, anything else by its words, and nothing without a search', () => {
    expect(vacioDeBusqueda('ventas', '#412', 412)).toBe(
      'No hay ninguna venta con el folio 412 en este periodo.',
    );
    expect(vacioDeBusqueda('ventas', 'pan', null)).toBe(
      'No hay movimientos con «pan» en este periodo.',
    );
    expect(vacioDeBusqueda('gastos', '412', 412)).toBe(
      'No hay movimientos con «412» en este periodo.',
    );
    expect(vacioDeBusqueda('ventas', '', null)).toBeNull();
  });
});

describe('personalizadoAbierto and limitesDeFecha', () => {
  it('flags only a Personalizado with a side open', () => {
    expect(personalizadoAbierto('personalizado', '', '')).toBe(true);
    expect(personalizadoAbierto('personalizado', '2026-05-01', '')).toBe(true);
    expect(personalizadoAbierto('personalizado', '2026-05-01', '2026-05-31')).toBe(false);
    expect(personalizadoAbierto('mes', '', '')).toBe(false);
  });

  it('bounds «Ir a fecha» by the period, and not on an open side', () => {
    expect(limitesDeFecha(r('2026-05-01', '2026-05-31'))).toEqual({
      min: '2026-05-01',
      max: '2026-05-31',
    });
    expect(limitesDeFecha(r('0000-01-01', '9999-12-31'))).toEqual({});
  });
});
