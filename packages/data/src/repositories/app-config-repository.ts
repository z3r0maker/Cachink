/**
 * AppConfigRepository — key/value singleton settings (CLAUDE.md §9).
 *
 * Unlike the other repositories this one is key-addressed, not id-addressed,
 * and carries no audit columns (see `AppConfigSchema` in @cachink/domain).
 * Values are opaque strings — JSON encoding is the caller's job.
 */

import type { AppConfig } from '@cachink/domain';

export type { AppConfig };

export interface AppConfigRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  /** Return all key/value pairs (used by the Settings "export all" flow). */
  list(): Promise<readonly AppConfig[]>;
}
