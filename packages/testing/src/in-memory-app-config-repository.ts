/**
 * In-memory {@link AppConfigRepository}. Map-backed; last write wins,
 * matching the Drizzle upsert semantics.
 */

import type { AppConfig, AppConfigRepository } from '@cachink/data';

export class InMemoryAppConfigRepository implements AppConfigRepository {
  private readonly store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(): Promise<readonly AppConfig[]> {
    return [...this.store.entries()].map(([key, value]) => ({ key, value }));
  }
}
