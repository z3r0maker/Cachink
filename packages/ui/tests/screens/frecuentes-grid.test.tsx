/**
 * FrecuentesGrid component tests (UXD-R3 C2).
 */

import { describe, expect, it, vi } from 'vitest';
import { makeProduct } from '../../../testing/src/fixtures/product';
import { FrecuentesGrid } from '../../src/screens/Ventas/frecuentes-grid';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

describe('FrecuentesGrid', () => {
  it('renders nothing when productos is empty', () => {
    renderWithProviders(
      <FrecuentesGrid productos={[]} onTap={vi.fn()} />,
    );
    expect(screen.queryByTestId('frecuentes-grid')).toBeNull();
  });

  it('renders grid when productos exist', () => {
    const products = [makeProduct({ nombre: 'Taco' }), makeProduct({ nombre: 'Agua' })];
    renderWithProviders(<FrecuentesGrid productos={products} onTap={vi.fn()} />);
    expect(screen.getByTestId('frecuentes-grid')).toBeInTheDocument();
    expect(screen.getByTestId('producto-card-grid')).toBeInTheDocument();
  });

  it('renders section title with frecuentes label', () => {
    const products = [makeProduct()];
    renderWithProviders(<FrecuentesGrid productos={products} onTap={vi.fn()} />);
    expect(screen.getByText('Frecuentes')).toBeInTheDocument();
  });
});
