/**
 * Unit tests for AppConfigProvider + the Zustand store (P1C Commit 3).
 *
 * The provider's job is narrowly scoped: read 3 keys from the AppConfig
 * repository, generate a deviceId if missing, narrow the mode value, and
 * flip `hydrated = true`. Tests cover:
 *   - fresh install path: deviceId is generated + persisted.
 *   - returning-user path: existing deviceId loaded from repo, not
 *     regenerated; mode + currentBusinessId hydrate intact.
 *   - rogue mode value: gets narrowed to null (wizard re-runs).
 *   - children only mount after hydration completes.
 *   - store selectors expose the hydrated values.
 */

import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import type { ReactElement } from 'react';
import { InMemoryAppConfigRepository } from '@cachink/testing';
import type { BusinessId, DeviceId } from '@cachink/domain';
import {
  APP_CONFIG_KEYS,
  AppConfigProvider,
  parseMode,
  useAppConfigStore,
  useCurrentBusinessId,
  useDeviceId,
  useMode,
  useAppConfigHydrated,
} from '../../src/app-config/index';
import { renderWithProviders, screen, waitFor } from '../test-utils';

function Probe(): ReactElement {
  const deviceId = useDeviceId();
  const mode = useMode();
  const businessId = useCurrentBusinessId();
  const hydrated = useAppConfigHydrated();
  return (
    <div>
      <span data-testid="deviceId">{deviceId ?? 'none'}</span>
      <span data-testid="mode">{mode ?? 'none'}</span>
      <span data-testid="businessId">{businessId ?? 'none'}</span>
      <span data-testid="hydrated">{hydrated ? 'yes' : 'no'}</span>
    </div>
  );
}

function resetStore(): void {
  act(() => {
    useAppConfigStore.getState().reset();
  });
}

describe('parseMode', () => {
  it('returns null for unknown strings', () => {
    expect(parseMode('something-else')).toBeNull();
    expect(parseMode('')).toBeNull();
    expect(parseMode(null)).toBeNull();
  });

  it('accepts all four documented mode names (ADR-039)', () => {
    expect(parseMode('local')).toBe('local');
    expect(parseMode('cloud')).toBe('cloud');
    expect(parseMode('lan-server')).toBe('lan-server');
    expect(parseMode('lan-client')).toBe('lan-client');
  });

  it('migrates legacy local-standalone and tablet-only values to "local"', () => {
    expect(parseMode('local-standalone')).toBe('local');
    expect(parseMode('tablet-only')).toBe('local');
  });

  it('returns the legacy-lan sentinel for the pre-ADR-039 "lan" value', () => {
    expect(parseMode('lan')).toBe('legacy-lan');
  });
});

describe('AppConfigProvider — fresh install', () => {
  it('generates a deviceId, persists it, and hydrates children', async () => {
    resetStore();
    const repo = new InMemoryAppConfigRepository();
    const fakeDeviceId = '01JPHK00000000000000000002' as DeviceId;

    renderWithProviders(
      <AppConfigProvider appConfig={repo} generateDeviceId={() => fakeDeviceId}>
        <Probe />
      </AppConfigProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('hydrated').textContent).toBe('yes'));
    expect(screen.getByTestId('deviceId').textContent).toBe(fakeDeviceId);
    expect(screen.getByTestId('mode').textContent).toBe('none');
    expect(screen.getByTestId('businessId').textContent).toBe('none');

    // Side-effect check: the generated deviceId was persisted.
    expect(await repo.get(APP_CONFIG_KEYS.deviceId)).toBe(fakeDeviceId);
  });
});

describe('AppConfigProvider — returning user', () => {
  it('reuses the persisted deviceId and does not regenerate it', async () => {
    resetStore();
    const repo = new InMemoryAppConfigRepository();
    const storedDeviceId = '01JPHK00000000000000000003' as DeviceId;
    const storedBusinessId = '01JPHK00000000000000000004' as BusinessId;
    await repo.set(APP_CONFIG_KEYS.deviceId, storedDeviceId);
    await repo.set(APP_CONFIG_KEYS.mode, 'local');
    await repo.set(APP_CONFIG_KEYS.currentBusinessId, storedBusinessId);
    const generateDeviceId = vi.fn(() => 'should-not-be-called' as unknown as DeviceId);

    renderWithProviders(
      <AppConfigProvider appConfig={repo} generateDeviceId={generateDeviceId}>
        <Probe />
      </AppConfigProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('hydrated').textContent).toBe('yes'));
    expect(screen.getByTestId('deviceId').textContent).toBe(storedDeviceId);
    expect(screen.getByTestId('mode').textContent).toBe('local');
    expect(screen.getByTestId('businessId').textContent).toBe(storedBusinessId);
    expect(generateDeviceId).not.toHaveBeenCalled();
  });

  it('migrates legacy "tablet-only" to "local" and rewrites the stored value (ADR-039)', async () => {
    resetStore();
    const repo = new InMemoryAppConfigRepository();
    await repo.set(APP_CONFIG_KEYS.deviceId, '01JPHK00000000000000000010');
    await repo.set(APP_CONFIG_KEYS.mode, 'tablet-only');

    renderWithProviders(
      <AppConfigProvider appConfig={repo}>
        <Probe />
      </AppConfigProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mode').textContent).toBe('local'));
    expect(await repo.get(APP_CONFIG_KEYS.mode)).toBe('local');
  });

  it('migrates legacy "lan" via resolveLegacyLan callback (ADR-039)', async () => {
    resetStore();
    const repo = new InMemoryAppConfigRepository();
    await repo.set(APP_CONFIG_KEYS.deviceId, '01JPHK00000000000000000011');
    await repo.set(APP_CONFIG_KEYS.mode, 'lan');
    const resolver = vi.fn(async (): Promise<'lan-server' | 'lan-client'> => 'lan-server');

    renderWithProviders(
      <AppConfigProvider appConfig={repo} resolveLegacyLan={resolver}>
        <Probe />
      </AppConfigProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mode').textContent).toBe('lan-server'));
    expect(resolver).toHaveBeenCalled();
    expect(await repo.get(APP_CONFIG_KEYS.mode)).toBe('lan-server');
  });

  it('defaults legacy "lan" to "lan-client" when no resolver is provided', async () => {
    resetStore();
    const repo = new InMemoryAppConfigRepository();
    await repo.set(APP_CONFIG_KEYS.deviceId, '01JPHK00000000000000000012');
    await repo.set(APP_CONFIG_KEYS.mode, 'lan');

    renderWithProviders(
      <AppConfigProvider appConfig={repo}>
        <Probe />
      </AppConfigProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mode').textContent).toBe('lan-client'));
  });

  it('narrows a rogue mode value to null so the wizard re-runs', async () => {
    resetStore();
    const repo = new InMemoryAppConfigRepository();
    await repo.set(APP_CONFIG_KEYS.deviceId, '01JPHK00000000000000000005');
    await repo.set(APP_CONFIG_KEYS.mode, 'mainframe-over-fax');

    renderWithProviders(
      <AppConfigProvider appConfig={repo}>
        <Probe />
      </AppConfigProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('hydrated').textContent).toBe('yes'));
    expect(screen.getByTestId('mode').textContent).toBe('none');
  });
});

describe('AppConfigProvider — rendering gate', () => {
  it('renders children only after hydration finishes', async () => {
    resetStore();
    const repo = new InMemoryAppConfigRepository();
    await repo.set(APP_CONFIG_KEYS.deviceId, '01JPHK00000000000000000006');

    renderWithProviders(
      <AppConfigProvider appConfig={repo}>
        <Probe />
      </AppConfigProvider>,
    );

    // Children may not be in DOM immediately — wait for hydration first.
    await waitFor(() => expect(screen.queryByTestId('hydrated')).not.toBeNull());
    expect(screen.getByTestId('hydrated').textContent).toBe('yes');
  });

  it('respects skipHydration — never queries the repo', async () => {
    resetStore();
    const repo = new InMemoryAppConfigRepository();
    const getSpy = vi.spyOn(repo, 'get');

    renderWithProviders(
      <AppConfigProvider appConfig={repo} skipHydration>
        <Probe />
      </AppConfigProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('hydrated').textContent).toBe('yes'));
    expect(getSpy).not.toHaveBeenCalled();
  });
});
