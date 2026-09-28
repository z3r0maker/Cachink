// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

/**
 * Cobrar from a PC keyboard (ADR-107): the shortcuts a keyboard-only cashier
 * lives in — type to search, Enter adds the first match, +/− change the last
 * line, F2 or Ctrl+Enter charges, Esc steps back. Every rule here is a refusal
 * of a keystroke that must NOT fire (a dialog owns the keyboard, a field other
 * than the search has focus, a modifier is down), and those refusals are the
 * branches a happy-path E2E walk never takes.
 */

// React 19's act needs the environment flag testing-library usually sets.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { BUSCAR_ID, useAtajosCaja } = await import('../../src/operador/caja/atajos');

interface CajaFalsa {
  readonly paso: string;
  readonly setPaso: ReturnType<typeof vi.fn>;
  readonly cobrar: ReturnType<typeof vi.fn>;
  readonly buscar: ReturnType<typeof vi.fn>;
  readonly add: ReturnType<typeof vi.fn>;
  readonly bump: ReturnType<typeof vi.fn>;
  query: string;
  productos: { readonly id: string }[];
  lines: { readonly productoId: string }[];
}

function cajaFalsa(over: Partial<CajaFalsa> = {}): CajaFalsa {
  const caja = {
    paso: 'catalogo',
    setPaso: vi.fn(),
    cobrar: vi.fn(),
    buscar: vi.fn((q: string) => {
      caja.query = q;
    }),
    add: vi.fn(),
    bump: vi.fn(),
    query: '',
    productos: [{ id: 'p-1' }],
    lines: [{ productoId: 'p-1' }],
    ...over,
  } as CajaFalsa;
  return caja;
}

const roots: Root[] = [];
let buscar: HTMLInputElement;

async function montar(caja: CajaFalsa): Promise<void> {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  roots.push(root);
  await act(async () => {
    root.render(
      createElement(() => {
        useAtajosCaja(caja as never);
        return null;
      }),
    );
  });
}

function tecla(
  key: string,
  opts: { target?: HTMLElement | Window; ctrl?: boolean; alt?: boolean } = {},
): KeyboardEvent {
  const target = opts.target ?? window;
  const ev = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ctrlKey: opts.ctrl ?? false,
    altKey: opts.alt ?? false,
  });
  target.dispatchEvent(ev);
  return ev;
}

beforeEach(() => {
  buscar = document.createElement('input');
  buscar.id = BUSCAR_ID;
  document.body.appendChild(buscar);
});

afterEach(async () => {
  for (const root of roots.splice(0)) {
    await act(async () => {
      root.unmount();
    });
  }
  document.body.innerHTML = '';
});

describe('useAtajosCaja', () => {
  it('F2 and Ctrl+Enter charge from the catalogue, and nothing else does', async () => {
    const caja = cajaFalsa();
    await montar(caja);
    assert.equal(tecla('F2').defaultPrevented, true);
    assert.equal(tecla('Enter', { ctrl: true }).defaultPrevented, true);
    assert.equal(caja.cobrar.mock.calls.length, 2);
    // A bare Enter is not Cobrar: it is not a letter either, so nothing fires.
    tecla('Enter');
    assert.equal(caja.cobrar.mock.calls.length, 2);
    assert.equal(caja.buscar.mock.calls.length, 0);
  });

  it('charging only exists on the catalogue step', async () => {
    const caja = cajaFalsa({ paso: 'cobro' });
    await montar(caja);
    tecla('F2');
    assert.equal(caja.cobrar.mock.calls.length, 0);
  });

  it('a dialog on top owns the keyboard, and Alt is left to the browser', async () => {
    const caja = cajaFalsa();
    await montar(caja);
    const dialogo = document.createElement('div');
    dialogo.setAttribute('role', 'dialog');
    document.body.appendChild(dialogo);
    tecla('F2');
    tecla('t'); // would have typed into the search
    dialogo.remove();
    tecla('t', { alt: true });
    assert.equal(caja.cobrar.mock.calls.length, 0);
    assert.equal(caja.buscar.mock.calls.length, 0);
  });

  it('Esc steps back to the catalogue, or clears the search when already there', async () => {
    const enCobro = cajaFalsa({ paso: 'cobro' });
    await montar(enCobro);
    tecla('Escape');
    assert.deepEqual(enCobro.setPaso.mock.calls, [['catalogo']]);
    assert.equal(enCobro.buscar.mock.calls.length, 0);

    const enCatalogo = cajaFalsa();
    await montar(enCatalogo);
    tecla('Escape', { target: buscar });
    assert.deepEqual(enCatalogo.buscar.mock.calls, [['']]);
    assert.equal(enCatalogo.setPaso.mock.calls.length, 0);
    // Esc with the search not focused does nothing.
    enCatalogo.buscar.mockClear();
    tecla('Escape');
    assert.equal(enCatalogo.buscar.mock.calls.length, 0);
  });

  it('Enter in the search adds the first match and clears it; an empty match adds nothing', async () => {
    const caja = cajaFalsa();
    await montar(caja);
    assert.equal(tecla('Enter', { target: buscar }).defaultPrevented, true);
    assert.deepEqual(caja.add.mock.calls, [[{ id: 'p-1' }]]);
    assert.deepEqual(caja.buscar.mock.calls, [['']]);

    const vacia = cajaFalsa({ productos: [] });
    await montar(vacia);
    tecla('Enter', { target: buscar });
    assert.equal(vacia.add.mock.calls.length, 0);
    // Any other key inside the search is the input's own business.
    vacia.buscar.mockClear();
    tecla('x', { target: buscar });
    assert.equal(vacia.buscar.mock.calls.length, 0);
  });

  it('+ and − change the last line, and only when there is one', async () => {
    const caja = cajaFalsa();
    await montar(caja);
    tecla('+');
    tecla('-');
    assert.deepEqual(caja.bump.mock.calls, [
      ['p-1', 1],
      ['p-1', -1],
    ]);

    const vacia = cajaFalsa({ lines: [] });
    await montar(vacia);
    tecla('+');
    assert.equal(vacia.bump.mock.calls.length, 0);
  });

  it('typing a letter lands in the search, focused; a space never does', async () => {
    const caja = cajaFalsa();
    await montar(caja);
    assert.equal(tecla('t').defaultPrevented, true);
    assert.deepEqual(caja.buscar.mock.calls, [['t']]);
    assert.equal(document.activeElement, buscar);
    // The second keystroke appends to what the first typed.
    tecla('a');
    assert.deepEqual(caja.buscar.mock.calls, [['t'], ['ta']]);

    caja.buscar.mockClear();
    tecla(' ');
    assert.equal(caja.buscar.mock.calls.length, 0);
  });

  it('a field other than the search keeps its keystrokes', async () => {
    const caja = cajaFalsa();
    await montar(caja);
    const nota = document.createElement('textarea');
    document.body.appendChild(nota);
    tecla('t', { target: nota });
    tecla('+', { target: nota });
    assert.equal(caja.buscar.mock.calls.length, 0);
    assert.equal(caja.bump.mock.calls.length, 0);
  });

  it('a letter with Ctrl, or away from the catalogue, is not a search either', async () => {
    const conCtrl = cajaFalsa();
    await montar(conCtrl);
    tecla('t', { ctrl: true });
    assert.equal(conCtrl.buscar.mock.calls.length, 0);

    const enCobro = cajaFalsa({ paso: 'cobro' });
    await montar(enCobro);
    tecla('t');
    assert.equal(enCobro.buscar.mock.calls.length, 0);
  });

  it('a letter with no search input on the page does not open a phantom search', async () => {
    const caja = cajaFalsa();
    await montar(caja);
    buscar.remove();
    const ev = tecla('t');
    assert.equal(ev.defaultPrevented, false);
    assert.equal(caja.buscar.mock.calls.length, 0);
  });
});
