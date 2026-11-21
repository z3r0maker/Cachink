/**
 * «Registros por enviar» (M-09, board `Operador Pendientes`): the local
 * queue's face (RvEnvio): what waits in order with its money, the line of
 * each phase, the footer that flushes or requeues, what the server refused
 * with its sentence, and the states cargando and falla. It
 * replaces «No enviados», which showed only the rejections.
 */
import { describe, expect, it, vi } from 'vitest';
import type { RechazoVisto } from '@xangarro/caja/pendientes';
import { COLA_FIXTURE } from '@xangarro/caja/pendientes';
import { initI18n } from '../src/i18n/index';
import { PorEnviarScreen } from '../src/screens/Pendientes/por-enviar-screen';
import { fireEvent, renderWithProviders, screen } from './test-utils';

initI18n();

const tap = (id: string): void => {
  const el = screen.getByTestId(id);
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
};

const RECHAZADOS: readonly RechazoVisto[] = [
  {
    key: 'sales:r-1',
    tabla: 'sales',
    fila: 'r-1',
    titulo: 'Venta',
    detalle: '$120.00 · Tacos',
    razon: 'El producto de este registro ya no existe en el portal.',
    pista:
      'Pídeles a los patrones que recuperen el producto en el portal y toca Reintentar. No la vuelvas a capturar: se contaría dos veces.',
    reintentando: false,
  },
  {
    key: 'client_payments:r-2',
    tabla: 'client_payments',
    fila: 'r-2',
    titulo: 'Pago de cliente',
    detalle: 'Chuy',
    razon: 'El cliente de este registro ya no existe en el portal.',
    pista:
      'Pídeles a los patrones que recuperen el cliente en el portal y toca Reintentar. No lo vuelvas a capturar: se contaría dos veces.',
    reintentando: false,
  },
];

function montar(over: Record<string, unknown> = {}) {
  const onReintentar = vi.fn();
  const onReintentarRechazado = vi.fn();
  const onIrACierre = vi.fn();
  const onRetry = vi.fn();
  renderWithProviders(
    <PorEnviarScreen
      state="happy"
      fase="espera"
      cola={COLA_FIXTURE}
      rechazados={[]}
      ultima="14:55"
      onReintentar={onReintentar}
      onReintentarRechazado={onReintentarRechazado}
      onIrACierre={onIrACierre}
      onRetry={onRetry}
      {...over}
    />,
  );
  return { onReintentar, onReintentarRechazado, onIrACierre, onRetry };
}

describe('PorEnviarScreen · en-espera', () => {
  it('says what waits, in order, each with its state, time and money', () => {
    montar();
    expect(screen.getByText('Registros por enviar')).toBeInTheDocument();
    expect(screen.getByText('Lo que capturaste sin internet')).toBeInTheDocument();
    expect(screen.getByTestId('por-enviar-aviso').textContent).toBe(
      '3 registros por enviar. Puedes seguir cobrando; se envían solos.',
    );
    expect(screen.getByTestId('cola-fila-q-1').textContent).toContain('Venta V-0412');
    expect(screen.getByTestId('cola-fila-q-1').textContent).toContain('$160.00');
    expect(screen.getByTestId('cola-fila-q-3').textContent).toContain('−$620.00');
    expect(screen.getByTestId('cola-fila-q-1').textContent).toContain('En cola');
    expect(screen.getByText('Se envían en este orden')).toBeInTheDocument();
  });

  it('the footer «Reintentar ahora» runs the flush the pill runs (RvEnvio)', () => {
    const { onReintentar } = montar();
    expect(screen.getByTestId('por-enviar-reintentar').textContent).toBe('Reintentar ahora');
    tap('por-enviar-reintentar');
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });
});

describe('PorEnviarScreen · fases', () => {
  it('sin-internet: the line and the rows say they wait for the connection', () => {
    montar({ state: 'sin-internet', fase: 'sin-internet' });
    expect(screen.getByTestId('por-enviar-aviso').textContent).toBe(
      '3 registros esperan conexión. Puedes seguir cobrando; se envían solos.',
    );
    expect(screen.getByTestId('por-enviar-reintentar').textContent).toBe('Reintentar ahora');
    expect(screen.getAllByText('Esperando conexión').length).toBe(COLA_FIXTURE.length);
  });

  it('enviando: the line says so and the footer holds', () => {
    const { onReintentar } = montar({ fase: 'enviando' });
    expect(screen.getByTestId('por-enviar-aviso').textContent).toContain('Enviando 3 registros…');
    expect(screen.getByTestId('por-enviar-reintentar').textContent).toBe('Enviando…');
    tap('por-enviar-reintentar');
    expect(onReintentar).not.toHaveBeenCalled();
  });

  it('todo-enviado: Don and who already has it, with no button: the board has none (RvEnvio)', () => {
    montar({ fase: 'enviado', cola: [] });
    const card = screen.getByTestId('por-enviar-todo-enviado').textContent ?? '';
    expect(card).toContain('Todo está enviado');
    expect(card).toContain('Los patrones ya tienen lo que capturaste. Última vez a las 14:55.');
    expect(screen.queryByTestId('por-enviar-aviso')).toBeNull();
    expect(screen.queryByTestId('por-enviar-reintentar')).toBeNull();
    expect(screen.queryByTestId('por-enviar-todo-enviado-cta')).toBeNull();
  });

  it('todo-enviado offline keeps the queue view, not Don’s card', () => {
    montar({ state: 'sin-internet', fase: 'enviado', cola: [] });
    expect(screen.queryByTestId('por-enviar-todo-enviado')).toBeNull();
  });
});

describe('PorEnviarScreen · con-rechazados', () => {
  it('the server’s sentence and its hint on each card; the footer requeues them all', () => {
    const { onReintentarRechazado } = montar({
      fase: 'con-rechazados',
      cola: [],
      rechazados: RECHAZADOS,
    });
    expect(screen.queryByTestId('por-enviar-aviso')).toBeNull();
    expect(screen.getByTestId('rechazado-sales:r-1').textContent).toContain(
      'El producto de este registro ya no existe en el portal.',
    );
    expect(screen.getByTestId('rechazado-client_payments:r-2').textContent).toContain(
      'El cliente de este registro ya no existe en el portal.',
    );
    expect(screen.queryByTestId('rechazado-retry-sales:r-1')).toBeNull();
    expect(screen.getByTestId('por-enviar-reintentar').textContent).toBe('Reintentar');
    tap('por-enviar-reintentar');
    expect(onReintentarRechazado).toHaveBeenCalledWith(RECHAZADOS);
  });

  it('an automatic retry says so, and the footer has nothing to requeue', () => {
    const { onReintentarRechazado } = montar({
      fase: 'con-rechazados',
      cola: [],
      rechazados: [{ ...RECHAZADOS[0]!, reintentando: true }],
    });
    expect(screen.getByText('Reintentando automáticamente')).toBeInTheDocument();
    expect(screen.queryByTestId('rechazado-retry-sales:r-1')).toBeNull();
    tap('por-enviar-reintentar');
    expect(onReintentarRechazado).not.toHaveBeenCalled();
  });
});

describe('PorEnviarScreen · estados', () => {
  it('cargando: reading the cola, never a guess', () => {
    montar({ state: 'cargando' });
    expect(screen.getByTestId('por-enviar-cargando')).toBeInTheDocument();
    expect(screen.queryByTestId('cola-fila-q-1')).toBeNull();
  });

  it('falla: the title, the reassurance and the retry', () => {
    const { onRetry } = montar({ state: 'error' });
    expect(screen.getByTestId('por-enviar-error').textContent).toContain(
      'No pudimos leer la cola de esta caja',
    );
    fireEvent.click(screen.getByTestId('por-enviar-error-reintentar'));
    expect(onRetry).toHaveBeenCalled();
  });
});
