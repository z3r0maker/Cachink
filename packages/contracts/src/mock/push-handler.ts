/**
 * `POST /sync/push` for the mock (§4): per-row outcomes, never a batch
 * failure for one bad row, idempotent on (table, id, updatedAt).
 */

import { ERROR_CATALOG, type ErrorCode } from '../errors.js';
import { isPushable } from '../scope.js';
import {
  PushRequestSchema,
  type Delta,
  type PushResponse,
  type RejectedRow,
} from '../sync-push.js';
import type { MockResponse } from './handler.js';
import { isFlakyReject, type Scenario } from './scenarios.js';
import type { Device, MockState } from './state.js';

type Outcome = { accepted: PushResponse['accepted'][number] } | { rejected: RejectedRow };

function reject(
  d: { rowId: string; clientSeq: number },
  code: ErrorCode,
  message: string,
): Outcome {
  return {
    rejected: {
      rowId: d.rowId,
      clientSeq: d.clientSeq,
      code,
      message,
      retryable: ERROR_CATALOG[code].retryable,
    },
  };
}

const FK_CHECKS: ReadonlyArray<[field: string, table: string, code: ErrorCode]> = [
  ['productoId', 'products', 'FK_PRODUCT_MISSING'],
  ['clienteId', 'clients', 'FK_CLIENT_MISSING'],
  ['createdByUserId', 'users', 'FK_USER_MISSING'],
];

function missingFk(
  state: MockState,
  row: Record<string, unknown>,
): { code: ErrorCode; message: string } | null {
  for (const [field, table, code] of FK_CHECKS) {
    const v = row[field];
    if (typeof v === 'string' && !state.get(table, v))
      return { code, message: `${field}=${v} not found` };
  }
  return null;
}

function applyDelta(state: MockState, d: Delta, device: Device, scenario: Scenario): Outcome {
  const row = d.row as Record<string, unknown>;
  if (!isPushable(d.table, d.op))
    return reject(d, d.op === 'update' ? 'HYBRID_UPDATE_FORBIDDEN' : 'TABLE_NOT_WRITABLE', d.table);
  if (row['businessId'] !== device.businessId)
    return reject(d, 'BUSINESS_MISMATCH', 'row.businessId ≠ token');
  const fk = missingFk(state, row);
  if (fk) return reject(d, fk.code, fk.message);
  if (scenario === 'flaky' && isFlakyReject(d.rowId))
    return reject(d, 'INTERNAL', 'simulated transient failure');
  const existing = state.get(d.table, d.rowId);
  const stored =
    existing && existing.row['updatedAt'] === row['updatedAt']
      ? existing
      : state.upsert(d.table, row);
  device.acknowledgedThrough = Math.max(device.acknowledgedThrough, stored.serverSeq);
  return { accepted: { rowId: d.rowId, clientSeq: d.clientSeq, serverSeq: stored.serverSeq } };
}

export function applyPush(
  state: MockState,
  body: unknown,
  device: Device,
  scenario: Scenario,
): MockResponse {
  const parsed = PushRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { status: 400, body: { error: { code: 'VALIDATION', message } } };
  }
  const accepted: PushResponse['accepted'] = [];
  const rejected: RejectedRow[] = [];
  for (const d of parsed.data.deltas) {
    const o = applyDelta(state, d, device, scenario);
    if ('accepted' in o) accepted.push(o.accepted);
    else rejected.push(o.rejected);
  }
  const out: PushResponse = {
    accepted,
    rejected,
    serverSeq: state.serverSeq,
    serverTime: new Date().toISOString(),
  };
  return { status: 200, body: out };
}
