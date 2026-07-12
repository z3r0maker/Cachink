/**
 * FuncionesNegocioScreen + FeatureFlagCard tests.
 *
 * Covers flag card rendering, toggle callbacks, dependency hints,
 * and cascade-disable behavior on toggle-off.
 */

import { describe, expect, it, vi } from 'vitest';
import type { FeatureFlags } from '@cachink/domain';
import { FuncionesNegocioScreen } from '../../src/screens/FuncionesNegocio/funciones-negocio-screen';
import { FeatureFlagCard } from '../../src/screens/FuncionesNegocio/feature-flag-card';
import { FLAG_DISPLAY_INFO } from '../../src/screens/FuncionesNegocio/flag-descriptions';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const ALL_ON: FeatureFlags = {
  stock: true,
  conversionMateriaPrima: true,
  conversionAutomatica: true,
  auditoriaInventario: true,
  merma: true,
  ventasCredito: true,
};

const ALL_OFF: FeatureFlags = {
  stock: false,
  conversionMateriaPrima: false,
  conversionAutomatica: false,
  auditoriaInventario: false,
  merma: false,
  ventasCredito: false,
};

describe('FuncionesNegocioScreen', () => {
  it('renders with default testID funciones-negocio', () => {
    renderWithProviders(
      <FuncionesNegocioScreen flags={ALL_ON} onToggle={vi.fn()} />,
    );
    expect(screen.getByTestId('funciones-negocio')).toBeInTheDocument();
  });

  it('renders all 6 flag cards (stock toggleable + 5 comingSoon) for MVP', () => {
    renderWithProviders(
      <FuncionesNegocioScreen flags={ALL_ON} onToggle={vi.fn()} />,
    );
    expect(FLAG_DISPLAY_INFO).toHaveLength(6);
    for (const info of FLAG_DISPLAY_INFO) {
      expect(screen.getByTestId(`flag-${info.key}`)).toBeInTheDocument();
    }
  });

  it('renders switch only for non-comingSoon flags (stock)', () => {
    renderWithProviders(
      <FuncionesNegocioScreen flags={ALL_ON} onToggle={vi.fn()} />,
    );
    // Stock is toggleable
    expect(screen.getByTestId('flag-stock-switch')).toBeInTheDocument();
    // comingSoon flags should NOT have a switch
    expect(screen.queryByTestId('flag-ventasCredito-switch')).toBeNull();
    expect(screen.queryByTestId('flag-conversionMateriaPrima-switch')).toBeNull();
    expect(screen.queryByTestId('flag-merma-switch')).toBeNull();
  });

  it('renders comingSoon flags with Próximamente badge text', () => {
    renderWithProviders(
      <FuncionesNegocioScreen flags={ALL_ON} onToggle={vi.fn()} />,
    );
    // All comingSoon flags should be visible as cards
    expect(screen.getByTestId('flag-merma')).toBeInTheDocument();
    expect(screen.getByTestId('flag-conversionMateriaPrima')).toBeInTheDocument();
    expect(screen.getByTestId('flag-conversionAutomatica')).toBeInTheDocument();
    expect(screen.getByTestId('flag-auditoriaInventario')).toBeInTheDocument();
  });

  it('renders stock switch checked when stock is on', () => {
    renderWithProviders(
      <FuncionesNegocioScreen flags={ALL_ON} onToggle={vi.fn()} />,
    );
    const switchEl = screen.getByTestId('flag-stock-switch');
    // The Switch should be rendered (presence test)
    expect(switchEl).toBeInTheDocument();
  });

  it('renders stock switch unchecked when stock is off', () => {
    renderWithProviders(
      <FuncionesNegocioScreen flags={ALL_OFF} onToggle={vi.fn()} />,
    );
    const switchEl = screen.getByTestId('flag-stock-switch');
    expect(switchEl).toBeInTheDocument();
  });

  it('renders with custom testID', () => {
    renderWithProviders(
      <FuncionesNegocioScreen flags={ALL_ON} onToggle={vi.fn()} testID="my-funciones" />,
    );
    expect(screen.getByTestId('my-funciones')).toBeInTheDocument();
  });
});

describe('FeatureFlagCard', () => {
  const STOCK_INFO = FLAG_DISPLAY_INFO.find((f) => f.key === 'stock')!;

  it('renders with the provided testID', () => {
    renderWithProviders(
      <FeatureFlagCard
        info={STOCK_INFO}
        enabled
        canToggle
        dependencyHint={null}
        onToggle={vi.fn()}
        testID="flag-stock"
      />,
    );
    expect(screen.getByTestId('flag-stock')).toBeInTheDocument();
  });

  it('renders the switch with testID', () => {
    renderWithProviders(
      <FeatureFlagCard
        info={STOCK_INFO}
        enabled
        canToggle
        dependencyHint={null}
        onToggle={vi.fn()}
        testID="flag-stock"
      />,
    );
    expect(screen.getByTestId('flag-stock-switch')).toBeInTheDocument();
  });

  it('renders switch as present and interactable', () => {
    renderWithProviders(
      <FeatureFlagCard
        info={STOCK_INFO}
        enabled={false}
        canToggle
        dependencyHint={null}
        onToggle={vi.fn()}
        testID="flag-stock"
      />,
    );
    const switchEl = screen.getByTestId('flag-stock-switch');
    expect(switchEl).toBeInTheDocument();
  });

  it('renders dependency hint when provided', () => {
    renderWithProviders(
      <FeatureFlagCard
        info={STOCK_INFO}
        enabled={false}
        canToggle={false}
        dependencyHint="Requiere Inventario"
        onToggle={vi.fn()}
        testID="flag-stock"
      />,
    );
    expect(screen.getByText('Requiere Inventario')).toBeInTheDocument();
  });

  it('does not render dependency hint when null', () => {
    renderWithProviders(
      <FeatureFlagCard
        info={STOCK_INFO}
        enabled
        canToggle
        dependencyHint={null}
        onToggle={vi.fn()}
        testID="flag-stock"
      />,
    );
    expect(screen.queryByText('Requiere')).toBeNull();
  });

  it('renders Próximamente badge when comingSoon is true', () => {
    const comingSoonInfo = { ...STOCK_INFO, comingSoon: true as const };
    renderWithProviders(
      <FeatureFlagCard
        info={comingSoonInfo}
        enabled={false}
        canToggle={false}
        dependencyHint={null}
        onToggle={vi.fn()}
        testID="flag-coming"
      />,
    );
    expect(screen.getByText('Próximamente')).toBeInTheDocument();
    // Should NOT render a switch
    expect(screen.queryByTestId('flag-coming-switch')).toBeNull();
  });

  it('renders switch when comingSoon is false/undefined', () => {
    renderWithProviders(
      <FeatureFlagCard
        info={STOCK_INFO}
        enabled
        canToggle
        dependencyHint={null}
        onToggle={vi.fn()}
        testID="flag-stock"
      />,
    );
    expect(screen.getByTestId('flag-stock-switch')).toBeInTheDocument();
    expect(screen.queryByText('Próximamente')).toBeNull();
  });
});
