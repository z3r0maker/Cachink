/**
 * Money formatters — pure presentation helpers.
 *
 * Money values stay as `bigint` centavos through the entire app per
 * CLAUDE.md §2 principle 8. Only the boundary between domain → UI does
 * the bigint → display-string conversion handled here. All formatters use
 * `Intl` with the es-MX locale (CLAUDE.md §8.5).
 *
 * Trade-off — `Intl.NumberFormat` does not accept bigint on every RN
 * runtime we ship to (Hermes is fine; older fallbacks are not). We route
 * through `toPesosString(...)` (a bigint-safe centavos→pesos serializer)
 * and then `Number.parseFloat`, accepting the bigint→Number conversion.
 * This is safe up to `Number.MAX_SAFE_INTEGER / 100` pesos (~$90 trillion
 * MXN) — far above any emprendedor's ledger. A regression test pins a
 * 10-trillion-peso sentinel to catch any future loss.
 */
import type { Money } from '../money/index.js';
import { toPesosString } from '../money/index.js';

const LOCALE = 'es-MX';

const FULL = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const COMPACT = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'MXN',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const PESOS_BARE = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function toFloat(centavos: Money): number {
  return Number.parseFloat(toPesosString(centavos));
}

/** "$1,234.56" — full currency form, two decimals always. */
export function formatMoney(centavos: Money): string {
  return FULL.format(toFloat(centavos));
}

/** "$1.2M" / "$8.4 K" — compact KPI form for tight hero cards. */
export function formatMoneyCompact(centavos: Money): string {
  return COMPACT.format(toFloat(centavos));
}

/** "1,234.56" — bare numeric form for tables and exports (no symbol). */
export function formatPesos(centavos: Money): string {
  return PESOS_BARE.format(toFloat(centavos));
}
