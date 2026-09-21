/**
 * The closed turnos (O-37): Cortes de turno reviews real rows — the count by
 * denomination, the difference with its reason, and one corte already
 * aclarado so the list shows all three states. Figures follow the seed's
 * frozen May week (PORTAL_TODAY).
 */

import type { Sql } from 'postgres';

import { BIZ, CREATED, DEV, id, USERS, TODAY, TS } from './seed-data.js';

interface CorteSemilla {
  readonly userId: string;
  readonly fecha: string;
  readonly apertura: string;
  readonly cierre: string;
  readonly fondo: number;
  readonly esperado: number;
  readonly cierreMonto: number;
  readonly diferencia: number;
  readonly motivo: string | null;
  readonly nota: string | null;
  readonly conteo: Record<string, number> | null;
  readonly aclarado: boolean;
}

const CORTES: readonly CorteSemilla[] = [
  {
    // Ana, the day before the frozen today: counted $60 short, explained.
    userId: USERS[0][0],
    fecha: '2026-05-13',
    apertura: TS('2026-05-13'),
    cierre: TS('2026-05-13').replace('15:00', '21:04'),
    fondo: 800_00,
    esperado: 2_710_00,
    cierreMonto: 2_650_00,
    diferencia: -60_00,
    motivo: 'error-en-cambio',
    nota: 'Se me fue un cambio de más con un cliente',
    conteo: { 1000: 2, 500: 1, 100: 1, 50: 1 },
    aclarado: false,
  },
  {
    // Luis, two days before: cuadró.
    userId: USERS[1][0],
    fecha: '2026-05-12',
    apertura: TS('2026-05-12'),
    cierre: TS('2026-05-12').replace('15:00', '20:47'),
    fondo: 500_00,
    esperado: 1_930_00,
    cierreMonto: 1_930_00,
    diferencia: 0,
    motivo: null,
    nota: null,
    conteo: { 1000: 1, 500: 1, 200: 2, 20: 1, 10: 1 },
    aclarado: true,
  },
];

export async function seedCortes(sql: Sql): Promise<void> {
  for (const [i, c] of CORTES.entries()) {
    await sql`
      INSERT INTO caja_turnos (id, user_id, fecha, apertura_at, cierre_at,
                               monto_apertura_centavos, efectivo_adicional_centavos,
                               monto_cierre_centavos, efectivo_esperado_centavos, diferencia_centavos,
                               discrepancy_reason, explicacion, conteo_centavos, conteo_at,
                               denominaciones, aclarado_at, aclarado_por,
                               business_id, device_id, created_at, updated_at)
      VALUES (${id(`CT${String(i).padStart(2, '0')}A`)}, ${c.userId}, ${c.fecha}, ${c.apertura}, ${c.cierre},
              ${c.fondo}, 0, ${c.cierreMonto}, ${c.esperado}, ${c.diferencia},
              ${c.motivo}, ${c.nota}, ${c.cierreMonto}, ${c.cierre},
              ${c.conteo === null ? null : JSON.stringify(c.conteo)},
              ${c.aclarado ? CREATED : null}, ${c.aclarado ? 'portal' : null},
              ${BIZ}, ${DEV}, ${c.apertura}, ${c.cierre})
      ON CONFLICT (id) DO NOTHING`;
  }
  void TODAY;
}
