/**
 * «Avisos» (M-09, board `Operador Avisos`): the two tabs and their unread
 * counts, the read marks, the reply from the sheet (happy, empty, failing,
 * duplicated), and the states — sin-avisos, cargando, error-al-leer, plus
 * the cta the caja's notices carry.
 */
import { describe, expect, it, vi } from 'vitest';
import type { Aviso, AvisosData, AvisosVivo } from '@xangarro/caja/avisos';
import { AVISOS_FIXTURE } from '@xangarro/caja/avisos';
import { initI18n } from '../src/i18n/index';
import { AvisosScreen } from '../src/screens/Avisos/avisos-screen';
import { fireEvent, renderWithProviders, screen, waitFor } from './test-utils';

initI18n();

const tap = (id: string): void => {
  const el = screen.getByTestId(id);
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
};

const escribir = (id: string, texto: string): void => {
  fireEvent.change(screen.getByTestId(id), { target: { value: texto } });
};

function montar(over: Record<string, unknown> = {}) {
  const onAbrir = vi.fn();
  const onRetry = vi.fn();
  const vivo: AvisosVivo = { marcar: vi.fn(), responder: vi.fn(async () => undefined) };
  renderWithProviders(
    <AvisosScreen
      state="happy"
      data={AVISOS_FIXTURE}
      tab="dueno"
      vivo={vivo}
      onAbrir={onAbrir}
      onRetry={onRetry}
      {...over}
    />,
  );
  return { onAbrir, onRetry, vivo };
}

describe('AvisosScreen · pestañas y tarjetas', () => {
  it('says the sub, the two tabs with their unread counts, and the corte card', () => {
    montar();
    expect(screen.getByText('Avisos')).toBeInTheDocument();
    expect(screen.getByText('Lo que te manda Pedro y lo que la caja te avisa')).toBeInTheDocument();
    expect(screen.getByTestId('avisos-tabs-dueno').textContent).toContain('De Pedro');
    expect(screen.getByTestId('avisos-tabs-dueno').textContent).toContain('2');
    expect(screen.getByTestId('avisos-tabs-caja').textContent).toContain('De tu caja');
    expect(screen.getByTestId('avisos-tabs-caja').textContent).toContain('4');
    expect(screen.getByText('Aclara el corte del 13 de mayo')).toBeInTheDocument();
    expect(screen.getByText(/Faltaron \$60.00/)).toBeInTheDocument();
  });

  it('de tu caja lists the system notices and their cta', () => {
    const { onAbrir } = montar();
    tap('avisos-tabs-caja');
    expect(screen.getByText('Taco de tripa está por debajo del umbral')).toBeInTheDocument();
    expect(screen.getByText('3 registros siguen sin enviarse')).toBeInTheDocument();
    tap('aviso-caja-cta-/operador/pendientes');
    expect(onAbrir).toHaveBeenCalledWith('/operador/pendientes');
  });

  it('marks one read, then all, and the counts fall', () => {
    const { vivo } = montar();
    tap('aviso-marcar-corte');
    expect(vivo.marcar).toHaveBeenCalledWith(['corte']);
    tap('avisos-marcar-todo');
    expect(vivo.marcar).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('avisos-tabs-dueno').textContent).not.toContain('2');
  });
});

describe('AvisosScreen · la respuesta', () => {
  it('sends the reply, closes the sheet and toasts who has it', async () => {
    const { vivo } = montar();
    tap('aviso-responder-corte');
    escribir('responder-texto', 'Creo que di cambio de más a un cliente.');
    tap('responder-enviar');
    await waitFor(() =>
      expect(vivo.responder).toHaveBeenCalledWith(
        'corte',
        'Creo que di cambio de más a un cliente.',
      ),
    );
    await waitFor(() => expect(screen.getByTestId('avisos-toast')).toBeInTheDocument());
    expect(screen.getByTestId('avisos-toast').textContent).toContain('Respuesta enviada');
    expect(screen.getByTestId('avisos-toast').textContent).toContain(
      'Pedro ya tiene tu respuesta sobre el corte del 13 de mayo.',
    );
    expect(screen.getByTestId('aviso-respondido').textContent).toContain(
      'Le mandaste tu respuesta a Pedro',
    );
  });

  it('a quick answer fills the box and sends in one more tap', async () => {
    const { vivo } = montar();
    tap('aviso-responder-corte');
    tap('responder-rapida-No sé qué pasó');
    expect(screen.getByTestId('responder-rapida-No sé qué pasó').getAttribute('aria-checked')).toBe(
      'true',
    );
    tap('responder-enviar');
    await waitFor(() =>
      expect(vivo.responder).toHaveBeenCalledWith(
        'corte',
        'No sé qué pasó, no recuerdo nada fuera de lo normal.',
      ),
    );
  });

  it('an empty reply never reaches the write', async () => {
    const { vivo } = montar();
    tap('aviso-responder-corte');
    escribir('responder-texto', 'no');
    tap('responder-enviar');
    expect(screen.getByTestId('responder-error').textContent).toContain('Cuéntale un poco más');
    expect(vivo.responder).not.toHaveBeenCalled();
  });

  it('a failed write keeps the sheet, the text and says why', async () => {
    montar({
      vivo: { marcar: vi.fn(), responder: vi.fn(async () => Promise.reject(new Error('db'))) },
    });
    tap('aviso-responder-corte');
    escribir('responder-texto', 'Salió un vale y no lo registré.');
    tap('responder-enviar');
    await waitFor(() =>
      expect(screen.getByTestId('responder-error').textContent).toContain('no se guardó'),
    );
    expect(screen.queryByTestId('avisos-toast')).toBeNull();
  });

  it('a double tap sends one reply, not two', async () => {
    const { vivo } = montar();
    tap('aviso-responder-corte');
    escribir('responder-texto', 'Cobré una venta y no la capturé.');
    tap('responder-enviar');
    tap('responder-enviar');
    await waitFor(() => expect(vivo.responder).toHaveBeenCalledTimes(1));
  });
});

describe('AvisosScreen · estados', () => {
  const avisos = (xs: readonly Aviso[]): AvisosData => ({ dueno: 'Pedro', avisos: xs });

  it('sin-avisos: nothing from Pedro nor from the caja', () => {
    montar({ state: 'sin-avisos', data: avisos([]) });
    expect(screen.getByTestId('avisos-vacio').textContent).toContain('Nada por leer');
    expect(screen.getByTestId('avisos-vacio').textContent).toContain(
      'Ni mensajes de Pedro ni avisos de tu caja.',
    );
  });

  it('cargando: a spinner, never a guess', () => {
    montar({ state: 'cargando', data: null });
    expect(screen.getByTestId('avisos-cargando')).toBeInTheDocument();
    expect(screen.queryByText('Aclara el corte')).toBeNull();
  });

  it('error-al-leer: the title and the retry', () => {
    const { onRetry } = montar({ state: 'error', data: null });
    expect(screen.getByTestId('avisos-error').textContent).toContain('No pudimos leer tus avisos');
    fireEvent.click(screen.getByTestId('error-state-retry'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('an empty tab says who has not written', () => {
    montar({ data: avisos(AVISOS_FIXTURE.avisos.filter((a) => a.grupo === 'dueno')) });
    tap('avisos-tabs-caja');
    expect(screen.getByTestId('avisos-vacio').textContent).toContain(
      'Tu caja no tiene avisos del sistema.',
    );
  });
});
