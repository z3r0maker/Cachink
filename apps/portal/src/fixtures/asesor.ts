import type { Money } from '@xangarro/domain';

import { pesos } from './business';

/**
 * Asesor fixtures.
 *
 * Everything here is **deterministic** — computed from the tenant's own records
 * by SQL and `@xangarro/domain`, not generated. That is why the Para ti feed,
 * the capacidades panel and Metas ship **live in production**, while the
 * Diagnóstico and the estrategia sit behind «Próximamente» until the model
 * credential lands (ADR-059).
 *
 * Deterministic output must not claim AI authorship: it is labelled "Calculado
 * a partir de tus registros", never "Generado con IA".
 */
export interface Capacidad {
  readonly name: string;
  readonly requirement: string;
  readonly locked: boolean;
  /** Progress toward the data volume the capability needs. */
  readonly progress: string;
  readonly pct: number;
}

export const CAPACIDADES: readonly Capacidad[] = [
  {
    name: 'Resumen del mes',
    requirement: '1 mes completo',
    locked: false,
    progress: 'Activo',
    pct: 100,
  },
  {
    name: 'Precios y márgenes',
    requirement: '60 días de ventas + 2 compras del producto',
    locked: true,
    progress: '33 de 60 días',
    pct: 55,
  },
  {
    name: 'Inventario',
    requirement: '60 días de movimientos',
    locked: false,
    progress: 'Activo',
    pct: 100,
  },
  {
    name: 'Gastos fuera de lo normal',
    requirement: '3 meses por categoría',
    locked: true,
    progress: '2 de 3 meses',
    pct: 66,
  },
  {
    name: '¿Me alcanza? (pronóstico)',
    requirement: '90 días de registros',
    locked: true,
    progress: '67 de 90 días',
    pct: 74,
  },
  {
    name: 'Corte de caja',
    requirement: '20 cortes',
    locked: true,
    progress: '8 de 20 cortes',
    pct: 40,
  },
];

export interface Previo {
  readonly title: string;
  readonly when: string;
  readonly outcome: 'Listo' | 'Descartado';
}

export const PREVIOS: readonly Previo[] = [
  { title: 'Tu ticket promedio subió a $269.44', when: 'Hace 3 días', outcome: 'Listo' },
  { title: 'El gasto de empaques se repitió 4 veces', when: 'Hace 5 días', outcome: 'Descartado' },
  { title: 'Ana cerró turno sin corte', when: 'Hace 6 días', outcome: 'Listo' },
  { title: 'Sube el precio de la gringa a $65.00', when: 'Hace 9 días', outcome: 'Descartado' },
];

export type MetaGroupA = 'ganar' | 'vender' | 'gastar';
export type MetaGroupB = 'comprar' | 'colchon' | 'deudas';
export type MetaLevel = 'empujon' | 'reto' | 'ambicioso';

export interface MetaOption<T extends string> {
  readonly id: T;
  readonly title: string;
  readonly description: string;
}

export const GROUP_A: readonly MetaOption<MetaGroupA>[] = [
  {
    id: 'ganar',
    title: 'Ganar más',
    description: 'Que te quede más dinero a ti al final del mes.',
  },
  { id: 'vender', title: 'Vender más', description: 'Subir tus ventas del mes.' },
  { id: 'gastar', title: 'Gastar menos', description: 'Bajar lo que se te va en gastos.' },
];

export const GROUP_B: readonly MetaOption<MetaGroupB>[] = [
  {
    id: 'comprar',
    title: 'Comprar algo para mi local',
    description: 'Un equipo, mueble o mejora para tu negocio.',
  },
  { id: 'colchon', title: 'Tener un colchón', description: 'Ahorro para las semanas flojas.' },
  { id: 'deudas', title: 'Pagar deudas', description: 'Liquidar lo que debe tu negocio.' },
];

export interface LevelOption {
  readonly id: MetaLevel;
  readonly title: string;
  readonly monthly: Money;
  readonly daily: Money;
  readonly recommended: boolean;
}

export const LEVELS: readonly LevelOption[] = [
  {
    id: 'empujon',
    title: 'Un empujón · +10%',
    monthly: pesos(51700),
    daily: pesos(1720),
    recommended: false,
  },
  {
    id: 'reto',
    title: 'Un reto · +20%',
    monthly: pesos(56400),
    daily: pesos(1880),
    recommended: true,
  },
  {
    id: 'ambicioso',
    title: 'Ambicioso · +30%',
    monthly: pesos(61100),
    daily: pesos(2040),
    recommended: false,
  },
];

export type Pace = 'ahead' | 'onpace' | 'behind';

export const PACE_COPY: Readonly<
  Record<Pace, { readonly label: string; readonly tone: 'healthy' | 'warning' | 'critical' }>
> = {
  ahead: { label: 'Vas 2 días adelantado', tone: 'healthy' },
  onpace: { label: 'Vas al ritmo', tone: 'healthy' },
  behind: { label: 'Vas 3 días atrasado', tone: 'warning' },
};

export interface Trophy {
  readonly month: string;
  readonly goal: string;
  readonly result: string;
  readonly achieved: boolean;
}

export const TROPHIES: readonly Trophy[] = [
  { month: 'Agosto 2026', goal: 'Vender más · +20%', result: '$52,900.00', achieved: true },
  { month: 'Julio 2026', goal: 'Gastar menos · −8%', result: '−$4,120.00', achieved: true },
  { month: 'Junio 2026', goal: 'Vender más · +10%', result: '$45,300.00', achieved: true },
  { month: 'Mayo 2026', goal: 'Ganar más · +15%', result: '86%', achieved: false },
];
