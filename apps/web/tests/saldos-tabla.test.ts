// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, describe, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';

/**
 * The CxC table (N-17): every row is a client picked, a phone shown, a saldo
 * typed through the money-only filter, and a quitar — for the writer. An
 * unpicked row offers only the clients not already used on another row, the
 * avatar carries two initials from words longer than two letters, and an
 * empty table says so instead of rendering a lonely header.
 */

vi.mock('../src/app/(portal)/_primeros/primeros.css', () => ({
  texto: 'texto',
  nota: 'nota',
  panel: 'panel',
}));
vi.mock('../src/app/(portal)/saldos-iniciales/cxc.css', () => ({
  encabezados: 'encabezados',
  vacio: 'vacio',
  fila: 'fila',
  cliente: 'cliente',
  avatar: 'avatar',
  nombre: 'nombre',
  telefono: 'telefono',
  saldo: 'saldo',
  saldoInput: 'saldoInput',
  quitar: 'quitar',
  elegir: 'elegir',
  derecha: 'derecha',
}));

const { TablaLineas } = await import('../src/app/(portal)/saldos-iniciales/tabla-lineas');
import type { Linea } from '../src/app/(portal)/saldos-iniciales/lineas';
import type { ClienteOpcion } from '../src/app/(portal)/saldos-iniciales/use-saldos';

const ANA: ClienteOpcion = { id: 'c-1', nombre: 'Ana Robledo', telefono: '55' };
const LUPITA: ClienteOpcion = { id: 'c-2', nombre: 'Lupita Ríos', telefono: null };

const escogida = (over: Partial<Linea> = {}): Linea => ({
  clave: 'c-1',
  clienteId: 'c-1',
  nombre: 'Ana Robledo',
  telefono: '55',
  saldo: '100.50',
  ...over,
});

function montar(lineas: readonly Linea[], editable = true) {
  const setLineas = vi.fn();
  render(
    createElement(TablaLineas, {
      lineas,
      setLineas: setLineas as never,
      editable,
      clientes: [ANA, LUPITA],
      cxc: 0n,
    } as never),
  );
  return { setLineas };
}

afterEach(cleanup);

describe('TablaLineas', () => {
  it('an empty table says so — nobody owed anything is a fine answer', () => {
    montar([]);
    assert.ok(screen.getByText(/Sin saldos por cliente todavía/));
  });

  it('a picked row shows initials, name, phone, saldo, and quitar for the writer', () => {
    montar([escogida()]);
    assert.ok(screen.getByText('AR'));
    assert.ok(screen.getByText('Ana Robledo'));
    assert.equal(
      (screen.getByLabelText('Saldo de Ana Robledo') as HTMLInputElement).value,
      '100.50',
    );
    assert.ok(screen.getByRole('button', { name: 'Quitar a Ana Robledo' }));
  });

  it('quitar removes exactly that row', () => {
    const { setLineas } = montar([
      escogida(),
      escogida({ clave: 'c-2', clienteId: 'c-2', nombre: 'Lupita Ríos' }),
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Quitar a Lupita Ríos' }));
    const fn = setLineas.mock.calls[0]?.[0] as (ls: Linea[]) => Linea[];
    assert.deepEqual(
      fn([{ clave: 'x' } as Linea, { clave: 'c-2' } as Linea]).map((l) => l.clave),
      ['x'],
    );
  });

  it('typing a saldo keeps only money through the filter and updates that row alone', () => {
    const { setLineas } = montar([escogida()]);
    fireEvent.change(screen.getByLabelText('Saldo de Ana Robledo'), {
      target: { value: '12a3.5b0' },
    });
    const fn = setLineas.mock.calls[0]?.[0] as (ls: Linea[]) => Linea[];
    assert.equal(fn([escogida()])[0]?.saldo, '123.50');
  });

  it('an unpicked row offers only the clients no other row uses, and choosing maps the row', () => {
    const { setLineas } = montar([
      escogida({ clave: 'nueva-1', clienteId: '', nombre: '', telefono: '', saldo: '' }),
    ]);
    const select = screen.getByLabelText('Elige un cliente') as HTMLSelectElement;
    const opciones = [...select.querySelectorAll('option')].map((o) => o.value);
    assert.deepEqual(
      opciones,
      ['', 'c-1', 'c-2'],
      'every client the table has not claimed is offered',
    );

    fireEvent.change(select, { target: { value: 'c-1' } });
    const fn = setLineas.mock.calls[0]?.[0] as (ls: Linea[]) => Linea[];
    const fila = fn([
      { clave: 'nueva-1', clienteId: '', nombre: '', telefono: '', saldo: '' } as Linea,
    ])[0];
    assert.equal(fila?.clienteId, 'c-1');
    assert.equal(fila?.nombre, 'Ana Robledo');
    assert.equal(fila?.telefono, '55');
    assert.equal(fila?.clave, 'nueva-1');
  });

  it('read-only rows carry no quitar and a disabled saldo', () => {
    montar([escogida()], false);
    assert.ok((screen.getByLabelText('Saldo de Ana Robledo') as HTMLInputElement).disabled);
    assert.ok(screen.queryByRole('button') === null);
  });

  it('a client picked on another row is not offered again', () => {
    montar([
      escogida(),
      escogida({ clave: 'nueva-1', clienteId: '', nombre: '', telefono: '', saldo: '' }),
    ]);
    const select = screen.getByLabelText('Elige un cliente') as HTMLSelectElement;
    const opciones = [...select.querySelectorAll('option')].map((o) => o.value);
    assert.deepEqual(opciones, ['', 'c-2']);
  });

  it('a name without long words shows «?» for its avatar', () => {
    montar([escogida({ clienteId: 'c-9', clave: 'c-9', nombre: 'Li Wu' })]);
    assert.ok(screen.getByText('?'));
  });
});
