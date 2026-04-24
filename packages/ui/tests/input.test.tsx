import { describe, it, expect, vi } from 'vitest';
import { Input } from '../src/components/Input/index';
import { fireEvent, renderWithProviders, screen } from './test-utils';

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

  it('renders a select element when options are provided', () => {
    renderWithProviders(
      <Input
        value=""
        onChange={() => undefined}
        options={['Producto', 'Servicio']}
        testID="input-select"
      />,
    );
    const root = screen.getAllByTestId('input-select')[0]!;
    expect(root.querySelector('select')).not.toBeNull();
  });

  it('renders an empty select when type=select is passed without options', () => {
    renderWithProviders(
      <Input value="" onChange={() => undefined} type="select" testID="input-empty-select" />,
    );
    const root = screen.getAllByTestId('input-empty-select')[0]!;
    const select = root.querySelector('select');
    expect(select).not.toBeNull();
    // Only the "Seleccionar..." placeholder option should render.
    const opts = Array.from(select!.querySelectorAll('option'));
    expect(opts).toHaveLength(1);
    expect(opts[0]!.textContent).toBe('Seleccionar...');
  });

  it('renders every option inside the select, plus the empty "Seleccionar..." entry', () => {
    renderWithProviders(
      <Input
        value=""
        onChange={() => undefined}
        options={['Producto', 'Servicio', 'Anticipo']}
        testID="input-options"
      />,
    );
    const root = screen.getAllByTestId('input-options')[0]!;
    const opts = Array.from(root.querySelectorAll('option')).map((o) => o.textContent ?? '');
    expect(opts).toEqual(['Seleccionar...', 'Producto', 'Servicio', 'Anticipo']);
  });

  it('calls onChange when the user selects a different option', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Input value="" onChange={onChange} options={['Producto', 'Servicio']} testID="input-pick" />,
    );
    const root = screen.getAllByTestId('input-pick')[0]!;
    const select = root.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'Servicio' } });
    expect(onChange).toHaveBeenCalledWith('Servicio');
  });

  it('forwards testID so E2E tests can anchor to it', () => {
    renderWithProviders(<Input value="" onChange={() => undefined} testID="venta-concepto" />);
    expect(screen.getAllByTestId('venta-concepto').length).toBeGreaterThan(0);
  });
});
