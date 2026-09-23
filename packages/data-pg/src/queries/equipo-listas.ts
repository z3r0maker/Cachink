/**
 * What Tu equipo's two lists show about each operator and each device
 * (C-2…C-5). The drawer queries stay in `equipo.ts`.
 *
 * The screen used to have four columns for an operator — id, name,
 * permissions, active — and draw a card the design fills with a shift state,
 * two stat boxes and a footer naming the device. None of that is stored on
 * the user: it is the shift that knows, and the shift is what these queries
 * walk to.
 */

import { sql } from 'drizzle-orm';

import { cajaTurnos } from '../schema/caja.js';
import { expenses, sales, tickets } from '../schema/ledger.js';
import { devices } from '../schema/portal.js';
import { syncRejections } from '../schema/sync.js';
import { users } from '../schema/tenant.js';
import type { Db } from '../client.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

const big = (v: unknown): bigint => (v === null || v === undefined ? 0n : BigInt(String(v)));

/**
 * An operator's shift state, as the design's pill names it.
 *
 * `sin_vincular` is an operator who has never opened a shift: they exist in
 * the team but no device has ever carried them, which is exactly what the
 * owner needs to see before wondering why nothing of theirs arrives.
 */
export type EstadoTurno = 'abierto' | 'cerrado' | 'sin_vincular';

export interface OperadorRow {
  readonly id: string;
  readonly nombre: string | null;
  readonly permissions: unknown;
  readonly active: boolean;
  readonly estadoTurno: EstadoTurno;
  /** Movements captured today, tickets and egresos alike. */
  readonly capturoHoy: number;
  /** What those tickets came to — derived from sale lines (ADR-073). */
  readonly cobradoHoy: bigint;
  /** The device of their most recent shift, and when it opened. */
  readonly dispositivo: string | null;
  readonly ultimoTurnoAt: string | null;
}

type OperadorSqlRow = {
  id: string;
  nombre: string | null;
  permissions: unknown;
  active: boolean;
  turnos: string;
  abiertos: string;
  capturo_hoy: string;
  cobrado_hoy: string;
  dispositivo: string | null;
  ultimo_turno_at: string | null;
};

function toEstado(r: OperadorSqlRow): EstadoTurno {
  if (Number(r.turnos) === 0) return 'sin_vincular';
  return Number(r.abiertos) > 0 ? 'abierto' : 'cerrado';
}

export async function listOperadores(tx: Tx, hoy: string): Promise<readonly OperadorRow[]> {
  const rows = await tx.execute<OperadorSqlRow>(sql`
    SELECT u.id, u.nombre, u.permissions, u.active,
           (SELECT count(*) FROM ${cajaTurnos} t WHERE t.user_id = u.id AND t.deleted_at IS NULL) AS turnos,
           (SELECT count(*) FROM ${cajaTurnos} t
             WHERE t.user_id = u.id AND t.deleted_at IS NULL AND t.cierre_at IS NULL) AS abiertos,
           (SELECT count(*) FROM ${tickets} k
              JOIN ${cajaTurnos} t ON t.id = k.caja_turno_id
             WHERE t.user_id = u.id AND k.fecha = ${hoy}
               AND k.deleted_at IS NULL AND k.cancelled_at IS NULL)
         + (SELECT count(*) FROM ${expenses} e
              JOIN ${cajaTurnos} t ON t.id = e.caja_turno_id
             WHERE t.user_id = u.id AND e.fecha = ${hoy} AND e.deleted_at IS NULL) AS capturo_hoy,
           (SELECT COALESCE(SUM(s.monto_centavos), 0) FROM ${sales} s
              JOIN ${tickets} k ON k.id = s.ticket_id
              JOIN ${cajaTurnos} t ON t.id = k.caja_turno_id
             WHERE t.user_id = u.id AND s.fecha = ${hoy}
               AND s.deleted_at IS NULL AND k.cancelled_at IS NULL)::text AS cobrado_hoy,
           (SELECT d.nombre FROM ${cajaTurnos} t
              JOIN ${devices} d ON d.id = t.device_id
             WHERE t.user_id = u.id AND t.deleted_at IS NULL
             ORDER BY t.apertura_at DESC LIMIT 1) AS dispositivo,
           (SELECT t.apertura_at::text FROM ${cajaTurnos} t
             WHERE t.user_id = u.id AND t.deleted_at IS NULL
             ORDER BY t.apertura_at DESC LIMIT 1) AS ultimo_turno_at
      FROM ${users} u
     WHERE u.deleted_at IS NULL
     ORDER BY u.nombre`);

  return [...rows].map((r) => ({
    id: r.id,
    nombre: r.nombre,
    permissions: r.permissions,
    active: r.active,
    estadoTurno: toEstado(r),
    capturoHoy: Number(r.capturo_hoy),
    cobradoHoy: big(r.cobrado_hoy),
    dispositivo: r.dispositivo,
    ultimoTurnoAt: r.ultimo_turno_at,
  }));
}

export interface DispositivoRow {
  readonly id: string;
  readonly nombre: string;
  readonly plataforma: string;
  readonly modelo: string;
  readonly lastPushAt: string | null;
  readonly revokedAt: string | null;
  /** Whoever last opened a shift on it, and whether that shift is still open. */
  readonly operador: string | null;
  readonly turnoAbierto: boolean;
  /** Rows this device sent that the server refused and nobody has resolved. */
  readonly rechazados: number;
  readonly ultimoCorte: string | null;
}

type DispositivoSqlRow = {
  id: string;
  nombre: string;
  plataforma: string;
  modelo: string;
  last_push_at: string | null;
  revoked_at: string | null;
  operador: string | null;
  turno_abierto: boolean;
  rechazados: string;
  ultimo_corte: string | null;
};

export async function listDispositivos(tx: Tx): Promise<readonly DispositivoRow[]> {
  const rows = await tx.execute<DispositivoSqlRow>(sql`
    SELECT d.id, d.nombre, d.plataforma, d.modelo,
           d.last_push_at::text AS last_push_at, d.revoked_at::text AS revoked_at,
           (SELECT u.nombre FROM ${cajaTurnos} t
              JOIN ${users} u ON u.id = t.user_id
             WHERE t.device_id = d.id AND t.deleted_at IS NULL
             ORDER BY t.apertura_at DESC LIMIT 1) AS operador,
           EXISTS (SELECT 1 FROM ${cajaTurnos} t
                    WHERE t.device_id = d.id AND t.deleted_at IS NULL AND t.cierre_at IS NULL)
             AS turno_abierto,
           (SELECT count(*) FROM ${syncRejections} r
             WHERE r.device_id = d.id AND r.resolved_at IS NULL) AS rechazados,
           (SELECT t.cierre_at::text FROM ${cajaTurnos} t
             WHERE t.device_id = d.id AND t.deleted_at IS NULL AND t.cierre_at IS NOT NULL
             ORDER BY t.cierre_at DESC LIMIT 1) AS ultimo_corte
      FROM ${devices} d
     ORDER BY d.nombre`);

  return [...rows].map((r) => ({
    id: r.id,
    nombre: r.nombre,
    plataforma: r.plataforma,
    modelo: r.modelo,
    lastPushAt: r.last_push_at,
    revokedAt: r.revoked_at,
    operador: r.operador,
    turnoAbierto: r.turno_abierto,
    rechazados: Number(r.rechazados),
    ultimoCorte: r.ultimo_corte,
  }));
}
