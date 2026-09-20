/**
 * The fiado clients (O-33): a register's linked Cobranza needs someone to
 * sell to on credit. Credit line and term set by the owner (ADR-074).
 */

import type { Sql } from 'postgres';

import { BIZ, CLIENTS, CREATED, DEV } from './seed-data.js';

export async function seedClients(sql: Sql): Promise<void> {
  for (const [id, nombre, telefono, limite, plazo] of CLIENTS) {
    await sql`
      INSERT INTO clients (id, nombre, telefono, limite_centavos, plazo_dias,
                           business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${nombre}, ${telefono}, ${limite}, ${plazo},
              ${BIZ}, ${DEV}, ${CREATED}, ${CREATED})
      ON CONFLICT (id) DO NOTHING`;
  }
}
