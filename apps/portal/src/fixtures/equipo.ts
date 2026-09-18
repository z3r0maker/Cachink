import type { Money } from '@xangarro/domain';

import { pesos } from './business';

/**
 * Operators are **not** portal members: they sign in on the phone with a name
 * and a PIN, no email (ADR-053 Q1/Q2). `role` is gone; `permissions` stays and
 * is portal-managed (ADR-058 §4).
 */
export interface Operador {
  readonly id: string;
  readonly nombre: string;
  readonly activo: boolean;
  readonly turnoAbierto: boolean;
  readonly desde?: string;
  readonly dispositivo: string;
  readonly capturoHoy: number;
  readonly cobradoHoy: Money;
  readonly ultimaVez: string;
  readonly puedeCancelar: boolean;
}

export const OPERADORES: readonly Operador[] = [
  {
    id: 'o1',
    nombre: 'Ana Robledo',
    activo: true,
    turnoAbierto: true,
    desde: '08:12',
    dispositivo: 'iPhone de caja',
    capturoHoy: 12,
    cobradoHoy: pesos(4850),
    ultimaVez: 'hace 3 min',
    puedeCancelar: true,
  },
  {
    id: 'o2',
    nombre: 'Luis Ortega',
    activo: true,
    turnoAbierto: false,
    dispositivo: 'Android de la barra',
    capturoHoy: 8,
    cobradoHoy: pesos(2310),
    ultimaVez: 'hace 41 min',
    puedeCancelar: false,
  },
  {
    id: 'o3',
    nombre: 'Marisol Vega',
    activo: false,
    turnoAbierto: false,
    dispositivo: 'Sin vincular',
    capturoHoy: 0,
    cobradoHoy: pesos(0),
    ultimaVez: 'hace 12 días',
    puedeCancelar: false,
  },
];

export interface Dispositivo {
  readonly id: string;
  readonly nombre: string;
  readonly plataforma: 'iOS' | 'Android';
  readonly modelo: string;
  readonly operador: string;
  readonly ultimaSync: string;
  readonly pendientes: number;
  readonly estado: 'activo' | 'revocado';
}

export const DISPOSITIVOS: readonly Dispositivo[] = [
  {
    id: 'd1',
    nombre: 'iPhone de caja',
    plataforma: 'iOS',
    modelo: 'iPhone 13',
    operador: 'Ana Robledo',
    ultimaSync: 'hace 3 min',
    pendientes: 0,
    estado: 'activo',
  },
  {
    id: 'd2',
    nombre: 'Android de la barra',
    plataforma: 'Android',
    modelo: 'Moto G84',
    operador: 'Luis Ortega',
    ultimaSync: 'hace 41 min',
    pendientes: 3,
    estado: 'activo',
  },
  {
    id: 'd3',
    nombre: 'Tablet vieja',
    plataforma: 'Android',
    modelo: 'Galaxy Tab A7',
    operador: '—',
    ultimaSync: 'hace 2 meses',
    pendientes: 0,
    estado: 'revocado',
  },
];

/** Codes never contain 0, O, 1 or I (ADR-053 Q5). */
export const ACTIVATION_CODE = 'K7M3DQ9P';
export const CODE_EXPIRES_IN = '09:42';

export interface RejectedRow {
  readonly id: string;
  readonly tipo: string;
  readonly dispositivo: string;
  readonly motivo: string;
  readonly preview: string;
  readonly recibido: string;
}

/** Human messages, never a code — they come from `ERROR_CATALOG` in production. */
export const RECHAZADOS: readonly RejectedRow[] = [
  {
    id: 'r1',
    tipo: 'Venta',
    dispositivo: 'Android de la barra',
    motivo: 'El producto de este registro ya no existe en el portal.',
    preview: 'Venta · Gringa ×1 · $60.00',
    recibido: 'hoy 13:20',
  },
  {
    id: 'r2',
    tipo: 'Movimiento de inventario',
    dispositivo: 'Android de la barra',
    motivo: 'Este tipo de registro solo se cambia en el portal.',
    preview: 'Ajuste · Refresco · −1',
    recibido: 'hoy 12:58',
  },
  {
    id: 'r3',
    tipo: 'Egreso',
    dispositivo: 'Android de la barra',
    motivo: 'El operador de este registro ya no existe en el portal.',
    preview: 'Gasto · Servilletas · $85.00',
    recibido: 'ayer 19:04',
  },
];
