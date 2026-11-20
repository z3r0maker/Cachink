import { randomBytes } from 'node:crypto';
import postgres from 'postgres';

import type { StaffLogin } from './helpers';
import { insertStaff } from './staff-fixture';

/**
 * The «Empresa» suite's own staff member (E-01): allowlisted like any staff,
 * a founder only once the suite registers them in corp. Separate from the
 * auth suite's member, so the two specs never share a TOTP seed or a lockout.
 */
export const SOCIO: StaffLogin = { email: 'e2e-socio@xangarro.mx' };

const superUrl = (): string => {
  const url = process.env.DATABASE_SUPER_URL ?? '';
  if (url === '') throw new Error('DATABASE_SUPER_URL is not set.');
  return url;
};

async function withSuper<T>(fn: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const sql = postgres(superUrl(), { max: 1, onnotice: () => undefined });
  try {
    return await fn(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

/** A fresh, not-yet-founder staff member, and no founders at all in corp. */
export async function resetSocioFixture(): Promise<void> {
  await withSuper(async (sql) => {
    await sql`DELETE FROM corp.founders`;
    await insertStaff(sql, SOCIO.email, 'Socia E2E', '01E2PARTNER', true);
  });
}

/** Registers the suite's member as Fundador 1 — what the operator CLI will do. */
export async function makeSocioFounder(): Promise<void> {
  await withSuper(async (sql) => {
    await sql`
      INSERT INTO corp.founders (id, staff_member_id, numero, nombre, created_at)
      SELECT ${`f-${randomBytes(6).toString('hex')}`}, id, 1, 'Socia E2E', now()
        FROM staff_members WHERE lower(email) = ${SOCIO.email} AND revoked_at IS NULL`;
  });
}

/** What the movimientos suite captures is named «E2E …» (and its reversal «Reversa: E2E …»). */
export const E2E_CONCEPTO = 'E2E Vercel';

/**
 * The console's corp role has no DELETE; the owner removes the suite's
 * entries: the ones it names «E2E …», their reversals, and whatever its
 * founders posted (a quarter close names itself), plus its funding calls.
 */
/**
 * E-22: the budgets and requests of the suite's founder and of the other
 * founder the tests add (`f-e2e-dos-…`), with their answers.
 */
async function borrarPresupuestos(tx: postgres.TransactionSql): Promise<void> {
  const suite = tx`SELECT f.id FROM corp.founders f
                     JOIN staff_members s ON s.id = f.staff_member_id
                    WHERE lower(s.email) = ${SOCIO.email}`;
  const presupuestos = tx`SELECT id FROM corp.budgets
                           WHERE prepared_by LIKE 'f-e2e-%' OR prepared_by IN (${suite})`;
  await tx`DELETE FROM corp.budget_answers WHERE budget_id IN (${presupuestos})`;
  await tx`DELETE FROM corp.budget_lines WHERE budget_id IN (${presupuestos})`;
  await tx`DELETE FROM corp.budgets WHERE id IN (${presupuestos})`;
  const pedidas = tx`SELECT id FROM corp.spend_requests
                      WHERE founder_id LIKE 'f-e2e-%' OR founder_id IN (${suite})`;
  await tx`DELETE FROM corp.spend_request_answers WHERE request_id IN (${pedidas})`;
  await tx`DELETE FROM corp.spend_requests WHERE id IN (${pedidas})`;
}

/** E-43: the códigos agrupadores the suite saved, with their validations. */
async function borrarCodigos(tx: postgres.TransactionSql): Promise<void> {
  const listas = tx`SELECT l.id FROM corp.account_code_lists l
                     JOIN corp.founders f ON f.id = l.captured_by
                     JOIN staff_members s ON s.id = f.staff_member_id
                    WHERE lower(s.email) = ${SOCIO.email}`;
  await tx`DELETE FROM corp.account_code_validations WHERE list_id IN (${listas})`;
  await tx`DELETE FROM corp.account_codes WHERE list_id IN (${listas})`;
  await tx`DELETE FROM corp.account_code_lists WHERE id IN (${listas})`;
}

/**
 * E-20: every Tablero row the suite's founders, the other founder the tests
 * add, or a founder an earlier run left behind wrote. The suite owns
 * corp.founders here (`clearFounders`), so a row of no current founder is a
 * past run's. Before the documents, which the notices and events name.
 */
async function borrarTablero(tx: postgres.TransactionSql): Promise<void> {
  const otros = tx`SELECT f.id FROM corp.founders f
                     JOIN staff_members s ON s.id = f.staff_member_id
                    WHERE lower(s.email) <> ${SOCIO.email} AND f.id NOT LIKE 'f-e2e-%'`;
  const tarjetas = tx`SELECT id FROM corp.board_cards
                       WHERE created_by NOT IN (${otros}) OR title LIKE 'E2E %'`;
  await tx`DELETE FROM corp.board_notices WHERE founder_id NOT IN (${otros})`;
  await tx`DELETE FROM corp.board_card_events
            WHERE card_id IN (${tarjetas}) OR founder_id NOT IN (${otros})`;
  await tx`DELETE FROM corp.board_cards WHERE id IN (${tarjetas})`;
  const objetivos = tx`SELECT id FROM corp.board_objectives WHERE created_by NOT IN (${otros})`;
  await tx`DELETE FROM corp.board_objective_progress WHERE objective_id IN (${objetivos})`;
  await tx`DELETE FROM corp.board_objectives WHERE id IN (${objetivos})`;
  await tx`DELETE FROM corp.board_plan_events WHERE founder_id NOT IN (${otros})`;
  await tx`DELETE FROM corp.board_clauses WHERE founder_id NOT IN (${otros})`;
}

/** The suite's documents, once nothing names them: the Tablero's rows, then the registries'. */
async function borrarDocumentos(
  tx: postgres.TransactionSql,
  suite: postgres.PendingQuery<postgres.Row[]>,
): Promise<void> {
  await borrarTablero(tx);
  await tx`UPDATE corp.registries SET document_id = NULL
            WHERE document_id IN (SELECT id FROM corp.documents WHERE uploaded_by IN (${suite}))`;
  await tx`DELETE FROM corp.blobs WHERE key IN (SELECT blob_key FROM corp.documents
             WHERE uploaded_by IN (${suite}) AND storage = 'pg')`;
  await tx`DELETE FROM corp.documents WHERE uploaded_by IN (${suite})`;
}

export async function clearLedgerFixture(): Promise<void> {
  await withSuper(async (sql) => {
    await sql.begin(async (tx) => {
      const suite = tx`SELECT f.id FROM corp.founders f
                         JOIN staff_members s ON s.id = f.staff_member_id
                        WHERE lower(s.email) = ${SOCIO.email}`;
      await borrarDocumentos(tx, suite);
      await tx`DELETE FROM corp.received_invoices WHERE created_by IN (${suite})`;
      await tx`DELETE FROM corp.share_events WHERE created_by IN (${suite})`;
      await tx`DELETE FROM corp.certificates WHERE created_by IN (${suite})`;
      await tx`DELETE FROM corp.obligations WHERE created_by IN (${suite})`;
      await tx`DELETE FROM corp.tax_returns WHERE created_by IN (${suite})`;
      const mine = tx`SELECT id FROM corp.entries
                       WHERE concepto LIKE 'E2E %' OR concepto LIKE 'Reversa: E2E %'
                          OR created_by IN (SELECT f.id FROM corp.founders f
                                              JOIN staff_members s ON s.id = f.staff_member_id
                                             WHERE lower(s.email) = ${SOCIO.email})`;
      await tx`DELETE FROM corp.entry_lines WHERE entry_id IN (${mine})`;
      await tx`DELETE FROM corp.entries WHERE id IN (${mine})`;
      // E-15: the Límites test's own project, and 2026's caps if it left them out.
      await tx`DELETE FROM corp.projects WHERE id LIKE 'e2e-%'`;
      await tx`INSERT INTO corp.annual_caps (anio, tope_sas, tope_resico, updated_by, updated_at)
               VALUES (2026, 767884994, 3500000000, 'e2e-fixture', now())
               ON CONFLICT (anio) DO NOTHING`;
      await tx`DELETE FROM corp.funding_calls WHERE concepto LIKE 'E2E %'`;
      // E-24: the services the suite made, before the templates they own.
      await tx`DELETE FROM corp.services WHERE nombre LIKE 'E2E %' OR updated_by IN (${suite})`;
      await tx`DELETE FROM corp.recurring_templates
                WHERE nombre LIKE 'E2E %' OR created_by IN (${suite})`;
      await borrarPresupuestos(tx);
      await borrarCodigos(tx);
      // E-14: the Cierre test closes a month before 2010, which nothing else uses;
      // a lock is lifted only with both founders, so its own goes with the
      // triggers off, for this transaction alone.
      await tx`DELETE FROM corp.bank_balances WHERE period < '2010-01'`;
      await tx`DELETE FROM corp.period_events WHERE period < '2010-01'`;
      await tx`SET LOCAL session_replication_role = replica`;
      await tx`DELETE FROM corp.closed_periods WHERE period < '2010-01'`;
    });
  });
}

/**
 * The suite starts with no SAT registration and the seeded registries; the
 * company row and the registries the database had are put back afterwards.
 */
type Empresa = {
  readonly company: Record<string, unknown> | null;
  readonly registries: readonly Record<string, unknown>[];
};

export async function sacarEmpresa(): Promise<Empresa> {
  return withSuper(async (sql) => {
    const [company] = await sql`DELETE FROM corp.company WHERE id = 'mexia'
                                RETURNING inscripcion_rfc::text, administrador, updated_by`;
    const registries =
      await sql`SELECT id, estado, referencia, siguiente, al_dia FROM corp.registries`;
    return { company: company ?? null, registries };
  });
}

export async function devolverEmpresa(antes: Empresa): Promise<void> {
  await withSuper(async (sql) => {
    for (const r of antes.registries) {
      await sql`UPDATE corp.registries
                   SET estado = ${String(r.estado)}, referencia = ${(r.referencia as string | null) ?? null},
                       siguiente = ${String(r.siguiente)}, al_dia = ${Boolean(r.al_dia)}
                 WHERE id = ${String(r.id)}`;
    }
    await sql`DELETE FROM corp.company WHERE id = 'mexia'`;
    const c = antes.company;
    if (c === null) return;
    await sql`INSERT INTO corp.company (id, inscripcion_rfc, administrador, updated_by, updated_at)
              VALUES ('mexia', ${(c.inscripcion_rfc as string | null) ?? null},
                      ${(c.administrador as number | null) ?? null}, ${String(c.updated_by)}, now())`;
  });
}

/** Leaves corp as the suite found it: no founders. */
export async function clearFounders(): Promise<void> {
  await withSuper(async (sql) => {
    await sql`DELETE FROM corp.founders`;
  });
}
