import { randomBytes, randomUUID } from 'node:crypto';

import { nombreTrimestre, trimestreSiguiente, ultimoDiaDelTrimestre } from '@xangarro/domain/corp';
import postgres from 'postgres';

import { OTRO_ID } from './empresa-cierre';
import { hoyMx, trimestreMx } from './empresa-presupuesto';

/**
 * E-20's steps for empresa.spec.ts. The other founder (no console login)
 * proposes values, approves and objects in the database, as a second
 * browser would. A closed quarter long before anything else writes
 * (2020–2024) is seeded with one partner under the minimum, for the notice.
 * `clearLedgerFixture` removes every Tablero row the suite leaves.
 */
export const TABLERO_ACTUAL = trimestreMx();
export const TABLERO_SIGUIENTE = trimestreSiguiente(TABLERO_ACTUAL);
export const TABLERO_CERRADO = (() => {
  const n = randomBytes(1).readUInt8(0) % 20;
  return `${2020 + Math.floor(n / 4)}-T${(n % 4) + 1}`;
})();
export const nombre = nombreTrimestre;

/** The first day of a quarter: a due date inside it. */
export const primerDia = (t: string) => {
  const [y, q] = [t.slice(0, 4), Number(t.slice(6))];
  return `${y}-${String(q * 3 - 2).padStart(2, '0')}-01`;
};

export const hoy = hoyMx;

const superSql = () =>
  postgres(process.env.DATABASE_SUPER_URL ?? '', { max: 1, onnotice: () => undefined });

async function con(f: (sql: postgres.Sql) => Promise<unknown>): Promise<void> {
  const sql = superSql();
  try {
    await f(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

/** Fundador 2 puts their value on the card named `titulo`, in pesos. */
export const otroPoneValor = (titulo: string, pesos: number) =>
  con(
    (sql) => sql`UPDATE corp.board_cards SET value_f2 = ${pesos * 100}, updated_by = ${OTRO_ID},
                     updated_at = now() WHERE title = ${titulo}`,
  );

export const otroApruebaPlan = (trimestre: string) =>
  con(
    (
      sql,
    ) => sql`INSERT INTO corp.board_plan_events (id, quarter, kind, socio, on_date, founder_id, at)
                   VALUES (${randomUUID()}, ${trimestre}, 'aprobado', 2, ${hoyMx()}, ${OTRO_ID}, now())`,
  );

export const otroObjeta = (titulo: string, motivo: string) =>
  con(
    (
      sql,
    ) => sql`INSERT INTO corp.board_card_events (id, card_id, kind, socio, on_date, reason, founder_id, at)
                   SELECT ${randomUUID()}, id, 'objetada', 2, ${hoyMx()}, ${motivo}, ${OTRO_ID}, now()
                     FROM corp.board_cards WHERE title = ${titulo}`,
  );

/**
 * `TABLERO_CERRADO`, approved by both: Fundador 1's «E2E Lanzamiento» was
 * finished and accepted ($35,000); Fundador 2's «E2E Alianza» ($30,000) never
 * started and left the next plan, so it rolls nowhere. Fundador 1 cumplió,
 * Fundador 2 did not: the quarter calls for a notice.
 */
export async function sembrarCierre(): Promise<void> {
  const t = TABLERO_CERRADO;
  const [dia, fin] = [primerDia(t), ultimoDiaDelTrimestre(t)];
  await con((sql) =>
    sql.begin(async (tx) => {
      for (const [kind, socio, at] of [
        ['enviado', 1, 1],
        ['aprobado', 2, 2],
      ] as const) {
        await tx`INSERT INTO corp.board_plan_events (id, quarter, kind, socio, on_date, founder_id, at)
                 VALUES (${randomUUID()}, ${t}, ${kind}, ${socio}, ${dia}, ${OTRO_ID},
                         ${`${dia}T1${at}:00:00Z`})`;
      }
      for (const [id, title, owner, valor, dropped] of [
        [`e2e-lanz-${randomUUID()}`, 'E2E Lanzamiento cerrado', 1, 3_500_000, null],
        [`e2e-alianza-${randomUUID()}`, 'E2E Alianza cerrada', 2, 3_000_000, trimestreSiguiente(t)],
      ] as const) {
        await tx`INSERT INTO corp.board_cards (id, quarter, kind, title, criterion, owner, due, value_f1,
                   value_f2, dropped_in, created_by, created_at, updated_by, updated_at)
                 VALUES (${id}, ${t}, 'entregable', ${title}, 'Con su evidencia.', ${owner}, ${fin},
                   ${valor}, ${valor}, ${dropped}, ${OTRO_ID}, now(), ${OTRO_ID}, now())`;
        if (owner !== 1) continue;
        await tx`INSERT INTO corp.board_card_events (id, card_id, kind, socio, on_date, link, founder_id, at)
                 VALUES (${randomUUID()}, ${id}, 'terminada', 1, ${dia}, 'https://xangarro.mx', ${OTRO_ID}, now())`;
        await tx`INSERT INTO corp.board_card_events (id, card_id, kind, socio, on_date, founder_id, at)
                 VALUES (${randomUUID()}, ${id}, 'aceptada', 2, ${dia}, ${OTRO_ID}, now() + interval '1 second')`;
      }
    }),
  );
}
