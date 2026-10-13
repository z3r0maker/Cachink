// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';

/**
 * «Tu plan ideal» (N-12, P-36 D-1): the price with its annual toggle — every
 * figure + IVA — the pending answers tagged with the plan that carries them,
 * and the three doors: a paid plan offers Checkout (or, in the beta, keeps the
 * choice and configures with its own notice), and the free plan starts with
 * «Empezar gratis» and no price card at all.
 */

const probarGratis = vi.fn();
const seguirGratis = vi.fn();
const push = vi.fn();
const assign = vi.fn();

vi.mock('../src/server/actions/onboarding', () => ({
  probarGratis: (...a: unknown[]) => probarGratis(...a),
  seguirGratis: (...a: unknown[]) => seguirGratis(...a),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/components', () => ({
  Banner: (p: { readonly title: string }) =>
    createElement('div', { 'data-testid': 'banner' }, p.title),
  Button: (p: {
    readonly children: unknown;
    readonly onClick?: () => void;
    readonly disabled?: boolean;
    readonly variant?: string;
  }) => createElement('button', { onClick: p.onClick, disabled: p.disabled }, p.children),
  Card: (p: { readonly children: unknown }) => createElement('div', null, p.children),
  Switch: (p: {
    readonly checked: boolean;
    readonly onCheckedChange: (v: boolean) => void;
    readonly label: string;
  }) =>
    createElement(
      'button',
      {
        'data-testid': 'anual',
        role: 'switch',
        'aria-checked': String(p.checked),
        onClick: () => p.onCheckedChange(!p.checked),
      },
      p.label,
    ),
  Tag: (p: { readonly children: unknown }) => createElement('span', null, p.children),
}));
vi.mock('../src/onboarding/ui/onboarding.css', () => ({
  note: 'note',
  list: 'list',
  stack: 'stack',
  actions: 'actions',
  price: 'price',
  row: 'row',
  rowTitle: 'rowTitle',
}));
vi.mock('../src/onboarding/ui/stage.css', () => ({ hint: 'hint', question: 'question' }));
vi.mock('../src/onboarding/ui/stage', () => ({
  Stage: (p: { readonly children: unknown }) => createElement('div', null, p.children),
}));

const locationOriginal = window.location;

const { PlanScreen } = await import('../src/app/(onboarding)/bienvenida/plan/screen');
import { priceLabel } from '../src/onboarding/plan-copy';

function montar(
  over: { plan?: 'xangarro' | 'xangarrito'; beta?: boolean; pending?: unknown[] } = {},
) {
  render(
    createElement(PlanScreen, {
      plan: over.plan ?? 'xangarro',
      headline: 'Para vender todos los días',
      pending: (over.pending ?? []) as never,
      beta: over.beta ?? false,
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  const original = window.location;
  Object.defineProperty(window, 'location', {
    value: { ...original, assign: (...a: unknown[]) => assign(...a) },
    configurable: true,
  });
  probarGratis.mockResolvedValue({ ok: true, redirect: null, beta: false });
  seguirGratis.mockResolvedValue({ ok: true });
});

afterEach(() => {
  cleanup();
  Object.defineProperty(window, 'location', { value: locationOriginal, configurable: true });
});

describe('PlanScreen · the price', () => {
  it('the monthly figure first, the annual toggle changes it', () => {
    montar();
    assert.equal(screen.getByTestId('plan-price').textContent, priceLabel('xangarro', 'mensual'));
    fireEvent.click(screen.getByTestId('anual'));
    assert.equal(screen.getByTestId('plan-price').textContent, priceLabel('xangarro', 'anual'));
  });

  it('the beta’s note replaces the card note (P-36 D-1)', () => {
    montar({ beta: true });
    assert.ok(screen.getByText(/Durante la beta no cobramos\./));
    cleanup();
    montar({ beta: false });
    assert.ok(screen.getByText(/Pagas con tarjeta/));
  });
});

describe('PlanScreen · the pending answers', () => {
  it('each is tagged with the plan that carries it; none renders nothing', () => {
    montar({ pending: [{ answer: 'venderMas', includedIn: 'xangarro' }] });
    assert.ok(screen.getByRole('list', { name: /pediste y viene en un plan de pago/ }));

    cleanup();
    montar();
    assert.ok(screen.queryByRole('list') === null);
  });
});

describe('PlanScreen · a paid plan', () => {
  it('Contratar goes to Checkout and the browser follows the redirect', async () => {
    probarGratis.mockResolvedValue({
      ok: true,
      redirect: 'https://checkout.stripe.com/x',
      beta: false,
    });
    montar();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Contratar este plan' }));
    });
    await waitFor(() => assert.deepEqual(assign.mock.calls, [['https://checkout.stripe.com/x']]));
    assert.deepEqual(probarGratis.mock.calls, [['xangarro', 'mensual']]);
  });

  it('the beta keeps the choice with its own notice (D-1)', async () => {
    probarGratis.mockResolvedValue({ ok: true, redirect: null, beta: true });
    montar();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Contratar este plan' }));
    });
    await waitFor(() => assert.ok(screen.getByTestId('banner')));
    assert.ok(screen.getByText(/Durante la beta no cobramos/));
    assert.equal(assign.mock.calls.length, 0);
  });

  it('a refusal is the banner, in its own words', async () => {
    probarGratis.mockResolvedValue({ ok: false, message: 'No pudimos empezar el pago.' });
    montar();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Contratar este plan' }));
    });
    await waitFor(() => assert.ok(screen.getByText('No pudimos empezar el pago.')));
  });

  it('Seguir gratis lands on /como-empiezo', async () => {
    montar();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Seguir gratis' }));
    });
    await waitFor(() => assert.deepEqual(push.mock.calls, [['/como-empiezo']]));
  });
});

describe('PlanScreen · the free plan', () => {
  it('no price card, no Contratar — Empezar gratis starts', async () => {
    montar({ plan: 'xangarrito' });
    assert.ok(screen.queryByTestId('plan-price') === null);
    assert.ok(screen.queryByRole('button', { name: /Contratar/ }) === null);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Empezar gratis' }));
    });
    await waitFor(() => assert.deepEqual(push.mock.calls, [['/como-empiezo']]));
    assert.equal(seguirGratis.mock.calls.length, 1);
  });
});
