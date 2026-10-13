// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, describe, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import type { OperadorPara } from '../../src/operador/runtime/protocol';

/**
 * The NIP entry's state machine (ADR-072 §3: the three-strike limit is ours,
 * not the server's): pick, type, verify; three wrong NIPs clear the pick and
 * the counter. A register with one operator comes pre-picked. The physical
 * keyboard feeds the same keys, and never steals a keystroke meant for an
 * input.
 */

afterEach(cleanup);

import type { Tecla } from '../../src/operador/acceso/nip-estado';

const { useNip, useTecladoFisico } = await import('../../src/operador/acceso/nip-estado');

const ANA: OperadorPara = { id: 'op-1', nombre: 'Ana Robledo' } as never;
const PEDRO: OperadorPara = { id: 'op-2', nombre: 'Pedro García' } as never;

function montar(operadores: readonly OperadorPara[], exito = true) {
  const verificar = vi.fn(async () => ({ success: exito }));
  const onAutenticado = vi.fn();
  const hook = renderHook(() =>
    useNip({ operadores, verificar: verificar as never, onAutenticado }),
  );
  return { hook, verificar, onAutenticado };
}

async function teclear(hook: { result: { current: { press: (k: Tecla) => void } } }, nip: string) {
  for (const k of nip) await act(async () => hook.result.current.press(k as Tecla));
}

describe('useNip', () => {
  it('a lone operator arrives pre-picked; a pair does not', () => {
    const solo = montar([ANA]);
    assert.equal(solo.hook.result.current.elegido?.id, 'op-1');

    const par = montar([ANA, PEDRO]);
    assert.equal(par.hook.result.current.elegido, null);
  });

  it('typing: digits land up to four, ⌫ takes one back, and nothing types without a pick', async () => {
    const { hook } = montar([ANA]);
    await teclear(hook, '258');
    assert.equal(hook.result.current.nip, '258');
    await teclear(hook, '0');
    assert.equal(hook.result.current.nip, '2580');
    await teclear(hook, '9');
    assert.equal(hook.result.current.nip, '2580', 'four is the limit');

    await act(async () => hook.result.current.press('⌫'));
    assert.equal(hook.result.current.nip, '258');
  });

  it('a good NIP authenticates the operator', async () => {
    const { hook, onAutenticado } = montar([ANA], true);
    await teclear(hook, '2580');
    await act(async () => hook.result.current.press('→'));
    assert.deepEqual(onAutenticado.mock.calls, [['op-1']]);
  });

  it('three wrong NIPs clear the pick and the counter; one and two do not', async () => {
    const { hook, verificar } = montar([ANA, PEDRO], false);
    const estado = hook.result.current;
    await act(async () => estado.elegir(PEDRO));

    for (let i = 2; i >= 1; i -= 1) {
      await teclear(hook, '1111');
      await act(async () => hook.result.current.press('→'));
      assert.equal(hook.result.current.fallidos, 3 - i);
      assert.equal(hook.result.current.restantes, i);
      assert.equal(hook.result.current.elegido?.id, 'op-2', 'the pick survives two misses');
      assert.equal(verificar.mock.calls.length, 3 - i);
    }

    await teclear(hook, '1111');
    await act(async () => hook.result.current.press('→'));
    assert.equal(hook.result.current.elegido, null, 'three strikes clear the pick');
    assert.equal(hook.result.current.fallidos, 0, 'and the counter for the next picker');
    assert.equal(hook.result.current.nip, '');
  });

  it('a partial NIP does not ask the verifier; a new pick resets everything', async () => {
    const { hook, verificar } = montar([ANA, PEDRO]);
    const estado = hook.result.current;
    await act(async () => estado.elegir(PEDRO));
    await teclear(hook, '25');
    await act(async () => hook.result.current.press('→'));
    assert.equal(verificar.mock.calls.length, 0);

    await act(async () => hook.result.current.elegir(ANA));
    assert.equal(hook.result.current.nip, '');
    assert.equal(hook.result.current.elegido?.id, 'op-1');
  });

  it('nothing types with no pick, and Enter with nobody chosen asks nothing', async () => {
    const { hook, verificar } = montar([ANA, PEDRO]);
    await teclear(hook, '2580');
    assert.equal(hook.result.current.nip, '', 'digits need a pick');
    await act(async () => hook.result.current.press('→'));
    assert.equal(verificar.mock.calls.length, 0);
  });
});

describe('useTecladoFisico', () => {
  function montarTeclado() {
    const press = vi.fn();
    renderHook(() => useTecladoFisico(press));
    const tipear = (tecla: string, target?: HTMLElement) => {
      const ev = new KeyboardEvent('keydown', { key: tecla, bubbles: true });
      const destino = target ?? document.body;
      Object.defineProperty(ev, 'target', { value: destino });
      act(() => {
        destino.dispatchEvent(ev);
      });
    };
    return { press, tipear };
  }

  it('digits, Backspace and Enter feed the pad; an input keeps its keystrokes', () => {
    const { press, tipear } = montarTeclado();
    tipear('7');
    tipear('Backspace');
    tipear('Enter');
    assert.deepEqual(
      press.mock.calls.map((c) => c[0]),
      ['7', '⌫', '→'],
    );

    const input = document.createElement('input');
    document.body.appendChild(input);
    press.mockClear();
    tipear('7', input);
    tipear('Enter', input);
    assert.equal(press.mock.calls.length, 0, 'the input owns its keys');
  });

  it('Enter on a button is the button’s, not the pad’s', () => {
    const { press, tipear } = montarTeclado();
    const boton = document.createElement('button');
    document.body.appendChild(boton);
    tipear('Enter', boton);
    assert.equal(press.mock.calls.length, 0);
  });
});
