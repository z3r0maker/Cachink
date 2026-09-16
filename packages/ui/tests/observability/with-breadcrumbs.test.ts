/**
 * withBreadcrumbs must keep a class-based LogStore fully usable: a failing
 * use case surfaces its own error, not "writeError is not a function".
 */

import { describe, expect, it, vi } from 'vitest';
// The package alias points at a test stub; the regression needs the real wrapper.
import { AuditedUseCase } from '../../../observability/src/audited-use-case.js';
import type { LogStore } from '../../../observability/src/log-store.js';
import { withBreadcrumbs } from '../../src/observability/use-audited-use-case';

vi.mock('../../src/observability/sentry-breadcrumbs', () => ({ addAuditBreadcrumb: vi.fn() }));

class PrivateFieldStore implements LogStore {
  readonly #errors: string[] = [];
  async writeAudit(): Promise<void> {}
  async writeError(entry: { errorName: string }): Promise<void> {
    this.#errors.push(entry.errorName);
  }
  errors(): readonly string[] {
    return this.#errors;
  }
  async queryAudit() {
    return [];
  }
  async queryErrors() {
    return [];
  }
  async queryTimeline() {
    return [];
  }
  async stats() {
    return {} as never;
  }
  async prune() {
    return 0;
  }
  async exportSnapshot() {
    return {} as never;
  }
}

class LimitError extends Error {
  constructor() {
    super('limit');
    this.name = 'LimitError';
  }
}

describe('withBreadcrumbs', () => {
  it('lets the use case error propagate and still logs it through the class store', async () => {
    const store = new PrivateFieldStore();
    const audited = new AuditedUseCase(
      { execute: async () => Promise.reject(new LimitError()) },
      withBreadcrumbs(store),
      { operation: 'x.y', entityType: 'x', extractEntityId: () => '' },
      { deviceId: 'D', userId: null, businessId: 'B' },
    );
    await expect(audited.execute(undefined)).rejects.toBeInstanceOf(LimitError);
    await vi.waitFor(() => expect(store.errors()).toEqual(['LimitError']));
  });
});
