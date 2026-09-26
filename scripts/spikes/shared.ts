/**
 * shared.ts — what both terminal spikes (N-40) need: the amount as the
 * providers' wire wants it, and a poll that reads a payment until it settles.
 */

/** Integer centavos as the string both providers accept: exactly two decimals, never a float. */
export function pesos(centavos: bigint): string {
  return `${centavos / 100n}.${String(centavos % 100n).padStart(2, '0')}`;
}

/**
 * Reads `fetchOnce` every `everyMs` until `settled` says so. A webhook is only a
 * signal (ADR-066): the status the venta trusts always comes from this read.
 */
export async function pollUntil<T>(
  fetchOnce: () => Promise<T>,
  settled: (value: T) => boolean,
  { everyMs, forMs }: { everyMs: number; forMs: number },
): Promise<T> {
  const deadline = Date.now() + forMs;
  for (;;) {
    const value = await fetchOnce();
    if (settled(value)) return value;
    if (Date.now() + everyMs > deadline) throw new Error(`not settled within ${forMs / 1000} s`);
    await new Promise((r) => setTimeout(r, everyMs));
  }
}
