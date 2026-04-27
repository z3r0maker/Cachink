/**
 * `useLanSync` hook — Slice 8 C7. Verifies the hook subscribes to a
 * provided handle, mirrors snapshot updates into component state, and
 * forwards retry calls. Without a provider it returns inert defaults so
 * AppShell can mount in Local / Cloud modes without a LAN handle.
 */

import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { LanSyncProvider, type LanSyncHandle, type LanSyncState } from '../../src/sync/index';
import { useLanSync } from '../../src/hooks/use-lan-sync';

function Probe(): ReactElement {
  const lan = useLanSync();
  return (
    <div
      data-testid="probe"
      data-status={lan.status}
      data-devices={String(lan.connectedDevices)}
      data-error={lan.lastError ?? ''}
    >
      <button
        data-testid="retry"
        type="button"
        onClick={() => {
          void lan.retryNow();
        }}
      />
    </div>
  );
}

function makeHandle(overrides?: Partial<LanSyncHandle>): {
  handle: LanSyncHandle;
  emit: (state: LanSyncState) => void;
  retryNow: ReturnType<typeof vi.fn>;
} {
  let listener: ((state: LanSyncState) => void) | null = null;
  let current: LanSyncState = {
    status: 'connecting',
    connectedDevices: 0,
    lastServerSeq: 0,
    lastError: null,
  };
  const retryNow = vi.fn(async () => {
    /* stubbed */
  });
  const handle: LanSyncHandle = {
    dispose: vi.fn(async () => {
      /* stubbed */
    }),
    getState: () => current,
    subscribe: (l) => {
      listener = l;
      return () => {
        listener = null;
      };
    },
    retryNow,
    ...overrides,
  };
  return {
    handle,
    emit: (next) => {
      current = next;
      listener?.(next);
    },
    retryNow,
  };
}

describe('useLanSync', () => {
  it('returns inert defaults when no LanSyncProvider is mounted', () => {
    render(<Probe />);
    const probe = screen.getByTestId('probe');
    expect(probe.dataset['status']).toBe('idle');
    expect(probe.dataset['devices']).toBe('0');
  });

  it('mirrors the handle snapshot on mount', () => {
    const { handle } = makeHandle();
    render(
      <LanSyncProvider handle={handle}>
        <Probe />
      </LanSyncProvider>,
    );
    expect(screen.getByTestId('probe').dataset['status']).toBe('connecting');
  });

  it('updates state when the handle emits a new snapshot', () => {
    const { handle, emit } = makeHandle();
    render(
      <LanSyncProvider handle={handle}>
        <Probe />
      </LanSyncProvider>,
    );
    act(() => {
      emit({ status: 'online', connectedDevices: 3, lastServerSeq: 42, lastError: null });
    });
    expect(screen.getByTestId('probe').dataset['status']).toBe('online');
    expect(screen.getByTestId('probe').dataset['devices']).toBe('3');
  });

  it('forwards retryNow() to the handle', async () => {
    const { handle, retryNow } = makeHandle();
    render(
      <LanSyncProvider handle={handle}>
        <Probe />
      </LanSyncProvider>,
    );
    await act(async () => {
      screen.getByTestId('retry').click();
    });
    expect(retryNow).toHaveBeenCalled();
  });

  it('noop retries resolve safely without a handle', async () => {
    render(<Probe />);
    await act(async () => {
      screen.getByTestId('retry').click();
    });
    // No error means the noop path resolved.
    expect(screen.getByTestId('probe').dataset['status']).toBe('idle');
  });
});
