/**
 * FlujoEfectivoScreen tests (Slice 3 C15).
 */

import { describe, expect, it } from 'vitest';
import type { FlujoDeEfectivo } from '@cachink/domain';
import { FlujoEfectivoScreen } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

function flujo(overrides: Partial<FlujoDeEfectivo> = {}): FlujoDeEfectivo {
  return {
    operacion: 50_000n,
    inversion: -10_000n,
    total: 40_000n,
    ...overrides,
  } as FlujoDeEfectivo;
}

describe('FlujoEfectivoScreen', () => {
  it('renders operación + inversión + total sections', () => {
    renderWithProviders(<FlujoEfectivoScreen flujo={flujo()} periodoLabel="Abril 2026" />);
    expect(screen.getByTestId('flujo-operacion').textContent).toContain('$500.00');
    expect(screen.getByTestId('flujo-inversion').textContent).toContain('-$100.00');
    expect(screen.getByTestId('flujo-total').textContent).toContain('$400.00');
  });

  it('renders the empty-period card when flujo is null', () => {
    renderWithProviders(<FlujoEfectivoScreen flujo={null} periodoLabel="Abril 2026" />);
    expect(screen.getByTestId('flujo-efectivo-empty')).toBeInTheDocument();
  });

  it('renders negative total with negative tone', () => {
    renderWithProviders(
      <FlujoEfectivoScreen
        flujo={flujo({ total: -5_000n, operacion: -5_000n, inversion: 0n })}
        periodoLabel="Abril 2026"
      />,
    );
    expect(screen.getByTestId('flujo-total').textContent).toContain('-$50.00');
  });
});
