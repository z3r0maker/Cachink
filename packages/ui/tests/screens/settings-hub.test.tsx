/**
 * SettingsHub tests — top-level settings navigation.
 *
 * Covers category card rendering, navigation callback wiring, and
 * business name display.
 */

import { describe, expect, it, vi } from 'vitest';
import type { Business } from '@cachink/domain';
import { SettingsHub } from '../../src/screens/Settings/settings-hub';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const BUSINESS = {
  nombre: 'Mi Tienda',
} as unknown as Business;

describe('SettingsHub', () => {
  it('renders with default testID settings-hub-screen', () => {
    renderWithProviders(
      <SettingsHub business={BUSINESS} onNavigate={vi.fn()} />,
    );
    expect(screen.getByTestId('settings-hub-screen')).toBeInTheDocument();
  });

  it('renders all 5 category cards', () => {
    renderWithProviders(
      <SettingsHub business={BUSINESS} onNavigate={vi.fn()} />,
    );
    expect(screen.getByTestId('settings-hub-negocio')).toBeInTheDocument();
    expect(screen.getByTestId('settings-hub-tasas-isr')).toBeInTheDocument();
    expect(screen.getByTestId('settings-hub-tipos-de-pago')).toBeInTheDocument();
    expect(screen.getByTestId('settings-hub-indicadores')).toBeInTheDocument();
    expect(screen.getByTestId('settings-hub-sistema')).toBeInTheDocument();
  });

  it('shows business name as negocio subtitle', () => {
    renderWithProviders(
      <SettingsHub business={BUSINESS} onNavigate={vi.fn()} />,
    );
    expect(screen.getByText('Mi Tienda')).toBeInTheDocument();
  });

  it('calls onNavigate with negocio when negocio card is tapped', () => {
    const onNavigate = vi.fn();
    renderWithProviders(
      <SettingsHub business={BUSINESS} onNavigate={onNavigate} />,
    );
    fireEvent.click(screen.getByTestId('settings-hub-negocio'));
    expect(onNavigate).toHaveBeenCalledWith('negocio');
  });

  it('calls onNavigate with sistema when sistema card is tapped', () => {
    const onNavigate = vi.fn();
    renderWithProviders(
      <SettingsHub business={BUSINESS} onNavigate={onNavigate} />,
    );
    fireEvent.click(screen.getByTestId('settings-hub-sistema'));
    expect(onNavigate).toHaveBeenCalledWith('sistema');
  });

  it('calls onNavigate with tasas-isr', () => {
    const onNavigate = vi.fn();
    renderWithProviders(
      <SettingsHub business={BUSINESS} onNavigate={onNavigate} />,
    );
    fireEvent.click(screen.getByTestId('settings-hub-tasas-isr'));
    expect(onNavigate).toHaveBeenCalledWith('tasas-isr');
  });

  it('calls onNavigate with tipos-de-pago', () => {
    const onNavigate = vi.fn();
    renderWithProviders(
      <SettingsHub business={BUSINESS} onNavigate={onNavigate} />,
    );
    fireEvent.click(screen.getByTestId('settings-hub-tipos-de-pago'));
    expect(onNavigate).toHaveBeenCalledWith('tipos-de-pago');
  });

  it('calls onNavigate with indicadores', () => {
    const onNavigate = vi.fn();
    renderWithProviders(
      <SettingsHub business={BUSINESS} onNavigate={onNavigate} />,
    );
    fireEvent.click(screen.getByTestId('settings-hub-indicadores'));
    expect(onNavigate).toHaveBeenCalledWith('indicadores');
  });

  it('handles null business', () => {
    renderWithProviders(
      <SettingsHub business={null} onNavigate={vi.fn()} />,
    );
    expect(screen.getByTestId('settings-hub-screen')).toBeInTheDocument();
  });

  it('renders with custom testID', () => {
    renderWithProviders(
      <SettingsHub business={BUSINESS} onNavigate={vi.fn()} testID="my-hub" />,
    );
    expect(screen.getByTestId('my-hub')).toBeInTheDocument();
  });
});
