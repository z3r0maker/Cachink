/**
 * NuevaRecetaModal tests — Phase 18.
 *
 * Verifies:
 *   - Renders form fields when open.
 *   - Submit button is present.
 *   - Renders nothing when closed.
 */

import { describe, expect, it, vi } from 'vitest';
import type { Product } from '@cachink/domain';
import { makeProduct } from '@cachink/testing';
import { renderWithProviders, screen, fireEvent } from '../test-utils';
import { initI18n } from '../../src/i18n/index';
import { NuevaRecetaModal } from '../../src/screens/Conversion/nueva-receta-modal';

initI18n();

const MP: Product = makeProduct({
  nombre: 'Café 1kg',
  usoProducto: 'materia-prima',
});

const PROD: Product = makeProduct({
  nombre: 'Taza de Café',
  usoProducto: 'venta',
});

describe('NuevaRecetaModal', () => {
  it('renders form fields when open', () => {
    renderWithProviders(
      <NuevaRecetaModal
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        materiasPrimas={[MP]}
        productosVenta={[PROD]}
      />,
    );
    expect(screen.getByTestId('receta-mp-picker')).toBeTruthy();
    expect(screen.getByTestId('receta-prod-picker')).toBeTruthy();
    expect(screen.getByTestId('receta-cant-origen')).toBeTruthy();
    expect(screen.getByTestId('receta-cant-resultante')).toBeTruthy();
    expect(screen.getByTestId('receta-submit')).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    renderWithProviders(
      <NuevaRecetaModal
        open={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        materiasPrimas={[MP]}
        productosVenta={[PROD]}
      />,
    );
    expect(screen.queryByTestId('nueva-receta-modal')).toBeNull();
  });

  it('does not call onSubmit without selections', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <NuevaRecetaModal
        open={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        materiasPrimas={[MP]}
        productosVenta={[PROD]}
      />,
    );
    // Submit without selecting anything — validation should block it.
    fireEvent.click(screen.getByTestId('receta-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
