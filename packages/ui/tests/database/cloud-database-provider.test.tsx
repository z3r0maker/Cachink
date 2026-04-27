/**
 * `CloudDatabaseProvider` tests (Slice 8 M3-C12).
 *
 * Verifies the conditional Context-swap behaviour: only when
 * `useMode() === 'cloud'` AND a non-null `cloudHandle` is provided does
 * the provider override the inherited `DatabaseContext` value. Every
 * other combination must pass children straight through (the outer
 * local-SQLite provider keeps owning the context).
 */

import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { act } from 'react';
import type { CachinkDatabase } from '@cachink/data';
import { useAppConfigStore } from '../../src/app-config/index';
import { DatabaseContext, TestDatabaseProvider } from '../../src/database/_internal';
import { CloudDatabaseProvider } from '../../src/database/cloud-database-provider';

const LOCAL_DB = { __tag: 'local' } as unknown as CachinkDatabase;
const CLOUD_DB = { __tag: 'cloud' } as unknown as CachinkDatabase;

function setMode(mode: 'local' | 'lan-server' | 'lan-client' | 'cloud' | null): void {
  act(() => {
    useAppConfigStore.setState({
      hydrated: true,
      mode,
      currentBusinessId: null,
      role: null,
      deviceId: null,
    });
  });
}

function ContextProbe({
  onRender,
}: {
  onRender: (db: CachinkDatabase | null) => void;
}): ReactElement {
  return (
    <DatabaseContext.Consumer>
      {(db) => {
        onRender(db);
        return <span data-testid="probe">probe</span>;
      }}
    </DatabaseContext.Consumer>
  );
}

function mount(node: ReactNode): void {
  render(<TestDatabaseProvider database={LOCAL_DB}>{node}</TestDatabaseProvider>);
}

describe('CloudDatabaseProvider (Slice 8 M3-C12)', () => {
  beforeEach(() => {
    setMode(null);
  });

  it('passes children through unchanged when mode !== cloud', () => {
    setMode('local');
    let observed: CachinkDatabase | null = null;
    mount(
      <CloudDatabaseProvider cloudHandle={CLOUD_DB}>
        <ContextProbe onRender={(db) => (observed = db)} />
      </CloudDatabaseProvider>,
    );
    expect(observed).toBe(LOCAL_DB);
  });

  it('passes children through unchanged when mode === cloud but cloudHandle is null', () => {
    setMode('cloud');
    let observed: CachinkDatabase | null = null;
    mount(
      <CloudDatabaseProvider cloudHandle={null}>
        <ContextProbe onRender={(db) => (observed = db)} />
      </CloudDatabaseProvider>,
    );
    expect(observed).toBe(LOCAL_DB);
  });

  it('swaps the DatabaseContext to cloudHandle when both conditions are met', () => {
    setMode('cloud');
    let observed: CachinkDatabase | null = null;
    mount(
      <CloudDatabaseProvider cloudHandle={CLOUD_DB}>
        <ContextProbe onRender={(db) => (observed = db)} />
      </CloudDatabaseProvider>,
    );
    expect(observed).toBe(CLOUD_DB);
  });
});
