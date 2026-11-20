import 'server-only';

import { throttleStore } from '@xangarro/data-pg';

import { db } from '../db/client';
import { authAudit } from '../db/staff';
import { staffChallengeStore } from '../db/staff-challenges';
import { staffLinkRepo } from '../db/staff-links';
import { staffPasskeyRepo } from '../db/staff-passkeys';
import { staffSessionStore } from '../db/staff-sessions';
import { relyingParty } from './config';
import type { AuthDeps } from './ports';

/**
 * The production `AuthDeps` (ADR-160): Postgres for passkeys, links,
 * challenges, sessions and audit; the portal's shared `xangarro.throttle`
 * through data-pg's adapter. The relying party comes from `ADMIN_BASE_URL`;
 * one that is not a URL fails loudly on the first sign-in, never silently.
 */
export function authDeps(): AuthDeps {
  const conn = db();
  return {
    rp: relyingParty(),
    challenges: staffChallengeStore(conn),
    passkeys: staffPasskeyRepo(conn),
    links: staffLinkRepo(conn),
    sessions: staffSessionStore(conn),
    throttle: throttleStore(conn),
    audit: authAudit(conn),
    now: () => new Date(),
  };
}
