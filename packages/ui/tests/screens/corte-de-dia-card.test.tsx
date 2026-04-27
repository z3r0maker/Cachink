/**
 * CorteDeDiaCard + useCorteGate tests (P1C-M7-T01, Slice 3 C1).
 */

import { describe, expect, it, vi } from 'vitest';
import { CorteDeDiaCard } from '../../src/screens/index';
import { computeCorteGate } from '../../src/hooks/use-corte-gate';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

describe('computeCorteGate', () => {
  it('hides the card before the default threshold (18:00)', () => {
    const noon = new Date('2026-04-24T17:30:00');
    expect(computeCorteGate({ now: () => noon })).toEqual({ shouldShow: false });
  });

  it('shows the card at exactly the threshold', () => {
    const six = new Date('2026-04-24T18:00:00');
    expect(computeCorteGate({ now: () => six })).toEqual({ shouldShow: true });
  });

  it('respects a custom threshold override', () => {
    const fivePm = new Date('2026-04-24T17:00:00');
    expect(computeCorteGate({ threshold: 17, now: () => fivePm })).toEqual({
      shouldShow: true,
    });
  });
});

describe('CorteDeDiaCard', () => {
  it('renders nothing when shouldShow is false', () => {
    const { container } = renderWithProviders(
      <CorteDeDiaCard shouldShow={false} onOpen={vi.fn()} />,
    );
    expect(container.querySelector('[data-testid="corte-de-dia-card"]')).toBeNull();
  });

  it('renders the CTA label when shouldShow is true', () => {
    renderWithProviders(<CorteDeDiaCard shouldShow onOpen={vi.fn()} />);
    expect(screen.getByTestId('corte-de-dia-card')).toBeInTheDocument();
    expect(screen.getByText('Cerrar corte del día')).toBeInTheDocument();
  });

  it('invokes onOpen when the CTA is tapped', () => {
    const onOpen = vi.fn();
    renderWithProviders(<CorteDeDiaCard shouldShow onOpen={onOpen} />);
    fireEvent.click(screen.getAllByTestId('corte-de-dia-cta')[0]!);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
