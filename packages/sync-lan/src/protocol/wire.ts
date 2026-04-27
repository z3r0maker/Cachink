/**
 * Zod schemas for everything that crosses the LAN wire (ADR-029).
 *
 * These are the single source of truth the Rust server and the JS client
 * validate against. Every response carries `X-Cachink-Protocol: 1`; unknown
 * versions get `426 Upgrade Required` at the HTTP layer (not modelled
 * here — see `protocol/constants.ts`).
 *
 * Money never crosses the wire as a JSON number — it always travels as a
 * decimal string so JSON.parse cannot silently truncate a 64-bit value.
 * Row-level enum validation is deliberately loose (any string): the
 * applier re-validates against the domain Zod schemas before hitting the
 * DB, so the wire stays forward-compatible with new enum members on
 * future clients without breaking older ones.
 */

import { z } from 'zod';
import { DELTA_OPS, MAX_BATCH_SIZE, SYNCED_TABLES } from './constants.js';

/** ULID regex — duplicated from domain to keep this file independent of it. */
const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const ULID_STRING = z.string().regex(ULID);

/** ISO 8601 UTC timestamp, e.g. "2026-04-23T15:30:00.000Z". */
const ISO_TIMESTAMP = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);

/** A Delta row has table-specific keys; keep it loose at this layer. */
const rowSchema = z.record(z.string(), z.unknown());

export const deltaSchema = z.object({
  table: z.enum(SYNCED_TABLES),
  op: z.enum(DELTA_OPS),
  rowId: ULID_STRING,
  row: rowSchema,
  rowUpdatedAt: ISO_TIMESTAMP,
  rowDeviceId: ULID_STRING,
});

export type Delta = z.infer<typeof deltaSchema>;

/** Pair request — client posts this to `POST /api/v1/pair`. */
export const pairRequestSchema = z.object({
  pairingToken: z.string().min(8),
  deviceId: ULID_STRING,
});
export type PairRequest = z.infer<typeof pairRequestSchema>;

export const pairResponseSchema = z.object({
  accessToken: z.string().min(8),
  businessId: ULID_STRING,
  serverId: z.string().min(4),
});
export type PairResponse = z.infer<typeof pairResponseSchema>;

/** Push request — Bearer-authed; max {@link MAX_BATCH_SIZE} deltas per call. */
export const pushRequestSchema = z.object({
  deltas: z.array(deltaSchema).max(MAX_BATCH_SIZE),
});
export type PushRequest = z.infer<typeof pushRequestSchema>;

export const rejectedDeltaSchema = z.object({
  rowId: ULID_STRING,
  table: z.enum(SYNCED_TABLES),
  reason: z.enum(['stale', 'invalid', 'foreign_key']),
});
export type RejectedDelta = z.infer<typeof rejectedDeltaSchema>;

export const pushResponseSchema = z.object({
  accepted: z.number().int().nonnegative(),
  rejected: z.array(rejectedDeltaSchema),
  lastServerSeq: z.number().int().nonnegative(),
});
export type PushResponse = z.infer<typeof pushResponseSchema>;

/** Pull response — returns rows strictly greater than `since`. */
export const pullResponseSchema = z.object({
  deltas: z.array(deltaSchema),
  nextSince: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});
export type PullResponse = z.infer<typeof pullResponseSchema>;

/** WS server→client events. `ping` lets clients detect dead sockets. */
export const wsEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('change'), serverSeq: z.number().int().nonnegative() }),
  z.object({ type: z.literal('ping'), ts: ISO_TIMESTAMP }),
]);
export type WsEvent = z.infer<typeof wsEventSchema>;

/** Error response shape used by every endpoint when Zod parsing fails. */
export const wireErrorSchema = z.object({
  error: z.string(),
  code: z.enum([
    'unauthorized',
    'invalid_token',
    'protocol_mismatch',
    'payload_invalid',
    'batch_too_large',
    'server_error',
  ]),
  protocolRequired: z.number().int().optional(),
  protocolReceived: z.string().optional(),
});
export type WireError = z.infer<typeof wireErrorSchema>;
