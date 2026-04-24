/**
 * Drizzle-backed {@link AppConfigRepository}. Upserts treat primary-key
 * conflicts as replacements so callers don't have to branch on "first write
 * vs update".
 */

import { eq } from 'drizzle-orm';
import type { AppConfig, AppConfigRepository } from '../app-config-repository.js';
import { appConfig } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

export class DrizzleAppConfigRepository implements AppConfigRepository {
  readonly #db: CachinkDatabase;

  constructor(db: CachinkDatabase) {
    this.#db = db;
  }

  async get(key: string): Promise<string | null> {
    const row = await this.#db
      .select()
      .from(appConfig)
      .where(eq(appConfig.key, key))
      .get();
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.#db
      .insert(appConfig)
      .values({ key, value })
      .onConflictDoUpdate({ target: appConfig.key, set: { value } })
      .run();
  }

  async delete(key: string): Promise<void> {
    await this.#db.delete(appConfig).where(eq(appConfig.key, key)).run();
  }

  async list(): Promise<readonly AppConfig[]> {
    const rows = await this.#db.select().from(appConfig).all();
    return rows.map((r) => ({ key: r.key, value: r.value }));
  }
}
