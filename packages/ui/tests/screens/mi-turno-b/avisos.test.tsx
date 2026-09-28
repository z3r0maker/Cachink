/**
 * Avisos (M-09, MvAvisos) as the operator meets it: the two tabs with their
 * unread counts, reading and answering the owner, «Todo leído», and a notice
 * of the caja leading to the phone screen that deals with it.
 */
import { describe, expect, it, vi } from 'vitest';
import { AVISOS_FIXTURE } from '@xangarro/caja/avisos';
import { initI18n } from '../../../src/i18n/index';
import { AvisosScreen } from '../../../src/screens/Avisos/avisos-screen';
import { rutaMovil } from '../../../src/screens/Inicio/inicio-rutas';
import { fireEvent, renderWithProviders, screen, waitFor } from '../../test-utils';

initI18n();

function tap(testID: string): void {
  const el = screen.getByTestId(testID);
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
}

function pantalla(over: Partial<Parameters<typeof AvisosScreen>[0]> = {}) {
  const props = {
    state: 'happy' as const,
    data: AVISOS_FIXTURE,
    onMarcar: vi.fn(),
    onResponder: vi.fn(() => Promise.resolve()),
    rutaDe: rutaMovil,
    onIr: vi.fn(),
    onRetry: vi.fn(),
    ...over,
  };
  renderWithProviders(<AvisosScreen {...props} />);
  return props;
}

describe('Avisos', () => {
  it('opens on the owner’s messages, the request first as the hero', () => {
    pantalla();
    expect(screen.getByTestId('avisos-tabs-dueno')).toHaveTextContent(/De Pedro · 2/i);
    expect(screen.getByTestId('avisos-tabs-caja')).toHaveTextContent(/De tu caja · 4/i);
    expect(screen.getByTestId('aviso-corte')).toHaveTextContent('Aclara el corte del 13 de mayo');
    expect(screen.getByTestId('aviso-estado-corte')).toHaveTextContent('Sin leer');
  });

  it('answers the owner with a quick answer', async () => {
    const p = pantalla();
    expect(screen.getByTestId('aviso-enviar-corte')).toBeDisabled();
    fireEvent.click(screen.getByText('Salió un vale'));
    tap('aviso-enviar-corte');
    await waitFor(() =>
      expect(p.onResponder).toHaveBeenCalledWith(
        'corte',
        'Salió un vale de la caja y no lo registré como gasto.',
      ),
    );
  });

  it('marks one message, or everything, read', () => {
    const p = pantalla();
    tap('aviso-leer-precio');
    expect(p.onMarcar).toHaveBeenCalledWith(['precio']);
    tap('avisos-todo-leido');
    expect(p.onMarcar).toHaveBeenLastCalledWith(AVISOS_FIXTURE.avisos.map((a) => a.id));
  });

  it('shows a sent reply instead of the form', () => {
    const [corte, ...resto] = AVISOS_FIXTURE.avisos;
    pantalla({
      data: {
        ...AVISOS_FIXTURE,
        avisos: [{ ...corte!, respuesta: 'Di cambio de más.', leido: true }, ...resto],
      },
    });
    expect(screen.getByText('Le mandaste tu respuesta a Pedro')).toBeInTheDocument();
    expect(screen.queryByTestId('aviso-enviar-corte')).toBeNull();
  });

  it('leads a notice of the caja to its phone screen and marks it read', () => {
    const p = pantalla();
    tap('avisos-tabs-caja');
    tap('aviso-ir-tripa');
    expect(p.onMarcar).toHaveBeenCalledWith(['tripa']);
    expect(p.onIr).toHaveBeenCalledWith('/inventario');
    tap('aviso-ir-cola');
    expect(p.onIr).toHaveBeenLastCalledWith('/pendientes');
    tap('aviso-ir-chuy');
    expect(p.onIr).toHaveBeenLastCalledWith('/cobranza');
    expect(screen.queryByTestId('aviso-ir-producto')).toBeNull();
  });

  it('says a failed read keeps nothing from the operator', () => {
    const p = pantalla({ state: 'error' });
    expect(screen.getByTestId('avisos-error')).toHaveTextContent(
      'Tus datos están a salvo en esta caja.',
    );
    tap('avisos-error-reintentar');
    expect(p.onRetry).toHaveBeenCalled();
  });
});
