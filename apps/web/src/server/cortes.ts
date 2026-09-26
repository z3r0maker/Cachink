/**
 * Cortes de turno's read (O-37): the business's closed turnos with their
 * figures and stats, straight from Postgres. The calculator's answer is the
 * stored `efectivo_esperado`; the parts shown beside it are derived from the
 * same rows (the abono part is day-granular, exactly as O-03 computes it).
 */

import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { cajaTurnos, users } from '@xangarro/data-pg';

import { leerFiguras, type Figuras } from './cortes-figuras';
import { withTenant } from './db';
import type { ConteoDenominaciones } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

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
    const figuras = await leerFiguras(
      tx,
      businessId,
      rows.map((r) => r.t),
    );
    return rows.map((r) => aCorte(r, figuras));
  });
}

/** One closed turno as the screen's row. */
function aCorte(
  r: { t: (typeof cajaTurnos)['$inferSelect']; nombre: string; color: string | null },
  f: Figuras,
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
    tint: color ?? colors.yellow,
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
function statsDe(id: string, f: Figuras): CorteRow['turno'] {
  return {
    ventas: f.vivas.get(id)?.n ?? 0,
    canceladas: { n: f.canceladas.get(id)?.n ?? 0, monto: f.canceladas.get(id)?.monto ?? 0n },
    fiado: f.fiado.get(id)?.monto ?? 0n,
    // The register writes no stock movements yet; the count stays 0.
    inventario: '0 entradas · 0 mermas',
    creados: 0,
  };
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
