/**
 * AppConfig — key/value singleton settings table (CLAUDE.md §9).
 *
 * Holds mode selection, current business id, notification preferences, and
 * similar device-local configuration. Values are JSON-encoded strings so the
 * shape stays a single column; schema-specific parsing is the caller's job.
 *
 * No audit fields — this is a local settings table, not a synced entity.
 */

import { z } from 'zod';

export const AppConfigSchema = z.object({
  key: z.string().min(1).max(64),
  value: z.string(),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
