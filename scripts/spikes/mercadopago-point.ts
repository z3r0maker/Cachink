/**
 * mercadopago-point.ts — the N-40 sandbox proof for Mercado Pago Point.
 *
 * Creates a Point order on Mercado Pago's virtual terminal (serial
 * `SBX0000001`), asks the sandbox to simulate the payment, then reads the
 * order back the way N-42 will: by fetching it, never by trusting a webhook.
 * No physical terminal and no dependency beyond Node's `fetch`.
 *
 * Usage (test credentials from Tus integraciones → Pruebas → Credenciales):
 *   MP_ACCESS_TOKEN=APP_USR-… pnpm tsx scripts/spikes/mercadopago-point.ts [processed|failed]
 * `MP_TERMINAL_ID` targets a real linked terminal instead of the virtual one.
 *
 * Findings and the doc links behind every call: docs/spikes/payments-mercadopago.md.
 */

import { randomUUID } from 'node:crypto';

import { pesos, pollUntil } from './shared.js';

const API = 'https://api.mercadopago.com';
const VIRTUAL_TERMINAL = 'NEWLAND_N950__SBX0000001';
/** The spike charges $24.00, held as integer centavos. */
const AMOUNT_CENTAVOS = 2400n;

type Order = {
  id: string;
  status: string;
  status_detail?: string;
  transactions?: { payments?: { id: string; status: string; status_detail?: string }[] };
};

async function call<T>(token: string, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(method === 'POST' ? { 'X-Idempotency-Key': randomUUID() } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return (text ? JSON.parse(text) : undefined) as T;
}

async function main(): Promise<void> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error('Set MP_ACCESS_TOKEN to the application’s TEST access token.');
  const outcome = process.argv[2] === 'failed' ? 'failed' : 'processed';
  const terminal = process.env.MP_TERMINAL_ID ?? VIRTUAL_TERMINAL;

  const linked = await call<unknown>(token, 'GET', '/terminals/v1/list?limit=50&offset=0');
  console.log('terminals linked to this account:', JSON.stringify(linked));

  const order = await call<Order>(token, 'POST', '/v1/orders', {
    type: 'point',
    external_reference: `xg-spike-${Date.now()}`,
    expiration_time: 'PT5M',
    description: 'Xangarro spike N-40',
    transactions: { payments: [{ amount: pesos(AMOUNT_CENTAVOS) }] },
    config: { point: { terminal_id: terminal, print_on_terminal: 'no_ticket' } },
  });
  console.log(`created ${order.id} on ${terminal}: ${order.status}`);

  await call(token, 'POST', `/v1/orders/${order.id}/events`, {
    status: outcome,
    payment_method_type: 'credit_card',
    payment_method_id: 'visa',
    installments: 1,
  });
  // The sandbox passes through `at_terminal` and settles within ~10 s (40 s for action_required).
  const final = await pollUntil(
    () => call<Order>(token, 'GET', `/v1/orders/${order.id}`),
    (o) => !['created', 'at_terminal'].includes(o.status),
    { everyMs: 3000, forMs: 60_000 },
  );
  console.log('settled:', JSON.stringify(final, null, 2));
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
