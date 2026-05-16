import { describe, expect, it } from 'vitest';
import { DeltaIndicator } from '../../src/components/DeltaIndicator/index';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

describe('DeltaIndicator', () => {
  it('renders nothing when previous is null', () => {
    const { container } = renderWithProviders(
      <DeltaIndicator current={100} previous={null} format="percent" periodLabel="vs mes anterior" />,
    );
    expect(container.textContent).toBe('');
  });

  it('renders ↑ with green for positive delta', () => {
    renderWithProviders(
      <DeltaIndicator current={120} previous={100} format="percent" periodLabel="vs mes anterior" />,
    );
    const label = screen.getByTestId('delta-indicator-label');
    expect(label.textContent).toContain('↑');
    expect(label.textContent).toContain('20%');
    expect(label.textContent).toContain('vs mes anterior');
  });

  it('renders ↓ with red for negative delta', () => {
    renderWithProviders(
      <DeltaIndicator current={80} previous={100} format="percent" periodLabel="vs mes anterior" />,
    );
    const label = screen.getByTestId('delta-indicator-label');
    expect(label.textContent).toContain('↓');
    expect(label.textContent).toContain('20%');
  });

  it('renders "= sin cambio" when delta is zero', () => {
    renderWithProviders(
      <DeltaIndicator current={100} previous={100} format="percent" periodLabel="vs mes anterior" />,
    );
    const label = screen.getByTestId('delta-indicator-label');
    expect(label.textContent).toContain('sin cambio');
  });

  it('handles previous = 0 with positive current', () => {
    renderWithProviders(
      <DeltaIndicator current={50} previous={0} format="percent" periodLabel="vs mes anterior" />,
    );
    const label = screen.getByTestId('delta-indicator-label');
    expect(label.textContent).toContain('↑');
    expect(label.textContent).toContain('100%');
  });

  it('handles previous = 0 and current = 0', () => {
    renderWithProviders(
      <DeltaIndicator current={0} previous={0} format="percent" periodLabel="vs mes anterior" />,
    );
    const label = screen.getByTestId('delta-indicator-label');
    expect(label.textContent).toContain('sin cambio');
  });

  it('supports custom testID', () => {
    renderWithProviders(
      <DeltaIndicator current={100} previous={80} format="percent" periodLabel="vs" testID="my-delta" />,
    );
    expect(screen.getByTestId('my-delta')).toBeInTheDocument();
  });
});
