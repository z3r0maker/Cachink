// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

/**
 * The CxC lines of Saldos iniciales (N-17): hand-edited lines, prefilled from
 * a .csv that names clientes that must already exist — a row whose cliente is
 * unknown is reported, never silently created, and a malformed sheet is an
 * error in its own words. The children are stubs; the csv parser, the client
 * sheet and `lineaDe` run real.
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../src/app/(portal)/_primeros/primeros.css', () => ({
  panel: 'panel',
  nota: 'nota',
}));
vi.mock('../src/app/(portal)/saldos-iniciales/cxc.css', () => ({
  aviso: 'aviso',
  cabeza: 'cabeza',
  cabezaTexto: 'cabezaTexto',
  titulo: 'titulo',
}));
vi.mock('../src/app/(portal)/_primeros/aviso', () => ({
  Aviso: (p: {
    readonly tono: string;
    readonly onCerrar: () => void;
    readonly accion?: ReactNode;
    readonly children: ReactNode;
  }) =>
    createElement(
      'div',
      { 'data-tono': p.tono },
      createElement('span', { id: 'aviso-texto' }, p.children),
      p.accion ?? null,
      createElement('button', { id: 'aviso-cerrar', onClick: p.onCerrar }, 'Cerrar aviso'),
    ),
}));
vi.mock('../src/app/(portal)/saldos-iniciales/tabla-lineas', () => ({
  TablaLineas: () => null,
}));
vi.mock('../src/app/(portal)/saldos-iniciales/pie-lineas', () => ({
  BotonCsv: (p: { readonly onArchivo: (f: File | null) => void }) =>
    createElement('input', {
      type: 'file',
      'data-testid': 'csv-input',
      onChange: (e: Event) => p.onArchivo((e.target as HTMLInputElement).files?.[0] ?? null),
    }),
  PieLineas: () => null,
}));

import type { Linea } from '../src/app/(portal)/saldos-iniciales/lineas';
import type { ClienteOpcion } from '../src/app/(portal)/saldos-iniciales/use-saldos';

const { LineasCxC } = await import('../src/app/(portal)/saldos-iniciales/lineas');

const ANA: ClienteOpcion = { id: 'c-1', nombre: 'Ana Robledo', telefono: '5512345678' };
const LUPITA: ClienteOpcion = { id: 'c-2', nombre: 'Lupita Ríos', telefono: null };

const roots: Root[] = [];
let ultima: Linea[] = [];
const escrituras: Linea[][] = [];

async function montar(
  props: { lineas?: Linea[]; editable?: boolean; clientes?: ClienteOpcion[] } = {},
): Promise<void> {
  ultima = props.lineas ?? [];
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  roots.push(root);
  await act(async () => {
    root.render(
      createElement(LineasCxC, {
        lineas: ultima,
        editable: props.editable ?? true,
        clientes: props.clientes ?? [ANA, LUPITA],
        cxc: 0n,
        setLineas: (fn: (ls: Linea[]) => Linea[]) => {
          ultima = fn(ultima);
          escrituras.push(ultima);
        },
      }),
    );
  });
}

async function subir(csv: string | null): Promise<void> {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  if (csv !== null) {
    const archivo = new File([csv], 'saldos.csv', { type: 'text/csv' });
    Object.defineProperty(input, 'files', { value: [archivo] });
    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    // The change handler is fire-and-forget (`void prellenar(f)`): the first
    // test also pays the dynamic `@/lib/csv` import. Wait for its effect.
    await vi.waitFor(() => {
      if (escrituras.length === 0 && texto() === null) throw new Error('prefill pendiente');
    });
    return;
  }
  await act(async () => {
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

const texto = () => document.querySelector('#aviso-texto')?.textContent ?? null;
const tono = () => document.querySelector('[data-tono]')?.getAttribute('data-tono') ?? null;

beforeEach(() => {
  escrituras.length = 0;
});

afterEach(async () => {
  for (const root of roots.splice(0)) {
    await act(async () => {
      root.unmount();
    });
  }
  document.body.innerHTML = '';
});

describe('LineasCxC · prellenar desde CSV', () => {
  it('matches clientes by name (trimmed, case-insensitive) and takes the saldo from the third column', async () => {
    await montar({
      lineas: [{ clave: 'nueva-1', clienteId: '', nombre: '', telefono: '', saldo: '' }],
    });
    await subir('nombre,telefono,saldo\n  ana robledo ,5512345678,100.50');
    assert.equal(escrituras.length, 1);
    const [linea] = escrituras[0] ?? [];
    assert.equal(linea?.clienteId, 'c-1');
    assert.equal(linea?.nombre, 'Ana Robledo');
    assert.equal(linea?.saldo, '100.50');
    // The empty hand-edited line the file replaces is gone.
    assert.equal(escrituras[0]?.length, 1);
    assert.equal(tono(), 'success');
    assert.equal(texto(), 'Prellené 1 saldo. Revísalos antes de guardar.');
  });

  it('a file for the same cliente replaces its line; other clientes keep theirs', async () => {
    const anaVieja: Linea = {
      clave: 'c-1',
      clienteId: 'c-1',
      nombre: 'Ana Robledo',
      telefono: '5512345678',
      saldo: '10.00',
    };
    const lupita: Linea = {
      clave: 'c-2',
      clienteId: 'c-2',
      nombre: 'Lupita Ríos',
      telefono: '',
      saldo: '20.00',
    };
    await montar({ lineas: [anaVieja, lupita] });
    await subir('nombre,telefono,saldo\nAna Robledo,,99.00');
    assert.deepEqual(
      escrituras[0]?.map((l) => [l.clienteId, l.saldo]),
      [
        ['c-2', '20.00'],
        ['c-1', '99.00'],
      ],
    );
  });

  it('unknown clientes are reported — named, capped at three — and never created', async () => {
    await montar();
    await subir('nombre,telefono,saldo\nAna Robledo,,5\nBeto,,1\nCaro,,1\nDiana,,1\nElena,,1');
    assert.equal(escrituras[0]?.length, 1); // sólo Ana
    assert.equal(tono(), 'warning');
    assert.equal(
      texto(),
      'Prellené 1 saldo. 4 sin match: Beto, Caro, Diana… no están en tus clientes.',
    );
    // The warning carries the way to fix it.
    assert.ok(document.querySelector('a')?.getAttribute('href'), '/importar?plantilla=clientes');
    // Y cerrar el aviso lo apaga.
    await act(async () => {
      document
        .querySelector('#aviso-cerrar')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    assert.equal(texto(), null);
  });

  it('one unknown cliente reads «no está», not «no están»', async () => {
    await montar();
    await subir('nombre,telefono,saldo\nDesconocido,,1');
    assert.equal(texto(), 'Prellené 0 saldos. 1 sin match: Desconocido no está en tus clientes.');
  });

  it('a sheet without the one required column is an error in its own words, and the lines do not move', async () => {
    await montar();
    await subir('telefono,saldo\n5512345678,10');
    assert.equal(escrituras.length, 0);
    assert.equal(tono(), 'critical');
    assert.equal(texto(), 'Faltan columnas: nombre');
  });

  it('a change event with no file behind it changes nothing', async () => {
    await montar();
    await subir(null);
    assert.equal(escrituras.length, 0);
    assert.equal(texto(), null);
  });

  it('a read-only owner gets no CSV button and no aviso', async () => {
    await montar({ editable: false });
    assert.equal(document.querySelector('input[type="file"]'), null);
    assert.equal(document.querySelector('[data-tono]'), null);
    assert.ok(document.querySelector('#cxc-t')); // the panel itself still renders
  });
});
