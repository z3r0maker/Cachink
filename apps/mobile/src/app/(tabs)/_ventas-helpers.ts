/**
 * Pure helpers and derived-state hooks for the Ventas tab.
 * Extracted to keep ventas.tsx under the 200-line / 40-line-function
 * limits enforced by ESLint (CLAUDE.md §2 #6).
 *
 * Underscore prefix → Expo Router ignores this file as a route.
 */

import type { IsoDate } from '@cachink/domain';

export function todayIso(): IsoDate {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}
