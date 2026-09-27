import 'server-only';

import { AsyncLocalStorage } from 'node:async_hooks';

import type { Deadline } from '@xangarro/data-pg';

/**
 * The device routes' database deadlines (audit DB3-SYNC-05, ADR-120).
 *
 * The device routes run inside {@link withDbDeadlines}; every `withTenant`
 * under them — the device-auth read, the push, the pull — picks the policy up
 * from here, so a route body needs no parameter threaded through it and cannot
 * forget one. Outside such a scope a transaction waits as before: a portal
 * page has no client of its own timing out underneath it.
 *
 * The clock is **per transaction**, started when the transaction is asked
 * for, not per request: a push's body arrives over a phone's connection first,
 * and a slow upload must not use up the time the database is given — it would
 * be shed on every retry. At most {@link ACQUIRE_MS} to get a connection, and
 * {@link deviceDeadlineMs} for the transaction, both well inside the phone's
 * 30 s fetch timeout. Past either, the device is told 503 + Retry-After and
 * backs off instead of re-sending into a queue.
 */
export interface DbDeadlines {
  readonly acquireMs: number;
  readonly totalMs: number;
}

const scope = new AsyncLocalStorage<DbDeadlines>();

/** How long a device request may wait for a free connection before it is shed. */
export const ACQUIRE_MS = 3_000;
const DEFAULT_DEVICE_DEADLINE_MS = 10_000;

/** `DEVICE_DB_DEADLINE_MS`, else 10 s. An unusable value falls back to the default. */
export function deviceDeadlineMs(value: string | undefined = process.env.DEVICE_DB_DEADLINE_MS) {
  const n = Number(value);
  return value !== undefined && value.trim() !== '' && Number.isInteger(n) && n > 0
    ? n
    : DEFAULT_DEVICE_DEADLINE_MS;
}

/** The device routes' policy: {@link ACQUIRE_MS} to connect, `DEVICE_DB_DEADLINE_MS` in all. */
export const deviceDeadlines = (): DbDeadlines => ({
  acquireMs: ACQUIRE_MS,
  totalMs: deviceDeadlineMs(),
});

/** Runs `fn` with every tenant transaction under it bounded by `deadlines`. */
export function withDbDeadlines<T>(deadlines: DbDeadlines, fn: () => Promise<T>): Promise<T> {
  return scope.run(deadlines, fn);
}

/** The deadline for a transaction asked for now, or none outside a scope. */
export function currentDeadline(now: number = Date.now()): Deadline | undefined {
  const d = scope.getStore();
  if (d === undefined) return undefined;
  return { acquireMs: Math.min(d.acquireMs, d.totalMs), until: now + d.totalMs };
}
