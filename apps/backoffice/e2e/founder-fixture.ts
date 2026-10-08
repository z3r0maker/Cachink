import { randomBytes } from 'node:crypto';
import { hashPassword } from '@xangarro/auth-core';
import postgres from 'postgres';

import type { StaffLogin } from './helpers';

/**
 * The «Empresa» suite's own staff member (E-01): allowlisted like any staff,
 * a founder only once the suite registers them in corp. Separate from the
 * auth suite's member, so the two specs never share a TOTP seed or a lockout.
 */
export const SOCIO: StaffLogin = {
  email: 'e2e-socio@xangarro.mx',
  password: 'e2e-socio-password-123',
};

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
  const hash = await hashPassword(SOCIO.password);
  await withSuper(async (sql) => {
    await sql`DELETE FROM corp.founders`;
    await sql`DELETE FROM staff_sessions USING staff_members s
               WHERE staff_sessions.staff_id = s.id AND lower(s.email) = ${SOCIO.email}`;
    await sql`DELETE FROM staff_audit_log USING staff_members s
               WHERE staff_audit_log.staff_id = s.id AND lower(s.email) = ${SOCIO.email}`;
    await sql`DELETE FROM staff_members WHERE lower(email) = ${SOCIO.email}`;
    // A ULID-shaped id (Crockford: no I, L, O or U), or the audit log refuses it.
    const id = `01E2PARTNER${randomBytes(9).toString('hex').toUpperCase()}`.slice(0, 26);
    await sql`
      INSERT INTO staff_members (id, email, nombre, password_hash, created_at)
      VALUES (${id}, ${SOCIO.email}, 'Socia E2E', ${hash}, now())`;
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
export async function clearLedgerFixture(): Promise<void> {
  await withSuper(async (sql) => {
    await sql.begin(async (tx) => {
      const suite = tx`SELECT f.id FROM corp.founders f
                         JOIN staff_members s ON s.id = f.staff_member_id
                        WHERE lower(s.email) = ${SOCIO.email}`;
      await tx`UPDATE corp.registries SET document_id = NULL
                WHERE document_id IN (SELECT id FROM corp.documents WHERE uploaded_by IN (${suite}))`;
      await tx`DELETE FROM corp.documents WHERE uploaded_by IN (${suite})`;
      await tx`DELETE FROM corp.share_events WHERE created_by IN (${suite})`;
      await tx`DELETE FROM corp.certificates WHERE created_by IN (${suite})`;
      await tx`DELETE FROM corp.obligations WHERE created_by IN (${suite})`;
      const mine = tx`SELECT id FROM corp.entries
                       WHERE concepto LIKE 'E2E %' OR concepto LIKE 'Reversa: E2E %'
                          OR created_by IN (SELECT f.id FROM corp.founders f
                                              JOIN staff_members s ON s.id = f.staff_member_id
                                             WHERE lower(s.email) = ${SOCIO.email})`;
      await tx`DELETE FROM corp.entry_lines WHERE entry_id IN (${mine})`;
      await tx`DELETE FROM corp.entries WHERE id IN (${mine})`;
      await tx`DELETE FROM corp.funding_calls WHERE concepto LIKE 'E2E %'`;
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
