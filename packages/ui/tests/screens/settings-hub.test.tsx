/**
 * SettingsHub tests — device-only settings navigation (ADR-053 §3).
 *
 * Business profile, ISR, tipos de pago and indicadores are tenant data
 * managed in the portal, so the hub lists only the device section.
 */

import { describe, expect, it, vi } from 'vitest';
import type { Business } from '@xangarro/domain';
import { SettingsHub } from '../../src/screens/Settings/settings-hub';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const BUSINESS = { nombre: 'Mi Tienda' } as unknown as Business;

describe('SettingsHub', () => {
  it('renders with default testID settings-hub-screen', () => {
    renderWithProviders(<SettingsHub business={BUSINESS} onNavigate={vi.fn()} />);
    expect(screen.getByTestId('settings-hub-screen')).toBeInTheDocument();
  });

  it('renders only the device-scoped sistema card', () => {
    renderWithProviders(<SettingsHub business={BUSINESS} onNavigate={vi.fn()} />);
    expect(screen.getByTestId('settings-hub-sistema')).toBeInTheDocument();
    for (const moved of ['negocio', 'tasas-isr', 'tipos-de-pago', 'indicadores']) {
      expect(screen.queryByTestId(`settings-hub-${moved}`)).toBeNull();
    }
  });

  it('calls onNavigate with sistema when sistema card is tapped', () => {
    const onNavigate = vi.fn();
    renderWithProviders(<SettingsHub business={BUSINESS} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByTestId('settings-hub-sistema'));
    expect(onNavigate).toHaveBeenCalledWith('sistema');
  });

  it('handles null business', () => {
    renderWithProviders(<SettingsHub business={null} onNavigate={vi.fn()} />);
    expect(screen.getByTestId('settings-hub-screen')).toBeInTheDocument();
  });

  it('renders with custom testID', () => {
    renderWithProviders(<SettingsHub business={BUSINESS} onNavigate={vi.fn()} testID="my-hub" />);
    expect(screen.getByTestId('my-hub')).toBeInTheDocument();
  });
});
