/**
 * Transport-agnostic implementation of §3–§7 against `MockState`. Both the
 * Node http server and the msw adapter delegate here; push lives in
 * push-handler.ts.
 */

import * as ed from '@noble/ed25519';
import { ZodError } from 'zod';
import { EntitlementSchema, type Entitlement } from '@xangarro/domain';
import { ActivateRequestSchema, type ActivateResponse } from '../activate.js';
import { canonicalize, type SignedEntitlement } from '../entitlement.js';
import { ERROR_CATALOG, type ErrorCode } from '../errors.js';
import type { PullResponse } from '../sync-pull.js';
import { PullQuerySchema } from '../sync-pull.js';
import { API_PATHS, HEADER_PROTOCOL, PROTOCOL_VERSION } from '../transport.js';
import { encodeJson } from '../wire.js';
import devKeys from './dev-keys.json' with { type: 'json' };
import { FIXTURE_BUSINESS_ID } from './fixtures.js';
import { applyPush } from './push-handler.js';
import { entitlementFor, scenarioOf, type Scenario } from './scenarios.js';
import { controlRoute } from './control-routes.js';
import { MockState, MOCK_CODES, type Device } from './state.js';

export interface MockRequest {
  readonly method: string;
  readonly path: string;
  readonly query: Record<string, string>;
  readonly headers: Record<string, string>;
  readonly body: unknown;
}
export interface MockResponse {
  readonly status: number;
  readonly body: unknown;
}

function err(
  code: ErrorCode,
  message: string = code,
  status: number = ERROR_CATALOG[code].httpStatus,
): MockResponse {
  return { status, body: { error: { code, message } } };
}

async function sign(payload: Entitlement): Promise<SignedEntitlement> {
  const bytes = new TextEncoder().encode(canonicalize(payload));
  const sig = await ed.signAsync(bytes, ed.etc.hexToBytes(devKeys.privateHex));
  return {
    payload: EntitlementSchema.parse(payload),
    signature: Buffer.from(sig).toString('base64'),
  };
}

function referenceTables(state: MockState, since: number): PullResponse['tables'] {
  const pick = (t: string): Record<string, unknown>[] => state.rowsOf(t, since).map((r) => r.row);
  const users = state.rowsOf('users', since).map((r) => {
    const { email: _email, ...rest } = r.row;
    return rest;
  });
  return {
    businesses: pick('businesses'),
    products: pick('products'),
    clients: pick('clients'),
    users,
    employees: pick('employees'),
    recurring_expenses: pick('recurring_expenses'),
    conversion_recetas: pick('conversion_recetas'),
    inventory_movements: pick('inventory_movements'),
    mensajes_operador: pick('mensajes_operador'),
    opening_balances: pick('opening_balances'),
    opening_balance_clients: pick('opening_balance_clients'),
    feature_flags: { stock: true },
  } as unknown as PullResponse['tables'];
}

/** JSON-safe body: bigint money becomes decimal strings exactly as on the wire. */
const jsonBody = (v: unknown): unknown => JSON.parse(encodeJson(v)) as unknown;

export class MockApi {
  readonly state: MockState;
  constructor(state = new MockState()) {
    this.state = state;
  }

  async handle(req: MockRequest): Promise<MockResponse> {
    const control = controlRoute(this.state, req);
    if (control) return control;
    if (req.headers[HEADER_PROTOCOL.toLowerCase()] !== String(PROTOCOL_VERSION)) {
      return err('PROTOCOL_UNSUPPORTED', 'send X-Xangarro-Protocol: 1');
    }
    const scenario = scenarioOf(req.headers, this.state.defaultScenario);
    if (req.path === API_PATHS.activate && req.method === 'POST')
      return this.activate(req, scenario);
    const device = this.authenticate(req, scenario);
    if (!device) return err(req.headers['authorization'] ? 'DEVICE_REVOKED' : 'UNAUTHENTICATED');
    return this.deviceRoute(req, device, scenario);
  }

  private async deviceRoute(
    req: MockRequest,
    device: Device,
    scenario: Scenario,
  ): Promise<MockResponse> {
    const key = `${req.method} ${req.path}`;
    if (key === `POST ${API_PATHS.syncPush}`)
      return applyPush(this.state, req.body, device, scenario);
    if (key === `GET ${API_PATHS.syncPull}`) return this.pull(req, device, scenario);
    if (key === `GET ${API_PATHS.entitlement}`) {
      return {
        status: 200,
        body: {
          entitlement: await sign(
            entitlementFor(scenario, FIXTURE_BUSINESS_ID, new Date(), this.state.recordsPerMonth),
          ),
        },
      };
    }
    return { status: 404, body: { error: { code: 'NOT_FOUND', message: req.path } } };
  }

  /** Bearer token is `mock-device:<deviceId>`; the `revoked` scenario always fails. */
  private authenticate(req: MockRequest, scenario: Scenario): Device | null {
    const m = /^Bearer mock-device:(.+)$/.exec(req.headers['authorization'] ?? '');
    if (!m) return null;
    const device = this.state.devices.get(m[1] as string);
    if (!device || device.status === 'revoked' || scenario === 'revoked') return null;
    return device;
  }

  private async activate(req: MockRequest, scenario: Scenario): Promise<MockResponse> {
    const parsed = ActivateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const message =
        parsed.error instanceof ZodError
          ? parsed.error.issues.map((i) => i.message).join('; ')
          : 'invalid';
      return err('CODE_INVALID', message, 400);
    }
    const code = this.state.codes.get(parsed.data.code);
    if (!code) return err('CODE_INVALID');
    if (code.email !== parsed.data.email) return err('EMAIL_MISMATCH');
    if (code.expiresAt < Date.now()) return err('CODE_EXPIRED');
    if (code.redeemedBy) return err('CODE_USED');
    const slots = parsed.data.code === MOCK_CODES.noSlots ? 0 : this.state.deviceSlots;
    if (this.state.activeDevices() >= slots)
      return err('NO_DEVICE_SLOTS', `plan allows ${slots} devices`);
    // Single-use: burn the code synchronously, before the first await, so a concurrent redeem loses.
    const device = this.state.newDevice();
    code.redeemedBy = device.id;
    const now = new Date();
    const body: ActivateResponse = {
      deviceToken: `mock-device:${device.id}`,
      deviceId: device.id,
      businessId: FIXTURE_BUSINESS_ID,
      entitlement: await sign(
        entitlementFor(scenario, FIXTURE_BUSINESS_ID, now, this.state.recordsPerMonth),
      ),
      bootstrap: {
        serverSeq: this.state.serverSeq,
        serverTime: now.toISOString(),
        tables: referenceTables(this.state, 0),
      },
    };
    return { status: 200, body: jsonBody(body) };
  }

  private async pull(req: MockRequest, device: Device, scenario: Scenario): Promise<MockResponse> {
    const q = PullQuerySchema.safeParse(req.query);
    if (!q.success)
      return {
        status: 400,
        body: { error: { code: 'VALIDATION', message: 'since must be a non-negative integer' } },
      };
    const now = new Date();
    const body: PullResponse = {
      serverSeq: this.state.serverSeq,
      serverTime: now.toISOString(),
      entitlement: await sign(
        entitlementFor(scenario, FIXTURE_BUSINESS_ID, now, this.state.recordsPerMonth),
      ),
      tables: referenceTables(this.state, q.data.since),
      acknowledgedThrough: device.acknowledgedThrough,
    };
    return { status: 200, body: jsonBody(body) };
  }
}

export { FIXTURE_BUSINESS_ID };
