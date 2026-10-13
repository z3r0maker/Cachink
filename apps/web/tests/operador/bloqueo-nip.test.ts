// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, describe, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { createElement } from 'react';

/**
 * The lock's NIP entry (OpBloqueo): four dots that say how many landed, the
 * wrong-NIP line only when it is true, the keypad's every key reporting
 * itself, «Entrar» armed by the fourth digit — and a physical keyboard that
 * types the NIP too, without stealing an input's or a button's keystrokes.
 */

vi.mock('../../src/operador/caja/bloqueo-nip.css', () => ({
  nipHead: 'nipHead',
  nipAyuda: 'nipAyuda',
  error: 'error',
  teclado: 'teclado',
  tecla: 'tecla',
  puntos: 'puntos',
  punto: 'punto',
}));

const { NipPad, Entrar, teclaDe, useTeclado } = await import('../../src/operador/caja/bloqueo-nip');

afterEach(cleanup);

describe('NipPad', () => {
  it('four dots, filled by what is typed; the count is spoken', () => {
    render(
      createElement(NipPad, {
        nip: '25',
        error: false,
        onKey: vi.fn(),
        accion: createElement('span'),
      }),
    );
    const puntos = screen.getByTestId('bloqueo-nip');
    assert.equal(puntos.getAttribute('aria-label'), '2 de 4 números escritos');
    const llenos = puntos.querySelectorAll('[data-lleno]').length;
    assert.equal(llenos, 2);
  });

  it('the wrong-NIP line appears only when it is true', () => {
    const { rerender } = render(
      createElement(NipPad, {
        nip: '',
        error: false,
        onKey: vi.fn(),
        accion: createElement('span'),
      }),
    );
    assert.ok(screen.queryByTestId('bloqueo-error') === null);

    rerender(
      createElement(NipPad, {
        nip: '2580',
        error: true,
        onKey: vi.fn(),
        accion: createElement('span'),
      }),
    );
    assert.ok(screen.getByRole('alert').textContent?.includes('NIP incorrecto'));
  });

  it('every key reports itself', () => {
    const onKey = vi.fn();
    render(createElement(NipPad, { nip: '', error: false, onKey, accion: createElement('span') }));
    for (const k of ['7', '⌫', '0']) {
      fireEvent.click(screen.getByTestId(`bloqueo-tecla-${k}`));
    }
    assert.deepEqual(
      onKey.mock.calls.map((c) => c[0]),
      ['7', '⌫', '0'],
    );
  });
});

describe('Entrar', () => {
  it('waits for the fourth digit, then arms', () => {
    const onEntrar = vi.fn();
    render(createElement(Entrar, { listo: false, label: 'Desbloquear', onEntrar }));
    const boton = screen.getByTestId('bloqueo-entrar');
    assert.equal(boton.disabled, true);

    cleanup();
    render(createElement(Entrar, { listo: true, label: 'Desbloquear', onEntrar }));
    fireEvent.click(screen.getByTestId('bloqueo-entrar'));
    assert.equal(onEntrar.mock.calls.length, 1);
  });
});

describe('teclaDe', () => {
  const manejar = (nip: string) => {
    const setNip = vi.fn();
    const onOk = vi.fn();
    const t = teclaDe(setNip, nip, onOk);
    return { setNip, onOk, t };
  };

  it('digits land up to four; ⌫ takes one back; OK asks', () => {
    const a = manejar('258');
    a.t('0');
    assert.deepEqual(a.setNip.mock.calls, [['2580']]);

    const b = manejar('2580');
    b.t('9');
    assert.deepEqual(b.setNip.mock.calls, [['2580']], 'four is the limit');

    const c = manejar('258');
    c.t('⌫');
    assert.deepEqual(c.setNip.mock.calls, [['25']]);

    const d = manejar('2580');
    d.t('OK');
    assert.equal(d.onOk.mock.calls.length, 1);
    assert.equal(d.setNip.mock.calls.length, 0);
  });
});

describe('useTeclado', () => {
  function montarTeclado() {
    const onKey = vi.fn();
    renderHook(() => useTeclado(onKey));
    const tipear = (tecla: string, target?: HTMLElement) => {
      const ev = new KeyboardEvent('keydown', { key: tecla, bubbles: true });
      const destino = target ?? document.body;
      Object.defineProperty(ev, 'target', { value: destino });
      act(() => {
        destino.dispatchEvent(ev);
      });
    };
    return { onKey, tipear };
  }

  it('digits, Backspace and Enter feed the pad', () => {
    const { onKey, tipear } = montarTeclado();
    tipear('7');
    tipear('Backspace');
    tipear('Enter');
    assert.deepEqual(
      onKey.mock.calls.map((c) => c[0]),
      ['7', '⌫', 'OK'],
    );
  });

  it('an input keeps its keystrokes; Enter on a button is the button’s', () => {
    const { onKey, tipear } = montarTeclado();
    const input = document.createElement('input');
    document.body.appendChild(input);
    tipear('7', input);
    tipear('Enter', input);

    const boton = document.createElement('button');
    document.body.appendChild(boton);
    tipear('Enter', boton);
    assert.equal(onKey.mock.calls.length, 0);
  });
});
