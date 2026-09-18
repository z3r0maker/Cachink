import { randomBytes } from 'node:crypto';

import { hashPassword } from '@xangarro/auth-core';
import { memoryThrottleStore } from '@xangarro/auth-core/testing';
import type { StaffMemberId } from '@xangarro/domain';

import type { AuthDeps, StaffAuthRepo, StaffSession, StaffSessionStore } from '@/server/auth/ports';

/**
 * In-memory `AuthDeps` with the same conditional-write semantics as the
 * Postgres adapters (`db/staff-auth.ts`, `db/staff-sessions.ts`).
 */
export interface MemoryStaff {
  id: StaffMemberId;
  email: string;
  nombre: string;
  passwordHash: string | null;
  revoked: boolean;
  secretEnc: string | null;
  enrolledAt: string | null;
  lastStep: number | null;
  recoveryCodes: string[];
}

export const STAFF_ID = '01J9Z6Q4ZC9R7Y8V2M3N4P5Q6R' as StaffMemberId;
export const PASSWORD = 'contraseña-larga-1';

export async function newStaff(overrides: Partial<MemoryStaff> = {}): Promise<MemoryStaff> {
  return {
    id: STAFF_ID,
    email: 'ana@xangarro.mx',
    nombre: 'Ana',
    passwordHash: await hashPassword(PASSWORD),
    revoked: false,
    secretEnc: null,
    enrolledAt: null,
    lastStep: null,
    recoveryCodes: [],
    ...overrides,
  };
}

function repo(rows: MemoryStaff[]): StaffAuthRepo {
  const live = (id: StaffMemberId) => rows.find((r) => r.id === id && !r.revoked);
  return {
    findForLogin: async (email) => {
      const r = rows.find((x) => x.email.toLowerCase() === email && !x.revoked);
      return r ? { id: r.id, email: r.email, passwordHash: r.passwordHash } : null;
    },
    totpState: async (id) => {
      const r = live(id);
      return r ? { secretEnc: r.secretEnc, enrolledAt: r.enrolledAt, lastStep: r.lastStep } : null;
    },
    savePendingSecret: async (id, previous, sealed) => {
      const r = live(id);
      if (!r || r.enrolledAt !== null || r.secretEnc !== previous) return false;
      r.secretEnc = sealed;
      return true;
    },
    completeEnrolment: async (id, step, hashes) => {
      const r = live(id);
      if (!r || r.enrolledAt !== null || r.secretEnc === null) return false;
      Object.assign(r, {
        enrolledAt: new Date().toISOString(),
        lastStep: step,
        recoveryCodes: [...hashes],
      });
      return true;
    },
    advanceStep: async (id, step) => {
      const r = live(id);
      if (!r || r.enrolledAt === null || (r.lastStep !== null && r.lastStep >= step)) return false;
      r.lastStep = step;
      return true;
    },
    consumeRecoveryCode: async (id, hash) => {
      const r = live(id);
      if (!r || r.enrolledAt === null || !r.recoveryCodes.includes(hash)) return null;
      r.recoveryCodes = r.recoveryCodes.filter((h) => h !== hash);
      return r.recoveryCodes.length;
    },
  };
}

export interface MemorySession {
  staffId: StaffMemberId;
  aal: 'aal1' | 'aal2';
  ttl: number;
  revoked: boolean;
}

function sessions(rows: MemoryStaff[], store: Map<string, MemorySession>): StaffSessionStore {
  return {
    open: async (hash, subject, ttl) => void store.set(hash, { ...subject, ttl, revoked: false }),
    resolve: async (hash): Promise<StaffSession | null> => {
      const s = store.get(hash);
      const r = s && !s.revoked ? rows.find((x) => x.id === s.staffId && !x.revoked) : undefined;
      if (!s || !r) return null;
      return {
        staffId: r.id,
        email: r.email,
        nombre: r.nombre,
        aal: s.aal,
        enrolled: r.enrolledAt !== null,
      };
    },
    revoke: async (hash) => {
      const s = store.get(hash);
      if (s) s.revoked = true;
    },
  };
}

export interface AuditRow {
  staffId: StaffMemberId;
  action: string;
  payload: Readonly<Record<string, unknown>>;
}

export function memoryAuth(rows: MemoryStaff[], now: { date: Date } = { date: new Date() }) {
  const sessionRows = new Map<string, MemorySession>();
  const audit: AuditRow[] = [];
  const throttle = memoryThrottleStore();
  const deps: AuthDeps = {
    repo: repo(rows),
    sessions: sessions(rows, sessionRows),
    throttle,
    audit: async (staffId, action, payload) =>
      void audit.push({ staffId, action, payload: payload ?? {} }),
    totpKey: randomBytes(32),
    now: () => now.date,
  };
  return { deps, sessionRows, audit, throttle, now };
}
