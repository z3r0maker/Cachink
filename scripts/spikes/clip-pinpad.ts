/**
 * clip-pinpad.ts — the N-40 proof for Clip's PinPad API.
 *
 * Clip has no sandbox for PinPad: this charges a REAL card on a REAL reader.
 * It sends a $1.00 intent to the reader, waits for the cashier to tap a card,
 * and reads the result back by fetching it (Clip's webhook is unsigned, so it
 * can only ever be a signal). If nobody pays in time, it cancels the intent.
 *
 * Needs: a Total 3, Ultra, PinPad or Stand 2 with Clip's PinPad app installed
 * (ask sdk@payclip.com, sending the serial), and a production API key + secret
 * from dashboard.clip.mx → Desarrolladores → Credenciales.
 *
 *   CLIP_API_KEY=… CLIP_SECRET=… CLIP_SERIAL=P82… pnpm tsx scripts/spikes/clip-pinpad.ts --charge
 *
 * Refund the peso from the Clip app afterwards. Findings: docs/spikes/payments-clip.md.
 */

import { pesos, pollUntil } from './shared.js';

const API = 'https://api.payclip.io/f2f/pinpad/v1';
/** One peso: the smallest honest proof that money moves. */
const AMOUNT_CENTAVOS = 100n;

type Intent = { pinpad_request_id: string; status?: 'PENDING' | 'COMPLETED' | 'FAILED' | string };

async function call<T>(auth: string, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return (text ? JSON.parse(text) : undefined) as T;
}

function credentials(): { auth: string; serial: string } {
  const { CLIP_API_KEY: key, CLIP_SECRET: secret, CLIP_SERIAL: serial } = process.env;
  if (!key || !secret || !serial) throw new Error('Set CLIP_API_KEY, CLIP_SECRET and CLIP_SERIAL.');
  if (!process.argv.includes('--charge')) {
    throw new Error(
      `This charges $${pesos(AMOUNT_CENTAVOS)} to a real card. Re-run with --charge.`,
    );
  }
  return { auth: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`, serial };
}

async function main(): Promise<void> {
  const { auth, serial } = credentials();

  const devices = await call<unknown>(auth, 'GET', '/devices/status');
  console.log('readers on this account:', JSON.stringify(devices));

  const intent = await call<Intent>(auth, 'POST', '/payment', {
    amount: pesos(AMOUNT_CENTAVOS),
    reference: `xg-spike-${Date.now()}`,
    serial_number_pos: serial,
    preferences: { is_tip_enabled: false, is_auto_print_receipt_enabled: false },
  });
  const id = intent.pinpad_request_id;
  console.log(`sent ${id} to ${serial}; tap a card on the reader within 2 minutes`);

  try {
    const final = await pollUntil(
      () => call<Intent>(auth, 'GET', `/payment?pinpadRequestId=${encodeURIComponent(id)}`),
      (p) => p.status !== 'PENDING',
      { everyMs: 3000, forMs: 120_000 },
    );
    console.log('settled:', JSON.stringify(final, null, 2));
  } catch (e) {
    await call(auth, 'DELETE', `/payment/${encodeURIComponent(id)}`);
    console.log(`cancelled ${id} on the reader`);
    throw e;
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
