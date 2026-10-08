/**
 * «Recibir abono» and «Recordarle su saldo» (M-08): the abono sheet follows
 * the web's rules exactly — nothing registers until the amount parses, zero
 * is not an amount, and an abono above the balance is allowed and becomes
 * saldo a favor (D5). The reminder composes the wa.me link from the phone as
 * typed and the live message, and waits for all ten digits.
 */
import { describe, expect, it, vi } from 'vitest';
import { Linking } from 'react-native';
import { cuentaPorId } from '@xangarro/caja/cobranza';
import { initI18n } from '../src/i18n/index';
import { RecibirAbonoSheet } from '../src/screens/Cobranza/recibir-abono-sheet';
import { RecordarSaldoSheet } from '../src/screens/Cobranza/recordar-saldo-sheet';
import {
  abrirWhatsApp,
  digitos,
  enlaceWhatsApp,
  telefonoCompleto,
} from '../src/screens/Cobranza/recordar-saldo';
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

describe('recordar saldo · the link and the sheet', () => {
  it('composes the wa.me link from the phone as typed and the message', () => {
    expect(digitos('5512 447 903')).toBe('5512447903');
    expect(enlaceWhatsApp('5512 447 903', 'Te debemos nada')).toBe(
      'https://wa.me/525512447903?text=Te%20debemos%20nada',
    );
    expect(telefonoCompleto('5512 447 903')).toBe(true);
    expect(telefonoCompleto('5512')).toBe(false);
  });

  it('opens WhatsApp and confirms in a line; a phone without it says so', async () => {
    const puede = vi.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    const abre = vi.spyOn(Linking, 'openURL').mockResolvedValue();
    await expect(abrirWhatsApp('5512 447 903', 'Hola')).resolves.toContain('Se abrió WhatsApp');
    expect(abre).toHaveBeenCalledWith('https://wa.me/525512447903?text=Hola');
    abre.mockRejectedValue(new Error('sin app'));
    await expect(abrirWhatsApp('5512 447 903', 'Hola')).resolves.toContain(
      'No se pudo abrir WhatsApp',
    );
    puede.mockRestore();
    abre.mockRestore();
  });

  it('the sheet prefills phone and message and waits for ten digits', () => {
    renderWithProviders(
      <RecordarSaldoSheet
        open
        nombre="Taller de Chuy"
        telefono="5533 981 204"
        mensaje="Hola, Taller de Chuy. Tu saldo es de $860.00."
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Recordarle su saldo a Taller de Chuy')).toBeInTheDocument();
    expect((screen.getByTestId('recordar-telefono') as HTMLInputElement).value).toBe(
      '5533 981 204',
    );
    expect(screen.getByTestId('recordar-mensaje').textContent).toContain('$860.00');
    expect(screen.queryByText('Faltan números: son 10 dígitos.')).toBeNull();
    fireEvent.change(screen.getByTestId('recordar-telefono'), { target: { value: '5533' } });
    expect(screen.getByText('Faltan números: son 10 dígitos.')).toBeInTheDocument();
    expect(screen.getByTestId('recordar-abrir').getAttribute('aria-disabled')).toBe('true');
  });

  it('the message can be changed and put back', () => {
    renderWithProviders(
      <RecordarSaldoSheet
        open
        nombre="Chuy"
        telefono="5533 981 204"
        mensaje="original"
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('recordar-restaurar')).toBeNull();
    fireEvent.change(screen.getByTestId('recordar-mensaje'), { target: { value: 'cambiado' } });
    expect(screen.getByTestId('recordar-restaurar')).toBeInTheDocument();
    tap('recordar-restaurar');
    expect(screen.queryByTestId('recordar-restaurar')).toBeNull();
    expect(screen.getByTestId('recordar-mensaje').textContent).toContain('original');
  });
});
