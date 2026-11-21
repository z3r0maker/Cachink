import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReportResult } from '@xangarro/application';

import { initI18n } from '../../src/i18n/index';
import { ReportarHoja, type ReportarHojaProps } from '../../src/reportar/reportar-hoja';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';

/**
 * The report sheet (M-23, ADR-162; boards RpHoja and RpTableta): a tap is
 * enough to send, text is optional, and what happened to the report is said
 * in plain words: sent, kept for later, the daily limit, a full queue, or a
 * failure with a way to try again.
 */
initI18n();

function montar(over: Partial<ReportarHojaProps> = {}) {
  const onEnviar = vi.fn(async (): Promise<ReportResult> => 'sent');
  const onClose = vi.fn();
  renderWithProviders(
    <ReportarHoja
      open
      onClose={onClose}
      onEnviar={onEnviar}
      nombre="Ana Robledo"
      porEnviar={0}
      {...over}
    />,
  );
  return { onEnviar, onClose };
}

const opcion = (key: string) => screen.getByTestId(`reportar-opcion-${key}`);

describe('ReportarHoja', () => {
  beforeEach(() => vi.clearAllMocks());

  it('asks «¿Qué pasó?» with four cards, and sends with a tap and no text', async () => {
    const { onEnviar } = montar();
    expect(screen.getByText('¿Qué pasó?')).toBeInTheDocument();
    for (const label of ['No me dejó cobrar', 'Se trabó o se cerró', 'Un número no cuadra']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('Otra cosa')).toBeInTheDocument();
    expect(opcion('could_not_charge')).toHaveAttribute(
      'aria-label',
      'No me dejó cobrar. Una venta, un pago o el ticket',
    );
    expect(screen.getByTestId('reportar-enviar')).toBeEnabled();
    fireEvent.click(screen.getByTestId('reportar-enviar'));
    await waitFor(() => expect(onEnviar).toHaveBeenCalledTimes(1));
    expect(onEnviar).toHaveBeenCalledWith({ category: 'could_not_charge', description: '' });
  });

  it('sends the card that was tapped and the sentence that was written', async () => {
    const { onEnviar } = montar();
    fireEvent.click(opcion('wrong_number'));
    expect(opcion('wrong_number')).toHaveAttribute('aria-checked', 'true');
    expect(opcion('could_not_charge')).toHaveAttribute('aria-checked', 'false');
    fireEvent.change(screen.getByTestId('reportar-mas'), {
      target: { value: 'El corte marcó de menos' },
    });
    fireEvent.click(screen.getByTestId('reportar-enviar'));
    await waitFor(() =>
      expect(onEnviar).toHaveBeenCalledWith({
        category: 'wrong_number',
        description: 'El corte marcó de menos',
      }),
    );
  });

  it('thanks the person by first name once the report is in', async () => {
    const { onClose } = montar();
    fireEvent.click(screen.getByTestId('reportar-enviar'));
    expect(await screen.findByText('Gracias, Ana. Ya nos llegó.')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('reportar-listo'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('says it is kept and leaves by itself when there is no connection', () => {
    montar({ inicial: 'queued', porEnviar: 1 });
    expect(screen.getByText('Guardado. Se envía solo.')).toBeInTheDocument();
    expect(screen.getByTestId('reportar-por-enviar')).toHaveTextContent('1 reporte por enviar');
  });

  it('says the daily limit and a full queue in plain words, with nothing to retry', () => {
    montar({ inicial: 'limited' });
    expect(screen.getByText('Hoy ya nos llegaron muchos reportes')).toBeInTheDocument();
    expect(screen.queryByTestId('reportar-reintentar')).not.toBeInTheDocument();
  });

  it('names how many the device keeps when the queue is full', () => {
    montar({ inicial: 'queue_full' });
    expect(screen.getByText('Ya hay reportes guardados')).toBeInTheDocument();
    expect(screen.getByText(/guarda 5 reportes sin enviar/)).toBeInTheDocument();
  });

  it('offers to try again after a failure, and goes back to the form', async () => {
    const onEnviar = vi.fn(async (): Promise<ReportResult> => 'failed');
    montar({ onEnviar });
    fireEvent.click(screen.getByTestId('reportar-enviar'));
    expect(await screen.findByText('No se pudo enviar')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('reportar-reintentar'));
    expect(screen.getByTestId('reportar-formulario')).toBeInTheDocument();
  });

  it('cancels without sending, and thanks without a name when nobody is signed in', async () => {
    const { onEnviar, onClose } = montar({ nombre: null });
    fireEvent.click(screen.getByTestId('reportar-cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onEnviar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('reportar-enviar'));
    expect(await screen.findByText('Gracias. Ya nos llegó.')).toBeInTheDocument();
  });

  it('lays the four cards in the tablet’s dialog too', () => {
    montar({ ancho: true });
    expect(screen.getByTestId('reportar-opciones').children).toHaveLength(4);
  });
});
