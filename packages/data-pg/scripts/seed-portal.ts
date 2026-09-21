/** The portal fixtures: devices, avisos and sync rejections. */

import type { Sql } from 'postgres';

import {
  BIZ,
  CREATED,
  DEVICES,
  NOTICES,
  REJECTIONS,
  REJECTING_DEVICE,
  TODAY,
  TS,
} from './seed-data.js';

export async function seedPortal(sql: Sql): Promise<void> {
  const now = TS(TODAY);
  for (const [id, nombre, plataforma, modelo, lastPush] of DEVICES) {
    await sql`
      INSERT INTO devices (id, nombre, plataforma, modelo, last_push_at, last_pull_at,
                           business_id, created_at, updated_at)
      VALUES (${id}, ${nombre}, ${plataforma}, ${modelo}, ${TS(lastPush)}, ${TS(lastPush)},
              ${BIZ}, ${CREATED}, ${CREATED})
      ON CONFLICT (id) DO NOTHING`;
  }
  for (const [id, source, severity, title, body, cta, href] of NOTICES) {
    await sql`
      INSERT INTO notices (id, source, severity, title, body, cta_label, cta_href, state,
                           business_id, created_at, updated_at)
      VALUES (${id}, ${source}, ${severity}, ${title}, ${body}, ${cta}, ${href}, 'nuevo',
              ${BIZ}, ${now}, ${now})
      ON CONFLICT (id) DO NOTHING`;
  }
  for (const [id, table, rowId, code, preview] of REJECTIONS) {
    await sql`
      INSERT INTO sync_rejections (id, device_id, table_name, row_id, code, payload, received_at,
                                   business_id, created_at, updated_at)
      VALUES (${id}, ${REJECTING_DEVICE}, ${table}, ${rowId}, ${code},
              ${JSON.stringify({ preview })}, ${now}, ${BIZ}, ${now}, ${now})
      ON CONFLICT (id) DO NOTHING`;
  }
}
