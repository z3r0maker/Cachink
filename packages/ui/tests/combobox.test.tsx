/**
 * Combobox component tests.
 *
 * Covers the full anchored-popover flow on the web/Vitest target —
 * trigger rendering, panel open/close, option selection, search/typeahead
 * filter, disabled state, and the placeholder fallback. Mobile-target
 * behaviour rides the same component (no `.native.tsx` split, see
 * `combobox.tsx` header) so this file is the canonical regression set.
 */

import { describe, it, expect, vi } from 'vitest';
import { Combobox, type ComboboxOption } from '../src/components/Combobox/index';
import { fireEvent, renderWithProviders, screen } from './test-utils';

/**
 * Tamagui's `<View>` wires `onPress` through React Native's Pressable
 * system, which on web listens for the full pointerdown → pointerup →
 * click sequence. `tap(el)` dispatches all three so tests mirror a real
 * user tap and Pressable fires its handler. Same shape as the helper
 * used in `modal.web.test.tsx`.
 */
function tap(el: Element): void {
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
}

const REGIMEN_OPTIONS: readonly ComboboxOption[] = [
  { key: 'RIF', label: 'RIF' },
  { key: 'RESICO', label: 'RESICO' },
  { key: 'Asalariados', label: 'Asalariados' },
  { key: 'Otro', label: 'Otro' },
];

const CATEGORY_OPTIONS: readonly ComboboxOption[] = [
  { key: 'Materia Prima', label: 'Materia Prima' },
  { key: 'Inventario', label: 'Inventario' },
  { key: 'Nómina', label: 'Nómina' },
  { key: 'Renta', label: 'Renta' },
  { key: 'Servicios', label: 'Servicios' },
  { key: 'Publicidad', label: 'Publicidad' },
  { key: 'Mantenimiento', label: 'Mantenimiento' },
  { key: 'Impuestos', label: 'Impuestos' },
  { key: 'Logística', label: 'Logística' },
  { key: 'Otro', label: 'Otro' },
];

function getTrigger(): HTMLElement {
  return screen.getAllByTestId('combobox-trigger')[0]!;
}

describe('Combobox', () => {
  it('renders the trigger with the placeholder when no value is selected', () => {
    renderWithProviders(
      <Combobox
        value=""
        options={REGIMEN_OPTIONS}
        onChange={vi.fn()}
        placeholder="Seleccionar..."
      />,
    );
    const trigger = getTrigger();
    expect(trigger).toBeInTheDocument();
    expect(trigger.textContent).toContain('Seleccionar...');
  });

  it('renders the selected option label inside the trigger', () => {
    renderWithProviders(<Combobox value="RESICO" options={REGIMEN_OPTIONS} onChange={vi.fn()} />);
    expect(getTrigger().textContent).toContain('RESICO');
  });

  it('opens the panel when the trigger is tapped and renders every option', () => {
    renderWithProviders(<Combobox value="" options={REGIMEN_OPTIONS} onChange={vi.fn()} />);
    tap(getTrigger());
    for (const opt of REGIMEN_OPTIONS) {
      expect(screen.getAllByTestId(`combobox-option-${opt.key}`).length).toBeGreaterThan(0);
    }
  });

  it('fires onChange with the chosen key and closes the panel on selection', () => {
    const onChange = vi.fn();
    renderWithProviders(<Combobox value="" options={REGIMEN_OPTIONS} onChange={onChange} />);
    tap(getTrigger());
    tap(screen.getAllByTestId('combobox-option-Asalariados')[0]!);
    expect(onChange).toHaveBeenCalledWith('Asalariados');
    // After selection the panel content should be gone — the option
    // testID disappears from the DOM tree.
    expect(screen.queryByTestId('combobox-option-Asalariados')).toBeNull();
  });

  it('marks the active option with aria-selected when the panel is open', () => {
    renderWithProviders(<Combobox value="RIF" options={REGIMEN_OPTIONS} onChange={vi.fn()} />);
    tap(getTrigger());
    const active = screen.getAllByTestId('combobox-option-RIF')[0]!;
    expect(active.getAttribute('aria-selected')).toBe('true');
    const other = screen.getAllByTestId('combobox-option-RESICO')[0]!;
    expect(other.getAttribute('aria-selected')).toBe('false');
  });

  it('reflects the open state on the trigger via aria-expanded', () => {
    renderWithProviders(<Combobox value="" options={REGIMEN_OPTIONS} onChange={vi.fn()} />);
    expect(getTrigger().getAttribute('aria-expanded')).toBe('false');
    tap(getTrigger());
    // Tamagui Popover.Trigger forwards aria-expanded — the wrapper view
    // re-renders with the new prop after open flips.
    expect(getTrigger().getAttribute('aria-expanded')).toBe('true');
  });

  it('does not open or call onChange when disabled', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Combobox value="RIF" options={REGIMEN_OPTIONS} onChange={onChange} disabled />,
    );
    tap(getTrigger());
    expect(screen.queryByTestId('combobox-option-RIF')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reflects disabled state via aria-disabled on the trigger', () => {
    renderWithProviders(
      <Combobox value="" options={REGIMEN_OPTIONS} onChange={vi.fn()} disabled />,
    );
    expect(getTrigger().getAttribute('aria-disabled')).toBe('true');
  });

  it('renders the search input only when searchable=true', () => {
    const { rerender } = renderWithProviders(
      <Combobox value="" options={CATEGORY_OPTIONS} onChange={vi.fn()} />,
    );
    tap(getTrigger());
    expect(screen.queryByTestId('combobox-search')).toBeNull();

    rerender(<Combobox value="" options={CATEGORY_OPTIONS} onChange={vi.fn()} searchable />);
    tap(getTrigger());
    expect(screen.getAllByTestId('combobox-search').length).toBeGreaterThan(0);
  });

  it('filters options by label as the user types in the search input', () => {
    renderWithProviders(
      <Combobox value="" options={CATEGORY_OPTIONS} onChange={vi.fn()} searchable />,
    );
    tap(getTrigger());
    const search = screen.getAllByTestId('combobox-search')[0]! as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'mat' } });
    // Only "Materia Prima" matches "mat" case-insensitively.
    expect(screen.getAllByTestId('combobox-option-Materia Prima').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('combobox-option-Renta')).toBeNull();
    expect(screen.queryByTestId('combobox-option-Servicios')).toBeNull();
  });

  it('renders an empty-state row when the filter has no matches', () => {
    renderWithProviders(
      <Combobox value="" options={CATEGORY_OPTIONS} onChange={vi.fn()} searchable />,
    );
    tap(getTrigger());
    const search = screen.getAllByTestId('combobox-search')[0]! as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'zzznotfound' } });
    expect(screen.getAllByTestId('combobox-empty').length).toBeGreaterThan(0);
  });

  it('falls back to "Seleccionar..." when no placeholder is provided and no value is set', () => {
    renderWithProviders(<Combobox value="" options={REGIMEN_OPTIONS} onChange={vi.fn()} />);
    expect(getTrigger().textContent).toContain('Seleccionar...');
  });

  it('forwards a custom testID to the trigger element', () => {
    renderWithProviders(
      <Combobox value="" options={REGIMEN_OPTIONS} onChange={vi.fn()} testID="business-regimen" />,
    );
    expect(screen.getAllByTestId('business-regimen').length).toBeGreaterThan(0);
  });

  it('renders a chevron icon inside the trigger that toggles direction with open state', () => {
    renderWithProviders(<Combobox value="" options={REGIMEN_OPTIONS} onChange={vi.fn()} />);
    // Lucide encodes the icon name in the data-testid the wrapper sets
    // on the rendered SVG (`icon-chevron-down` by default). After the
    // panel opens the wrapper flips to `icon-chevron-up`.
    expect(screen.getAllByTestId('icon-chevron-down').length).toBeGreaterThan(0);
    tap(getTrigger());
    expect(screen.getAllByTestId('icon-chevron-up').length).toBeGreaterThan(0);
  });
});
