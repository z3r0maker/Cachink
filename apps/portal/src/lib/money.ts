/**
 * Pesos in, centavos out — for every money field a person types in the portal.
 *
 * The shopkeeper types `2100.50`; storage is integer centavos (CLAUDE.md §2.8).
 * Parsed as digits, never as a float: `0.29 * 100` is `28.999…` in floating
 * point. Anything that is not a plain non-negative amount with at most two
 * decimals is refused rather than coerced — `Number('')` is 0, and a silent
 * zero is worse than a refusal.
 */
export function pesosToCentavos(input: string): bigint | null {
  const trimmed = input.trim().replace(/,/g, '');
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(trimmed);
  if (match === null) return null;
  const [, whole = '0', fraction = ''] = match;
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}
