/**
 * «Fiado y abonos» (M-08, RvFiado): the list screen's states. The fixture
 * accounts say the KPIs, the compact rows and today's abonos; the filters
 * and the search narrow the list; a row opens the client's page; an empty
 * business says nobody owes anything; a failed read offers the retry. The
 * account and the abono are the client's page (`cliente-pagina.test.tsx`).
 */
import { describe, expect, it, vi } from 'vitest';
import { HOY } from '@xangarro/caja';
import { CUENTAS } from '@xangarro/caja/cobranza';
import { initI18n } from '../src/i18n/index';
import { CobranzaScreen } from '../src/screens/Cobranza/cobranza-screen';
import { fireEvent, renderWithProviders, screen } from './test-utils';

initI18n();

const DATOS = {
  cuentas: CUENTAS,
  hoy: HOY,
  negocio: 'Taquería Don Pedro',
  dueno: 'Pedro',
};

function montar(over: Record<string, unknown> = {}) {
  const onAbrirCliente = vi.fn();
  const onRetry = vi.fn();
  const onBack = vi.fn();
  renderWithProviders(
    <CobranzaScreen
      state="happy"
      data={DATOS}
      onAbrirCliente={onAbrirCliente}
      onRetry={onRetry}
      onBack={onBack}
      {...over}
    />,
  );
  return { onAbrirCliente, onRetry, onBack };
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
  it('says the three figures, the compact rows and today’s abonos', () => {
    montar();
    expect(screen.getByText('Fiado y abonos')).toBeInTheDocument();
    expect(screen.getByText('$1,780.00')).toBeInTheDocument();
    expect(screen.getByText('Tres clientes con saldo')).toBeInTheDocument();
    expect(screen.getByText('$760.00')).toBeInTheDocument();
    expect(screen.getByText('Abonos que recibiste hoy')).toBeInTheDocument();
    // The row, and the day's abono, each name the client.
    expect(screen.getAllByText('Taller de Chuy').length).toBe(2);
    const chuy = screen.getByTestId('cobranza-cliente-chuy').textContent ?? '';
    expect(chuy).toContain('$860.00');
    expect(chuy).toContain('Atrasado');
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

  it('a row has no buttons: it opens the client’s page', () => {
    const { onAbrirCliente } = montar();
    expect(screen.queryByText('Recibir abono')).toBeNull();
    tap('cobranza-cliente-delgado');
    expect(onAbrirCliente).toHaveBeenCalledWith('delgado');
  });

  it('a client who owes nothing says so on the row, with no mark', () => {
    montar();
    const fila = screen.getByTestId('cobranza-cliente-delgado').textContent ?? '';
    expect(fila).toContain('No debe nada');
    expect(fila).toContain('$0.00');
    expect(fila).not.toContain('Atrasado');
  });

  it('with no accounts at all, the empty state explains when someone appears', () => {
    montar({ data: { ...DATOS, cuentas: [] } });
    expect(screen.getByTestId('cobranza-vacio').textContent).toContain('Nadie te debe nada');
  });
});

describe('CobranzaScreen · states', () => {
  it('cargando: Don counting, never a guess', () => {
    montar({ state: 'cargando', data: null });
    expect(screen.getByTestId('cobranza-cargando')).toBeInTheDocument();
    expect(screen.queryByText('Doña Mari de la tienda')).toBeNull();
  });

  it('error-al-leer: the title, the reassurance and the retry', () => {
    const { onRetry } = montar({ state: 'error', data: null });
    expect(screen.getByTestId('cobranza-error').textContent).toContain(
      'No pudimos cargar el fiado',
    );
    fireEvent.click(screen.getByTestId('cobranza-error-reintentar'));
    expect(onRetry).toHaveBeenCalled();
  });
});
