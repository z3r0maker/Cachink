/**
 * One reader per outbox table (O-27): the few columns Registros por enviar
 * shows, read in batches with plain SQL (money cast to text, so a centavos
 * amount never passes through a float).
 */

import { sql } from 'drizzle-orm';

import type { PendienteCrudo } from './cola-shapes';
import { OTROS, otro } from './cola-otros';
import { filas, movimiento, porId, porLotes, type Lector } from './cola-sql';

type Linea = { t: string; concepto: string; cantidad: number; monto: string };
type Ticket = { id: string; folio: number; hora: string | null; metodo: string; en: string };

const ventas: Lector = async (db, ids) => {
  const tickets = await porLotes(ids, (l) =>
    filas<Ticket & { cancelada: string | null }>(
      db,
      sql`SELECT id, folio, hora, metodo, created_at AS en, cancelled_at AS cancelada
          FROM tickets WHERE id IN ${l}`,
    ),
  );
  const lineas = await porLotes(ids, (l) =>
    filas<Linea>(
      db,
      sql`SELECT ticket_id AS t, concepto, cantidad, CAST(monto_centavos AS TEXT) AS monto
          FROM sales WHERE ticket_id IN ${l} AND deleted_at IS NULL ORDER BY created_at`,
    ),
  );
  return porId(
    tickets.map((t) => {
      const suyas = lineas.filter((x) => x.t === t.id);
      return {
        tipo: 'venta',
        id: t.id,
        en: t.en,
        folio: Number(t.folio),
        hora: t.hora,
        metodo: t.metodo,
        lineas: suyas.map((x) => ({ concepto: x.concepto, cantidad: Number(x.cantidad) })),
        totalCentavos: suyas.reduce((a, x) => a + BigInt(x.monto ?? '0'), 0n).toString(),
        cancelada: t.cancelada !== null,
      };
    }),
  );
};

const gastos: Lector = async (db, ids) =>
  porId(
    await porLotes(ids, (l) =>
      filas<{ id: string; en: string; concepto: string; monto: string; proveedor: string | null }>(
        db,
        sql`SELECT id, created_at AS en, concepto, CAST(monto_centavos AS TEXT) AS monto, proveedor
            FROM expenses WHERE id IN ${l}`,
      ),
    ).then((rs) =>
      rs.map((r) => ({
        tipo: 'gasto' as const,
        id: r.id,
        en: r.en,
        concepto: r.concepto,
        montoCentavos: r.monto,
        proveedor: r.proveedor,
      })),
    ),
  );

const abonos: Lector = async (db, ids) =>
  porId(
    await porLotes(ids, (l) =>
      filas<{ id: string; en: string; cliente: string | null; monto: string; metodo: string }>(
        db,
        sql`SELECT p.id, p.created_at AS en, c.nombre AS cliente,
                   CAST(p.monto_centavos AS TEXT) AS monto, p.metodo
            FROM client_payments p LEFT JOIN clients c ON c.id = p.cliente_id
            WHERE p.id IN ${l}`,
      ),
    ).then((rs) =>
      rs.map((r) => ({
        tipo: 'abono' as const,
        id: r.id,
        en: r.en,
        cliente: r.cliente,
        montoCentavos: r.monto,
        metodo: r.metodo,
      })),
    ),
  );

const movimientosCaja: Lector = async (db, ids) =>
  porId(
    (
      await porLotes(ids, (l) =>
        filas<{ id: string; en: string; tipo: string; monto: string; motivo: string }>(
          db,
          sql`SELECT id, created_at AS en, tipo, CAST(monto_centavos AS TEXT) AS monto, motivo
              FROM caja_movimientos WHERE id IN ${l}`,
        ),
      )
    ).map((r) =>
      movimiento(r.id, r.en, r.tipo === 'retiro' ? 'retiro' : 'deposito', r.motivo, r.monto),
    ),
  );

type Turno = { id: string; en: string; cierre: string | null; abre: string; cierra: string | null };

const turnos: Lector = async (db, ids) =>
  porId(
    (
      await porLotes(ids, (l) =>
        filas<Turno>(
          db,
          sql`SELECT id, updated_at AS en, cierre_at AS cierre,
                     CAST(monto_apertura_centavos AS TEXT) AS abre,
                     CAST(monto_cierre_centavos AS TEXT) AS cierra
              FROM caja_turnos WHERE id IN ${l}`,
        ),
      )
    ).map((r) =>
      r.cierre === null
        ? movimiento(r.id, r.en, 'apertura', null, r.abre)
        : movimiento(r.id, r.en, 'cierre', null, r.cierra),
    ),
  );

const respuestas: Lector = async (db, ids) =>
  porId(
    (
      await porLotes(ids, (l) =>
        filas<{ id: string; en: string; texto: string }>(
          db,
          sql`SELECT id, created_at AS en, texto FROM respuestas_operador WHERE id IN ${l}`,
        ),
      )
    ).map((r) => movimiento(r.id, r.en, 'respuesta', r.texto, null)),
  );

/** Every unsent ledger row, folded into one line under the id `inventario`. */
const inventario: Lector = async (db, ids) => {
  const rs = await porLotes(ids, (l) =>
    filas<{ tipo: string; n: number; en: string }>(
      db,
      sql`SELECT tipo, count(*) AS n, max(updated_at) AS en
          FROM inventory_movements WHERE id IN ${l} GROUP BY tipo`,
    ),
  );
  if (rs.length === 0) return new Map();
  const cuenta = (t: string) => rs.filter((r) => r.tipo === t).reduce((a, r) => a + Number(r.n), 0);
  const en =
    rs
      .map((r) => r.en)
      .sort()
      .at(-1) ?? '';
  const fila: PendienteCrudo = {
    tipo: 'movimiento',
    id: 'inventario',
    en,
    clase: 'inventario',
    texto: null,
    montoCentavos: null,
    entradas: cuenta('entrada'),
    salidas: cuenta('salida'),
  };
  return new Map([['inventario', fila]]);
};

export const LECTORES: Readonly<Record<string, Lector>> = {
  tickets: ventas,
  expenses: gastos,
  client_payments: abonos,
  caja_movimientos: movimientosCaja,
  caja_turnos: turnos,
  respuestas_operador: respuestas,
  inventory_movements: inventario,
  ...Object.fromEntries(Object.keys(OTROS).map((t) => [t, otro(t)])),
};
