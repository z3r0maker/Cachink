import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import type { CachinkDatabase } from '@cachink/data';
import { AsyncDatabaseProvider, useDatabase } from '../../src/database/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';

initI18n();

const fakeDb = { __kind: 'fake-cachink-db' } as unknown as CachinkDatabase;

function DbConsumer({ testID }: { readonly testID: string }): ReactElement {
  const db = useDatabase();
  return <span data-testid={testID}>{(db as unknown as { __kind: string }).__kind}</span>;
}

describe('AsyncDatabaseProvider error state', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the fallback when initialization fails', async () => {
    const create = vi.fn(async () => {
      throw new Error('boom');
    });

    renderWithProviders(
      <AsyncDatabaseProvider create={create} reset={async () => {}}>
        <DbConsumer testID="db-ready" />
      </AsyncDatabaseProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('database-error-state')).toBeInTheDocument());
    expect(screen.getByTestId('database-error-state-retry')).toBeInTheDocument();
    expect(screen.getByTestId('database-error-state-copy')).toBeInTheDocument();
    expect(screen.getByTestId('database-error-state-reset')).toBeInTheDocument();
    expect(screen.queryByTestId('db-ready')).toBeNull();
  });

  it('retries initialization from the fallback state', async () => {
    const create = vi
      .fn<() => Promise<CachinkDatabase>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(fakeDb);

    renderWithProviders(
      <AsyncDatabaseProvider create={create}>
        <DbConsumer testID="db-ready" />
      </AsyncDatabaseProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('database-error-state')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('database-error-state-retry'));

    await waitFor(() => expect(screen.getByTestId('db-ready').textContent).toBe('fake-cachink-db'));
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('copies error details from the fallback state', async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    renderWithProviders(
      <AsyncDatabaseProvider
        create={async () => {
          throw new Error('detalle de prueba');
        }}
      >
        <DbConsumer testID="db-ready" />
      </AsyncDatabaseProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('database-error-state-copy')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId('database-error-state-copy'));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('detalle de prueba'));
  });

  it('resets the database after confirmation and retries initialization', async () => {
    const create = vi
      .fn<() => Promise<CachinkDatabase>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(fakeDb);
    const reset = vi.fn(async () => {});

    renderWithProviders(
      <AsyncDatabaseProvider create={create} reset={reset}>
        <DbConsumer testID="db-ready" />
      </AsyncDatabaseProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('database-error-state-reset')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId('database-error-state-reset'));

    await waitFor(() => expect(screen.getByText('Sí, restablecer')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Sí, restablecer'));

    await waitFor(() => expect(reset).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('db-ready').textContent).toBe('fake-cachink-db'));
    expect(create).toHaveBeenCalledTimes(2);
  });
});
