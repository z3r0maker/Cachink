/**
 * Fiado y abonos (M-08) as the operator meets it: the list with its figures
 * and filters, a client's account, «Recibir abono» on the keypad and
 * «Recordarle su saldo». Presentational: every screen is fed its data.
 */
import { describe, expect, it, vi } from 'vitest';
import { CUENTAS, cuentaPorId } from '@xangarro/caja/cobranza';
import { initI18n } from '../../../src/i18n/index';
import { ClienteScreen } from '../../../src/screens/Cobranza/cliente-screen';
import { CobranzaScreen } from '../../../src/screens/Cobranza/cobranza-screen';
import { fireEvent, renderWithProviders, screen, waitFor } from '../../test-utils';

initI18n();

const HOY = '2026-05-14';

function tap(testID: string): void {
  const el = screen.getByTestId(testID);
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
}

describe('Fiado y abonos', () => {
  it.skip('sums what is owed and today’s abonos, and lists every client', () => {
    renderWithProviders(
      <CobranzaScreen
        state="happy"
        cuentas={CUENTAS}
        hoy={HOY}
        onAbrir={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    const resumen = screen.getByTestId('cobranza-resumen');
    expect(resumen).toHaveTextContent('$1,780.00');
    expect(resumen).toHaveTextContent('$760.00');
    expect(resumen).toHaveTextContent('$550.00');
    expect(screen.getByTestId('cobranza-cliente-chuy')).toHaveTextContent(
      'Abonó hoy · debe desde hace 16 días',
    );
    expect(screen.getByTestId('estado-chuy')).toHaveTextContent('Atrasado');
    expect(screen.getByTestId('estado-delgado')).toHaveTextContent('Sin saldo');
  });

  it.skip('filters by state and opens an account', () => {
    const onAbrir = vi.fn();
    renderWithProviders(
      <CobranzaScreen
        state="happy"
        cuentas={CUENTAS}
        hoy={HOY}
        onAbrir={onAbrir}
        onRetry={vi.fn()}
      />,
    );
    tap('cobranza-filtro-Atrasados');
    expect(screen.queryByTestId('cobranza-cliente-mari')).toBeNull();
    tap('cobranza-cliente-chuy');
    expect(onAbrir).toHaveBeenCalledWith('chuy');
  });

  it('says when it cannot read the accounts', () => {
    const onRetry = vi.fn();
    renderWithProviders(
      <CobranzaScreen state="error" cuentas={[]} hoy={HOY} onAbrir={vi.fn()} onRetry={onRetry} />,
    );
    expect(screen.getByTestId('cobranza-error')).toBeInTheDocument();
  });
});

describe('a client’s account', () => {
  const props = {
    state: 'happy' as const,
    hoy: HOY,
    negocio: 'Taquería Don Pedro',
    onRetry: vi.fn(),
  };

  it('shows the saldo, the open sales and the abonos', () => {
    renderWithProviders(
      <ClienteScreen {...props} cuenta={cuentaPorId('chuy')} onRecibir={vi.fn()} />,
    );
    expect(screen.getByTestId('cliente-saldo-monto')).toHaveTextContent('$860.00');
    expect(screen.getByTestId('cliente-dias-deuda')).toHaveTextContent('16 días');
    expect(screen.getByTestId('cliente-abiertas')).toHaveTextContent('V-0288');
    expect(screen.getByTestId('cliente-abonos')).toHaveTextContent('$400.00');
  });

  it('receives an abono on the keypad through the caller, then says where it went', async () => {
    const onRecibir = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <ClienteScreen {...props} cuenta={cuentaPorId('chuy')} onRecibir={onRecibir} />,
    );
    tap('cliente-abonar');
    ['5', '0', '0'].forEach((k) => tap(`abono-tecla-${k}`));
    expect(screen.getByTestId('abono-restante')).toHaveTextContent('$360.00');
    tap('abono-metodo-Transferencia');
    tap('abono-recibir');
    expect(onRecibir).toHaveBeenCalledWith('Transferencia', 500_00n);
    await waitFor(() => expect(screen.getByTestId('cliente-toast')).toBeInTheDocument());
    expect(screen.getByTestId('cliente-toast')).toHaveTextContent('queda $360.00');
  });

  it('a client who owes nothing gets no «Recibir abono»', () => {
    renderWithProviders(
      <ClienteScreen {...props} cuenta={cuentaPorId('delgado')} onRecibir={vi.fn()} />,
    );
    expect(screen.queryByTestId('cliente-abonar')).toBeNull();
    expect(screen.getByTestId('cliente-sin-saldo')).toBeInTheDocument();
  });

  it('writes the reminder with the live balance and the client’s number', () => {
    renderWithProviders(
      <ClienteScreen {...props} cuenta={cuentaPorId('chuy')} onRecibir={vi.fn()} abrirRecordar />,
    );
    const msg = screen.getByTestId('recordar-mensaje') as HTMLTextAreaElement;
    expect(msg.value).toContain('Te escribimos de Taquería Don Pedro');
    expect(msg.value).toContain('$860.00');
    expect(screen.queryByTestId('recordar-tel-malo')).toBeNull();
  });
});
