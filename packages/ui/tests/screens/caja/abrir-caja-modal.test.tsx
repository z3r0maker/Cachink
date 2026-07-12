/**
 * AbrirCajaModal + AbrirCajaHeader + AbrirCajaFooter tests.
 *
 * Covers numpad entry, quick amounts, header rendering, footer submit gating.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import type { Money } from '@cachink/domain';
import { AbrirCajaModal } from '../../../src/screens/Caja/abrir-caja-modal';
import { AbrirCajaHeader } from '../../../src/screens/Caja/abrir-caja-header';
import { AbrirCajaFooter } from '../../../src/screens/Caja/abrir-caja-footer';
import { initI18n } from '../../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../../test-utils';

initI18n();

describe('AbrirCajaModal', () => {
  afterEach(() => vi.restoreAllMocks());

  const defaultProps = {
    suggestedAmount: null as Money | null,
    previousCloseAmount: null as Money | null,
    onSubmit: vi.fn(),
    submitting: false,
  };

  function renderModal(overrides: Partial<typeof defaultProps> = {}) {
    return renderWithProviders(
      <AbrirCajaModal {...defaultProps} {...overrides} />,
    );
  }

  it('renders with default testID abrir-caja-modal', () => {
    renderModal();
    expect(screen.getByTestId('abrir-caja-modal')).toBeInTheDocument();
  });

  it('renders the header card', () => {
    renderModal();
    expect(screen.getByTestId('abrir-caja-header')).toBeInTheDocument();
  });

  it('renders the numpad display', () => {
    renderModal();
    expect(screen.getByTestId('abrir-numpad-display')).toBeInTheDocument();
  });

  it('renders quick amount buttons', () => {
    renderModal();
    expect(screen.getByTestId('abrir-quick-amounts')).toBeInTheDocument();
  });

  it('renders the numpad', () => {
    renderModal();
    expect(screen.getByTestId('abrir-numpad')).toBeInTheDocument();
  });

  it('renders the submit footer', () => {
    renderModal();
    expect(screen.getByTestId('caja-abrir-submit')).toBeInTheDocument();
  });

  it('fires onSubmit with entered amount when numpad digits are typed', () => {
    const onSubmit = vi.fn();
    renderModal({ onSubmit });
    // Type "500" on the numpad
    fireEvent.click(screen.getByTestId('numpad-5'));
    fireEvent.click(screen.getByTestId('numpad-0'));
    fireEvent.click(screen.getByTestId('numpad-0'));
    // Submit
    fireEvent.click(screen.getByTestId('caja-abrir-submit'));
    expect(onSubmit).toHaveBeenCalledWith(50000n, 0n);
  });

  it('renders with custom testID', () => {
    renderWithProviders(
      <AbrirCajaModal {...defaultProps} testID="my-modal" />,
    );
    expect(screen.getByTestId('my-modal')).toBeInTheDocument();
  });
});

describe('AbrirCajaHeader', () => {
  it('renders with testID abrir-caja-header', () => {
    // AbrirCajaHeader only needs a t() function
    renderWithProviders(<AbrirCajaHeader t={((k: string) => k) as any} />);
    expect(screen.getByTestId('abrir-caja-header')).toBeInTheDocument();
  });
});

describe('AbrirCajaFooter', () => {
  it('renders the submit button', () => {
    renderWithProviders(
      <AbrirCajaFooter
        buttonLabel="Abrir turno"
        canSubmit
        submitting={false}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('caja-abrir-submit')).toBeInTheDocument();
    expect(screen.getByText('Abrir turno')).toBeInTheDocument();
  });

  it('disables button when canSubmit is false', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <AbrirCajaFooter
        buttonLabel="Abrir turno"
        canSubmit={false}
        submitting={false}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByTestId('caja-abrir-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('fires onSubmit when clicked and canSubmit is true', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <AbrirCajaFooter
        buttonLabel="Abrir turno"
        canSubmit
        submitting={false}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByTestId('caja-abrir-submit'));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('renders custom testID', () => {
    renderWithProviders(
      <AbrirCajaFooter
        buttonLabel="Submit"
        canSubmit
        submitting={false}
        onSubmit={vi.fn()}
        testID="my-footer"
      />,
    );
    expect(screen.getByTestId('my-footer')).toBeInTheDocument();
  });
});
