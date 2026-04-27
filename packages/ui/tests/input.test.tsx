import { describe, it, expect, vi } from 'vitest';
import { Input } from '../src/components/Input/index';
import { fireEvent, renderWithProviders, screen } from './test-utils';

/**
 * Tamagui's `<View>` wires `onPress` through React Native's Pressable
 * system, which on web listens for the full pointerdown → pointerup →
 * click sequence. `tap(el)` mirrors a real user tap so Pressable fires
 * its handler. Same helper as combobox/modal tests.
 */
function tap(el: Element): void {
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
}

describe('Input', () => {
  it('renders the label text above the field when provided', () => {
    renderWithProviders(<Input label="Concepto" value="" onChange={() => undefined} />);
    const label = screen.getByText('Concepto');
    expect(label).toBeDefined();
    // CSS uppercases the label visually — assert the style applies, mirroring
    // the brand requirement from CLAUDE.md §8.2.
    expect(getComputedStyle(label).textTransform).toBe('uppercase');
  });

  it('renders the note text below the field when provided', () => {
    renderWithProviders(
      <Input value="" onChange={() => undefined} note="Aparece en el comprobante." />,
    );
    expect(screen.getByText('Aparece en el comprobante.')).toBeDefined();
  });

  it('forwards value and placeholder to the underlying text input', () => {
    renderWithProviders(
      <Input
        value="Playera"
        onChange={() => undefined}
        placeholder="¿Qué vendiste?"
        testID="input-text"
      />,
    );
    const root = screen.getAllByTestId('input-text')[0]!;
    const field = root.querySelector('input') as HTMLInputElement | null;
    expect(field).not.toBeNull();
    expect(field!.value).toBe('Playera');
    expect(field!.placeholder).toBe('¿Qué vendiste?');
  });

  it('calls onChange with the new string when the user types', () => {
    const onChange = vi.fn();
    renderWithProviders(<Input value="" onChange={onChange} testID="input-typed" />);
    const root = screen.getAllByTestId('input-typed')[0]!;
    const field = root.querySelector('input') as HTMLInputElement;
    fireEvent.change(field, { target: { value: 'Hola' } });
    expect(onChange).toHaveBeenCalledWith('Hola');
  });

  it('renders a Combobox trigger (not a native HTML <select>) when options are provided', () => {
    // Pre-2026-04 the select branch rendered a native HTML `<select>`.
    // It now delegates to the shared `<Combobox>` so the picker styles
    // match the brand and behaves identically on web + mobile.
    renderWithProviders(
      <Input
        value=""
        onChange={() => undefined}
        options={['Producto', 'Servicio']}
        testID="input-select"
      />,
    );
    const wrapper = screen.getAllByTestId('input-select')[0]!;
    // Wrapper is unique — the Combobox trigger uses its own
    // `combobox-trigger` testID and never collides with the wrapper.
    expect(wrapper.querySelector('select')).toBeNull();
    expect(screen.getAllByTestId('combobox-trigger').length).toBeGreaterThan(0);
  });

  it('renders the Seleccionar... placeholder when type=select is passed without options', () => {
    renderWithProviders(
      <Input value="" onChange={() => undefined} type="select" testID="input-empty-select" />,
    );
    const trigger = screen.getAllByTestId('combobox-trigger')[0]!;
    expect(trigger.textContent).toContain('Seleccionar...');
  });

  it('opens the Combobox panel and renders every option as a row when tapped', () => {
    renderWithProviders(
      <Input
        value=""
        onChange={() => undefined}
        options={['Producto', 'Servicio', 'Anticipo']}
        testID="input-options"
      />,
    );
    tap(screen.getAllByTestId('combobox-trigger')[0]!);
    for (const opt of ['Producto', 'Servicio', 'Anticipo']) {
      expect(screen.getAllByTestId(`combobox-option-${opt}`).length).toBeGreaterThan(0);
    }
  });

  it('calls onChange with the chosen option key when the user selects from the Combobox', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Input value="" onChange={onChange} options={['Producto', 'Servicio']} testID="input-pick" />,
    );
    tap(screen.getAllByTestId('combobox-trigger')[0]!);
    tap(screen.getAllByTestId('combobox-option-Servicio')[0]!);
    expect(onChange).toHaveBeenCalledWith('Servicio');
  });

  it('forwards testID so E2E tests can anchor to it', () => {
    renderWithProviders(<Input value="" onChange={() => undefined} testID="venta-concepto" />);
    expect(screen.getAllByTestId('venta-concepto').length).toBeGreaterThan(0);
  });
});
