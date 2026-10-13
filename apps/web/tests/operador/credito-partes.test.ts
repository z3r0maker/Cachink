// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, describe, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';

/**
 * The fiado step's parts (Track M): the client filter that looks through
 * accents and case, the row that says what they owe — or «Sin saldo» — and
 * what they would owe once chosen, and «Cliente nuevo» opening its name
 * field for the owner to review later.
 */

vi.mock('../../src/operador/shell/icon', () => ({
  Icon: () => createElement('span', { 'data-icon': true }),
}));
vi.mock('../../src/operador/ui/mostrador.css', () => ({
  etiqueta: 'etiqueta',
  campo: 'campo',
  campoInput: 'campoInput',
}));
vi.mock('../../src/operador/caja/credito.css', () => ({
  cliente: 'cliente',
  punto: 'punto',
  texto: 'texto',
  nombre: 'nombre',
  debe: 'debe',
  quedaria: 'quedaria',
  nuevo: 'nuevo',
  nuevoBoton: 'nuevoBoton',
  mas: 'mas',
  nuevoCampos: 'nuevoCampos',
  campo: 'campo',
  nota: 'nota',
}));

const { ClienteNuevo, ClienteRadio, filtrar } =
  await import('../../src/operador/caja/credito-partes');
import type { ClienteFiado } from '@xangarro/caja/caja';

const MARIA: ClienteFiado = { id: 'c-1', nombre: 'María López', telefono: '55', saldo: 550_00n };
const SIN_SALDO: ClienteFiado = { id: 'c-2', nombre: 'Lupita Ríos', telefono: '5', saldo: 0n };

afterEach(cleanup);

describe('filtrar', () => {
  it('matches through accents and case; empty shows everyone', () => {
    const clientes = [MARIA, SIN_SALDO];
    assert.deepEqual(filtrar(clientes, ''), clientes);
    assert.deepEqual(filtrar(clientes, 'maria'), [MARIA]);
    assert.deepEqual(filtrar(clientes, '  MARÍA '), [MARIA]);
    assert.deepEqual(filtrar(clientes, 'rios'), [SIN_SALDO]);
    assert.deepEqual(filtrar(clientes, 'nobody'), []);
  });
});

describe('ClienteRadio', () => {
  it('says what they owe; the chosen one adds what it would owe', () => {
    const onPick = vi.fn();
    render(createElement(ClienteRadio, { k: MARIA, total: 350_00n, on: false, onPick }));
    const boton = screen.getByRole('radio');
    assert.ok(screen.getByText('María López'));
    assert.ok(screen.getByText('Debe $550.00'));
    assert.ok(screen.queryByText(/Quedaría debiendo/) === null);
    assert.equal(boton.getAttribute('aria-checked'), 'false');

    fireEvent.click(boton);
    assert.equal(onPick.mock.calls.length, 1);
  });

  it('the chosen one shows the sum; a zero saldo says so', () => {
    render(createElement(ClienteRadio, { k: MARIA, total: 350_00n, on: true, onPick: vi.fn() }));
    assert.ok(screen.getByText('Quedaría debiendo $900.00'));

    cleanup();
    render(
      createElement(ClienteRadio, { k: SIN_SALDO, total: 100_00n, on: false, onPick: vi.fn() }),
    );
    assert.ok(screen.getByText('Sin saldo'));
  });
});

describe('ClienteNuevo', () => {
  it('opens on the button, types the name, closes back to null', () => {
    const onNombre = vi.fn();
    const { rerender } = render(createElement(ClienteNuevo, { nombre: null, onNombre }));
    const boton = screen.getByRole('button', { name: /Cliente nuevo/ });
    assert.equal(boton.getAttribute('aria-expanded'), 'false');
    assert.ok(screen.queryByLabelText('Nombre') === null);

    fireEvent.click(boton);
    assert.deepEqual(onNombre.mock.calls, [['']]);

    rerender(createElement(ClienteNuevo, { nombre: '', onNombre }));
    assert.ok(screen.getByLabelText('Nombre'));
    assert.ok(screen.getByText(/El dueño lo revisa en su portal/));

    const input = screen.getByLabelText('Nombre');
    fireEvent.change(input, { target: { value: 'Don Beto' } });
    assert.deepEqual(onNombre.mock.calls, [[''], ['Don Beto']]);

    rerender(createElement(ClienteNuevo, { nombre: 'Don Beto', onNombre }));
    fireEvent.click(screen.getByRole('button', { name: /Cliente nuevo/ }));
    assert.deepEqual(onNombre.mock.lastCall, [null]);
  });
});
