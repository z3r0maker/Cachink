/**
 * OtrosScreen + OtrosCard tests — feature-flag-driven grid coverage.
 *
 * Covers role-based item filtering, feature-flag gating, card rendering,
 * navigation callback wiring.
 */

import { describe, expect, it, vi } from 'vitest';
import type { FeatureFlags } from '@cachink/domain';
import { OtrosScreen } from '../../src/screens/Otros/otros-screen';
import { OtrosCard } from '../../src/screens/Otros/otros-card';
import {
  operativoOtrosItems,
} from '../../src/screens/Otros/otros-items';
import { directorOtrosItems } from '../../src/screens/Otros/otros-items-director';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const ALL_FLAGS: FeatureFlags = {
  stock: true,
  conversionMateriaPrima: true,
  conversionAutomatica: true,
  auditoriaInventario: true,
  merma: true,
  ventasCredito: true,
};

const NO_FLAGS: FeatureFlags = {
  stock: false,
  conversionMateriaPrima: false,
  conversionAutomatica: false,
  auditoriaInventario: false,
  merma: false,
  ventasCredito: false,
};

describe('operativoOtrosItems', () => {
  it('always includes caja, caja-movimientos, and cancelaciones', () => {
    const items = operativoOtrosItems(NO_FLAGS);
    const keys = items.map((i) => i.key);
    expect(keys).toContain('caja');
    expect(keys).toContain('caja-movimientos');
    expect(keys).toContain('cancelaciones');
  });

  it('excludes ventas-credito even when ventasCredito flag is on (hidden for MVP)', () => {
    const items = operativoOtrosItems({ ...NO_FLAGS, ventasCredito: true });
    expect(items.map((i) => i.key)).not.toContain('ventas-credito');
  });

  it('does not include hidden MVP items (conversion, auditoria, productos, ventas-credito)', () => {
    const items = operativoOtrosItems(ALL_FLAGS);
    const keys = items.map((i) => i.key);
    expect(keys).not.toContain('conversion');
    expect(keys).not.toContain('auditoria');
    expect(keys).not.toContain('productos');
    expect(keys).not.toContain('ventas-credito');
  });
});

describe('directorOtrosItems', () => {
  it('does not include empleados (hidden for MVP)', () => {
    const items = directorOtrosItems(ALL_FLAGS);
    expect(items.map((i) => i.key)).not.toContain('empleados');
  });

  it('does not include ventas-credito (hidden for MVP)', () => {
    const items = directorOtrosItems({ ...NO_FLAGS, ventasCredito: true });
    expect(items.map((i) => i.key)).not.toContain('ventas-credito');
  });

  it('always includes productos, gastos, funciones, usuarios', () => {
    const items = directorOtrosItems(NO_FLAGS);
    const keys = items.map((i) => i.key);
    expect(keys).toContain('productos');
    expect(keys).toContain('gastos');
    expect(keys).toContain('funciones');
    expect(keys).toContain('usuarios');
  });
});

describe('OtrosScreen', () => {
  it('renders with default testID otros-screen', () => {
    renderWithProviders(
      <OtrosScreen role="operativo" flags={NO_FLAGS} onNavigate={vi.fn()} />,
    );
    expect(screen.getByTestId('otros-screen')).toBeInTheDocument();
  });

  it('renders always-on cards for operativo', () => {
    renderWithProviders(
      <OtrosScreen role="operativo" flags={NO_FLAGS} onNavigate={vi.fn()} />,
    );
    expect(screen.getByTestId('otros-caja')).toBeInTheDocument();
    expect(screen.getByTestId('otros-cancelaciones')).toBeInTheDocument();
  });

  it('calls onNavigate with item path when card is pressed', () => {
    const onNavigate = vi.fn();
    renderWithProviders(
      <OtrosScreen role="operativo" flags={NO_FLAGS} onNavigate={onNavigate} />,
    );
    fireEvent.click(screen.getByTestId('otros-caja'));
    expect(onNavigate).toHaveBeenCalledWith('/caja');
  });

  it('renders with custom testID', () => {
    renderWithProviders(
      <OtrosScreen role="operativo" flags={NO_FLAGS} onNavigate={vi.fn()} testID="my-otros" />,
    );
    expect(screen.getByTestId('my-otros')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    renderWithProviders(
      <OtrosScreen
        role="operativo"
        flags={NO_FLAGS}
        onNavigate={vi.fn()}
        footer={<span data-testid="dev-footer">dev</span>}
      />,
    );
    expect(screen.getByTestId('dev-footer')).toBeInTheDocument();
  });
});

describe('OtrosCard', () => {
  it('renders with testID', () => {
    const item = operativoOtrosItems(NO_FLAGS)[0]!;
    renderWithProviders(
      <OtrosCard item={item} onPress={vi.fn()} testID="my-card" />,
    );
    expect(screen.getByTestId('my-card')).toBeInTheDocument();
  });

  it('calls onPress when tapped', () => {
    const onPress = vi.fn();
    const item = operativoOtrosItems(NO_FLAGS)[0]!;
    renderWithProviders(
      <OtrosCard item={item} onPress={onPress} testID="test-card" />,
    );
    fireEvent.click(screen.getByTestId('test-card'));
    expect(onPress).toHaveBeenCalled();
  });
});
