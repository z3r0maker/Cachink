/**
 * CountResultStep tests — Step 2 of blind-close flow.
 *
 * Covers comparison card rendering, discrepancy reason selector,
 * close button gating, and callback wiring.
 */

import { describe, expect, it, vi } from 'vitest';
import { CountResultStep } from '../../../src/screens/Caja/count-result-step';
import { initI18n } from '../../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../../test-utils';

initI18n();

describe('CountResultStep', () => {
  it('renders with default testID count-result-step', () => {
    renderWithProviders(
      <CountResultStep
        conteoCentavos={50000n}
        esperadoCentavos={50000n}
        onClose={vi.fn()}
        submitting={false}
      />,
    );
    expect(screen.getByTestId('count-result-step')).toBeInTheDocument();
  });

  it('renders the comparison card', () => {
    renderWithProviders(
      <CountResultStep
        conteoCentavos={50000n}
        esperadoCentavos={50000n}
        onClose={vi.fn()}
        submitting={false}
      />,
    );
    expect(screen.getByTestId('comparison-card')).toBeInTheDocument();
  });

  it('renders close button', () => {
    renderWithProviders(
      <CountResultStep
        conteoCentavos={50000n}
        esperadoCentavos={50000n}
        onClose={vi.fn()}
        submitting={false}
      />,
    );
    expect(screen.getByTestId('count-result-close')).toBeInTheDocument();
  });

  it('fires onClose with null reason when amounts match', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <CountResultStep
        conteoCentavos={50000n}
        esperadoCentavos={50000n}
        onClose={onClose}
        submitting={false}
      />,
    );
    fireEvent.click(screen.getByTestId('count-result-close'));
    expect(onClose).toHaveBeenCalledWith(null, null);
  });

  it('shows reason selector when amounts differ', () => {
    renderWithProviders(
      <CountResultStep
        conteoCentavos={40000n}
        esperadoCentavos={50000n}
        onClose={vi.fn()}
        submitting={false}
      />,
    );
    expect(screen.getByTestId('count-result-reason')).toBeInTheDocument();
    expect(screen.getByTestId('count-result-explicacion')).toBeInTheDocument();
  });

  it('does not show reason selector when amounts match', () => {
    renderWithProviders(
      <CountResultStep
        conteoCentavos={50000n}
        esperadoCentavos={50000n}
        onClose={vi.fn()}
        submitting={false}
      />,
    );
    expect(screen.queryByTestId('count-result-reason')).toBeNull();
  });

  it('displays formatted amounts in the comparison card', () => {
    renderWithProviders(
      <CountResultStep
        conteoCentavos={45000n}
        esperadoCentavos={50000n}
        onClose={vi.fn()}
        submitting={false}
      />,
    );
    expect(screen.getByText('$450.00')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
  });

  it('renders with custom testID', () => {
    renderWithProviders(
      <CountResultStep
        conteoCentavos={50000n}
        esperadoCentavos={50000n}
        onClose={vi.fn()}
        submitting={false}
        testID="my-result"
      />,
    );
    expect(screen.getByTestId('my-result')).toBeInTheDocument();
  });
});
