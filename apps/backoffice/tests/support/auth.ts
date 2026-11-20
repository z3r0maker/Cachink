import { hashToken, mintToken, type NewPasskey } from '@xangarro/auth-core';
import {
  memoryChallengeStore,
  memoryThrottleStore,
  softAuthenticator,
} from '@xangarro/auth-core/testing';
import type { StaffMemberId } from '@xangarro/domain';

import type {
  AuthDeps,
  EnrolmentLinkRepo,
  PasskeyView,
  StaffPasskeyRepo,
  StaffSession,
  StaffSessionStore,
} from '@/server/auth/ports';

/**
 * In-memory `AuthDeps` with the same conditional-write semantics as the
 * Postgres adapters (`db/staff-passkeys.ts`, `db/staff-links.ts`,
 * `db/staff-sessions.ts`): a removed passkey or a revoked member makes every
 * session it opened unresolvable, a link is spent once, the last passkey stays.
 */
export const RP = {
  id: 'admin.xangarro.test',
  name: 'Xangarro Consola',
  origin: 'https://admin.xangarro.test',
};
export const STAFF_ID = '01J9Z6Q4ZC9R7Y8V2M3N4P5Q6R' as StaffMemberId;

export interface MemoryStaff {
  id: StaffMemberId;
  email: string;
  nombre: string;
  revoked: boolean;
}

export interface MemoryPasskey extends NewPasskey {
  staffId: StaffMemberId;
  nombre: string;
  origen: 'enlace' | 'mi_acceso';
  createdAt: Date;
  lastUsedAt: Date | null;
  revoked: boolean;
  counter: number;
}

export interface MemoryLink {
  staffId: StaffMemberId;
  expiresAt: Date;
  usedAt: Date | null;
  voided: boolean;
}

export interface MemorySession {
  staffId: StaffMemberId;
  passkeyId: string;
  steppedUpAt: Date;
  openedAt: Date;
  expiresAt: Date;
  revoked: boolean;
}

export function newStaff(overrides: Partial<MemoryStaff> = {}): MemoryStaff {
  return { id: STAFF_ID, email: 'ana@xangarro.mx', nombre: 'Ana', revoked: false, ...overrides };
}

interface World {
  readonly staff: MemoryStaff[];
  readonly passkeys: Map<string, MemoryPasskey>;
  readonly links: Map<string, MemoryLink>;
  readonly sessions: Map<string, MemorySession>;
  readonly clock: { date: Date };
}

const liveStaff = (w: World, id: StaffMemberId) => w.staff.find((s) => s.id === id && !s.revoked);

function livePasskey(w: World, id: string) {
  const p = w.passkeys.get(id);
  return p && !p.revoked && liveStaff(w, p.staffId) ? p : undefined;
}

function store(
  w: World,
  staffId: StaffMemberId,
  passkey: NewPasskey,
  nombre: string,
  origen: MemoryPasskey['origen'],
) {
  w.passkeys.set(passkey.id, {
    ...passkey,
    staffId,
    nombre,
    origen,
    createdAt: w.clock.date,
    lastUsedAt: null,
    revoked: false,
  });
}

function passkeyRepo(w: World): StaffPasskeyRepo {
  return {
    find: async (id) => {
      const p = livePasskey(w, id);
      return p
        ? {
            id,
            ownerId: p.staffId,
            publicKey: p.publicKey,
            counter: p.counter,
            transports: p.transports,
          }
        : null;
    },
    recordUse: async (id, counter) => {
      const p = livePasskey(w, id);
      if (!p) return false;
      Object.assign(p, { counter, lastUsedAt: w.clock.date });
      return true;
    },
    listFor: async (staffId): Promise<readonly PasskeyView[]> =>
      [...w.passkeys.values()]
        .filter((p) => p.staffId === staffId && !p.revoked)
        .map((p) => ({
          id: p.id,
          nombre: p.nombre,
          backedUp: p.backedUp,
          createdAt: p.createdAt,
          lastUsedAt: p.lastUsedAt,
        })),
    add: async (staffId, passkey, nombre) => {
      if (!liveStaff(w, staffId) || w.passkeys.has(passkey.id)) return false;
      store(w, staffId, passkey, nombre, 'mi_acceso');
      return true;
    },
    remove: async (staffId, id) => {
      const p = w.passkeys.get(id);
      if (!p || p.revoked || p.staffId !== staffId) return 'missing';
      const live = [...w.passkeys.values()].filter((x) => x.staffId === staffId && !x.revoked);
      if (live.length <= 1) return 'last';
      p.revoked = true;
      return 'removed';
    },
  };
}

function linkRepo(w: World): EnrolmentLinkRepo {
  return {
    find: async (hash) => {
      const l = w.links.get(hash);
      const s = l ? w.staff.find((x) => x.id === l.staffId) : undefined;
      if (!l || !s) return null;
      return {
        staffId: s.id,
        email: s.email,
        nombre: s.nombre,
        expiresAt: l.expiresAt,
        usedAt: l.usedAt,
        dead: l.voided || s.revoked,
      };
    },
    spend: async (hash, passkey, nombre) => {
      const l = w.links.get(hash);
      if (!l || l.usedAt || l.voided || l.expiresAt <= w.clock.date || !liveStaff(w, l.staffId))
        return null;
      l.usedAt = w.clock.date;
      store(w, l.staffId, passkey, nombre, 'enlace');
      return l.staffId;
    },
  };
}

function sessionStore(w: World): StaffSessionStore {
  return {
    open: async (hash, subject, ttl) =>
      void w.sessions.set(hash, {
        ...subject,
        steppedUpAt: w.clock.date,
        openedAt: w.clock.date,
        expiresAt: new Date(w.clock.date.getTime() + ttl * 1000),
        revoked: false,
      }),
    resolve: async (hash): Promise<StaffSession | null> => {
      const s = w.sessions.get(hash);
      const staff = s && !s.revoked ? liveStaff(w, s.staffId) : undefined;
      if (!s || !staff || !livePasskey(w, s.passkeyId)) return null;
      return {
        staffId: staff.id,
        email: staff.email,
        nombre: staff.nombre,
        passkeyId: s.passkeyId,
        steppedUpAt: s.steppedUpAt,
        openedAt: s.openedAt,
        expiresAt: s.expiresAt,
      };
    },
    revoke: async (hash) => {
      const s = w.sessions.get(hash);
      if (s) s.revoked = true;
    },
    stepUp: async (hash) => {
      const s = w.sessions.get(hash);
      if (s && !s.revoked) s.steppedUpAt = w.clock.date;
    },
  };
}

export interface AuditRow {
  staffId: StaffMemberId;
  action: string;
  payload: Readonly<Record<string, unknown>>;
}

export function memoryAuth(staff: MemoryStaff[] = [newStaff()]) {
  const w: World = {
    staff,
    passkeys: new Map(),
    links: new Map(),
    sessions: new Map(),
    clock: { date: new Date('2026-11-20T16:00:00Z') },
  };
  const challengeClock = { t: 0 };
  const audit: AuditRow[] = [];
  const throttle = memoryThrottleStore();
  const deps: AuthDeps = {
    rp: RP,
    challenges: memoryChallengeStore(challengeClock),
    passkeys: passkeyRepo(w),
    links: linkRepo(w),
    sessions: sessionStore(w),
    throttle,
    audit: async (staffId, action, payload) =>
      void audit.push({ staffId, action, payload: payload ?? {} }),
    now: () => w.clock.date,
  };
  const authenticator = softAuthenticator({ origin: RP.origin });
  /** Mints a link the way the CLI does; returns the raw token. */
  const mintLink = (staffId: StaffMemberId = STAFF_ID, minutes = 15): string => {
    const token = mintToken();
    w.links.set(hashToken(token), {
      staffId,
      expiresAt: new Date(w.clock.date.getTime() + minutes * 60_000),
      usedAt: null,
      voided: false,
    });
    return token;
  };
  const advance = (seconds: number) => {
    w.clock.date = new Date(w.clock.date.getTime() + seconds * 1000);
    challengeClock.t += seconds;
  };
  return { deps, world: w, audit, throttle, authenticator, mintLink, advance };
}
