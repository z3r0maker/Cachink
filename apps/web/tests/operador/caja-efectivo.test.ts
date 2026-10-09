// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, describe, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';

/**
 * Pago en efectivo: typed or tapped, with the change — or what is missing —
 * in big. The quick chips carry «Exacto» and the round bills at or above the
 * total, whole pesos type as «200» not «200.00», one «.» is enough, and
 * «Registrar venta» waits for the change to cover and fires exactly once per
 * smash (the sheet's own click-flush lesson).
 */

vi.mock('../../src/operador/shell/icon', () => ({
  Icon: () => createElement('span', { 'data-icon': true }),
}));
vi.mock('../../src/operador/ui/monto', () => ({
  MontoInput: (p: {
    readonly id: string;
    readonly value: string;
    readonly onChange: (v: string) => void;
    readonly trailing: object;
  }) =>
    createElement(
      'div',
      null,
      createElement('input', {
        'data-testid': p.id,
        value: p.value,
        onChange: (ev: { target: { value: string } }) => p.onChange(ev.target.value),
      }),
      p.trailing,
    ),
}));
vi.mock('../../src/operador/caja/cobro.css', () => ({ confirm: 'confirm' }));
vi.mock('../../src/operador/caja/efectivo.css', () => ({
  quick: 'quick',
  quickChip: 'quickChip',
  clear: 'clear',
  keypad: 'keypad',
  key: 'key',
  change: 'change',
  changeLabel: 'changeLabel',
  changeValue: 'changeValue',
}));

const { Efectivo } = await import('../../src/operador/caja/efectivo');
import type { Caja } from '../../src/operador/caja/use-caja';

const vender = vi.fn();

function montar(total: bigint) {
  const caja = {
    total,
    vender,
  } as unknown as Caja;
  render(createElement(Efectivo, { caja }));
  return caja;
}

const cambiar = (texto: string) => {
  fireEvent.change(screen.getByTestId('cx-recibido'), { target: { value: texto } });
};

afterEach(() => {
  cleanup();
  vender.mockClear();
});

describe('Efectivo', () => {
  it('nothing typed: Cambio at zero; the chips carry «Exacto» and the round bills', () => {
    montar(350_00n);
    assert.ok(screen.getByText('Cambio'));
    assert.ok(screen.getByText('Exacto'));
    assert.ok(screen.getByText('$500.00'));
    assert.ok(screen.getByText('$1,000.00') || screen.getByText('$1000.00'));
  });

  it('covering: the change in big; short: «Falta» with the missing amount', () => {
    montar(350_00n);
    cambiar('500');
    assert.ok(screen.getByText('Cambio'));
    assert.ok(screen.getByText('$150.00'));

    cambiar('200');
    assert.ok(screen.getByText('Falta'));
    assert.ok(screen.getByText('$150.00'));
  });

  it('the chips fill whole pesos — «200», not «200.00» — and «Exacto» covers exactly', () => {
    montar(350_00n);
    fireEvent.click(screen.getByText('$500.00'));
    assert.equal((screen.getByTestId('cx-recibido') as HTMLInputElement).value, '500');

    fireEvent.click(screen.getByText('Exacto'));
    const campo = screen.getByTestId('cx-recibido') as HTMLInputElement;
    assert.equal(campo.value, '350');
    assert.ok(screen.getByText('Cambio'));
  });

  it('a total with centavos types its decimals; the keypad and ⌫ work, one «.» only', () => {
    montar(350_50n);
    for (const k of ['2', '0', '0', '.', '5']) fireEvent.click(screen.getByText(k));
    assert.equal((screen.getByTestId('cx-recibido') as HTMLInputElement).value, '200.5');
    fireEvent.click(screen.getByText('.'));
    assert.equal((screen.getByTestId('cx-recibido') as HTMLInputElement).value, '200.5');
    fireEvent.click(screen.getByText('⌫'));
    assert.equal((screen.getByTestId('cx-recibido') as HTMLInputElement).value, '200.');

    fireEvent.click(screen.getByTitle('Borrar'));
    assert.equal((screen.getByTestId('cx-recibido') as HTMLInputElement).value, '');
  });

  it('«Registrar venta» waits for the change to cover, then sells once — Enter too', () => {
    montar(350_00n);
    const boton = screen.getByRole('button', { name: 'Registrar venta' });
    assert.equal(boton.disabled, true);

    fireEvent.click(screen.getByText('Exacto'));
    assert.equal(boton.disabled, false);
    fireEvent.click(boton);
    fireEvent.click(boton);
    assert.equal(vender.mock.calls.length, 1, 'a smash registers once');
    assert.deepEqual(vender.mock.calls[0]?.[0]?.metodo, 'Efectivo');
    assert.equal(vender.mock.calls[0]?.[0]?.cambio, 0n);

    cleanup();
    montar(350_00n);
    cambiar('400');
    fireEvent.keyDown(screen.getByTestId('cx-recibido').parentElement ?? document.body, {
      key: 'Enter',
    });
    assert.equal(vender.mock.calls.length, 2, 'Enter registers too');
  });

  it('an empty register (total zero) never sells', () => {
    montar(0n);
    cambiar('100');
    assert.equal(screen.getByRole('button', { name: 'Registrar venta' }).disabled, true);
  });
});
