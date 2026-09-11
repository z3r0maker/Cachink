/**
 * Typed wrappers around the three `lan_server_*` Tauri commands exposed
 * by the Rust backend (Slice 8 C2 / ADR-029).
 *
 * The Rust side serializes its `LanStartResult` with default
 * (snake_case) field names; the UI's `LanHostStartResult` is camelCase.
 * This module owns that translation so consumers — primarily
 * `LanGate` via `lan-bridges.ts` — see one well-typed shape only.
 *
 * Errors from `invoke()` come back as plain strings; we wrap them in a
 * stable `LanHostBridgeError` so calling code can pattern-match instead
 * of string-sniffing.
 */

import { invoke } from '@tauri-apps/api/core';
import type { LanHostStartResult } from '@cachink/ui';

interface RawLanStartResult {
  url: string;
  pairing_token: string;
  qr_png_base64: string;
  protocol: number;
}

export class LanHostBridgeError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'LanHostBridgeError';
  }
}

async function safeInvoke<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(name, args);
  } catch (err) {
    throw new LanHostBridgeError(`Tauri command \`${name}\` failed`, err);
  }
}

/** Boot (or fetch the existing handle of) the bundled LAN sync server. */
export async function startLanServer(): Promise<LanHostStartResult & { protocol: number }> {
  const raw = await safeInvoke<RawLanStartResult>('lan_server_start');
  return {
    url: raw.url,
    pairingToken: raw.pairing_token,
    qrPngBase64: raw.qr_png_base64,
    protocol: raw.protocol,
  };
}

/** Stop the LAN sync server. Idempotent — safe to call when stopped. */
export async function stopLanServer(): Promise<void> {
  await safeInvoke<null>('lan_server_stop');
}

/**
 * Distinct paired devices currently holding an open WebSocket. Used by
 * the desktop AppShell to feed `SyncStatusBadge`'s "N dispositivos" copy.
 */
export async function lanServerConnectedDevices(): Promise<number> {
  return safeInvoke<number>('lan_server_connections');
}
