/**
 * Registros por enviar (M-09, MvPendientes): the hero with what waits and
 * what it adds up to, «La cola» in order, the refused rows with their retry,
 * «Reintentar ahora», and «Todo enviado» when nothing waits.
 */
import { describe, expect, it, vi } from 'vitest';
import { COLA_FIXTURE } from '@xangarro/caja/pendientes';
import type { RejectedRow } from '@xangarro/sync';
import { initI18n } from '../../../src/i18n/index';
import { PendientesScreen } from '../../../src/screens/Pendientes/pendientes-screen';
import { faseDe, partesConCifras } from '../../../src/screens/Pendientes/pendientes-logica';
import { fireEvent, renderWithProviders, screen } from '../../test-utils';

initI18n();

function tap(testID: string): void {
  const el = screen.getByTestId(testID);
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
}

const RECHAZADA: RejectedRow = {
  tableName: 'sales',
  rowId: 'S1',
  code: 'FK_PRODUCT_MISSING',
  message: 'productoId=P1 not found',
  retryable: false,
  attempts: 1,
  lastAttemptAt: '2026-09-16T14:32:00.000Z',
  row: { monto: 12000n, concepto: 'Tacos', fecha: '2026-09-16' },
};

function pantalla(over: Partial<Parameters<typeof PendientesScreen>[0]> = {}) {
  const props = {
    state: 'happy' as const,
    cola: COLA_FIXTURE,
    rechazados: [] as readonly RejectedRow[],
    fase: faseDe(false, COLA_FIXTURE),
    offline: true,
    sinInternet: false,
    onReintentar: vi.fn(),
    onReintentarRechazados: vi.fn(),
    onRetryLeer: vi.fn(),
    ...over,
  };
  renderWithProviders(<PendientesScreen {...props} />);
  return props;
}

describe('Registros por enviar', () => {
  it('says how many wait, what they add up to, and lists them in order', () => {
    const p = pantalla();
    const heroe = screen.getByTestId('pendientes-heroe-espera');
    expect(heroe).toHaveTextContent(`${COLA_FIXTURE.length} registros esperan conexión`);
    const filas = screen.getAllByTestId(/^pendiente-/);
    expect(filas).toHaveLength(COLA_FIXTURE.length);
    expect(filas[0]).toHaveTextContent(COLA_FIXTURE[0]!.titulo);
    expect(filas[0]).toHaveTextContent('Esperando conexión');
    tap('pendientes-reintentar');
    expect(p.onReintentar).toHaveBeenCalled();
  });

  it('says the retry found no internet', () => {
    pantalla({ sinInternet: true });
    expect(screen.getByTestId('pendientes-sin-internet')).toBeInTheDocument();
  });

  it('lists the refused rows with their retry', () => {
    const p = pantalla({ rechazados: [RECHAZADA] });
    expect(screen.getByTestId('no-enviado-reason-sales:S1')).toHaveTextContent(
      'El producto de este registro ya no existe en el portal.',
    );
    tap('no-enviado-retry-sales:S1');
    expect(p.onReintentarRechazados).toHaveBeenCalledWith([RECHAZADA]);
  });

  it('turns green with «Todo enviado» when nothing waits', () => {
    pantalla({ cola: [], fase: faseDe(false, []), offline: false });
    expect(screen.getByTestId('pendientes-heroe-enviado')).toHaveTextContent('Todo enviado');
    expect(screen.queryByTestId('pendientes-cola')).toBeNull();
    expect(screen.getByTestId('pendientes-reintentar')).toHaveTextContent('Revisar de nuevo');
  });

  it('shows «Enviando» on every row while a sync runs', () => {
    pantalla({ fase: faseDe(true, COLA_FIXTURE) });
    expect(screen.getAllByTestId(/^pendiente-/)[0]).toHaveTextContent('Enviando');
    expect(screen.getByTestId('pendientes-reintentar')).toBeDisabled();
  });

  it('sets the money in a sentence apart', () => {
    expect(partesConCifras('Suman $283.00 de ventas.')).toEqual([
      { texto: 'Suman ', cifra: false },
      { texto: '$283.00', cifra: true },
      { texto: ' de ventas.', cifra: false },
    ]);
  });
});
