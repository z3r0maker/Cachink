// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';

/**
 * N-15's review: every change listed before anything is applied — none means
 * a no-op with its own Don and a plain «Listo» that skips the server. The
 * apply goes through `aplicarCambios` and lands on /como-empiezo; a failure
 * is the banner, not a dead button.
 */

const aplicarCambios = vi.fn();
const push = vi.fn();

vi.mock('../src/server/actions/onboarding', () => ({
  aplicarCambios: (...a: unknown[]) => aplicarCambios(...a),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/components', () => ({
  Banner: (p: { readonly title: string }) => createElement('div', null, p.title),
  Button: (p: {
    readonly children: unknown;
    readonly onClick?: () => void;
    readonly disabled?: boolean;
  }) => createElement('button', { onClick: p.onClick, disabled: p.disabled }, p.children),
  Card: (p: { readonly children: unknown }) => createElement('div', null, p.children),
}));
vi.mock('../src/onboarding/ui/onboarding.css', () => ({
  note: 'note',
  list: 'list',
  stack: 'stack',
  actions: 'actions',
}));
vi.mock('../src/onboarding/ui/stage.css', () => ({ hint: 'hint', question: 'question' }));
vi.mock('../src/onboarding/ui/stage', () => ({
  Stage: (p: { readonly children: unknown; readonly don: { readonly text: string } }) =>
    createElement('div', null, createElement('p', null, p.don.text), p.children),
}));

const { ReviewScreen } = await import('../src/app/(onboarding)/bienvenida/revisar/screen');

beforeEach(() => {
  vi.clearAllMocks();
  aplicarCambios.mockResolvedValue({ ok: true });
});

afterEach(cleanup);

describe('ReviewScreen', () => {
  it('changes listed; Don says nothing applies until the owner says so', () => {
    render(createElement(ReviewScreen, { lines: ['Régimen: RESICO', 'NIP nuevo: 4 dígitos'] }));
    assert.ok(screen.getByText(/Esto es lo que cambiaría/));
    assert.ok(screen.getByText(/Nada se aplica hasta que tú digas/));
    const cambios = screen.getByTestId('review-changes');
    assert.deepEqual(
      [...cambios.querySelectorAll('li')].map((li) => li.textContent),
      ['Régimen: RESICO', 'NIP nuevo: 4 dígitos'],
    );
    assert.ok(screen.getByRole('button', { name: 'Aplicar cambios' }));
    assert.ok(screen.getByRole('button', { name: 'Cambiar respuestas' }));
  });

  it('no changes: the no-op copy, and «Listo» goes straight on without the server', async () => {
    render(createElement(ReviewScreen, { lines: [] }));
    assert.ok(screen.getByText('No hay cambios'));
    assert.ok(screen.getByText('Todo queda igual.'));
    assert.ok(screen.getByText(/Tu negocio ya está como me dijiste/));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Listo' }));
    });
    assert.deepEqual(push.mock.calls, [['/como-empiezo']]);
    assert.equal(aplicarCambios.mock.calls.length, 0);
  });

  it('applying lands on /como-empiezo; a failure is the banner', async () => {
    render(createElement(ReviewScreen, { lines: ['Régimen: RESICO'] }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambios' }));
    });
    await waitFor(() => assert.deepEqual(push.mock.calls, [['/como-empiezo']]));

    cleanup();
    aplicarCambios.mockResolvedValue({
      ok: false,
      message: 'No pudimos guardar. Intenta de nuevo.',
    });
    render(createElement(ReviewScreen, { lines: ['Régimen: RESICO'] }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambios' }));
    });
    await waitFor(() => assert.ok(screen.getByText('No pudimos guardar. Intenta de nuevo.')));
    assert.equal(push.mock.calls.length, 1, 'no navigation on failure');
  });

  it('«Cambiar respuestas» goes back to the wizard', async () => {
    render(createElement(ReviewScreen, { lines: ['x'] }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cambiar respuestas' }));
    });
    assert.deepEqual(push.mock.calls, [['/bienvenida?modo=reconfigurar']]);
  });
});
