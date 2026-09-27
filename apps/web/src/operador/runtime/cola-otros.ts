/**
 * The outbox's rarer tables (O-27): a corte, an entrega, a conversion, a
 * count, or a catalogue edit, each one line with a title and, where the row
 * has one, a name.
 */

import { sql } from 'drizzle-orm';

import { filas, movimiento, porId, porLotes, type Lector } from './cola-sql';
import type { ClaseMovimiento } from '@xangarro/caja/lectura';

/** The rarer tables: a title, and a name where the row has one. */
export const OTROS: Readonly<Record<string, readonly [ClaseMovimiento, boolean]>> = {
  day_closes: ['corte', false],
  entregas_credito: ['entrega', false],
  conversions: ['conversion', false],
  auditorias_inventario: ['conteo', false],
  products: ['producto', true],
  clients: ['cliente', true],
};

export const otro =
  (tabla: string): Lector =>
  async (db, ids) => {
    const [clase, conNombre] = OTROS[tabla] ?? ['corte', false];
    const nombre = conNombre ? sql`nombre` : sql`NULL`;
    const rs = await porLotes(ids, (l) =>
      filas<{ id: string; en: string; nombre: string | null }>(
        db,
        sql`SELECT id, updated_at AS en, ${nombre} AS nombre FROM ${sql.raw(tabla)} WHERE id IN ${l}`,
      ),
    );
    return porId(rs.map((r) => movimiento(r.id, r.en, clase, r.nombre, null)));
  };
