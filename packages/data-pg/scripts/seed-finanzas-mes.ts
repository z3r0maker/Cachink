import type postgres from 'postgres';

import { BIZ, CLIENTS, COST, DEV, EMPLOYEES, PRODUCTS, id, TS } from './seed-data.js';

type Sql = ReturnType<typeof postgres>;

/**
 * One month of the financial seed (`seed-finanzas.ts` holds the why): the
 * ticket/day/mes generator. Montos are centavos end to end — the fixture's
 * precios and salarios already are, so no peso() anywhere in here.
 */

export type Egreso = readonly [
  eid: string,
  concepto: string,
  categoria: string,
  montoCentavos: number,
];

const METODOS = [
  'Efectivo',
  'Efectivo',
  'Efectivo',
  'Transferencia',
  'Tarjeta',
  'QR/CoDi',
] as const;

/** Products a customer buys — `[id, nombre, sku, costo, precio, …]`, precio > 0. */
const VENDIBLES = PRODUCTS.filter((p) => Number(p[4]) > 0);

const nominaQuincenal = Math.round(EMPLOYEES.reduce((t, e) => t + Number(e[3]), 0) / 2);

/** One inventory movement — a venta's salida, or the month's merma. */
async function movimiento(
  sql: Sql,
  mid: string,
  productoId: string,
  fecha: string,
  tipo: 'entrada' | 'salida',
  cantidad: number,
  costo: number,
  motivo: string,
): Promise<void> {
  await sql`
    INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad,
                                     costo_unit_centavos, motivo, business_id, device_id, created_at, updated_at)
    VALUES (${id(mid)}, ${productoId}, ${fecha}, ${tipo}, ${cantidad},
            ${costo}, ${motivo}, ${BIZ}, ${DEV}, ${TS(fecha)}, ${TS(fecha)})
    ON CONFLICT (id) DO NOTHING`;
}

/** Writes one ticket: its header and its sale line. */
async function persistTicket(
  sql: Sql,
  v: {
    readonly tid: string;
    readonly sid: string;
    readonly folio: number;
    readonly fecha: string;
    readonly hora: string;
    readonly concepto: string;
    readonly metodo: string;
    readonly clienteId: string | null;
    readonly estadoPago: 'pagado' | 'pendiente';
    readonly monto: bigint;
    readonly productoId: string;
    readonly cantidad: number;
  },
): Promise<void> {
  await sql`
    INSERT INTO tickets (id, folio, fecha, hora, concepto, metodo, cliente_id, estado_pago,
                         business_id, device_id, created_at, updated_at)
    VALUES (${v.tid}, ${v.folio}, ${v.fecha}, ${v.hora}, ${v.concepto}, ${v.metodo},
            ${v.clienteId}, ${v.estadoPago}, ${BIZ}, ${DEV}, ${TS(v.fecha)}, ${TS(v.fecha)})
    ON CONFLICT (id) DO NOTHING`;
  await sql`
    INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos,
                       producto_id, cantidad, business_id, device_id, created_at, updated_at)
    VALUES (${v.sid}, ${v.tid}, ${v.fecha}, ${v.concepto}, 'Producto', ${v.monto},
            ${v.productoId}, ${v.cantidad}, ${BIZ}, ${DEV}, ${TS(v.fecha)}, ${TS(v.fecha)})
    ON CONFLICT (id) DO NOTHING`;
}

/** The ticket's method — at most one Crédito per month, on the calendar's whim. */
function eligeMetodo(
  r: () => number,
  st: { folio: number; creditoDado: boolean },
): { credito: boolean; metodo: string; clienteId: string | null } {
  const credito = !st.creditoDado && r() < 0.25;
  return {
    credito,
    metodo: credito ? 'Crédito' : METODOS[Math.floor(r() * METODOS.length)],
    clienteId: credito ? CLIENTS[st.folio % CLIENTS.length][0] : null,
  };
}

/** One ticket — header, line, and the stock it moved. Returns its efectivo. */
async function seedTicket(
  sql: Sql,
  tag: string,
  fecha: string,
  r: () => number,
  st: { folio: number; creditoDado: boolean },
  folioBase: number,
): Promise<number> {
  st.folio += 1;
  const p = VENDIBLES[Math.floor(r() * VENDIBLES.length)];
  const cantidad = 1 + Math.floor(r() * 5);
  const monto = BigInt(Number(p[4]) * cantidad);
  const { credito, metodo, clienteId } = eligeMetodo(r, st);
  await persistTicket(sql, {
    tid: id(`FINT${tag}${st.folio}`),
    sid: id(`FINS${tag}${st.folio}`),
    folio: folioBase + st.folio,
    fecha,
    hora: `${9 + Math.floor(r() * 12)}:${String(Math.floor(r() * 60)).padStart(2, '0')}`,
    concepto: `${p[1]} ×${cantidad}`,
    metodo,
    clienteId,
    estadoPago: credito ? 'pendiente' : 'pagado',
    monto,
    productoId: p[0],
    cantidad,
  });
  await movimiento(
    sql,
    `FINMS${tag}${st.folio}`,
    p[0],
    fecha,
    'salida',
    cantidad,
    COST[p[0]] ?? 0,
    'Venta',
  );
  if (credito) st.creditoDado = true;
  return metodo === 'Efectivo' ? Number(monto) : 0;
}

/** One operating day: its tickets and its corte. */
async function seedDia(
  sql: Sql,
  tag: string,
  fecha: string,
  r: () => number,
  st: { folio: number; creditoDado: boolean },
  folioBase: number,
): Promise<void> {
  const tickets = 3 + Math.floor(r() * 4);
  let efectivoDia = 0;
  for (let t = 0; t < tickets; t++) {
    efectivoDia += await seedTicket(sql, tag, fecha, r, st, folioBase);
  }
  const diferencia = Math.round((r() - 0.6) * 12);
  await sql`
    INSERT INTO day_closes (id, fecha, efectivo_esperado_centavos, efectivo_contado_centavos,
                            diferencia_centavos, cerrado_por, business_id, device_id, created_at, updated_at)
    VALUES (${id(`FINC${tag}${fecha.slice(5, 7)}${fecha.slice(8)}`)}, ${fecha},
            ${BigInt(efectivoDia)}, ${BigInt(efectivoDia + diferencia)}, ${BigInt(diferencia)}, 'Director',
            ${BIZ}, ${DEV}, ${TS(fecha)}, ${TS(fecha)})
    ON CONFLICT (id) DO NOTHING`;
}

/** The month's egresos and its one merma. */
async function seedEgresosMes(sql: Sql, tag: string, days: readonly string[]): Promise<void> {
  const dia = (i: number): string => days[Math.min(i, days.length - 1)];
  const egresos: readonly Egreso[] = [
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
  for (const [i, [eid, concepto, categoria, montoCentavos]] of egresos.entries()) {
    const fecha = i === 0 ? dia(6) : i === 1 ? dia(Math.floor(days.length / 2)) : dia(i);
    await sql`
      INSERT INTO expenses (id, fecha, concepto, categoria, monto_centavos,
                            business_id, device_id, created_at, updated_at)
      VALUES (${id(eid)}, ${fecha}, ${concepto}, ${categoria}, ${montoCentavos},
              ${BIZ}, ${DEV}, ${TS(fecha)}, ${TS(fecha)})
      ON CONFLICT (id) DO NOTHING`;
  }
  // One merma a month: inventory that left without pleasing anyone.
  await movimiento(
    sql,
    `FINMM${tag}`,
    PRODUCTS[0][0],
    dia(12),
    'salida',
    3,
    COST[PRODUCTS[0][0]] ?? 0,
    'Merma / daño',
  );
}

/** Previous or current month of `anchor`, as one seeded ledger. */
export async function seedMes(
  sql: Sql,
  tag: string,
  days: readonly string[],
  folioBase: number,
): Promise<void> {
  const st = { folio: 0, creditoDado: false };
  for (const fecha of days) {
    await seedDia(sql, tag, fecha, rng(fecha), st, folioBase);
  }
  await seedEgresosMes(sql, tag, days);
}

/** Deterministic per-date PRNG (FNV-1a seeded): re-runs stay stable. */
function rng(seed: string): () => number {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    return (h >>> 0) / 4294967296;
  };
}
