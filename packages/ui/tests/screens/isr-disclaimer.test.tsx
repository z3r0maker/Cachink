/**
 * IsrDisclaimer tests (Slice 3 C18 + UX audit Issues 2, 9).
 */

import { describe, expect, it, vi } from 'vitest';
import { IsrDisclaimer } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

describe('IsrDisclaimer', () => {
  it('renders the title and body copy', () => {
    renderWithProviders(<IsrDisclaimer />);
    expect(screen.getByTestId('isr-disclaimer')).toBeInTheDocument();
    expect(screen.getByText('ISR referencial')).toBeInTheDocument();
    expect(
      screen.getByText('La cifra de ISR es orientativa. Consulta a tu contador antes de declarar.'),
    ).toBeInTheDocument();
  });

  it('invokes onOpenSettings when the ajustes Btn is tapped', () => {
    const onOpenSettings = vi.fn();
    renderWithProviders(<IsrDisclaimer onOpenSettings={onOpenSettings} />);
    fireEvent.click(screen.getAllByTestId('isr-disclaimer-settings')[0]!);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('shows the rate in the title when isrRate is provided', () => {
    renderWithProviders(<IsrDisclaimer isrRate={0.30} />);
    expect(screen.getByText('ISR referencial (30%)')).toBeInTheDocument();
  });

  it('shows zero-explanation when ISR is zero due to loss', () => {
    renderWithProviders(<IsrDisclaimer isrRate={0.30} isrIsZeroDueToLoss />);
    expect(
      screen.getByText(
        'Tu tasa de ISR es del 30%, pero como la utilidad operativa es negativa, no se calcula ISR. Consulta a tu contador.',
      ),
    ).toBeInTheDocument();
  });

  it('shows default body when isrIsZeroDueToLoss is false', () => {
    renderWithProviders(<IsrDisclaimer isrRate={0.30} isrIsZeroDueToLoss={false} />);
    expect(
      screen.getByText('La cifra de ISR es orientativa. Consulta a tu contador antes de declarar.'),
    ).toBeInTheDocument();
  });

  it('shows rate in the settings button label when isrRate is provided', () => {
    const onOpenSettings = vi.fn();
    renderWithProviders(<IsrDisclaimer onOpenSettings={onOpenSettings} isrRate={0.30} />);
    expect(screen.getByText('Ajustar tasa (30%)')).toBeInTheDocument();
  });
});
