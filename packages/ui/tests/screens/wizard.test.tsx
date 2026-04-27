/**
 * Wizard component tests — four-screen state machine (ADR-039).
 *
 * Step 1 asks "¿Cómo lo vas a usar?" with two primary cards (Solo,
 * Multi) plus two secondary links (Join existing, Help).
 *
 * Step 2A (Solo) offers Local + Cloud-as-backup.
 * Step 2B (Multi) offers lan-server + Cloud (lan-server disabled on mobile).
 * Step 3 (Join existing) offers lan-client + Cloud sign-in.
 *
 * Help modal pre-selects a Step-1 card on close. Migration-deferred
 * screen explains the Phase 2 deferral.
 */

import type { ReactElement, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing';
import { Wizard, useWizardStore } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

function withProviders(node: ReactElement): ReactNode {
  // Repos + a fresh QueryClient so DataPreservedCallout's data-counts
  // hook can mount inside the wizard. Returns a fragment so call-sites
  // stay tidy in `renderWithProviders(...)`.
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return (
    <QueryClientProvider client={qc}>
      <MockRepositoryProvider>{node}</MockRepositoryProvider>
    </QueryClientProvider>
  );
}

afterEach(() => {
  // Reset the wizard store so each test starts at step1 with no preselection.
  useWizardStore.getState().reset();
});

function tapCard(testId: string): void {
  const card = screen.getAllByTestId(`${testId}-card`)[0]!;
  fireEvent.click(card);
}

describe('Wizard — Step 1 (welcome)', () => {
  it('renders solo + multi cards plus the two secondary links on desktop', () => {
    renderWithProviders(withProviders(<Wizard onSelectMode={vi.fn()} platform="desktop" />));
    expect(screen.getByTestId('wizard-step1-solo')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step1-multi')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step1-join-existing-link')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step1-help-link')).toBeInTheDocument();
  });

  it('renders solo + multi cards on mobile too', () => {
    renderWithProviders(withProviders(<Wizard onSelectMode={vi.fn()} platform="mobile" />));
    expect(screen.getByTestId('wizard-step1-solo')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step1-multi')).toBeInTheDocument();
  });

  it('advances to step2a when "Solo en este dispositivo" is tapped', () => {
    renderWithProviders(withProviders(<Wizard onSelectMode={vi.fn()} platform="desktop" />));
    tapCard('wizard-step1-solo');
    expect(screen.getByTestId('wizard-step2a-local')).toBeInTheDocument();
  });

  it('advances to step2b when "En varios dispositivos" is tapped', () => {
    renderWithProviders(withProviders(<Wizard onSelectMode={vi.fn()} platform="desktop" />));
    tapCard('wizard-step1-multi');
    expect(screen.getByTestId('wizard-step2b-server')).toBeInTheDocument();
  });

  it('advances to step3 when the "Ya tengo Cachink" link is tapped', () => {
    renderWithProviders(withProviders(<Wizard onSelectMode={vi.fn()} platform="desktop" />));
    fireEvent.click(screen.getByTestId('wizard-step1-join-existing-link'));
    expect(screen.getByTestId('wizard-step3-lan')).toBeInTheDocument();
  });
});

describe('Wizard — Step 2A (solo)', () => {
  it('"Guardar todo en este dispositivo" fires onSelectMode("local")', () => {
    const onSelectMode = vi.fn();
    renderWithProviders(withProviders(<Wizard onSelectMode={onSelectMode} platform="desktop" />));
    tapCard('wizard-step1-solo');
    tapCard('wizard-step2a-local');
    expect(onSelectMode).toHaveBeenCalledWith('local');
  });

  it('"Guardar todo en la nube" fires onSelectMode("cloud") via the handoff', () => {
    const onSelectMode = vi.fn();
    renderWithProviders(withProviders(<Wizard onSelectMode={onSelectMode} platform="desktop" />));
    tapCard('wizard-step1-solo');
    tapCard('wizard-step2a-cloud');
    expect(onSelectMode).toHaveBeenCalledWith('cloud');
  });

  it('Back link returns to Step 1', () => {
    renderWithProviders(withProviders(<Wizard onSelectMode={vi.fn()} platform="desktop" />));
    tapCard('wizard-step1-solo');
    fireEvent.click(screen.getByTestId('wizard-back'));
    expect(screen.getByTestId('wizard-step1-solo')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-step2a-local')).toBeNull();
  });
});

describe('Wizard — Step 2B (multi)', () => {
  it('desktop: server card fires onSelectMode("lan-server")', () => {
    const onSelectMode = vi.fn();
    renderWithProviders(withProviders(<Wizard onSelectMode={onSelectMode} platform="desktop" />));
    tapCard('wizard-step1-multi');
    tapCard('wizard-step2b-server');
    expect(onSelectMode).toHaveBeenCalledWith('lan-server');
  });

  it('desktop: cloud card fires onSelectMode("cloud") via handoff', () => {
    const onSelectMode = vi.fn();
    renderWithProviders(withProviders(<Wizard onSelectMode={onSelectMode} platform="desktop" />));
    tapCard('wizard-step1-multi');
    tapCard('wizard-step2b-cloud');
    expect(onSelectMode).toHaveBeenCalledWith('cloud');
  });

  it('desktop: importLink advances to migration-deferred screen', () => {
    renderWithProviders(withProviders(<Wizard onSelectMode={vi.fn()} platform="desktop" />));
    tapCard('wizard-step1-multi');
    fireEvent.click(screen.getByTestId('wizard-step2b-import-link'));
    expect(screen.getByTestId('wizard-migration-deferred-screen')).toBeInTheDocument();
  });

  it('mobile: server card is disabled with the explanation visible', () => {
    renderWithProviders(withProviders(<Wizard onSelectMode={vi.fn()} platform="mobile" />));
    tapCard('wizard-step1-multi');
    expect(screen.getByTestId('wizard-step2b-server-note')).toBeInTheDocument();
  });

  it('mobile: server card does NOT fire onSelectMode when tapped', () => {
    const onSelectMode = vi.fn();
    renderWithProviders(withProviders(<Wizard onSelectMode={onSelectMode} platform="mobile" />));
    tapCard('wizard-step1-multi');
    tapCard('wizard-step2b-server');
    expect(onSelectMode).not.toHaveBeenCalledWith('lan-server');
  });

  it('mobile: importLink is hidden', () => {
    renderWithProviders(withProviders(<Wizard onSelectMode={vi.fn()} platform="mobile" />));
    tapCard('wizard-step1-multi');
    expect(screen.queryByTestId('wizard-step2b-import-link')).toBeNull();
  });
});

describe('Wizard — Step 3 (join existing)', () => {
  it('LAN card fires onSelectMode("lan-client")', () => {
    const onSelectMode = vi.fn();
    renderWithProviders(withProviders(<Wizard onSelectMode={onSelectMode} platform="desktop" />));
    fireEvent.click(screen.getByTestId('wizard-step1-join-existing-link'));
    tapCard('wizard-step3-lan');
    expect(onSelectMode).toHaveBeenCalledWith('lan-client');
  });

  it('Cloud sign-in card fires onSelectMode("cloud") via handoff', () => {
    const onSelectMode = vi.fn();
    renderWithProviders(withProviders(<Wizard onSelectMode={onSelectMode} platform="desktop" />));
    fireEvent.click(screen.getByTestId('wizard-step1-join-existing-link'));
    tapCard('wizard-step3-cloud');
    expect(onSelectMode).toHaveBeenCalledWith('cloud');
  });

  it('back returns to Step 1', () => {
    renderWithProviders(withProviders(<Wizard onSelectMode={vi.fn()} platform="desktop" />));
    fireEvent.click(screen.getByTestId('wizard-step1-join-existing-link'));
    fireEvent.click(screen.getByTestId('wizard-back'));
    expect(screen.getByTestId('wizard-step1-solo')).toBeInTheDocument();
  });
});

describe('Wizard — Help modal', () => {
  it('opens when the help link is tapped', () => {
    renderWithProviders(withProviders(<Wizard onSelectMode={vi.fn()} platform="desktop" />));
    fireEvent.click(screen.getByTestId('wizard-step1-help-link'));
    expect(screen.getByTestId('wizard-help-solo-local')).toBeInTheDocument();
  });

  it('picking solo-local pre-selects the solo card and advances to step2a', () => {
    renderWithProviders(withProviders(<Wizard onSelectMode={vi.fn()} platform="desktop" />));
    fireEvent.click(screen.getByTestId('wizard-step1-help-link'));
    fireEvent.click(screen.getByTestId('wizard-help-solo-local-cta'));
    expect(screen.getByTestId('wizard-step2a-local')).toBeInTheDocument();
  });

  it('picking multi-device advances to step2b', () => {
    renderWithProviders(withProviders(<Wizard onSelectMode={vi.fn()} platform="desktop" />));
    fireEvent.click(screen.getByTestId('wizard-step1-help-link'));
    fireEvent.click(screen.getByTestId('wizard-help-multi-device-cta'));
    expect(screen.getByTestId('wizard-step2b-server')).toBeInTheDocument();
  });

  it('picking solo-cloud advances to step2a (where the cloud card is visible)', () => {
    renderWithProviders(withProviders(<Wizard onSelectMode={vi.fn()} platform="desktop" />));
    fireEvent.click(screen.getByTestId('wizard-step1-help-link'));
    fireEvent.click(screen.getByTestId('wizard-help-solo-cloud-cta'));
    expect(screen.getByTestId('wizard-step2a-cloud')).toBeInTheDocument();
  });
});

describe('Wizard — Migration-deferred screen', () => {
  it('Back returns to step2b', () => {
    renderWithProviders(withProviders(<Wizard onSelectMode={vi.fn()} platform="desktop" />));
    tapCard('wizard-step1-multi');
    fireEvent.click(screen.getByTestId('wizard-step2b-import-link'));
    fireEvent.click(screen.getByTestId('wizard-migration-deferred-back'));
    expect(screen.getByTestId('wizard-step2b-server')).toBeInTheDocument();
  });
});
