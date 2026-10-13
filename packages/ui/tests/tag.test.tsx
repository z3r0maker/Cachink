import { describe, it, expect } from 'vitest';
import { Tag, type TagVariant } from '../src/components/Tag/index';
import { renderWithProviders, screen } from './test-utils';

describe('Tag', () => {
  it('renders its children as the visible label text', () => {
    renderWithProviders(<Tag>Producto</Tag>);
    expect(screen.getByText('Producto')).toBeDefined();
  });

  it('applies the neutral variant tokens by default', () => {
    renderWithProviders(<Tag testID="tag-default">Producto</Tag>);
    const root = screen.getAllByTestId('tag-default')[0]!;
    // gray100 (#F2F2F0) → rgb(242, 242, 240).
    expect(getComputedStyle(root).backgroundColor.toLowerCase()).toContain('rgb(242, 242, 240)');
  });

  it('applies the brand variant yellow background when variant="brand"', () => {
    renderWithProviders(
      <Tag variant="brand" testID="tag-brand">
        Nuevo
      </Tag>,
    );
    const root = screen.getAllByTestId('tag-brand')[0]!;
    // yellow (#FFD60A) → rgb(255, 214, 10).
    expect(getComputedStyle(root).backgroundColor.toLowerCase()).toContain('rgb(255, 214, 10)');
  });

  it('applies the danger variant red soft background and red text when variant="danger"', () => {
    renderWithProviders(
      <Tag variant="danger" testID="tag-danger">
        Renta
      </Tag>,
    );
    const root = screen.getAllByTestId('tag-danger')[0]!;
    // redSoft (#FFE8EA) → rgb(255, 232, 234).
    expect(getComputedStyle(root).backgroundColor.toLowerCase()).toContain('rgb(255, 232, 234)');
    // red (#FF4757) → rgb(255, 71, 87).
    const label = screen.getByText('Renta');
    expect(getComputedStyle(label).color.toLowerCase()).toContain('rgb(255, 71, 87)');
  });

  it('applies each of the seven variants without error', () => {
    const variants: TagVariant[] = [
      'neutral',
      'brand',
      'soft',
      'success',
      'info',
      'danger',
      'warning',
    ];
    for (const variant of variants) {
      renderWithProviders(
        <Tag variant={variant} testID={`tag-${variant}`}>
          Texto
        </Tag>,
      );
      expect(screen.getAllByTestId(`tag-${variant}`).length).toBeGreaterThan(0);
    }
  });

  it('preserves the case of the children string (no uppercasing)', () => {
    renderWithProviders(<Tag variant="soft">Transferencia</Tag>);
    const label = screen.getByText('Transferencia');
    // The mock renders categoria / metodo strings in proper case — assert
    // the visual transform does NOT force uppercase (unlike <Btn>).
    expect(getComputedStyle(label).textTransform).not.toBe('uppercase');
  });

  it('forwards testID so E2E tests can anchor to it', () => {
    renderWithProviders(<Tag testID="venta-categoria">Servicio</Tag>);
    expect(screen.getAllByTestId('venta-categoria').length).toBeGreaterThan(0);
  });
});
