import type { SecondFactorRepo, TotpState } from '@xangarro/auth-core';
import { sql, type SQL } from 'drizzle-orm';

import type { Db } from '../client.js';

/**
 * The owner portal's second factor (N-83, ADR-142) through the
 * `xangarro.second_factor_*` functions of 0057. Every write is one conditional
 * statement inside its function, so the database decides races: one enrolment
 * wins, a TOTP step is accepted once, a recovery code is removed once.
 */
export interface SecondFactorStatus extends TotpState {
  readonly codesLeft: number;
  /** The one-time invitation was answered «Ahora no», or the factor was once on. */
  readonly inviteDismissed: boolean;
}

/** `SecondFactorRepo` plus what only the portal offers: new codes, turning it off. */
export interface PortalSecondFactorRepo extends SecondFactorRepo {
  /** Swap every recovery code — only for an enrolled account. */
  replaceRecoveryCodes(userId: string, hashes: readonly string[]): Promise<boolean>;
  /** Remove the seed and the codes; false when there was nothing to turn off. */
  disable(userId: string): Promise<boolean>;
  dismissInvite(userId: string): Promise<void>;
}

interface StateRow extends Record<string, unknown> {
  secret_enc: string | null;
  enrolled_at: string | Date | null;
  last_step: string | number | null;
  codes_left: number;
  invite_dismissed: boolean;
}

/** `text[]` from a JS array: drizzle would otherwise spread it into separate parameters. */
const textArray = (values: readonly string[]): SQL =>
  sql`ARRAY[${sql.join(
    values.map((v) => sql`${v}`),
    sql`, `,
  )}]::text[]`;

const iso = (at: string | Date | null): string | null =>
  at === null ? null : new Date(at).toISOString();

/** One account's second factor, or `null` when there is no such account. */
export async function secondFactorStatus(
  db: Db,
  userId: string,
): Promise<SecondFactorStatus | null> {
  const [row] = await db.execute<StateRow>(
    sql`SELECT * FROM xangarro.second_factor_state(${userId}::uuid)`,
  );
  if (row === undefined) return null;
  return {
    secretEnc: row.secret_enc,
    enrolledAt: iso(row.enrolled_at),
    // `bigint` arrives as text: parsed here, never asserted (ADR-094).
    lastStep: row.last_step === null ? null : Number(row.last_step),
    codesLeft: Number(row.codes_left),
    inviteDismissed: row.invite_dismissed,
  };
}

async function flag(db: Db, call: SQL): Promise<boolean> {
  const [row] = await db.execute<{ ok: boolean }>(sql`SELECT ${call} AS ok`);
  return row?.ok === true;
}

export function secondFactorRepo(db: Db): PortalSecondFactorRepo {
  return {
    totpState: async (id) => {
      const s = await secondFactorStatus(db, id);
      return s && { secretEnc: s.secretEnc, enrolledAt: s.enrolledAt, lastStep: s.lastStep };
    },
    savePendingSecret: (id, previous, sealed) =>
      flag(db, sql`xangarro.second_factor_save_pending(${id}::uuid, ${previous}, ${sealed})`),
    completeEnrolment: (id, step, hashes) =>
      flag(
        db,
        sql`xangarro.second_factor_complete(${id}::uuid, ${step}::bigint, ${textArray(hashes)})`,
      ),
    advanceStep: (id, step) =>
      flag(db, sql`xangarro.second_factor_advance(${id}::uuid, ${step}::bigint)`),
    consumeRecoveryCode: async (id, hash) => {
      const [row] = await db.execute<{ left: number | null }>(
        sql`SELECT xangarro.second_factor_use_recovery(${id}::uuid, ${hash}) AS left`,
      );
      return row?.left === null || row?.left === undefined ? null : Number(row.left);
    },
    replaceRecoveryCodes: (id, hashes) =>
      flag(db, sql`xangarro.second_factor_replace_recovery(${id}::uuid, ${textArray(hashes)})`),
    disable: (id) => flag(db, sql`xangarro.second_factor_disable(${id}::uuid)`),
    dismissInvite: async (id) => {
      await db.execute(sql`SELECT xangarro.second_factor_dismiss_invite(${id}::uuid)`);
    },
  };
}
