/**
 * ConsentModal tests (ADR-027, S4-C15).
 */

import { describe, expect, it, vi } from 'vitest';
import { ConsentModal } from '../../src/screens/ConsentModal/consent-modal';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

describe('ConsentModal', () => {
  it('renders when open', () => {
    renderWithProviders(<ConsentModal open={true} onChange={vi.fn()} />);
    expect(screen.getByTestId('consent-modal-yes')).toBeInTheDocument();
    expect(screen.getByTestId('consent-modal-no')).toBeInTheDocument();
    expect(screen.getByTestId('consent-modal-later')).toBeInTheDocument();
  });

  it('fires onChange(true) when Sí is tapped', () => {
    const onChange = vi.fn();
    renderWithProviders(<ConsentModal open={true} onChange={onChange} />);
    fireEvent.click(screen.getAllByTestId('consent-modal-yes')[0]!);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('fires onChange(false) when No gracias is tapped', () => {
    const onChange = vi.fn();
    renderWithProviders(<ConsentModal open={true} onChange={onChange} />);
    fireEvent.click(screen.getAllByTestId('consent-modal-no')[0]!);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('fires onChange(null) when Decidir después is tapped', () => {
    const onChange = vi.fn();
    renderWithProviders(<ConsentModal open={true} onChange={onChange} />);
    fireEvent.click(screen.getAllByTestId('consent-modal-later')[0]!);
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
