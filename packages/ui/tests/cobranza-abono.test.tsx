/**
 * «Recibir abono» and «Recordarle su saldo» (M-08): the abono sheet follows
 * the web's rules exactly — nothing registers until the amount parses, zero
 * is not an amount, and an abono above the balance is allowed and becomes
 * saldo a favor (D5). The reminder is `RecordarSheet`'s (MvRecordarSaldo),
 * tested with the client's page.
 */
import { describe, expect, it, vi } from 'vitest';
import { cuentaPorId } from '@xangarro/caja/cobranza';
import { initI18n } from '../src/i18n/index';
import { RecibirAbonoSheet } from '../src/screens/Cobranza/recibir-abono-sheet';
import { fireEvent, renderWithProviders, screen } from './test-utils';

initI18n();

const mari = cuentaPorId('mari');

function abono(over: Record<string, unknown> = {}) {
  const onGuardar = vi.fn(async () => null);
  renderWithProviders(
    <RecibirAbonoSheet open cuenta={mari!} onClose={vi.fn()} onGuardar={onGuardar} {...over} />,
  );
  return { onGuardar };
}

const tap = (id: string): void => {
  const el = screen.getByTestId(id);
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
};

const monto = (texto: string): void => {
  fireEvent.change(screen.getByTestId('abono-monto'), { target: { value: texto } });
};

describe('RecibirAbonoSheet · validation, the web’s rules', () => {
  it('names the client and their balance, and waits for an amount', () => {
    const { onGuardar } = abono();
    expect(screen.getByText('Abono de Doña Mari de la tienda')).toBeInTheDocument();
    expect(screen.getByTestId('abono-sheet').textContent).toContain('$340.00');
    expect(screen.getByTestId('abono-registrar').textContent).toContain('Escribe cuánto abona');
    tap('abono-registrar');
    expect(onGuardar).not.toHaveBeenCalled();
    expect(screen.getByText(/Elige un monto/)).toBeInTheDocument();
  });

  it('zero is not an amount, and neither is a malformed one', () => {
    const { onGuardar } = abono();
    monto('0');
    expect(screen.getByTestId('abono-registrar').textContent).toContain('Escribe cuánto abona');
    monto('12.34.5');
    expect(screen.getByTestId('abono-registrar').textContent).toContain('Escribe cuánto abona');
    tap('abono-registrar');
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('a quick amount fills the field and says where it lands, oldest first', () => {
    abono();
    const todo = screen.getByTestId('abono-rapido-34000');
    expect(todo.textContent).toContain('Todo · $340.00');
    tap('abono-rapido-34000');
    expect((screen.getByTestId('abono-monto') as HTMLInputElement).value).toBe('340');
    expect(screen.getByText(/Se aplica a:/).textContent).toContain('V-0361 completa');
  });

  it('an abono above the balance registers whole and says the excess is a su favor (D5)', () => {
    const { onGuardar } = abono();
    monto('500');
    expect(screen.getByTestId('abono-sheet').textContent).toContain('$160.00 a su favor');
    tap('abono-registrar');
    expect(onGuardar).toHaveBeenCalledWith('Efectivo', 500_00n);
  });

  it('the method chips pick how it pays, and the amount hands over whole', async () => {
    const { onGuardar } = abono();
    monto('100');
    tap('abono-metodo-Transferencia');
    tap('abono-registrar');
    expect(onGuardar).toHaveBeenCalledWith('Transferencia', 100_00n);
  });
});
