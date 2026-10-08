/**
 * GastosScreen (Track M, M-08) — the states the boards draw: the list with
 * its figures and pendientes, the search and the chips, sin gastos, cargando,
 * con error, and the two sheets' opening. Data comes from the caja package's
 * fixtures, as on the web screen.
 */
import { describe, expect, it, vi } from 'vitest';
import { GASTOS_FIXTURE, RECURRENTE_PAGAR_FIXTURE, type GastosData } from '@xangarro/caja/gastos';
import { initI18n } from '../src/i18n/index';
import { GastosScreen } from '../src/screens/Gastos/gastos-screen';
import { fireEvent, renderWithProviders, screen, waitFor } from './test-utils';

initI18n();

const DATA: GastosData = { ...GASTOS_FIXTURE, dueno: 'Pedro' };

type Over = Partial<Parameters<typeof GastosScreen>[0]>;

function montar(over: Over = {}) {
  const onRetry = vi.fn();
  const registrar = vi.fn(() => Promise.resolve());
  renderWithProviders(
    <GastosScreen
      state="happy"
      data={DATA}
      porPagar={[RECURRENTE_PAGAR_FIXTURE]}
      registrar={registrar}
      onRetry={onRetry}
      {...over}
    />,
  );
  return { onRetry, registrar };
}

const escribir = (testID: string, texto: string): void => {
  fireEvent.change(screen.getByTestId(testID), { target: { value: texto } });
};

describe('GastosScreen · lista', () => {
  it('says the head, the three figures and the owner note', () => {
    montar();
    expect(screen.getByRole('heading').textContent).toBe('Gastos');
    expect(screen.getByText('Lo que salió de la caja en tu turno')).toBeInTheDocument();
    expect(screen.getByText('Gastos del turno')).toBeInTheDocument();
    expect(screen.getByText('$620.00')).toBeInTheDocument();
    expect(screen.getByText('Pedro te lo va a preguntar')).toBeInTheDocument();
  });

  it('lists the turno rows with the category and receipt chips', () => {
    montar();
    expect(screen.getByText('Carbón')).toBeInTheDocument();
    expect(screen.getByText('Carbonería La Flama · con foto')).toBeInTheDocument();
    expect(screen.getByText('−$240.00')).toBeInTheDocument();
    expect(screen.getByTestId('gasto-g-5')).toBeInTheDocument();
    expect(screen.getByTestId('gasto-comp-g-3').textContent).toContain('Sin comprobante');
    expect(screen.getByTestId('gasto-comp-g-5').textContent).toContain('Con foto');
  });

  it('offers the due recurrent gasto and opens its sheet', () => {
    montar();
    expect(screen.getByTestId('gastos-pendientes')).toBeInTheDocument();
    expect(screen.getByText('Gas del local')).toBeInTheDocument();
    expect(screen.getByText('Vence hoy')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('gastos-pagar-r-gas'));
    expect(screen.getByTestId('pagar-recurrente-sheet')).toBeInTheDocument();
    expect(screen.getByText('Pagar gas del local')).toBeInTheDocument();
  });

  it('opens the registrar sheet from the header button, and cancels back', () => {
    montar();
    fireEvent.click(screen.getByTestId('gastos-abrir-registrar'));
    expect(screen.getByTestId('registrar-gasto-sheet')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('gasto-cancelar'));
    expect(screen.queryByTestId('registrar-gasto-sheet')).not.toBeInTheDocument();
  });
});

describe('GastosScreen · filtros', () => {
  it('filters by category and searches without accents', () => {
    montar();
    fireEvent.click(screen.getByTestId('gastos-filtro-Insumos'));
    expect(screen.getByText('Carbón')).toBeInTheDocument();
    expect(screen.queryByText('Taxi por insumos')).not.toBeInTheDocument();
    escribir('gastos-buscar', 'carbonería');
    expect(screen.getByText('Carbón')).toBeInTheDocument();
    escribir('gastos-buscar', 'gas');
    expect(screen.getByTestId('gastos-sin-resultados')).toBeInTheDocument();
    expect(
      screen.getByText('Ningún gasto de tu turno coincide con lo que buscas.'),
    ).toBeInTheDocument();
  });
});

describe('GastosScreen · estados', () => {
  it('sin gastos: the board empty answer', () => {
    montar({ data: { ...DATA, gastos: [] }, porPagar: [] });
    expect(screen.getByTestId('gastos-sin-gastos')).toBeInTheDocument();
    expect(screen.getByText('Sin gastos en este turno')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Cuando saques dinero de la caja para algo del negocio, regístralo aquí con su comprobante.',
      ),
    ).toBeInTheDocument();
  });

  it('cargando: a spinner, not a guess', () => {
    montar({ state: 'loading', data: null, porPagar: null });
    expect(screen.getByTestId('gastos-cargando')).toBeInTheDocument();
  });

  it('con error: says so and retries', () => {
    const { onRetry } = montar({ state: 'error', data: null, porPagar: null });
    expect(screen.getByTestId('gastos-error')).toBeInTheDocument();
    expect(screen.getByText('No pudimos cargar tus gastos')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('error-state-retry'));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('GastosScreen · prefill', () => {
  it('a due recurrent gasto Inicio sent opens the pagar sheet', async () => {
    montar({ prefill: RECURRENTE_PAGAR_FIXTURE.prefill });
    await waitFor(() => expect(screen.getByTestId('pagar-recurrente-sheet')).toBeInTheDocument());
  });
});
