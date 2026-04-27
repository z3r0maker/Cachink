/**
 * IsrDisclaimer tests (Slice 3 C18).
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
});
