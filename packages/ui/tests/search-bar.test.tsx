import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { SearchBar } from '../src/components/SearchBar/index';
import { initI18n } from '../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from './test-utils';

initI18n();

function inputOf(testID: string): HTMLInputElement {
  const root = screen.getAllByTestId(testID)[0]!;
  const input = root.querySelector('input') as HTMLInputElement | null;
  if (input === null) throw new Error(`No <input> in testID="${testID}"`);
  return input;
}

describe('SearchBar', () => {
  it('renders the label, placeholder, and the leading search icon', () => {
    renderWithProviders(
      <SearchBar
        label="Buscar"
        placeholder="Por nombre o SKU"
        value=""
        onChange={() => undefined}
        testID="stock-buscar"
      />,
    );
    expect(screen.getByText('Buscar')).toBeInTheDocument();
    expect(inputOf('stock-buscar').placeholder).toBe('Por nombre o SKU');
    // Lucide search icon mounts as a child of the SearchBar wrapper.
    expect(screen.getAllByTestId('icon-search').length).toBeGreaterThan(0);
  });

  it('forwards typed value via onChange', () => {
    const onChange = vi.fn();
    renderWithProviders(<SearchBar value="" onChange={onChange} testID="search-typing" />);
    fireEvent.change(inputOf('search-typing'), { target: { value: 'taco' } });
    expect(onChange).toHaveBeenCalledWith('taco');
  });

  it('drives the search return-key variant onto the underlying input', () => {
    function Harness(): JSX.Element {
      const [v, setV] = useState('');
      return <SearchBar value={v} onChange={setV} testID="search-return" />;
    }
    renderWithProviders(<Harness />);
    expect(inputOf('search-return').getAttribute('data-input-type')).toBe('text');
  });

  // Audit Round 2 G4: top-up below-floor coverage.

  it('falls back to the label as ariaLabel when the explicit prop is omitted', () => {
    renderWithProviders(
      <SearchBar
        label="Buscar productos"
        value=""
        onChange={() => undefined}
        testID="search-aria-fallback"
      />,
    );
    expect(inputOf('search-aria-fallback').getAttribute('aria-label')).toBe('Buscar productos');
  });

  it('honours an explicit ariaLabel when provided (overrides the label)', () => {
    renderWithProviders(
      <SearchBar
        label="Buscar"
        ariaLabel="Filtrar lista de clientes"
        value=""
        onChange={() => undefined}
        testID="search-aria-explicit"
      />,
    );
    expect(inputOf('search-aria-explicit').getAttribute('aria-label')).toBe(
      'Filtrar lista de clientes',
    );
  });
});
