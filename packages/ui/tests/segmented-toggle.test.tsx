import { describe, it, expect, vi } from 'vitest';
import { SegmentedToggle } from '../src/components/SegmentedToggle/index';
import { fireEvent, renderWithProviders, screen } from './test-utils';

const METODOS = [
  { key: 'efectivo' as const, label: 'Efectivo' },
  { key: 'transfer' as const, label: 'Transfer.' },
  { key: 'tarjeta' as const, label: 'Tarjeta' },
];

describe('SegmentedToggle', () => {
  it('renders one chip per option', () => {
    renderWithProviders(
      <SegmentedToggle value="efectivo" options={METODOS} onChange={() => null} />,
    );
    for (const m of METODOS) {
      expect(screen.getAllByTestId(`segmented-toggle-${m.key}`).length).toBeGreaterThan(0);
    }
  });

  it('marks the active chip with aria-checked=true', () => {
    renderWithProviders(
      <SegmentedToggle value="transfer" options={METODOS} onChange={() => null} />,
    );
    const active = screen.getAllByTestId('segmented-toggle-transfer')[0]!;
    expect(active.getAttribute('aria-checked')).toBe('true');
    const inactive = screen.getAllByTestId('segmented-toggle-efectivo')[0]!;
    expect(inactive.getAttribute('aria-checked')).toBe('false');
  });

  it('paints the active chip yellow', () => {
    renderWithProviders(
      <SegmentedToggle
        value="efectivo"
        options={METODOS}
        onChange={() => null}
        testID="st-active"
      />,
    );
    const active = screen.getAllByTestId('segmented-toggle-efectivo')[0]!;
    expect(getComputedStyle(active).backgroundColor.toLowerCase()).toContain('rgb(255, 214, 10)');
  });

  it('fires onChange with the next key when an inactive chip is tapped', () => {
    const onChange = vi.fn<(next: 'efectivo' | 'transfer' | 'tarjeta') => void>();
    renderWithProviders(<SegmentedToggle value="efectivo" options={METODOS} onChange={onChange} />);
    fireEvent.click(screen.getAllByTestId('segmented-toggle-tarjeta')[0]!);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('tarjeta');
  });

  it('does not fire onChange when the active chip is tapped', () => {
    const onChange = vi.fn();
    renderWithProviders(<SegmentedToggle value="efectivo" options={METODOS} onChange={onChange} />);
    fireEvent.click(screen.getAllByTestId('segmented-toggle-efectivo')[0]!);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('skips onChange when disabled is true', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <SegmentedToggle value="efectivo" options={METODOS} onChange={onChange} disabled />,
    );
    fireEvent.click(screen.getAllByTestId('segmented-toggle-tarjeta')[0]!);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('marks every chip aria-disabled when disabled is true', () => {
    renderWithProviders(
      <SegmentedToggle value="efectivo" options={METODOS} onChange={() => null} disabled />,
    );
    for (const m of METODOS) {
      const el = screen.getAllByTestId(`segmented-toggle-${m.key}`)[0]!;
      expect(el.getAttribute('aria-disabled')).toBe('true');
    }
  });

  it('renders an uppercase eyebrow when label is provided', () => {
    renderWithProviders(
      <SegmentedToggle
        label="Método de pago"
        value="efectivo"
        options={METODOS}
        onChange={() => null}
      />,
    );
    const label = screen.getAllByTestId('segmented-toggle-label')[0]!;
    expect(label.textContent).toBe('Método de pago');
    expect(getComputedStyle(label).textTransform).toBe('uppercase');
  });

  it('emits role=radiogroup on the inner row for accessibility', () => {
    renderWithProviders(
      <SegmentedToggle
        label="Método de pago"
        value="efectivo"
        options={METODOS}
        onChange={() => null}
      />,
    );
    const group = screen.getByRole('radiogroup');
    expect(group.getAttribute('aria-label')).toBe('Método de pago');
  });
});
