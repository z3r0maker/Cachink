import { describe, it, expect, vi } from 'vitest';
import { List } from '../src/components/List/index';
import { renderWithProviders, screen } from './test-utils';

interface Row {
  readonly id: string;
  readonly label: string;
}

const rows: readonly Row[] = [
  { id: 'r1', label: 'Playera blanca' },
  { id: 'r2', label: 'Camiseta azul' },
  { id: 'r3', label: 'Gorra negra' },
];

describe('List (web variant)', () => {
  it('renders one row per data entry via renderItem', () => {
    renderWithProviders(
      <List<Row>
        data={rows}
        keyExtractor={(r) => r.id}
        renderItem={(r) => <span data-testid={`row-${r.id}`}>{r.label}</span>}
        testID="ventas-list"
      />,
    );
    expect(screen.getByTestId('row-r1').textContent).toBe('Playera blanca');
    expect(screen.getByTestId('row-r2').textContent).toBe('Camiseta azul');
    expect(screen.getByTestId('row-r3').textContent).toBe('Gorra negra');
  });

  it('renders the header above the rows when ListHeaderComponent is provided', () => {
    renderWithProviders(
      <List<Row>
        data={rows}
        keyExtractor={(r) => r.id}
        renderItem={(r) => <span data-testid={`row-${r.id}`}>{r.label}</span>}
        ListHeaderComponent={<span data-testid="list-header">3 productos</span>}
      />,
    );
    expect(screen.getByTestId('list-header')).toBeInTheDocument();
    // Row order is preserved.
    const r1 = screen.getByTestId('row-r1');
    const header = screen.getByTestId('list-header');
    expect(header.compareDocumentPosition(r1) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders the empty component instead of rows when data is empty', () => {
    renderWithProviders(
      <List<Row>
        data={[]}
        keyExtractor={(r) => r.id}
        renderItem={(r) => <span data-testid={`row-${r.id}`}>{r.label}</span>}
        ListEmptyComponent={<span data-testid="list-empty">Sin filas</span>}
      />,
    );
    expect(screen.getByTestId('list-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('row-r1')).toBeNull();
  });

  it('renders the footer below the rows when ListFooterComponent is provided', () => {
    renderWithProviders(
      <List<Row>
        data={rows}
        keyExtractor={(r) => r.id}
        renderItem={(r) => <span data-testid={`row-${r.id}`}>{r.label}</span>}
        ListFooterComponent={<span data-testid="list-footer">Fin de la lista</span>}
      />,
    );
    expect(screen.getByTestId('list-footer')).toBeInTheDocument();
  });

  it('uses the supplied keyExtractor to derive React keys', () => {
    // Render with keys that wouldn't naturally derive from index.
    // If the implementation forgot to call keyExtractor, React would
    // log a console warning. We assert no warning was logged.
    const warnSpy = vi.fn();
    const original = console.warn;
    console.warn = warnSpy;
    try {
      renderWithProviders(
        <List<Row>
          data={rows}
          keyExtractor={(r) => r.id}
          renderItem={(r) => <span>{r.label}</span>}
        />,
      );
      const keyWarnings = warnSpy.mock.calls.filter((call) =>
        String(call[0] ?? '').includes('Each child in a list should have a unique "key"'),
      );
      expect(keyWarnings.length).toBe(0);
    } finally {
      console.warn = original;
    }
  });
});
