import 'server-only';

import { throttleKey, throttleTake } from '@xangarro/data-pg';

import { db } from '../db';

/**
 * How often a business may export (audit DB3-EXP-01): {@link exportsPerWindow}
 * files per {@link EXPORT_WINDOW_S} seconds, counted per business in the shared
 * throttle table, so every server instance sees the same count. An export
 * reads the whole history; five in ten minutes is a contador's afternoon, and
 * a hundred is a loop someone left running — or a viewer's button mashed.
 */
export const EXPORT_WINDOW_S = 600;
const DEFAULT_PER_WINDOW = 5;

/** `EXPORTS_PER_TENANT`, else 5. E2E raises it; an unusable value is the default. */
export function exportsPerWindow(value: string | undefined = process.env.EXPORTS_PER_TENANT) {
  const n = Number(value);
  return value !== undefined && value.trim() !== '' && Number.isInteger(n) && n >= 1
    ? n
    : DEFAULT_PER_WINDOW;
}

/** Takes one export from the business's allowance: seconds to wait, 0 to go. */
export function takeExport(businessId: string): Promise<number> {
  const key = throttleKey('export', 'business', businessId);
  return throttleTake(db(), key, exportsPerWindow(), EXPORT_WINDOW_S);
}
