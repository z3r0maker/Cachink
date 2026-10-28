/**
 * The rejected-rows panel after «Reintentar todo» succeeds: the rows drop
 * to zero mid-render, and `Todos` used to be CALLED as a function — its
 * useTranslation ran in the parent's hook slot, so the drop rendered
 * fewer hooks than the previous pass and React threw «Rendered fewer
 * hooks than expected» straight into the error boundary (M-11: the
 * sync-rejected flow crashed the app exactly here). Rendered as a
 * component, its early return is its own.
 */
import { describe, it, expect } from 'vitest';
import { renderWithProviders as render, screen } from '../test-utils';
import { RechazadosLista } from '../../src/screens/Pendientes/rechazados-lista';
import { initI18n } from '../../src/i18n/index';

const fila = (n: number) =>
  ({
    tableName: 'sales',
    rowId: `01JSA0000000000000000000${n}`,
    clientSeq: n,
    code: 'FK_PRODUCT_MISSING',
    message: 'productoId=… not found',
    retryable: false,
    lastAttemptAt: '2026-09-30T00:00:00.000Z',
    nextAttemptAt: null,
  }) as never;

describe('RechazadosLista', () => {
  it('survives the rows dropping to zero after a successful retry', () => {
    initI18n();
    const onRetry = () => undefined;
    const view = render(<RechazadosLista rows={[fila(1), fila(2)]} onRetry={onRetry} />);
    expect(screen.getByTestId('no-enviados-screen')).toBeTruthy();
    // The retry succeeds: the panel re-renders with nothing left. Calling
    // this rerender used to throw the hooks violation.
    view.rerender(<RechazadosLista rows={[]} onRetry={onRetry} />);
    expect(screen.queryByTestId('no-enviados-screen')).toBeNull();
  });
});
