import type postgres from 'postgres';

import { BIZ, DAY_CLOSE_ID, DEV, MOVEMENTS, peso, TS } from './seed-data.js';

type Sql = ReturnType<typeof postgres>;
export async function seedMovements(sql: Sql): Promise<void> {
  for (const [id, productoId, fecha, tipo, cantidad, costo] of MOVEMENTS) {
    await sql`
      INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad,
                                       costo_unit_centavos, motivo, business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${productoId}, ${fecha}, ${tipo}, ${cantidad}, ${costo}, 'Compra a proveedor',
              ${BIZ}, ${DEV}, ${TS(fecha)}, ${TS(fecha)})
      ON CONFLICT (id) DO NOTHING`;
  }
}

export async function seedDayClose(sql: Sql): Promise<void> {
  await sql`
    INSERT INTO day_closes (id, fecha, efectivo_esperado_centavos, efectivo_contado_centavos,
                            diferencia_centavos, cerrado_por, business_id, device_id, created_at, updated_at)
    VALUES (${DAY_CLOSE_ID}, '2026-05-11', ${peso(2118)}, ${peso(2112)}, ${-peso(6)}, 'Director',
            ${BIZ}, ${DEV}, ${TS('2026-05-11')}, ${TS('2026-05-11')})
    ON CONFLICT (id) DO NOTHING`;
}
