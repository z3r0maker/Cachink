/**
 * Mock-only control endpoints (not part of the contract) that let tests put
 * the server in a given state:
 *
 *   POST /__mock/reset             fixtures, codes and devices back to start
 *   POST /__mock/code              issue a fresh activation code
 *   POST /__mock/forget  {table,id} hard-remove a row, as if purged in the
 *                                  portal — pushes referencing it are
 *                                  rejected with an FK code (A-08)
 *   POST /__mock/restore {table,id} put a forgotten row back
 *   POST /__mock/scenario {scenario, transactionsPerMonth?} default scenario for
 *                                  requests without the header, and an
 *                                  optional record-limit override (A-10)
 */

import type { MockRequest, MockResponse } from './handler.js';
import { isScenario } from './scenarios.js';
import type { MockState } from './state.js';

const BAD_BODY: MockResponse = {
  status: 400,
  body: { error: { code: 'VALIDATION', message: 'body must be { table, id }' } },
};

function rowKeyOf(state: MockState, body: unknown): string | null {
  const { table, id } = (body ?? {}) as { table?: unknown; id?: unknown };
  return typeof table === 'string' && typeof id === 'string' ? state.key(table, id) : null;
}

function forget(state: MockState, body: unknown): MockResponse {
  const key = rowKeyOf(state, body);
  if (!key) return BAD_BODY;
  const row = state.rows.get(key);
  if (row) state.forgotten.set(key, row);
  return { status: 200, body: { removed: state.rows.delete(key) } };
}

function restore(state: MockState, body: unknown): MockResponse {
  const key = rowKeyOf(state, body);
  if (!key) return BAD_BODY;
  const row = state.forgotten.get(key);
  if (row) state.rows.set(key, row);
  state.forgotten.delete(key);
  return { status: 200, body: { restored: row !== undefined } };
}

function setScenario(state: MockState, body: unknown): MockResponse {
  const { scenario, transactionsPerMonth } = (body ?? {}) as Record<string, unknown>;
  const limitOk =
    transactionsPerMonth === undefined ||
    (typeof transactionsPerMonth === 'number' &&
      Number.isInteger(transactionsPerMonth) &&
      transactionsPerMonth > 0);
  if (!isScenario(scenario) || !limitOk) return BAD_BODY;
  state.defaultScenario = scenario;
  state.transactionsPerMonth = transactionsPerMonth as number | undefined;
  return {
    status: 200,
    body: { scenario, transactionsPerMonth: transactionsPerMonth ?? 'plan default' },
  };
}

export function controlRoute(state: MockState, req: MockRequest): MockResponse | null {
  if (req.method !== 'POST') return null;
  switch (req.path) {
    case '/__mock/reset':
      state.reset();
      return { status: 200, body: { ok: true } };
    case '/__mock/code':
      return { status: 200, body: { code: state.issueCode() } };
    case '/__mock/forget':
      return forget(state, req.body);
    case '/__mock/restore':
      return restore(state, req.body);
    case '/__mock/scenario':
      return setScenario(state, req.body);
    default:
      return null;
  }
}
