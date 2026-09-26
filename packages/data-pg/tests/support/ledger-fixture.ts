import type postgres from 'postgres';

import { testId } from './test-ids';

/**
 * A small ledger on a throwaway tenant, written as the owner role (RLS off)
 * so a suite can shape exactly the rows the seed does not have: a ticket of
 * two lines, a cancelled one, a timestamped `fecha` on a month's last day,
 * days just outside the month, a deleted line, and egresos by category.
 *
 * Every id is run-unique; `device_id` too, because tickets are unique on
 * `(device_id, folio)` and an earlier run's rows may still be there.
 */
export interface LedgerFixture {
  readonly biz: string;
  readonly dev: string;
  /** The two-line Efectivo ticket of 2026-05-10. */
  readonly ticketDoble: string;
}

interface Venta {
  readonly fecha: string;
  readonly metodo: string;
  readonly lineas: readonly { concepto: string; monto: number; borrada?: boolean }[];
  readonly cancelada?: boolean;
}

/** May 2026 plus its edges. Totals in centavos are in the suite's assertions. */
export const VENTAS: readonly Venta[] = [
  {
    fecha: '2026-05-10',
    metodo: 'Efectivo',
    lineas: [
      { concepto: 'Taco al pastor', monto: 2500 },
      { concepto: 'Agua de horchata', monto: 1500 },
      { concepto: 'Borrada', monto: 999, borrada: true },
    ],
  },
  {
    fecha: '2026-05-11',
    metodo: 'Tarjeta',
    lineas: [{ concepto: 'Gringa', monto: 6000 }],
    cancelada: true,
  },
  {
    fecha: '2026-05-31T22:15:00-06:00',
    metodo: 'Crédito',
    lineas: [{ concepto: 'Orden 100% maíz', monto: 8000 }],
  },
  { fecha: '2026-05-01', metodo: 'Efectivo', lineas: [{ concepto: 'Refresco', monto: 2000 }] },
  { fecha: '2026-04-30', metodo: 'Efectivo', lineas: [{ concepto: 'Fuera antes', monto: 700 }] },
  { fecha: '2026-06-01', metodo: 'Efectivo', lineas: [{ concepto: 'Fuera después', monto: 900 }] },
];

export const GASTOS = [
  { fecha: '2026-05-03', concepto: 'Sueldo Lupita', categoria: 'Nómina', monto: 100_000 },
  { fecha: '2026-05-15', concepto: 'Renta local', categoria: 'Renta', monto: 500_000 },
  {
    fecha: '2026-05-31T09:00:00-06:00',
    concepto: 'Sueldo Beto',
    categoria: 'Nómina',
    monto: 200_000,
  },
  { fecha: '2026-06-02', concepto: 'Fuera', categoria: 'Renta', monto: 1 },
] as const;

export async function seedLedger(owner: postgres.Sql, tag: string): Promise<LedgerFixture> {
  const biz = testId(tag);
  const dev = testId('D');
  const now = new Date('2026-05-12T14:00:00Z');
  const fila = { business_id: biz, device_id: dev, created_at: now, updated_at: now };
  await owner`INSERT INTO businesses ${owner({ id: biz, nombre: 'Ledger', regimen_fiscal: 'RESICO', isr_tasa: 125, ...fila })}`;
  await owner`INSERT INTO devices ${owner({ id: dev, nombre: 'Caja 1', plataforma: 'android', modelo: 'x', business_id: biz, created_at: now, updated_at: now })}`;
  const prod = testId('P');
  await owner`INSERT INTO products ${owner({ id: prod, nombre: 'Taco', categoria: 'Producto Terminado', costo_unit_centavos: 100, unidad: 'pza', ...fila })}`;
  let ticketDoble = '';
  for (const [i, v] of VENTAS.entries()) {
    const ticket = testId('T');
    if (i === 0) ticketDoble = ticket;
    await owner`INSERT INTO tickets ${owner({ id: ticket, folio: i + 1, fecha: v.fecha, hora: '12:00:00', concepto: 'Venta', metodo: v.metodo, estado_pago: 'pagado', cancelled_at: v.cancelada === true ? now : null, ...fila })}`;
    for (const l of v.lineas) {
      await owner`INSERT INTO sales ${owner({ id: testId('S'), ticket_id: ticket, fecha: v.fecha, concepto: l.concepto, categoria: 'Producto', monto_centavos: l.monto, producto_id: prod, deleted_at: l.borrada === true ? now : null, ...fila })}`;
    }
  }
  for (const g of GASTOS) {
    await owner`INSERT INTO expenses ${owner({ id: testId('E'), fecha: g.fecha, concepto: g.concepto, categoria: g.categoria, monto_centavos: g.monto, ...fila })}`;
  }
  return { biz, dev, ticketDoble };
}
