/**
 * Unit tests for the shared DatabaseProvider primitives (P1C Commit 1).
 *
 * Covers the pieces that work on both mobile and desktop:
 *   - `useDatabase()` throws a helpful error outside a provider.
 *   - `TestDatabaseProvider` wires the context so `useDatabase()` returns
 *     the injected db.
 *   - `AsyncDatabaseProvider` defers rendering until its factory resolves,
 *     then exposes the db to children.
 *   - The `database` prop short-circuits the factory (production
 *     ergonomics, test ergonomics).
 *   - Migration-statement splitter handles the Drizzle Kit breakpoint
 *     marker correctly.
 *
 * The platform-specific `.native.tsx` / `.web.tsx` variants are thin
 * wrappers that pass a platform factory into `AsyncDatabaseProvider`;
 * their SQLite-driver behaviour is covered by integration tests (data
 * layer) + the Maestro E2E flows added in Commit 17.
 */

import { describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import {
  AsyncDatabaseProvider,
  TestDatabaseProvider,
  splitStatements,
  useDatabase,
} from '../../src/database/index';
import type { CachinkDatabase } from '@cachink/data';
import { renderWithProviders, screen, waitFor } from '../test-utils';

/** Tiny placeholder — we never touch any SQL method in these tests. */
const fakeDb = { __kind: 'fake-cachink-db' } as unknown as CachinkDatabase;

function DbConsumer({ testID }: { readonly testID: string }): ReactElement {
  const db = useDatabase();
  return <span data-testid={testID}>{(db as unknown as { __kind: string }).__kind}</span>;
}

describe('useDatabase', () => {
  it('throws a descriptive error when called outside a provider', () => {
    // Silence React's uncaught-error noise for this intentionally-throwing render.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => renderWithProviders(<DbConsumer testID="no-provider" />)).toThrow(
        /useDatabase\(\) must be called inside <DatabaseProvider>/,
      );
    } finally {
      spy.mockRestore();
    }
  });
});

describe('TestDatabaseProvider', () => {
  it('exposes the injected database to children via useDatabase()', () => {
    renderWithProviders(
      <TestDatabaseProvider database={fakeDb}>
        <DbConsumer testID="with-test-provider" />
      </TestDatabaseProvider>,
    );
    expect(screen.getByTestId('with-test-provider').textContent).toBe('fake-cachink-db');
  });
});

describe('AsyncDatabaseProvider', () => {
  it('renders children once the factory resolves', async () => {
    const create = vi.fn(() => Promise.resolve(fakeDb));
    renderWithProviders(
      <AsyncDatabaseProvider create={create}>
        <DbConsumer testID="async-resolved" />
      </AsyncDatabaseProvider>,
    );
    await waitFor(() => expect(screen.queryByTestId('async-resolved')).not.toBeNull());
    expect(screen.getByTestId('async-resolved').textContent).toBe('fake-cachink-db');
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('renders null while the factory is pending', () => {
    const create = vi.fn(() => new Promise<CachinkDatabase>(() => {}));
    renderWithProviders(
      <AsyncDatabaseProvider create={create}>
        <DbConsumer testID="async-pending" />
      </AsyncDatabaseProvider>,
    );
    expect(screen.queryByTestId('async-pending')).toBeNull();
  });

  it('short-circuits the factory when the `database` prop is supplied', () => {
    const create = vi.fn(() => Promise.reject(new Error('should not be called')));
    renderWithProviders(
      <AsyncDatabaseProvider create={create} database={fakeDb}>
        <DbConsumer testID="async-injected" />
      </AsyncDatabaseProvider>,
    );
    expect(screen.getByTestId('async-injected').textContent).toBe('fake-cachink-db');
    expect(create).not.toHaveBeenCalled();
  });

  it('surfaces factory errors via console.error rather than hanging silently', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const create = vi.fn(() => Promise.reject(new Error('boom')));
    try {
      renderWithProviders(
        <AsyncDatabaseProvider create={create}>
          <DbConsumer testID="async-error" />
        </AsyncDatabaseProvider>,
      );
      await waitFor(() => expect(spy).toHaveBeenCalled());
      // Children never rendered because db stayed null.
      expect(screen.queryByTestId('async-error')).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });
});

describe('splitStatements', () => {
  it('splits a Drizzle Kit migration at the statement-breakpoint marker', () => {
    const raw = [
      'CREATE TABLE a (id TEXT);',
      '--> statement-breakpoint',
      'CREATE TABLE b (id TEXT);',
      '--> statement-breakpoint',
      'CREATE TABLE c (id TEXT);',
    ].join('\n');
    const out = splitStatements(raw);
    expect(out).toEqual([
      'CREATE TABLE a (id TEXT);',
      'CREATE TABLE b (id TEXT);',
      'CREATE TABLE c (id TEXT);',
    ]);
  });

  it('filters out empty segments so trailing breakpoints do not emit blank statements', () => {
    const raw = 'CREATE TABLE a (id TEXT);\n--> statement-breakpoint\n';
    expect(splitStatements(raw)).toEqual(['CREATE TABLE a (id TEXT);']);
  });

  it('returns a single statement when no breakpoint marker is present', () => {
    expect(splitStatements('SELECT 1;')).toEqual(['SELECT 1;']);
  });
});
