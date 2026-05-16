/**
 * WheelQuantityPicker component tests (ADR-050).
 *
 * Uses a jsdom mock of react-native-wheely that renders options as
 * clickable divs. Tests verify: label, selected value, onChange,
 * min/max bounds, error display, and string option labels.
 */

import { describe, expect, it, vi } from 'vitest';
import { WheelQuantityPicker } from '../../src/components/fields/index';
import { renderWithProviders, screen, fireEvent } from '../test-utils';

describe('WheelQuantityPicker', () => {
  it('renders with the provided label', () => {
    renderWithProviders(
      <WheelQuantityPicker label="CANTIDAD" value={1} onChange={vi.fn()} />,
    );
    expect(screen.getByText('CANTIDAD')).toBeInTheDocument();
  });

  it('renders the testID on the wrapper', () => {
    renderWithProviders(
      <WheelQuantityPicker
        label="Qty"
        value={5}
        onChange={vi.fn()}
        testID="my-qty"
      />,
    );
    expect(screen.getByTestId('my-qty')).toBeInTheDocument();
  });

  it('displays the current value as selected', () => {
    renderWithProviders(
      <WheelQuantityPicker
        label="Cantidad"
        value={3}
        onChange={vi.fn()}
        min={1}
        max={10}
      />,
    );
    // The mock renders each option; value=3 with min=1 → index 2 is selected
    const selectedOption = screen.getByTestId('wheel-option-2');
    expect(selectedOption).toHaveAttribute('data-selected', 'true');
    expect(selectedOption).toHaveTextContent('3');
  });

  it('fires onChange with the correct numeric value when scrolled to', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <WheelQuantityPicker
        label="Cantidad"
        value={1}
        onChange={onChange}
        min={1}
        max={10}
      />,
    );
    // Click option at index 4 → min(1) + 4 = 5
    fireEvent.click(screen.getByTestId('wheel-option-4'));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('respects min/max bounds — only generates options within range', () => {
    renderWithProviders(
      <WheelQuantityPicker
        label="Qty"
        value={5}
        onChange={vi.fn()}
        min={3}
        max={7}
      />,
    );
    // Should have options: 3, 4, 5, 6, 7 → indices 0-4
    expect(screen.getByTestId('wheel-option-0')).toHaveTextContent('3');
    expect(screen.getByTestId('wheel-option-4')).toHaveTextContent('7');
    expect(screen.queryByTestId('wheel-option-5')).toBeNull();
  });

  it('shows error text when error prop is provided', () => {
    renderWithProviders(
      <WheelQuantityPicker
        label="Qty"
        value={1}
        onChange={vi.fn()}
        error="Valor requerido"
      />,
    );
    expect(screen.getByText('Valor requerido')).toBeInTheDocument();
  });

  it('does not render error text when error is undefined', () => {
    renderWithProviders(
      <WheelQuantityPicker label="Qty" value={1} onChange={vi.fn()} />,
    );
    // No red error text should appear
    expect(screen.queryByText('Valor requerido')).toBeNull();
  });

  it('renders string option labels instead of numbers when provided', () => {
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    renderWithProviders(
      <WheelQuantityPicker
        label="Día"
        value={0}
        onChange={vi.fn()}
        min={0}
        max={6}
        options={dayNames}
      />,
    );
    expect(screen.getByText('Lun')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
    expect(screen.getByText('Dom')).toBeInTheDocument();
    // Numbers should NOT appear
    expect(screen.queryByText('0')).toBeNull();
  });

  it('calls onChange with min + index when using string options', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <WheelQuantityPicker
        label="Día"
        value={0}
        onChange={onChange}
        min={0}
        max={6}
        options={['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']}
      />,
    );
    // Click "Vie" at index 4 → min(0) + 4 = 4
    fireEvent.click(screen.getByTestId('wheel-option-4'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('defaults to min=1, max=99 when not specified', () => {
    renderWithProviders(
      <WheelQuantityPicker label="Qty" value={1} onChange={vi.fn()} />,
    );
    // Should have 99 options (1 through 99)
    expect(screen.getByTestId('wheel-option-0')).toHaveTextContent('1');
    expect(screen.getByTestId('wheel-option-98')).toHaveTextContent('99');
    expect(screen.queryByTestId('wheel-option-99')).toBeNull();
  });

  it('clamps selectedIndex to 0 when value < min', () => {
    renderWithProviders(
      <WheelQuantityPicker
        label="Qty"
        value={0}
        onChange={vi.fn()}
        min={1}
        max={10}
      />,
    );
    // value - min = 0 - 1 = -1, clamped to 0
    const firstOption = screen.getByTestId('wheel-option-0');
    expect(firstOption).toHaveAttribute('data-selected', 'true');
  });
});
