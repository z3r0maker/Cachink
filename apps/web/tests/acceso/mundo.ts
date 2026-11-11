import { randomBytes, randomUUID } from 'node:crypto';

import {
  memorySecondFactorRepo,
  memoryThrottleStore,
  type MemoryFactorRow,
} from '@xangarro/auth-core/testing';
import type { LinkKind, LinkPeek } from '@xangarro/data-pg';

import type { AccessDeps } from '@/server/acceso/ports';

/**
 * An in-memory world for the access use cases, with the semantics of the
 * functions in `0057_email_confirm_second_factor.sql`: a new link retires the
 * account's earlier ones of its kind, confirming retires the pending pass,
 * claiming removes the password, and the second factor's writes are
 * conditional (`memorySecondFactorRepo`).
 */
export interface CuentaDePrueba {
  id: string;
  email: string;
  nombre: string | null;
  password: string | null;
  confirmed: boolean;
  negocio: { id: string; nombre: string } | null;
}

interface Enlace {
  kind: LinkKind;
  userId: string;
  expires: number;
  used: boolean;
}

export const PASSWORD = 'contraseña-larga-1';

export function cuenta(overrides: Partial<CuentaDePrueba> = {}): CuentaDePrueba {
  const id = randomUUID();
  return {
    id,
    email: `${id.slice(0, 8)}@taqueria.test.mx`,
    nombre: 'Pedro',
    password: PASSWORD,
    confirmed: true,
    negocio: { id: `biz-${id.slice(0, 6)}`, nombre: 'Taquería Don Pedro' },
    ...overrides,
  };
}

type Factor = MemoryFactorRow & { inviteDismissed: boolean };

function enlaces(cuentas: CuentaDePrueba[], rows: Map<string, Enlace>, t: () => number) {
  const porId = (id: string) => cuentas.find((c) => c.id === id);
  const peek = async (token: string, kind: LinkKind): Promise<LinkPeek | null> => {
    const l = rows.get(token);
    const c = l && l.kind === kind ? porId(l.userId) : undefined;
    if (!l || !c) return null;
    const state = l.used ? 'used' : l.expires <= t() ? 'expired' : 'fresh';
    return { state, userId: c.id, email: c.email, nombre: c.nombre, confirmed: c.confirmed };
  };
  const consume = async (token: string, kind: LinkKind) => {
    const view = await peek(token, kind);
    if (view?.state !== 'fresh') return null;
    (rows.get(token) as Enlace).used = true;
    return view.userId;
  };
  const retire = (userId: string, kinds: readonly LinkKind[]) => {
    for (const l of rows.values()) if (l.userId === userId && kinds.includes(l.kind)) l.used = true;
  };
  return {
    peek,
    consume,
    retire,
    issue: async (email: string, kind: LinkKind, ttl: number) => {
      const c = cuentas.find((x) => x.email === email);
      if (!c) return null;
      retire(c.id, [kind]);
      const token = randomBytes(32).toString('base64url');
      rows.set(token, { kind, userId: c.id, expires: t() + ttl * 1000, used: false });
      return token;
    },
    confirm: async (token: string) => {
      const uid = await consume(token, 'confirm');
      const c = uid === null ? undefined : porId(uid);
      if (!c) return null;
      c.confirmed = true;
      retire(c.id, ['pending']);
      return c.id;
    },
  };
}

export function mundo(cuentas: CuentaDePrueba[] = [], start = new Date('2026-11-10T18:00:00Z')) {
  const clock = { date: start };
  const t = () => clock.date.getTime();
  const rows = new Map<string, Enlace>();
  const links = enlaces(cuentas, rows, t);
  // One row per account that exists, as `second_factor_state` answers; none for a stranger.
  const factores = new Map<string, Factor>(
    cuentas.map((c) => [
      c.id,
      {
        secretEnc: null,
        enrolledAt: null,
        lastStep: null,
        recoveryCodes: [],
        inviteDismissed: false,
      },
    ]),
  );
  const factorDe = (id: string): Factor | undefined => factores.get(id);
  const repo = memorySecondFactorRepo(factores);
  const correos: { kind: 'confirmacion' | 'bienvenida'; to: string; token?: string }[] = [];
  const sesion = { userId: null as string | null, steppedUpAt: null as number | null };
  const takes = new Map<string, number>();
  const throttle = memoryThrottleStore();

  const deps: AccessDeps = {
    links: { issue: links.issue, peek: links.peek, confirm: links.confirm, consume: links.consume },
    accounts: {
      confirmed: async (id) => cuentas.find((c) => c.id === id)?.confirmed ?? null,
      claim: async (id, keepPassword) => {
        const c = cuentas.find((x) => x.id === id);
        if (!c || c.confirmed) return false;
        Object.assign(c, { confirmed: true, password: keepPassword ? c.password : null });
        links.retire(id, ['confirm', 'pending', 'challenge']);
        if (sesion.userId === id) sesion.userId = null;
        return true;
      },
      changeEmail: async (id, email) => {
        const c = cuentas.find((x) => x.id === id);
        const taken = cuentas.some((x) => x.email.toLowerCase() === email.toLowerCase());
        if (!c || c.confirmed || taken) return false;
        c.email = email;
        links.retire(id, ['confirm', 'magic', 'reset']);
        return true;
      },
      passwordMatches: async (email, password) => {
        const c = cuentas.find((x) => x.email === email);
        return c && c.password !== null && c.password === password
          ? { id: c.id, email: c.email }
          : null;
      },
      negocio: async (id) => cuentas.find((c) => c.id === id)?.negocio ?? null,
    },
    mail: {
      confirmacion: async (m) =>
        void correos.push({ kind: 'confirmacion', to: m.to, token: m.token }),
      bienvenida: async (m) => void correos.push({ kind: 'bienvenida', to: m.to }),
    },
    sessions: {
      open: async (id) => {
        if (!cuentas.find((c) => c.id === id)?.negocio) return false;
        Object.assign(sesion, { userId: id, steppedUpAt: null });
        return true;
      },
      stepUp: async () => void (sesion.steppedUpAt = t()),
      steppedUp: async (w) => sesion.steppedUpAt !== null && sesion.steppedUpAt > t() - w * 1000,
    },
    factor: {
      ...repo,
      status: async (id) => {
        const f = factorDe(id);
        return f
          ? {
              secretEnc: f.secretEnc,
              enrolledAt: f.enrolledAt,
              lastStep: f.lastStep,
              codesLeft: f.recoveryCodes.length,
              inviteDismissed: f.inviteDismissed,
            }
          : null;
      },
      replaceRecoveryCodes: async (id, hashes) => {
        const f = factorDe(id);
        if (!f || f.enrolledAt === null) return false;
        f.recoveryCodes = [...hashes];
        return true;
      },
      disable: async (id) => {
        const f = factorDe(id);
        if (!f || f.enrolledAt === null) return false;
        const off = { secretEnc: null, enrolledAt: null, lastStep: null, recoveryCodes: [] };
        Object.assign(f, off, { inviteDismissed: true });
        links.retire(id, ['challenge']);
        return true;
      },
      dismissInvite: async (id) => {
        const f = factorDe(id);
        if (f) f.inviteDismissed = true;
      },
    },
    throttle,
    take: async (key, max) => {
      const n = (takes.get(key) ?? 0) + 1;
      takes.set(key, n);
      return n > max ? 60 : 0;
    },
    totpKey: (() => {
      const key = randomBytes(32);
      return () => key;
    })(),
    now: () => clock.date,
  };
  const avanzar = (seconds: number) => {
    clock.date = new Date(t() + seconds * 1000);
    throttle.clock.t += seconds;
  };
  return { deps, cuentas, correos, sesion, factorDe, clock, avanzar };
}
