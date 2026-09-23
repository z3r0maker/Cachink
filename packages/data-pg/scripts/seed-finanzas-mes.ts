import type postgres from 'postgres';

import { BIZ, CLIENTS, COST, DEV, PRODUCTS, id, TS } from './seed-data.js';
import { seedEgresosMes } from './seed-finanzas-egresos.js';
import { movimiento, reponerStock, semanas, type Consumo } from './seed-finanzas-stock.js';

type Sql = ReturnType<typeof postgres>;

/**
 * One month of the financial seed (`seed-finanzas.ts` holds the why): the
 * ticket/day/mes generator. Montos are centavos end to end — the fixture's
 * precios and salarios already are, so no peso() anywhere in here.
 */

const METODOS = [
  'Efectivo',
  'Efectivo',
  'Efectivo',
  'Transferencia',
  'Tarjeta',
  'QR/CoDi',
] as const;

/** Products a customer buys — `[id, nombre, sku, costo, precio, …]`, precio > 0. */
let MOV_SEQ = 1;

const VENDIBLES = PRODUCTS.filter((p) => Number(p[4]) > 0);

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

/** What one month carries across its days: folio, the single crédito, the tally. */
type EstadoMes = { folio: number; creditoDado: boolean; consumo: Consumo };

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

/** The stock a ticket moved: the `salida` row, and the week's tally it feeds. */
async function registraSalida(
  sql: Sql,
  st: EstadoMes,
  productoId: string,
  fecha: string,
  cantidad: number,
): Promise<void> {
  await movimiento(
    sql,
    `FM${String(MOV_SEQ++).padStart(3, '0')}`,
    productoId,
    fecha,
    'salida',
    cantidad,
    COST[productoId] ?? 0,
    'Venta',
  );
  st.consumo.set(productoId, (st.consumo.get(productoId) ?? 0) + cantidad);
}

/** One ticket — header, line, and the stock it moved. Returns its efectivo. */
async function seedTicket(
  sql: Sql,
  tag: string,
  fecha: string,
  r: () => number,
  st: EstadoMes,
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
  await registraSalida(sql, st, p[0], fecha, cantidad);
  if (credito) st.creditoDado = true;
  return metodo === 'Efectivo' ? Number(monto) : 0;
}

/** One operating day: its tickets and its corte. */
async function seedDia(
  sql: Sql,
  tag: string,
  fecha: string,
  r: () => number,
  st: EstadoMes,
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

/** Previous or current month of `anchor`, as one seeded ledger. */
export async function seedMes(
  sql: Sql,
  tag: string,
  days: readonly string[],
  folioBase: number,
): Promise<void> {
  const st: EstadoMes = { folio: 0, creditoDado: false, consumo: new Map() };
  for (const semana of semanas(days)) {
    for (const fecha of semana) {
      await seedDia(sql, tag, fecha, rng(fecha), st, folioBase);
    }
    // Pedro's compra for the week that just sold — the seed may never net a
    // negative stock, which `seed-contract.integration.test.ts` now asserts.
    await reponerStock(sql, semana[0] ?? days[0] ?? '', st.consumo);
    st.consumo.clear();
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
