/**
 * `pairWithLanServer` — client-side `POST /api/v1/pair` (Slice 9 wiring
 * catch-up, extracted from `apps/desktop/src/shell/lan-pair-bridge.ts`).
 *
 * Used by both shells when the user picks "Conectar a un servidor
 * local" instead of being the host. Mobile + desktop both import this
 * helper so the wire protocol lives in exactly one place
 * (CLAUDE.md §2 rule 3).
 *
 * The wire types live in
 * `apps/desktop/src-tauri/src/lan_sync/protocol.rs` and are stamped
 * `#[serde(rename_all = "camelCase")]` so the JS shape matches 1:1.
 * The PROTOCOL_HEADER must be sent on every request (server returns
 * 426 otherwise).
 */

import type { LanPairSuccess } from '../screens/LanPairing/lan-join-screen';

const PROTOCOL_HEADER = 'X-Cachink-Protocol';
const PROTOCOL_VERSION = '1';
const API_PREFIX = '/api/v1';

interface PairRequestBody {
  pairingToken: string;
  deviceId: string;
}

interface PairResponseBody {
  accessToken: string;
  businessId: string;
  serverId: string;
}

interface WireError {
  error: string;
  code: string;
}

export class LanPairError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly httpStatus?: number,
  ) {
    super(message);
    this.name = 'LanPairError';
  }
}

export interface PairWithLanServerArgs {
  readonly serverUrl: string;
  readonly pairingToken: string;
  readonly deviceId: string;
}

async function postPairRequest(url: string, body: PairRequestBody): Promise<Response> {
  try {
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [PROTOCOL_HEADER]: PROTOCOL_VERSION,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new LanPairError(err instanceof Error ? err.message : 'Network error', 'network');
  }
}

async function readWireError(response: Response): Promise<{ message: string; code: string }> {
  let code = 'pair_failed';
  let message = `Pair failed with HTTP ${response.status}`;
  try {
    const data = (await response.json()) as WireError;
    if (typeof data?.error === 'string') message = data.error;
    if (typeof data?.code === 'string') code = data.code;
  } catch {
    /* swallow non-JSON error body */
  }
  return { message, code };
}

export async function pairWithLanServer(args: PairWithLanServerArgs): Promise<LanPairSuccess> {
  const url = joinUrl(args.serverUrl, `${API_PREFIX}/pair`);
  const response = await postPairRequest(url, {
    pairingToken: args.pairingToken,
    deviceId: args.deviceId,
  });
  if (!response.ok) {
    const { message, code } = await readWireError(response);
    throw new LanPairError(message, code, response.status);
  }
  const data = (await response.json()) as PairResponseBody;
  return {
    serverUrl: args.serverUrl,
    accessToken: data.accessToken,
    businessId: data.businessId,
  };
}

function joinUrl(base: string, path: string): string {
  if (base.endsWith('/') && path.startsWith('/')) return base + path.slice(1);
  if (!base.endsWith('/') && !path.startsWith('/')) return `${base}/${path}`;
  return base + path;
}
