import { describe, expect, it, vi } from 'vitest';
import { HealthIndicator } from '../../src/components/HealthIndicator/index';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen, fireEvent } from '../test-utils';

initI18n();

describe('HealthIndicator', () => {
  it('renders the verdict text', () => {
    renderWithProviders(
      <HealthIndicator tone="healthy" verdict="Tu margen es saludable" />,
    );
    expect(screen.getByText('Tu margen es saludable')).toBeInTheDocument();
  });

  it('renders a green dot for healthy tone', () => {
    renderWithProviders(
      <HealthIndicator tone="healthy" verdict="Saludable" />,
    );
    const dot = screen.getByTestId('health-indicator-dot');
    expect(dot).toBeInTheDocument();
  });

  it('renders correctly for warning tone', () => {
    renderWithProviders(
      <HealthIndicator tone="warning" verdict="Bajo" />,
    );
    expect(screen.getByText('Bajo')).toBeInTheDocument();
    expect(screen.getByTestId('health-indicator-dot')).toBeInTheDocument();
  });

  it('renders correctly for critical tone', () => {
    renderWithProviders(
      <HealthIndicator tone="critical" verdict="Crítico" />,
    );
    expect(screen.getByText('Crítico')).toBeInTheDocument();
    expect(screen.getByTestId('health-indicator-dot')).toBeInTheDocument();
  });

  it('shows threshold label when provided', () => {
    renderWithProviders(
      <HealthIndicator
        tone="healthy"
        verdict="Saludable"
        thresholdLabel="Rango saludable: >20%"
      />,
    );
    expect(screen.getByTestId('health-indicator-threshold')).toBeInTheDocument();
    expect(screen.getByText('Rango saludable: >20%')).toBeInTheDocument();
  });

  it('does not show threshold label when not provided', () => {
    renderWithProviders(
      <HealthIndicator tone="healthy" verdict="Saludable" />,
    );
    expect(screen.queryByTestId('health-indicator-threshold')).toBeNull();
  });

  it('shows "Configurar en Ajustes" link when onOpenSettings is provided', () => {
    const onOpenSettings = vi.fn();
    renderWithProviders(
      <HealthIndicator
        tone="healthy"
        verdict="Saludable"
        thresholdLabel="Rango: >20%"
        onOpenSettings={onOpenSettings}
      />,
    );
    const link = screen.getByTestId('health-indicator-settings-link');
    expect(link).toBeInTheDocument();
    expect(link.textContent).toContain('Configurar en Ajustes');
  });

  it('fires onOpenSettings callback when link is pressed', () => {
    const onOpenSettings = vi.fn();
    renderWithProviders(
      <HealthIndicator
        tone="healthy"
        verdict="Saludable"
        thresholdLabel="Rango: >20%"
        onOpenSettings={onOpenSettings}
      />,
    );
    fireEvent.click(screen.getByTestId('health-indicator-settings-link'));
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it('supports a custom testID', () => {
    renderWithProviders(
      <HealthIndicator tone="healthy" verdict="OK" testID="custom-health" />,
    );
    expect(screen.getByTestId('custom-health')).toBeInTheDocument();
  });
});
