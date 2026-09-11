/**
 * Conformance harness: runs against `API_BASE` when set (a real backend),
 * otherwise boots the mock on an ephemeral port. Mock-only tests check
 * `isMock` and skip against a real server.
 */

import * as ed from '@noble/ed25519';
import { startMockServer, type RunningMock } from '../../src/mock/server.js';
import devKeys from '../../src/mock/dev-keys.json' with { type: 'json' };
import { deviceHeaders } from '../../src/transport.js';
import { canonicalize, type SignedEntitlement } from '../../src/entitlement.js';

export interface Harness {
  readonly base: string;
  readonly isMock: boolean;
  readonly email: string;
  freshCode(): Promise<string>;
  reset(): Promise<void>;
  close(): Promise<void>;
}

export async function startHarness(): Promise<Harness> {
  const external = process.env['API_BASE'];
  if (external) {
    const email = process.env['CONFORMANCE_EMAIL'] ?? 'demo@xangarro.mx';
    const codes = (process.env['CONFORMANCE_CODES'] ?? '').split(',').filter(Boolean);
    return {
      base: external,
      isMock: false,
      email,
      freshCode: async () => {
        const c = codes.shift();
        if (!c) throw new Error('CONFORMANCE_CODES exhausted');
        return c;
      },
      reset: async () => {},
      close: async () => {},
    };
  }
  const running: RunningMock = await startMockServer(0);
  return {
    base: running.url,
    isMock: true,
    email: 'dueno@tacoslaesquina.mx',
    freshCode: async () => {
      const r = await fetch(`${running.url}/__mock/code`, { method: 'POST' });
      return ((await r.json()) as { code: string }).code;
    },
    reset: async () => {
      await fetch(`${running.url}/__mock/reset`, { method: 'POST' });
    },
    close: () => running.close(),
  };
}

export async function call(
  base: string,
  method: string,
  path: string,
  opts: {
    token?: string;
    body?: unknown;
    scenario?: string;
    headers?: Record<string, string>;
  } = {},
) {
  const headers: Record<string, string> = { ...deviceHeaders(opts.token), ...(opts.headers ?? {}) };
  if (opts.scenario) headers['X-Mock-Scenario'] = opts.scenario;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

export const DEVICE = {
  name: 'Conformance iPhone',
  platform: 'ios' as const,
  appVersion: '0.1.0',
  osVersion: '18.1',
};

export async function verifyEntitlement(ent: SignedEntitlement): Promise<boolean> {
  const pub = ed.etc.hexToBytes(process.env['ENTITLEMENT_PUBKEY'] ?? devKeys.publicHex);
  return ed.verifyAsync(
    Buffer.from(ent.signature, 'base64'),
    new TextEncoder().encode(canonicalize(ent.payload)),
    pub,
  );
}
