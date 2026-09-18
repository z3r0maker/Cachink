import { StatusPill, type ColumnDef } from '@/components';

export interface Venta {
  readonly id: string;
  readonly fecha: string;
  readonly concepto: string;
  readonly metodo: string;
  readonly monto: string;
}

/** Sample content only — replaced by real data in the product screens. */
export const VENTAS: readonly Venta[] = [
  {
    id: '1',
    fecha: '12/may 14:02',
    concepto: 'Taco al pastor ×3',
    metodo: 'Efectivo',
    monto: '+$75.00',
  },
  { id: '2', fecha: '12/may 13:41', concepto: 'Gringa', metodo: 'Transferencia', monto: '+$60.00' },
  {
    id: '3',
    fecha: '12/may 13:20',
    concepto: 'Agua de horchata ×2',
    metodo: 'QR / CoDi',
    monto: '+$60.00',
  },
];

export const COLUMNS: readonly ColumnDef<Venta>[] = [
  { key: 'fecha', header: 'Fecha', render: (r) => r.fecha },
  { key: 'concepto', header: 'Concepto', render: (r) => r.concepto },
  {
    key: 'metodo',
    header: 'Método de pago',
    render: (r) => <StatusPill tone="info">{r.metodo}</StatusPill>,
  },
  { key: 'monto', header: 'Monto', numeric: true, render: (r) => r.monto },
];
