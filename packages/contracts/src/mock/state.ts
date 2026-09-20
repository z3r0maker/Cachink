/**
 * In-memory server state for the mock: reference + transactional rows with
 * server sequences, activation codes, devices. Reset with `MockState.reset()`.
 */

import { buildFixtures, FIXTURE_BUSINESS_ID, FIXTURE_EMAIL } from './fixtures.js';
import { ulidOf } from './ids.js';
import type { Scenario } from './scenarios.js';

export interface StoredRow {
  readonly table: string;
  readonly id: string;
  row: Record<string, unknown>;
  serverSeq: number;
}

export interface Device {
  readonly id: string;
  readonly businessId: string;
  status: 'active' | 'revoked';
  acknowledgedThrough: number;
}

export interface ActivationCode {
  readonly code: string;
  readonly email: string;
  readonly expiresAt: number;
  redeemedBy: string | null;
}

/** Codes obey the §3 alphabet (no 0/O/1/I). */
export const MOCK_CODES = {
  valid: 'VALDK7M3',
  used: 'USEDK7M3',
  expired: 'EXPRK7M3',
  noSlots: 'NSLTK7M3',
} as const;

export class MockState {
  rows = new Map<string, StoredRow>();
  /** Rows removed by `/__mock/forget`, restorable with `/__mock/restore`. */
  forgotten = new Map<string, StoredRow>();
  /** Scenario for requests without `X-Mock-Scenario` (`/__mock/scenario`). */
  defaultScenario: Scenario = 'xangarro';
  /** Overrides the entitlement's records-per-month; `undefined` = plan default. */
  recordsPerMonth: number | null | undefined = undefined;
  devices = new Map<string, Device>();
  codes = new Map<string, ActivationCode>();
  serverSeq = 0;
  deviceSlots = 2;
  #deviceCounter = 0;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.rows.clear();
    this.forgotten.clear();
    this.defaultScenario = 'xangarro';
    this.recordsPerMonth = undefined;
    this.devices.clear();
    this.codes.clear();
    this.serverSeq = 0;
    this.#deviceCounter = 0;
    const fx = buildFixtures();
    for (const [table, list] of Object.entries(fx)) {
      for (const row of list as readonly Record<string, unknown>[]) this.upsert(table, row);
    }
    const far = Date.now() + 48 * 3_600_000;
    this.codes.set(MOCK_CODES.valid, {
      code: MOCK_CODES.valid,
      email: FIXTURE_EMAIL,
      expiresAt: far,
      redeemedBy: null,
    });
    this.codes.set(MOCK_CODES.used, {
      code: MOCK_CODES.used,
      email: FIXTURE_EMAIL,
      expiresAt: far,
      redeemedBy: 'someone-else',
    });
    this.codes.set(MOCK_CODES.expired, {
      code: MOCK_CODES.expired,
      email: FIXTURE_EMAIL,
      expiresAt: Date.now() - 1,
      redeemedBy: null,
    });
    this.codes.set(MOCK_CODES.noSlots, {
      code: MOCK_CODES.noSlots,
      email: FIXTURE_EMAIL,
      expiresAt: far,
      redeemedBy: null,
    });
  }

  /** Issue a fresh single-use code (test helper + `/__mock/code`). */
  issueCode(email = FIXTURE_EMAIL): string {
    const code =
      `FR${String(this.codes.size).padStart(2, '0').replace(/0/g, '2').replace(/1/g, '3')}K7M3`.slice(
        0,
        8,
      );
    this.codes.set(code, { code, email, expiresAt: Date.now() + 48 * 3_600_000, redeemedBy: null });
    return code;
  }

  key(table: string, id: string): string {
    return `${table}:${id}`;
  }

  upsert(table: string, row: Record<string, unknown>): StoredRow {
    const id = String(row['id']);
    const { _seq, ...clean } = row as Record<string, unknown> & { _seq?: number };
    this.serverSeq += 1;
    const stored: StoredRow = {
      table,
      id,
      row: clean,
      serverSeq:
        typeof _seq === 'number'
          ? (this.serverSeq = Math.max(this.serverSeq, _seq))
          : this.serverSeq,
    };
    this.rows.set(this.key(table, id), stored);
    return stored;
  }

  get(table: string, id: string): StoredRow | undefined {
    return this.rows.get(this.key(table, id));
  }

  rowsOf(table: string, since = 0): StoredRow[] {
    return [...this.rows.values()]
      .filter((r) => r.table === table && r.serverSeq > since)
      .sort((a, b) => a.serverSeq - b.serverSeq);
  }

  activeDevices(): number {
    return [...this.devices.values()].filter(
      (d) => d.businessId === FIXTURE_BUSINESS_ID && d.status === 'active',
    ).length;
  }

  newDevice(): Device {
    this.#deviceCounter += 1;
    const d: Device = {
      id: ulidOf('DEV', 100 + this.#deviceCounter),
      businessId: FIXTURE_BUSINESS_ID,
      status: 'active',
      acknowledgedThrough: 0,
    };
    this.devices.set(d.id, d);
    return d;
  }
}
