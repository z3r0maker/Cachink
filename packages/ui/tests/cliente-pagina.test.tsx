/**
 * A client's page on Fiado y abonos (RvFiado «Cliente»): the account with
 * its indicators and the owner's limit note, «Recibir abono» only while
 * they owe, the abono handed to the route with the toast saying where it
 * landed (or that it failed), the reminder with its three ways to send, and
 * Don's states when the account can't be read or isn't there.
 */
import { describe, expect, it, vi } from 'vitest';
import { HOY } from '@xangarro/caja';
import { cuentaPorId } from '@xangarro/caja/cobranza';
import { initI18n } from '../src/i18n/index';
import { ClienteScreen } from '../src/screens/Cobranza/cliente-screen';
import { fireEvent, renderWithProviders, screen, waitFor } from './test-utils';

initI18n();

const DATOS = { cuentas: [], hoy: HOY, negocio: 'Taquería Don Pedro' };

function montar(id: string | null, over: Record<string, unknown> = {}) {
  const onRegistrar = vi.fn(async () => null);
  const onRetry = vi.fn();
  renderWithProviders(
    <ClienteScreen
      state="happy"
      cuenta={id === null ? null : cuentaPorId(id)}
      data={DATOS}
      onRegistrar={onRegistrar}
      onRetry={onRetry}
      {...over}
    />,
  );
  return { onRegistrar, onRetry };
}

const tap = (id: string): void => {
  const el = screen.getByTestId(id);
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
};

const escribir = (id: string, texto: string): void => {
  fireEvent.change(screen.getByTestId(id), { target: { value: texto } });
};

describe('ClienteScreen · the account', () => {
  it('says who, the state, the indicators and the owner’s limit note', () => {
    montar('chuy');
    expect(screen.getByText(/cliente desde enero 2026/)).toBeInTheDocument();
    expect(screen.getByTestId('cuenta-estado').textContent).toBe('Atrasado');
    expect(screen.getByTestId('cuenta-indicadores').textContent).toContain('Ventas abiertas');
    expect(screen.getByTestId('cuenta-indicadores').textContent).toContain(
      'Lo fijaron los patrones · plazo 15 días',
    );
    expect(screen.getByText(/Pasó su límite|Puede fiar hasta/)).toBeInTheDocument();
  });

  it('a client who owes nothing gets no abono to receive', () => {
    montar('delgado');
    expect(screen.getByTestId('cuenta-abonar').textContent).toContain('Sin saldo por cobrar');
    tap('cuenta-abonar');
    expect(screen.queryByTestId('abono-monto')).toBeNull();
  });
});

describe('ClienteScreen · the abono', () => {
  it('records through the route and the toast says where it landed', async () => {
    const { onRegistrar } = montar('mari');
    tap('cuenta-abonar');
    escribir('abono-monto', '100');
    tap('abono-registrar');
    await waitFor(() =>
      expect(onRegistrar).toHaveBeenCalledWith({
        clienteId: 'mari',
        metodo: 'Efectivo',
        monto: 100_00n,
      }),
    );
    await waitFor(() => expect(screen.getByTestId('cliente-toast')).toBeInTheDocument());
    expect(screen.getByTestId('cliente-toast').textContent).toContain('Abono registrado');
    expect(screen.getByTestId('cliente-toast').textContent).toContain('$100.00 de Doña Mari');
  });

  it('a failed write replaces the toast with what went wrong', async () => {
    const fallo = 'No se pudo registrar el abono: sin negocio';
    montar('chuy', { onRegistrar: vi.fn(async () => fallo) });
    tap('cuenta-abonar');
    escribir('abono-monto', '100');
    tap('abono-registrar');
    await waitFor(() => expect(screen.getByTestId('cliente-toast').textContent).toContain(fallo));
  });

  it('opens with the abono up from Inicio’s «Cobrar a …»', () => {
    montar('mari', { abrirAbono: true });
    expect(screen.getByTestId('abono-monto')).toBeInTheDocument();
  });

  it('but not for a client who owes nothing', () => {
    montar('delgado', { abrirAbono: true });
    expect(screen.queryByTestId('abono-monto')).toBeNull();
  });
});

describe('ClienteScreen · the reminder', () => {
  it('writes it with the live balance, and offers three ways to send', () => {
    montar('chuy');
    tap('cuenta-recordar');
    const msg = screen.getByTestId('recordar-mensaje') as HTMLTextAreaElement;
    expect(msg.value).toContain('Taquería Don Pedro');
    expect(msg.value).toContain('$860.00');
    expect(screen.getByTestId('recordar-whatsapp')).toBeInTheDocument();
    expect(screen.getByTestId('recordar-mensajes')).toBeInTheDocument();
    expect(screen.getByTestId('recordar-compartir')).toBeInTheDocument();
  });
});

describe('ClienteScreen · states', () => {
  it('cargando: Don counting', () => {
    montar('mari', { state: 'cargando', data: null });
    expect(screen.getByTestId('cliente-cargando')).toBeInTheDocument();
  });

  it('a failed read offers the retry', () => {
    const { onRetry } = montar('mari', { state: 'error' });
    expect(screen.getByTestId('cliente-error').textContent).toContain('No pudimos leer la cuenta');
    fireEvent.click(screen.getByTestId('cliente-error-reintentar'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('a client this caja doesn’t have says so', () => {
    montar(null);
    expect(screen.getByTestId('cliente-error').textContent).toContain(
      'No encontramos a este cliente',
    );
  });
});
