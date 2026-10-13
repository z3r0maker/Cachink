// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, describe, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(cleanup);
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';

/**
 * The shared loading · empty · error block of every operator screen
 * (OpEstados). The happy state is the screen's own; these three are the ones
 * every screen shares — including the promise the error state makes to the
 * cashier: your data is safe on this computer, try again.
 */

const refresh = vi.fn();
vi.mock('../../src/operador/estado.css', () => ({
  loadingCard: 'loadingCard',
  scene: 'scene',
  coin: 'coin',
  don: 'don',
  frase: 'frase',
  sub: 'sub',
  rows: 'rows',
  row: 'row',
  rowTile: 'rowTile',
  rowBar: 'rowBar',
  rowBarShort: 'rowBarShort',
  emptyCard: 'emptyCard',
  title: 'title',
  body: 'body',
  action: 'action',
  errorCard: 'errorCard',
  safe: 'safe',
  spin: 'spin',
}));
vi.mock('../../src/components/don/don', () => ({
  Don: (p: { readonly pose: string; readonly size: number }) =>
    createElement('span', { 'data-don': p.pose }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
vi.mock('next/link', () => ({
  default: (p: { readonly href: string; readonly children: unknown }) =>
    createElement('a', { href: p.href }, p.children),
}));

window.matchMedia = ((q: string) => ({ matches: false, media: q })) as never;

const { OperadorEstado } = await import('../../src/operador/estado');

describe('OperadorEstado', () => {
  it('loading: a status the screen reader hears, with Don counting', () => {
    render(createElement(OperadorEstado, { mode: 'loading' }));
    const carta = screen.getByRole('status');
    assert.equal(carta.getAttribute('aria-busy'), 'true');
    assert.ok(carta.textContent?.includes('Don Cuentas está sacando tus números'));
  });

  it('empty: the default copy, and the action only when both label and href arrive', () => {
    const { unmount } = render(createElement(OperadorEstado, { mode: 'empty' }));
    assert.ok(screen.getByText('Nada por aquí todavía'));
    assert.ok(screen.queryByRole('link') === null);
    unmount();

    render(
      createElement(OperadorEstado, {
        mode: 'empty',
        cta: 'Capturar una venta',
        href: '/operador/caja',
      }),
    );
    const accion = screen.getByRole('link');
    assert.equal(accion.getAttribute('href'), '/operador/caja');
    assert.ok(accion.textContent?.includes('Capturar una venta'));
  });

  it('empty honours the screen’s own words', () => {
    render(
      createElement(OperadorEstado, {
        mode: 'empty',
        emptyTitle: 'Sin ventas hoy',
        emptyBody: 'Cuando cobres, aparece aquí.',
      }),
    );
    assert.ok(screen.getByText('Sin ventas hoy'));
    assert.ok(screen.getByText('Cuando cobres, aparece aquí.'));
  });

  it('error: the data-safe promise, a retry that calls what was given', async () => {
    const onRetry = vi.fn();
    render(
      createElement(OperadorEstado, {
        mode: 'error',
        errorTitle: 'No pudimos leer el catálogo',
        onRetry,
      }),
    );
    assert.ok(screen.getByRole('alert'));
    assert.ok(screen.getByText(/Tus datos están a salvo en esta computadora/));
    assert.ok(screen.getByText('No pudimos leer el catálogo'));

    const boton = screen.getByRole('button', { name: /Intentar de nuevo/ });
    act(() => {
      fireEvent.click(boton);
    });
    assert.equal(onRetry.mock.calls.length, 1);
    // «Intentando…» for a beat, then the button returns.
    assert.ok(screen.getByText('Intentando…'));
    await waitFor(() => assert.ok(screen.getByText('Intentar de nuevo')), { timeout: 2500 });
  });

  it('error without a retry refreshes the page’s loader', async () => {
    render(createElement(OperadorEstado, { mode: 'error' }));
    await waitFor(() => {
      const b = screen.getByRole('button', { name: /^Intentar de nuevo$/ });
      if (b.disabled) throw new Error('todavía girando');
    });
    fireEvent.click(screen.getByRole('button', { name: /^Intentar de nuevo$/ }));
    assert.equal(refresh.mock.calls.length, 1);
  });
});
