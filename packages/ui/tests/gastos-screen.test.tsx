/**
 * GastosScreen (Track M, M-08; RvGastos) — the states the boards draw: the
 * list with its two figures, the receipt note and the chips, one «Registrar
 * gasto» at the foot, sin gastos with Don, sin turno, cargando, con error,
 * and the two sheets' opening. Data comes from the caja package's
 * fixtures, as on the web screen.
 */
import { describe, expect, it, vi } from 'vitest';
import { GASTOS_FIXTURE, RECURRENTE_PAGAR_FIXTURE, type GastosData } from '@xangarro/caja/gastos';
import { initI18n } from '../src/i18n/index';
import { GastosScreen } from '../src/screens/Gastos/gastos-screen';
import { fireEvent, renderWithProviders, screen, waitFor } from './test-utils';

initI18n();

const DATA: GastosData = GASTOS_FIXTURE;

type Over = Partial<Parameters<typeof GastosScreen>[0]>;

function montar(over: Over = {}) {
  const onRetry = vi.fn();
  const onAbrirTurno = vi.fn();
  const registrar = vi.fn(() => Promise.resolve());
  renderWithProviders(
    <GastosScreen
      state="happy"
      data={DATA}
      turnoAbierto
      onAbrirTurno={onAbrirTurno}
      porPagar={[RECURRENTE_PAGAR_FIXTURE]}
      registrar={registrar}
      onRetry={onRetry}
      {...over}
    />,
  );
  return { onRetry, onAbrirTurno, registrar };
}

describe('GastosScreen · lista', () => {
  it('says the head, the two figures and the receipt note in one line', () => {
    montar();
    expect(screen.getByRole('heading').textContent).toBe('Gastos');
    expect(screen.getByText('Lo que salió de la caja en tu turno')).toBeInTheDocument();
    expect(screen.getByText('Salió de caja chica')).toBeInTheDocument();
    expect(screen.getByText('$620.00')).toBeInTheDocument();
    expect(screen.getByTestId('gastos-cuantos').textContent).toBe('5');
    expect(screen.getByTestId('gastos-sin-comprobante').textContent).toBe(
      '1 sin comprobante. Los patrones te lo van a preguntar.',
    );
    expect(screen.queryByText('Gastos del turno')).not.toBeInTheDocument();
  });

  it('has no search box: the chips are the only filter', () => {
    montar();
    expect(screen.queryByTestId('gastos-buscar')).not.toBeInTheDocument();
  });

  it('says nothing about receipts when every gasto has one', () => {
    montar({ data: { ...DATA, gastos: DATA.gastos.filter((g) => g.comprobante) } });
    expect(screen.queryByTestId('gastos-sin-comprobante')).not.toBeInTheDocument();
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

  it('opens the registrar sheet from the one button at the foot, and cancels back', () => {
    montar();
    fireEvent.click(screen.getByTestId('gastos-abrir-registrar'));
    expect(screen.getByTestId('registrar-gasto-sheet')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('gasto-cancelar'));
    expect(screen.queryByTestId('registrar-gasto-sheet')).not.toBeInTheDocument();
  });
});

describe('GastosScreen · filtros', () => {
  it('filters by category', () => {
    montar();
    fireEvent.click(screen.getByTestId('gastos-filtro-Insumos'));
    expect(screen.getByText('Carbón')).toBeInTheDocument();
    expect(screen.queryByText('Taxi por insumos')).not.toBeInTheDocument();
  });

  it('a category with nothing in it says so, and the chips stay', () => {
    montar();
    fireEvent.click(screen.getByTestId('gastos-filtro-Mantenimiento'));
    expect(screen.getByTestId('gastos-sin-resultados')).toBeInTheDocument();
    expect(screen.getByText('Nada en esta categoría')).toBeInTheDocument();
    expect(screen.getByTestId('gastos-filtro-Todos')).toBeInTheDocument();
  });
});

describe('GastosScreen · estados', () => {
  it('sin gastos: Don, one sentence, and the button still at the foot', () => {
    montar({ data: { ...DATA, gastos: [] }, porPagar: [] });
    expect(screen.getByTestId('gastos-sin-gastos')).toBeInTheDocument();
    expect(screen.getByText('No ha salido dinero de la caja')).toBeInTheDocument();
    expect(
      screen.getByText('Cuando pagues algo del negocio con efectivo, regístralo aquí.'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('gastos-cifras')).not.toBeInTheDocument();
    expect(screen.queryByTestId('gastos-filtros')).not.toBeInTheDocument();
    expect(screen.getByTestId('gastos-abrir-registrar')).toBeInTheDocument();
  });

  it('sin gastos keeps the due recurrent gastos to pay', () => {
    montar({ data: { ...DATA, gastos: [] } });
    expect(screen.getByTestId('gastos-pendientes')).toBeInTheDocument();
  });

  it('sin turno: no form to open, only «Abrir turno» (M8)', () => {
    const { onAbrirTurno } = montar({ turnoAbierto: false });
    expect(screen.getByText('Abre tu turno para registrar gastos')).toBeInTheDocument();
    expect(screen.queryByTestId('gastos-abrir-registrar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('gastos-pendientes')).not.toBeInTheDocument();
    expect(screen.queryByTestId('gastos-lista')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('gastos-sin-turno-cta'));
    expect(onAbrirTurno).toHaveBeenCalled();
  });

  it('cargando: a spinner, not a guess', () => {
    montar({ state: 'loading', data: null, porPagar: null });
    expect(screen.getByTestId('gastos-cargando')).toBeInTheDocument();
  });

  it('con error: says so and retries', () => {
    const { onRetry } = montar({ state: 'error', data: null, porPagar: null });
    expect(screen.getByTestId('gastos-error')).toBeInTheDocument();
    expect(screen.getByText('No pudimos cargar tus gastos')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('gastos-error-reintentar'));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('GastosScreen · prefill', () => {
  it('a due recurrent gasto Inicio sent opens the pagar sheet', async () => {
    montar({ prefill: RECURRENTE_PAGAR_FIXTURE.prefill });
    await waitFor(() => expect(screen.getByTestId('pagar-recurrente-sheet')).toBeInTheDocument());
  });

  it('without a turno the prefill opens nothing', () => {
    montar({ turnoAbierto: false, prefill: RECURRENTE_PAGAR_FIXTURE.prefill });
    expect(screen.queryByTestId('pagar-recurrente-sheet')).not.toBeInTheDocument();
  });
});
