import { describe, expect, it, vi } from 'vitest';

import { FiadoScreen } from '../../src/screens/Checkout/fiado-screen';
import type { ClienteFiado } from '@xangarro/caja/caja';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';

/**
 * «Anótalo a su cuenta» (M-07, MvFiado): presentation only — but its states
 * are the flow's guardrails. No client chosen, no anotar; a search that
 * finds nobody says so and points at creating the client; a failed read
 * offers the same exit; and the action names exactly who and how much.
 */

const MARIA: ClienteFiado = {
  id: 'c-1',
  nombre: 'María López',
  telefono: '5512345678',
  saldo: 550_00n,
};

function montar(over: Record<string, unknown> = {}) {
  const onAnotar = vi.fn();
  renderWithProviders(
    <FiadoScreen
      folio="V-0413"
      total={350_00n}
      clientes={[MARIA]}
      cargando={false}
      registrando={false}
      error={null}
      dueno="Pedro"
      onAnotar={onAnotar}
      {...over}
    />,
  );
  return { onAnotar };
}

const textoDe = (testID: string): string => (screen.getByTestId(testID).textContent ?? '').trim();

/** RN-web's TextInput maps to an input whose change carries the text. */
function escribir(texto: string): void {
  fireEvent.change(screen.getByTestId('fiado-buscar'), { target: { value: texto } });
}

describe('FiadoScreen', () => {
  it('names the ticket and the amount, and the action waits for a client', () => {
    const { onAnotar } = montar();
    expect(screen.getByText('Anótalo a su cuenta')).toBeInTheDocument();
    expect(screen.getByText('V-0413 · $350.00')).toBeInTheDocument();
    expect(textoDe('fiado-anotar')).toContain('Elige a quién se lo anotas');
    fireEvent.click(screen.getByTestId('fiado-anotar'));
    expect(onAnotar).not.toHaveBeenCalled();
  });

  it('choosing a client names them and the amount on the action', async () => {
    const { onAnotar } = montar();
    await waitFor(() => expect(screen.getByText('María López')).toBeInTheDocument());
    fireEvent.click(screen.getByText('María López').closest('[role="radio"]') ?? document.body);
    expect(textoDe('fiado-anotar')).toContain('Anotar $350.00 a la cuenta de María López');
    fireEvent.click(screen.getByTestId('fiado-anotar'));
    expect(onAnotar).toHaveBeenCalledWith({ tipo: 'cliente', cliente: MARIA });
  });

  it('a search that finds nobody says so; a search that matches keeps them', () => {
    montar();
    escribir('Nadie');
    expect(screen.getByTestId('fiado-sin-resultados').textContent).toContain(
      'No hay nadie con ese nombre',
    );

    escribir('mar');
    expect(screen.getByText('María López')).toBeInTheDocument();
    expect(screen.queryByTestId('fiado-sin-resultados')).not.toBeInTheDocument();
  });

  it('an empty client list and a failed read each point at creating the client', () => {
    montar({ clientes: [] });
    expect(screen.getByTestId('fiado-sin-resultados').textContent).toContain(
      'Todavía no hay clientes',
    );

    montar({ clientes: null });
    expect(screen.getByTestId('fiado-error')).toBeInTheDocument();
  });

  it('while loading, a spinner instead of a guess', () => {
    montar({ cargando: true });
    expect(screen.getByTestId('fiado-cargando')).toBeInTheDocument();
  });
});
