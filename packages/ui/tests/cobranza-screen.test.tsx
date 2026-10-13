/**
 * «Fiado y abonos» (M-08, MvCobranza*): the list screen's states and its one
 * write. The fixture accounts say the KPIs, the cards and today's abonos; the
 * filters and the search narrow the list; an empty business says nobody owes
 * anything; a failed read offers the retry; and recording an abono hands the
 * write to the route and says where it landed, or that it failed.
 */
import { describe, expect, it, vi } from 'vitest';
import { HOY } from '@xangarro/caja';
import { CUENTAS, type CuentaCliente } from '@xangarro/caja/cobranza';
import { initI18n } from '../src/i18n/index';
import { CobranzaScreen } from '../src/screens/Cobranza/cobranza-screen';
import { fireEvent, renderWithProviders, screen, waitFor } from './test-utils';

initI18n();

const DATOS = {
  cuentas: CUENTAS,
  hoy: HOY,
  negocio: 'Taquería Don Pedro',
  dueno: 'Pedro',
};

const [mari, chuy, , delgado] = CUENTAS;

function montar(over: Record<string, unknown> = {}) {
  const onRegistrar = vi.fn(async () => null);
  const onRetry = vi.fn();
  const onBack = vi.fn();
  renderWithProviders(
    <CobranzaScreen
      state="happy"
      data={DATOS}
      onRegistrar={onRegistrar}
      onRetry={onRetry}
      onBack={onBack}
      {...over}
    />,
  );
  return { onRegistrar, onRetry, onBack };
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

describe('CobranzaScreen · lista', () => {
  it('says the three figures, the cards and today’s abonos from the accounts', () => {
    montar();
    expect(screen.getByText('Fiado y abonos')).toBeInTheDocument();
    expect(screen.getByText('$1,780.00')).toBeInTheDocument();
    expect(screen.getByText('Tres clientes con saldo')).toBeInTheDocument();
    expect(screen.getByText('$760.00')).toBeInTheDocument();
    expect(screen.getByText('Tres abonos recibidos')).toBeInTheDocument();
    expect(screen.getByText('Abonos que recibiste hoy')).toBeInTheDocument();
    // The card, and the day's abono, each name the client.
    expect(screen.getAllByText('Taller de Chuy').length).toBe(2);
    expect(
      screen.getByText('2 ventas abiertas · la más antigua V-0288 del 28 abr'),
    ).toBeInTheDocument();
  });

  it('narrows by the filter chips and the search, and says so when nothing matches', () => {
    montar();
    tap('cobranza-filtro-Atrasados');
    expect(screen.queryByTestId('cobranza-cliente-mari')).toBeNull();
    expect(screen.getByTestId('cobranza-cliente-chuy')).toBeInTheDocument();
    escribir('cobranza-buscar', 'Delgado');
    expect(screen.getByTestId('cobranza-sin-resultados').textContent).toContain(
      'Ningún cliente coincide',
    );
    tap('cobranza-filtro-Todos');
    expect(screen.getByTestId('cobranza-cliente-delgado')).toBeInTheDocument();
  });

  it('a sin-saldo client keeps their card but loses the abono action', () => {
    montar();
    expect(screen.getByText('Sin saldo por cobrar')).toBeInTheDocument();
    expect(screen.queryByTestId(`cobranza-abonar-${delgado!.id}`)).toBeNull();
    expect(screen.getByTestId(`cobranza-ver-${delgado!.id}`)).toBeInTheDocument();
  });

  it('with no accounts at all, the empty state explains when someone appears', () => {
    montar({ data: { ...DATOS, cuentas: [] } });
    expect(screen.getByTestId('cobranza-vacio').textContent).toContain('Nadie te debe nada');
  });
});

describe('CobranzaScreen · states', () => {
  it('cargando: a spinner, never a guess', () => {
    montar({ state: 'cargando', data: null });
    expect(screen.getByTestId('cobranza-cargando')).toBeInTheDocument();
    expect(screen.queryByText('Doña Mari de la tienda')).toBeNull();
  });

  it('error-al-leer: the title, the reassurance and the retry', () => {
    const { onRetry } = montar({ state: 'error', data: null });
    expect(screen.getByTestId('cobranza-error').textContent).toContain(
      'No pudimos cargar el fiado',
    );
    fireEvent.click(screen.getByTestId('error-state-retry'));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('CobranzaScreen · the account and the write', () => {
  const abrirCuenta = (c: CuentaCliente): void => tap(`cobranza-ver-${c.id}`);

  it('a client’s account opens as a sheet with its four indicators', () => {
    montar();
    abrirCuenta(chuy!);
    expect(screen.getByTestId('cuenta-sheet')).toBeInTheDocument();
    expect(screen.getByText(/cliente desde enero 2026/)).toBeInTheDocument();
    expect(screen.getByTestId('cuenta-estado').textContent).toBe('Atrasado');
    expect(screen.getByTestId('cuenta-indicadores').textContent).toContain('Ventas abiertas');
    expect(screen.getByTestId('cuenta-indicadores').textContent).toContain('Lo fijó Pedro');
    expect(screen.getByText(/Pasó su límite|Puede fiar hasta/)).toBeInTheDocument();
  });

  it('recibir abono from the card, register, and the toast says where it landed', async () => {
    const { onRegistrar } = montar();
    tap(`cobranza-abonar-${mari!.id}`);
    escribir('abono-monto', '100');
    tap('abono-registrar');
    await waitFor(() =>
      expect(onRegistrar).toHaveBeenCalledWith({
        clienteId: mari!.id,
        metodo: 'Efectivo',
        monto: 100_00n,
      }),
    );
    await waitFor(() => expect(screen.getByTestId('cobranza-toast')).toBeInTheDocument());
    expect(screen.getByTestId('cobranza-toast').textContent).toContain('Abono registrado');
    expect(screen.getByTestId('cobranza-toast').textContent).toContain('$100.00 de Doña Mari');
  });

  it('a failed write replaces the toast with what went wrong', async () => {
    const fallo = 'No se pudo registrar el abono: sin negocio';
    montar({ onRegistrar: vi.fn(async () => fallo) });
    tap(`cobranza-abonar-${chuy!.id}`);
    escribir('abono-monto', '100');
    tap('abono-registrar');
    await waitFor(() => expect(screen.getByTestId('cobranza-toast').textContent).toContain(fallo));
  });
});
