import type { Money } from '@xangarro/domain';

import { pesos } from './business';

/**
 * Ledger fixtures. The portal **reads** these; it never creates them — sales,
 * gastos and caja are captured on the phone (ADR-058 §2).
 */
export type MovKind = 'venta' | 'gasto';

export interface Movimiento {
  readonly id: string;
  readonly kind: MovKind;
  readonly fecha: string;
  readonly hora: string;
  readonly concepto: string;
  /** Método de pago for a venta, categoría for a gasto. */
  readonly clasificacion: string;
  readonly operador: string;
  readonly dispositivo: string;
  readonly amount: Money;
  readonly pending?: boolean;
  readonly cancelada?: { readonly motivo: string };
}

export const MOVIMIENTOS: readonly Movimiento[] = [
  {
    id: 'v1',
    kind: 'venta',
    fecha: '12/may',
    hora: '14:02',
    concepto: 'Taco al pastor ×3',
    clasificacion: 'Efectivo',
    operador: 'Ana',
    dispositivo: 'iPhone de caja',
    amount: pesos(75),
  },
  {
    id: 'v2',
    kind: 'venta',
    fecha: '12/may',
    hora: '13:41',
    concepto: 'Gringa',
    clasificacion: 'Transferencia',
    operador: 'Ana',
    dispositivo: 'iPhone de caja',
    amount: pesos(60),
  },
  {
    id: 'v3',
    kind: 'venta',
    fecha: '12/may',
    hora: '13:20',
    concepto: 'Agua de horchata ×2',
    clasificacion: 'QR / CoDi',
    operador: 'Luis',
    dispositivo: 'Android de la barra',
    amount: pesos(60),
    pending: true,
  },
  {
    id: 'v4',
    kind: 'venta',
    fecha: '12/may',
    hora: '12:58',
    concepto: 'Quesadilla ×2',
    clasificacion: 'Efectivo',
    operador: 'Ana',
    dispositivo: 'iPhone de caja',
    amount: pesos(80),
    cancelada: { motivo: 'Error al cobrar' },
  },
  {
    id: 'v5',
    kind: 'venta',
    fecha: '12/may',
    hora: '12:30',
    concepto: 'Gringa ×2',
    clasificacion: 'Crédito',
    operador: 'Luis',
    dispositivo: 'Android de la barra',
    amount: pesos(120),
  },
  {
    id: 'g1',
    kind: 'gasto',
    fecha: '12/may',
    hora: '13:55',
    concepto: 'Queso Oaxaca 5 kg',
    clasificacion: 'Materia Prima',
    operador: 'Luis',
    dispositivo: 'Android de la barra',
    amount: pesos(420),
  },
  {
    id: 'g2',
    kind: 'gasto',
    fecha: '12/may',
    hora: '12:30',
    concepto: 'Gas',
    clasificacion: 'Servicios',
    operador: 'Luis',
    dispositivo: 'Android de la barra',
    amount: pesos(340),
  },
  {
    id: 'g3',
    kind: 'gasto',
    fecha: '11/may',
    hora: '19:10',
    concepto: 'Nómina semana 19',
    clasificacion: 'Nómina',
    operador: 'Ana',
    dispositivo: 'iPhone de caja',
    amount: pesos(8150),
  },
];

export interface KpiDef {
  readonly label: string;
  readonly value: Money | string;
  readonly tone?: 'neutral' | 'positive' | 'negative' | 'warning';
  readonly hint?: string;
}

export const VENTAS_KPIS: readonly KpiDef[] = [
  { label: 'Ventas del periodo', value: pesos(68420), tone: 'positive', hint: '254 ventas' },
  { label: 'Ticket promedio', value: pesos(269.37), hint: 'Por venta' },
  { label: 'Efectivo en caja', value: pesos(21180), hint: 'Sin cortes pendientes' },
  { label: 'Cuentas por cobrar', value: pesos(3940), tone: 'warning', hint: '4 clientes' },
];

export const GASTOS_KPIS: readonly KpiDef[] = [
  { label: 'Gastos del periodo', value: pesos(53222.38), tone: 'negative', hint: '86 egresos' },
  { label: 'Mayor categoría', value: pesos(24610), hint: 'Materia Prima · 46%' },
  { label: 'Nómina', value: pesos(16800), hint: 'Del periodo' },
  { label: 'Sin factura', value: pesos(7310), tone: 'warning', hint: 'Revisa comprobantes' },
];

export const VENTA_FILTERS = [
  'Efectivo',
  'Transferencia',
  'Tarjeta',
  'QR / CoDi',
  'Crédito',
] as const;
export const GASTO_FILTERS = [
  'Materia Prima',
  'Nómina',
  'Renta',
  'Servicios',
  'Insumos',
  'Mantenimiento',
] as const;
