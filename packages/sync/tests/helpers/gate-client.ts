/**
 * A push client in front of the contracts mock that refuses whole batches on
 * cue — a poison row the server answers with 400/413/500 for the whole
 * request, an outage, a rate limit — and records what it was sent.
 */

import type { Delta, PushResponse } from '@xangarro/contracts';
import { ApiClient, type ApiResult } from '../../src/api-client.js';

export type Refusal = Extract<ApiResult<never>, { ok: false }>;

/** Decides a push before the mock sees it: a refusal, or null to forward it. */
export type Gate = (deltas: readonly Delta[], request: number) => Refusal | null;

export const refusal = (status: number, extra: Partial<Refusal> = {}): Refusal => ({
  ok: false,
  status,
  code: status === 400 ? 'VALIDATION' : status === 429 ? 'RATE_LIMITED' : 'INTERNAL',
  message: `HTTP ${status}`,
  ...extra,
});

/** Refuses, with `status`, every batch that carries one of `poison`. */
export const poisonGate =
  (poison: ReadonlySet<string>, status: number): Gate =>
  (deltas) =>
    deltas.some((d) => poison.has(d.rowId)) ? refusal(status) : null;

export class GateClient extends ApiClient {
  /** The row ids of every push, in order. */
  readonly batches: string[][] = [];
  /** Every row id ever sent. */
  readonly seen = new Set<string>();
  /** Every row id the mock accepted. */
  readonly accepted = new Set<string>();
  gate: Gate;

  get sizes(): number[] {
    return this.batches.map((b) => b.length);
  }

  constructor(baseUrl: string, gate: Gate) {
    super({ baseUrl });
    this.gate = gate;
  }

  override async push(token: string, deltas: readonly Delta[]): Promise<ApiResult<PushResponse>> {
    this.batches.push(deltas.map((d) => d.rowId));
    for (const d of deltas) this.seen.add(d.rowId);
    const refused = this.gate(deltas, this.batches.length);
    if (refused !== null) return refused;
    const res = await super.push(token, deltas);
    if (res.ok) for (const a of res.data.accepted) this.accepted.add(a.rowId);
    return res;
  }
}
