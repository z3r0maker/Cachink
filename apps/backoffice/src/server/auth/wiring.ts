import 'server-only';

import { parseSecretKey } from '@xangarro/auth-core';
import { throttleStore } from '@xangarro/data-pg';

import { db } from '../db/client';
import { authAudit } from '../db/staff';
import { staffAuthRepo } from '../db/staff-auth';
import { staffSessionStore } from '../db/staff-sessions';
import type { AuthDeps } from './ports';

/**
 * The production `AuthDeps`: Postgres for staff rows, sessions and audit; the
 * portal's shared `xangarro.throttle` through data-pg's adapter.
 *
 * `ADMIN_TOTP_KEY` is 32 bytes, base64 (`openssl rand -base64 32`), and lives
 * only in the admin Vercel project. It seals every TOTP seed: rotating it
 * without re-sealing forces every staff member to enrol again. A missing or
 * malformed key fails loudly on the first sign-in, never silently.
 */
let totpKey: Buffer | undefined;

export function authDeps(): AuthDeps {
  totpKey ??= parseSecretKey(process.env.ADMIN_TOTP_KEY);
  const conn = db();
  return {
    repo: staffAuthRepo(conn),
    sessions: staffSessionStore(conn),
    throttle: throttleStore(conn),
    audit: authAudit(conn),
    totpKey,
    now: () => new Date(),
  };
}
