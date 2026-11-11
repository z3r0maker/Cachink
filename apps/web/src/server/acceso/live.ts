import 'server-only';

import { parseSecretKey } from '@xangarro/auth-core';
import {
  accountConfirmed,
  changeAccountEmail,
  claimAccount,
  confirmEmail,
  consumeLink,
  issueLink,
  peekLink,
  secondFactorRepo,
  secondFactorStatus,
  sessionSteppedUp,
  stepUpSession,
  throttleStore,
  throttleTake,
} from '@xangarro/data-pg';

import { RUTA_CONFIRMAR } from '@/lib/acceso-rutas';

import { portalOrigin } from '../billing/origin';
import { db } from '../db';
import { sendEmailConfirmation } from '../email/auth-links';
import { sendWelcome } from '../email/welcome';
import { negociosOf } from '../memberships';
import { passwordMatches } from '../password';
import { sessionToken } from '../session';
import { signInUser } from '../sign-in';
import { CONFIRM_TTL_HOURS } from './plazos';
import type { AccessDeps, AccessMail, AccessSessions } from './ports';

/**
 * The production `AccessDeps` (N-83): `xangarro.*` definer functions through
 * `@xangarro/data-pg`, the request's cookies, and the portal's email sender.
 *
 * `PORTAL_TOTP_KEY` is 32 bytes, base64 (`openssl rand -base64 32`). It seals
 * every owner's TOTP seed: rotating it without re-sealing leaves every
 * enrolled owner unable to pass the second step. It is read only when a seed
 * is touched, so a portal without it still signs in everyone who has no
 * second factor, and fails loudly for the first who turns one on.
 */
let totpKey: Buffer | undefined;

/** Where the confirmation link lands: a page with a button (board SgConfirmar). */
export const CONFIRM_PATH = RUTA_CONFIRMAR;

function mail(): AccessMail {
  return {
    confirmacion: async (m) => {
      const url = `${await portalOrigin()}${CONFIRM_PATH}?t=${m.token}`;
      await sendEmailConfirmation(m.to, url, {
        name: m.nombre,
        nombreNegocio: m.negocio,
        expiresInHours: CONFIRM_TTL_HOURS,
      });
    },
    bienvenida: async (m) => {
      await sendWelcome({
        to: m.to,
        name: m.nombre,
        nombreNegocio: m.negocio,
        businessId: m.businessId,
        origin: await portalOrigin(),
      });
    },
  };
}

/** The request's session; one opened in this request is stamped by its own token. */
function sessions(): AccessSessions {
  let opened: string | null = null;
  const current = async () => opened ?? (await sessionToken());
  return {
    open: async (userId) => {
      opened = await signInUser(userId);
      return opened !== null;
    },
    stepUp: async () => {
      const token = await current();
      if (token !== null) await stepUpSession(db(), token);
    },
    steppedUp: async (windowSeconds) => {
      const token = await current();
      return token !== null && sessionSteppedUp(db(), token, windowSeconds);
    },
  };
}

export function accessDeps(): AccessDeps {
  const conn = db();
  return {
    accounts: {
      confirmed: (id) => accountConfirmed(conn, id),
      claim: (id, keepPassword) => claimAccount(conn, id, keepPassword),
      changeEmail: (id, email) => changeAccountEmail(conn, id, email),
      passwordMatches,
      negocio: async (id) => {
        const [first] = await negociosOf(id);
        return first === undefined ? null : { id: first.businessId, nombre: first.nombre };
      },
    },
    links: {
      issue: (email, kind, ttl) => issueLink(conn, email, kind, ttl),
      peek: (token, kind) => peekLink(conn, token, kind),
      consume: (token, kind) => consumeLink(conn, token, kind),
      confirm: (token) => confirmEmail(conn, token),
    },
    mail: mail(),
    sessions: sessions(),
    factor: { ...secondFactorRepo(conn), status: (id) => secondFactorStatus(conn, id) },
    throttle: throttleStore(conn),
    take: (key, max, windowSeconds) => throttleTake(conn, key, max, windowSeconds),
    totpKey: () => (totpKey ??= parseSecretKey(process.env.PORTAL_TOTP_KEY)),
    now: () => new Date(),
  };
}
