/**
 * «Registros por enviar» (M-09, board `Operador Pendientes`): the local
 * queue's face — what waits in order with its money, the hero of each
 * phase, the retry that flushes, what the server refused with its sentence
 * and the retry that requeues it, and the states cargando and falla. It
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
    pista: 'El producto fue eliminado — regístrala con otro producto.',
    reintentando: false,
  },
  {
    key: 'client_payments:r-2',
    tabla: 'client_payments',
    fila: 'r-2',
    titulo: 'Pago de cliente',
    detalle: 'Chuy',
    razon: 'El cliente de este registro ya no existe en el portal.',
    pista: 'El cliente fue eliminado — regístrala sin cliente o con otro.',
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
      dueno="Pedro"
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
    expect(screen.getByTestId('por-enviar-heroe').textContent).toContain('3 registros por enviar');
    expect(screen.getByTestId('por-enviar-heroe').textContent).toContain('$283.00 de ventas');
    expect(screen.getByTestId('por-enviar-heroe').textContent).toContain('un gasto de $620.00');
    expect(screen.getByTestId('cola-fila-q-1').textContent).toContain('Venta V-0412');
    expect(screen.getByTestId('cola-fila-q-1').textContent).toContain('$160.00');
    expect(screen.getByTestId('cola-fila-q-3').textContent).toContain('−$620.00');
    expect(screen.getByTestId('cola-fila-q-1').textContent).toContain('En cola');
    expect(screen.getByText('Se envían en este orden')).toBeInTheDocument();
  });

  it('the retry button runs the flush the pill runs', () => {
    const { onReintentar } = montar();
    tap('por-enviar-reintentar');
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });
});

describe('PorEnviarScreen · fases', () => {
  it('sin-internet: the hero and the rows say they wait for the connection', () => {
    montar({ state: 'sin-internet', fase: 'sin-internet' });
    expect(screen.getByTestId('por-enviar-heroe').textContent).toContain(
      '3 registros esperan conexión',
    );
    expect(screen.getAllByText('Esperando conexión').length).toBe(COLA_FIXTURE.length);
  });

  it('enviando: the hero says so and the button rests', () => {
    const { onReintentar } = montar({ fase: 'enviando' });
    expect(screen.getByTestId('por-enviar-heroe').textContent).toContain('Enviando 3 registros…');
    expect(screen.getByTestId('por-enviar-heroe').textContent).toContain('Enviando…');
    tap('por-enviar-reintentar');
    expect(onReintentar).not.toHaveBeenCalled();
  });

  it('todo-enviado: nothing pending and the way to the cierre', () => {
    const { onIrACierre } = montar({ fase: 'enviado', cola: [] });
    expect(screen.getByTestId('por-enviar-heroe').textContent).toContain('Todo enviado');
    expect(screen.getByTestId('por-enviar-heroe').textContent).toContain('a las 14:55');
    expect(screen.getByTestId('cola-vacia').textContent).toContain('Nada pendiente');
    expect(screen.getByTestId('cola-vacia').textContent).toContain('el portal de Pedro');
    tap('cola-ir-cierre');
    expect(onIrACierre).toHaveBeenCalled();
  });
});

describe('PorEnviarScreen · con-rechazados', () => {
  it('the server’s sentence, its hint and the retry that requeues', () => {
    const { onReintentarRechazado } = montar({
      fase: 'con-rechazados',
      cola: [],
      rechazados: RECHAZADOS,
    });
    expect(screen.getByTestId('por-enviar-heroe').textContent).toContain(
      'El servidor no aceptó 2 registros',
    );
    expect(screen.getByTestId('rechazado-sales:r-1').textContent).toContain(
      'El producto de este registro ya no existe en el portal.',
    );
    expect(screen.getByTestId('rechazado-client_payments:r-2').textContent).toContain(
      'El cliente de este registro ya no existe en el portal.',
    );
    tap('rechazado-retry-sales:r-1');
    expect(onReintentarRechazado).toHaveBeenCalledWith([RECHAZADOS[0]]);
    tap('rechazados-retry-todos');
    expect(onReintentarRechazado).toHaveBeenCalledWith(RECHAZADOS);
  });

  it('an automatic retry says so and keeps no button', () => {
    montar({
      fase: 'con-rechazados',
      cola: [],
      rechazados: [{ ...RECHAZADOS[0]!, reintentando: true }],
    });
    expect(screen.getByText('Reintentando automáticamente')).toBeInTheDocument();
    expect(screen.queryByTestId('rechazado-retry-sales:r-1')).toBeNull();
    expect(screen.queryByTestId('rechazados-retry-todos')).toBeNull();
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
    fireEvent.click(screen.getByTestId('error-state-retry'));
    expect(onRetry).toHaveBeenCalled();
  });
});
