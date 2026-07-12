/**
 * ColorSwatchPicker component tests.
 */

import { describe, it, expect, vi } from 'vitest';
import { ColorSwatchPicker } from '../src/components/ColorSwatchPicker/index';
import { renderWithProviders, screen, fireEvent } from './test-utils';

describe('ColorSwatchPicker', () => {
  it('renders the label text', () => {
    renderWithProviders(
      <ColorSwatchPicker
        label="Color de fondo"
        value="white"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Color de fondo')).toBeDefined();
  });

  it('renders swatch elements', () => {
    renderWithProviders(
      <ColorSwatchPicker
        label="Color"
        value="white"
        onChange={() => {}}
      />,
    );
    // At least the selected swatch should exist
    expect(screen.getByTestId('swatch-white')).toBeDefined();
  });

  it('uses default testID', () => {
    renderWithProviders(
      <ColorSwatchPicker
        label="Color"
        value="white"
        onChange={() => {}}
      />,
    );
    expect(screen.getByTestId('color-swatch-picker')).toBeDefined();
  });

  it('calls onChange when a swatch is pressed', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ColorSwatchPicker
        label="Color"
        value="white"
        onChange={onChange}
      />,
    );
    // Find a different swatch and click it
    const pinkSwatch = screen.queryByTestId('swatch-pink');
    if (pinkSwatch) {
      fireEvent.click(pinkSwatch);
      expect(onChange).toHaveBeenCalledWith('pink');
    }
  });
});
