import type postgres from 'postgres';

import { BIZ, COST, DEV, EMPLOYEES, PRODUCTS, id, TS } from './seed-data.js';
import { movimiento } from './seed-finanzas-stock.js';

type Sql = ReturnType<typeof postgres>;

/**
 * The egreso half of one seeded month: what the taquería pays out, and the
 * one merma that leaves the inventory without pleasing anybody.
 *
 * Split from `seed-finanzas-mes.ts` when the weekly restock pushed that file
 * past 200 lines (CLAUDE.md §2.6). The generator there owns tickets, days and
 * cortes; this owns the fixed monthly outflows.
 */

/** `[idMnemonic, concepto, categoria, montoCentavos]`. */
export type Egreso = readonly [
  eid: string,
  concepto: string,
  categoria: string,
  montoCentavos: number,
];

let MW_SEQ = 1;

const nominaQuincenal = Math.round(EMPLOYEES.reduce((t, e) => t + Number(e[3]), 0) / 2);

/** The fixed outflows every seeded month carries, in centavos. */
function egresosDelMes(tag: string): readonly Egreso[] {
  return [
    [`FINEE${tag}N1`, 'Nómina · primera quincena', 'Nómina', nominaQuincenal],
    [`FINEE${tag}N2`, 'Nómina · segunda quincena', 'Nómina', nominaQuincenal],
    [`FINEE${tag}R`, 'Renta del local', 'Renta', 300_000],
    [`FINEE${tag}L`, 'Luz CFE', 'Servicios', 48_000],
    [`FINEE${tag}G`, 'Gas (cilindro)', 'Servicios', 34_000],
    [`FINEE${tag}B`, 'Bolsas y servilletas', 'Inventario', 26_000],
    [`FINEE${tag}C`, 'Carne al pastor', 'Materia Prima', 240_000],
    [`FINEE${tag}T`, 'Tortillas de la semana', 'Materia Prima', 68_000],
    [`FINEE${tag}Q`, 'Queso Oaxaca', 'Materia Prima', 42_000],
  ];
}

/** The month's egresos and its one merma. */
export async function seedEgresosMes(
  sql: Sql,
  tag: string,
  days: readonly string[],
): Promise<void> {
  const dia = (i: number): string => days[Math.min(i, days.length - 1)];
  for (const [i, [eid, concepto, categoria, montoCentavos]] of egresosDelMes(tag).entries()) {
    const fecha = i === 0 ? dia(6) : i === 1 ? dia(Math.floor(days.length / 2)) : dia(i);
    await sql`
      INSERT INTO expenses (id, fecha, concepto, categoria, monto_centavos,
                            business_id, device_id, created_at, updated_at)
      VALUES (${id(eid)}, ${fecha}, ${concepto}, ${categoria}, ${montoCentavos},
              ${BIZ}, ${DEV}, ${TS(fecha)}, ${TS(fecha)})
      ON CONFLICT (id) DO NOTHING`;
  }
  // One merma a month: inventory that left without pleasing anyone. It eats
  // into the opening buffer, never into a week's own compra (ADR-095).
  await movimiento(
    sql,
    `FMW${String(MW_SEQ++).padStart(2, '0')}`,
    PRODUCTS[0][0],
    dia(12),
    'salida',
    3,
    COST[PRODUCTS[0][0]] ?? 0,
    'Merma / daño',
  );
}
