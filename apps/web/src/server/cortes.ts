/**
 * Cortes de turno's read (O-37): the business's closed turnos with their
 * figures and stats, straight from Postgres. The calculator's answer is the
 * stored `efectivo_esperado`; the parts shown beside it are derived from the
 * same rows (the abono part is day-granular, exactly as O-03 computes it).
 */

import { and, count, desc, eq, inArray, isNotNull, isNull, sum } from 'drizzle-orm';
import {
  cajaTurnos,
  clientPayments,
  expenses as expensesTable,
  sales as salesTable,
  tickets as ticketsTable,
  users,
} from '@xangarro/data-pg';

import { withTenant, type Tx } from './db';
import type { ConteoDenominaciones } from '@xangarro/domain';

/** The screen's `Corte`, in centavos, ready to render. */
export interface CorteRow {
  readonly id: string;
  readonly operador: string;
  readonly iniciales: string;
  readonly tint: string;
  readonly caja: string;
  readonly dia: string;
  readonly horario: string;
  readonly fondo: bigint;
  readonly ventasEfectivo: bigint;
  readonly abonosEfectivo: bigint;
  readonly gastosCaja: bigint;
  readonly conteo: ConteoDenominaciones;
  readonly motivo: string | null;
  readonly nota: string | null;
  readonly estado: 'Cuadró' | 'Por aclarar' | 'Aclarado';
  readonly turno: {
    readonly ventas: number;
    readonly canceladas: { readonly n: number; readonly monto: bigint };
    readonly fiado: bigint;
    readonly inventario: string;
    readonly creados: number;
  };
}

type Stats = Map<string, { n: number; monto: bigint }>;

const dia = (iso: string): string =>
  new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Mexico_City',
  }).format(new Date(iso));

const hhmm = (iso: string): string =>
  new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Mexico_City',
  }).format(new Date(iso));

/** The closed turnos, newest first, with everything the list and drawer show. */
export async function listarCortes(businessId: string): Promise<readonly CorteRow[]> {
  return withTenant(businessId, async (tx) => {
    const rows = await tx
      .select({ t: cajaTurnos, nombre: users.nombre, color: users.avatarColor })
      .from(cajaTurnos)
      .innerJoin(users, eq(users.id, cajaTurnos.userId))
      .where(
        and(
          eq(cajaTurnos.businessId, businessId),
          isNotNull(cajaTurnos.cierreAt),
          isNull(cajaTurnos.deletedAt),
        ),
      )
      .orderBy(desc(cajaTurnos.cierreAt))
      .limit(200);
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.t.id);
    const figuras = await leerFiguras(tx, businessId, ids);
    return rows.map((r) => aCorte(r, figuras));
  });
}

/** One closed turno as the screen's row. */
function aCorte(
  r: { t: (typeof cajaTurnos)['$inferSelect']; nombre: string; color: string | null },
  f: {
    vivas: Stats;
    canceladas: Stats;
    fiado: Stats;
    gastos: Map<string, bigint>;
    abonos: Map<string, bigint>;
  },
): CorteRow {
  const { t, nombre, color } = r;
  const fondo = t.montoAperturaCentavos + t.efectivoAdicionalCentavos;
  const gastosCaja = f.gastos.get(t.id) ?? 0n;
  const abonosEfe = f.abonos.get(t.fecha) ?? 0n;
  const esperado = t.efectivoEsperadoCentavos ?? fondo;
  return {
    id: t.id,
    operador: nombre,
    iniciales: iniciales(nombre),
    tint: color ?? '#FFD60A',
    caja: 'Caja 1',
    dia: dia(t.cierreAt ?? t.aperturaAt),
    horario: `${hhmm(t.aperturaAt)} a ${hhmm(t.cierreAt ?? t.aperturaAt)}`,
    fondo,
    ventasEfectivo: esperado - fondo - abonosEfe + gastosCaja,
    abonosEfectivo: abonosEfe,
    gastosCaja,
    conteo: safeConteo(t.denominaciones),
    motivo: t.discrepancyReason ?? null,
    nota: t.explicacion ?? null,
    estado: estadoDe(t),
    turno: statsDe(t.id, f),
  } satisfies CorteRow;
}

/** Cuadró / Por aclarar / Aclarado, from the stored difference and stamp. */
function estadoDe(t: (typeof cajaTurnos)['$inferSelect']): CorteRow['estado'] {
  if (t.aclaradoAt !== null) return 'Aclarado';
  return (t.diferenciaCentavos ?? 0n) === 0n ? 'Cuadró' : 'Por aclarar';
}

/** The «Qué más pasó» card's counts. */
function statsDe(id: string, f: Awaited<ReturnType<typeof leerFiguras>>): CorteRow['turno'] {
  return {
    ventas: f.vivas.get(id)?.n ?? 0,
    canceladas: { n: f.canceladas.get(id)?.n ?? 0, monto: f.canceladas.get(id)?.monto ?? 0n },
    fiado: f.fiado.get(id)?.monto ?? 0n,
    // The register writes no stock movements yet; the count stays 0.
    inventario: '0 entradas · 0 mermas',
    creados: 0,
  };
}

/** All the per-turno figures the rows need, in five grouped queries. */
async function leerFiguras(tx: Tx, businessId: string, ids: readonly string[]) {
  const [vivas, fiado, canceladas, gastosFilas, abonosFilas] = await Promise.all([
    statsPorTurno(tx, ids, isNull(ticketsTable.cancelledAt)),
    statsPorTurno(
      tx,
      ids,
      and(isNull(ticketsTable.cancelledAt), eq(ticketsTable.metodo, 'Crédito')),
    ),
    statsPorTurno(tx, ids, isNotNull(ticketsTable.cancelledAt)),
    tx
      .select({ turno: expensesTable.cajaTurnoId, monto: expensesTable.monto })
      .from(expensesTable)
      .where(and(inArray(expensesTable.cajaTurnoId, ids), isNull(expensesTable.deletedAt))),
    tx
      .select({ fecha: clientPayments.fecha, monto: clientPayments.montoCentavos })
      .from(clientPayments)
      .where(
        and(
          eq(clientPayments.businessId, businessId),
          eq(clientPayments.metodo, 'Efectivo'),
          isNull(clientPayments.deletedAt),
        ),
      ),
  ]);
  const gastos = new Map<string, bigint>();
  for (const g of gastosFilas) {
    if (g.turno !== null) gastos.set(g.turno, (gastos.get(g.turno) ?? 0n) + g.monto);
  }
  const abonos = new Map<string, bigint>();
  for (const a of abonosFilas) abonos.set(a.fecha, (abonos.get(a.fecha) ?? 0n) + a.monto);
  return { vivas, fiado, canceladas, gastos, abonos };
}

/** Ticket counts and line-total sums per turno, for the stats card. */
async function statsPorTurno(
  tx: Tx,
  ids: readonly string[],
  vivo: Parameters<typeof and>[0],
): Promise<Stats> {
  const rows = await tx
    .select({
      turno: ticketsTable.cajaTurnoId,
      n: count(ticketsTable.id),
      monto: sum(salesTable.monto),
    })
    .from(ticketsTable)
    .leftJoin(salesTable, eq(salesTable.ticketId, ticketsTable.id))
    .where(and(inArray(ticketsTable.cajaTurnoId, ids), vivo, isNull(ticketsTable.deletedAt)))
    .groupBy(ticketsTable.cajaTurnoId);
  const m: Stats = new Map();
  for (const r of rows) {
    if (r.turno === null) continue;
    m.set(r.turno, { n: Number(r.n), monto: BigInt(r.monto ?? '0') });
  }
  return m;
}

function iniciales(nombre: string): string {
  const p = nombre.trim().split(/\s+/);
  return `${p[0]?.[0] ?? ''}${p[1]?.[0] ?? ''}`.toUpperCase();
}

function safeConteo(json: string | null): ConteoDenominaciones {
  if (json === null) return {};
  try {
    const parsed: unknown = JSON.parse(json);
    return typeof parsed === 'object' && parsed !== null ? (parsed as ConteoDenominaciones) : {};
  } catch {
    return {};
  }
}
