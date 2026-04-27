/**
 * Unit tests for the repository composition root (P1C Commit 4).
 *
 * The pieces:
 *   - `useRepositories()` throws outside a `<RepositoryProvider>`.
 *   - Every typed accessor (`useSalesRepository`, etc.) returns the
 *     matching instance from the context record.
 *   - `MockRepositoryProvider` wires a default in-memory set so
 *     component tests don't have to juggle 11 repos.
 *   - `MockRepositoryProvider` honours `overrides` — any provided repo
 *     supplants the default, unspecified keys still fall back to fresh
 *     in-memory instances.
 *   - `buildDrizzleRepositories` returns instances of every Drizzle
 *     class (11 in total) — smoke-test for the factory.
 */

import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { InMemorySalesRepository } from '@cachink/testing';
import type { DeviceId } from '@cachink/domain';
import type { CachinkDatabase, SalesRepository } from '@cachink/data';
import Sqlite from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from '@cachink/data/schema';
import { buildTauriCallback } from '../../src/database/database-provider.web';
import {
  buildDrizzleRepositories,
  useAppConfigRepository,
  useBusinessesRepository,
  useClientPaymentsRepository,
  useClientsRepository,
  useDayClosesRepository,
  useEmployeesRepository,
  useExpensesRepository,
  useInventoryMovementsRepository,
  useProductsRepository,
  useRecurringExpensesRepository,
  useRepositories,
  useSalesRepository,
} from '../../src/app/index';
import { MockRepositoryProvider } from '@cachink/testing';
import { renderWithProviders, screen } from '../test-utils';

function RepoProbe(): ReactElement {
  const repos = useRepositories();
  return <span data-testid="count">{Object.keys(repos).length}</span>;
}

describe('useRepositories', () => {
  it('throws a helpful error when used outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => renderWithProviders(<RepoProbe />)).toThrow(
        /must be called inside a <RepositoryProvider>/,
      );
    } finally {
      spy.mockRestore();
    }
  });

  it('exposes all 11 repositories through the context record', () => {
    renderWithProviders(
      <MockRepositoryProvider>
        <RepoProbe />
      </MockRepositoryProvider>,
    );
    expect(screen.getByTestId('count').textContent).toBe('11');
  });
});

describe('typed accessor hooks', () => {
  function AccessorsProbe(): ReactElement {
    // Each accessor should return a non-null value when mounted correctly.
    const appConfig = useAppConfigRepository();
    const businesses = useBusinessesRepository();
    const sales = useSalesRepository();
    const expenses = useExpensesRepository();
    const products = useProductsRepository();
    const inventoryMovements = useInventoryMovementsRepository();
    const employees = useEmployeesRepository();
    const clients = useClientsRepository();
    const clientPayments = useClientPaymentsRepository();
    const dayCloses = useDayClosesRepository();
    const recurringExpenses = useRecurringExpensesRepository();
    const live = [
      appConfig,
      businesses,
      sales,
      expenses,
      products,
      inventoryMovements,
      employees,
      clients,
      clientPayments,
      dayCloses,
      recurringExpenses,
    ].every((repo) => repo !== null && typeof repo === 'object');
    return <span data-testid="live">{live ? 'all-live' : 'null-found'}</span>;
  }

  it('returns a repository instance from each typed accessor', () => {
    renderWithProviders(
      <MockRepositoryProvider>
        <AccessorsProbe />
      </MockRepositoryProvider>,
    );
    expect(screen.getByTestId('live').textContent).toBe('all-live');
  });
});

describe('MockRepositoryProvider overrides', () => {
  it('supplants specific repos while keeping defaults for the rest', () => {
    const sentinelSales = new InMemorySalesRepository();

    function Leaf(): ReactElement {
      const sales = useSalesRepository();
      const clients = useClientsRepository();
      return (
        <>
          <span data-testid="sales-override">{sales === sentinelSales ? 'yes' : 'no'}</span>
          <span data-testid="clients-live">
            {clients && typeof clients === 'object' ? 'yes' : 'no'}
          </span>
        </>
      );
    }

    renderWithProviders(
      <MockRepositoryProvider overrides={{ sales: sentinelSales as unknown as SalesRepository }}>
        <Leaf />
      </MockRepositoryProvider>,
    );
    expect(screen.getByTestId('sales-override').textContent).toBe('yes');
    expect(screen.getByTestId('clients-live').textContent).toBe('yes');
  });
});

describe('buildDrizzleRepositories', () => {
  it('returns 11 non-null repository instances wired onto one db + deviceId', () => {
    const sqlite = new Sqlite(':memory:');
    const shim = {
      path: ':memory:',
      async execute(sqlText: string, params?: unknown[]) {
        sqlite.prepare(sqlText).run(...(params ?? []));
        return { rowsAffected: 0 };
      },
      async select<T>(sqlText: string, params?: unknown[]): Promise<T> {
        return sqlite.prepare(sqlText).all(...(params ?? [])) as unknown as T;
      },
      async close() {
        sqlite.close();
        return true;
      },
    };
    const db = drizzle(
      buildTauriCallback(shim as unknown as Parameters<typeof buildTauriCallback>[0]),
      {
        schema,
      },
    ) as unknown as CachinkDatabase;
    const deviceId = '01JPHK00000000000000000007' as DeviceId;
    const repos = buildDrizzleRepositories(db, deviceId);
    const count = Object.keys(repos).length;
    expect(count).toBe(11);
    expect(Object.values(repos).every((r) => r !== null && typeof r === 'object')).toBe(true);
  });
});
