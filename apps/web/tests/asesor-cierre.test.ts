// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import type { MetasPageData } from '../src/server/metas';

/**
 * The month-end dialog (P-27), both variants: a goal met offers to raise the
 * bar or hold it; a goal missed offers to hold or soften it — and every
 * choice re-fixes the goal at the level it names, except «Cambiar», which
 * goes back to the wizard. The dialog's copy states the verdict in money.
 */

const fijarMetaAction = vi.fn(async () => ({ ok: true }));
const recargar = vi.fn();

vi.mock('@/components', () => ({
  Card: (p: { readonly children: unknown }) => createElement('div', null, p.children),
  Button: (p: { readonly children: unknown; readonly onClick?: () => void }) =>
    createElement('button', { onClick: p.onClick }, p.children),
}));
vi.mock('@/styles/text.css', () => ({ eyebrow: 'eyebrow' }));
vi.mock('../src/server/actions/metas', () => ({ fijarMetaAction }));

const { CierreDialog, CierreReciente } = await import('../src/app/(portal)/asesor/cierre');

const NIVELES = [
  { id: 'empujon', pct: 10, mensual: 110_00n, diario: 3_00n },
  { id: 'reto', pct: 20, mensual: 120_00n, diario: 4_00n },
  { id: 'ambicioso', pct: 30, mensual: 130_00n, diario: 4_00n },
] as never[];

const cerrada = (lograda: boolean) =>
  ({
    id: 'm-1',
    objetivo: 'vender',
    motivo: 'colchon',
    nivel: 'reto',
    periodo: '2026-04',
    lograda,
    resultadoCentavos: lograda ? 132_00n : 95_00n,
    objetivoCentavos: 120_00n,
  }) as never;

let locationOriginal: Location | undefined;

beforeEach(() => {
  locationOriginal = window.location;
});

afterEach(() => {
  cleanup();
  if (locationOriginal !== undefined) {
    Object.defineProperty(window, 'location', { value: locationOriginal, configurable: true });
  }
  fijarMetaAction.mockClear();
  recargar.mockClear();
});

describe('CierreDialog', () => {
  it('a goal met says so in money and offers to raise the bar or hold it', () => {
    const onElección = vi.fn();
    render(
      createElement(CierreDialog, {
        meta: cerrada(true),
        niveles: NIVELES,
        onElección: onElección as never,
      }),
    );
    assert.ok(screen.getByText(/¡La lograste! \$132\.00/));
    assert.ok(screen.getByText('Subir el reto · +30%'));
    assert.ok(screen.getByText('Repetir · +20%'));
    assert.ok(screen.queryByText(/Bajar un nivel/) === null);

    fireEvent.click(screen.getByText('Subir el reto · +30%'));
    assert.deepEqual(onElección.mock.calls, [['subir']]);
  });

  it('a goal missed states the shortfall and offers to hold or soften it', () => {
    const onElección = vi.fn();
    render(
      createElement(CierreDialog, {
        meta: cerrada(false),
        niveles: NIVELES,
        onElección: onElección as never,
      }),
    );
    assert.ok(screen.getByText(/Quedaste en \$95\.00 de \$120\.00/));
    assert.ok(screen.getByText('Repetir · +20%'));
    assert.ok(screen.getByText('Bajar un nivel · +10%'));
    assert.ok(screen.queryByText(/Subir el reto/) === null);

    fireEvent.click(screen.getByText('Bajar un nivel · +10%'));
    assert.deepEqual(onElección.mock.calls, [['bajar']]);
  });

  it('«Cambiar» is always there', () => {
    render(
      createElement(CierreDialog, {
        meta: cerrada(true),
        niveles: NIVELES,
        onElección: vi.fn() as never,
      }),
    );
    fireEvent.click(screen.getByText('Cambiar'));
  });
});

describe('CierreReciente · what each choice does', () => {
  function montar() {
    const onCambiar = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', {
      value: { ...original, reload: () => recargar() },
      configurable: true,
    });
    render(
      createElement(CierreReciente, {
        data: { recienCerrada: cerrada(true), niveles: NIVELES } as unknown as MetasPageData,
        onCambiar,
      }),
    );
    return { onCambiar };
  }

  it('subir re-fixes the goal at ambicioso and reloads', async () => {
    montar();
    fireEvent.click(screen.getByText('Subir el reto · +30%'));
    await vi.waitFor(() => assert.ok(fijarMetaAction.mock.calls.length === 1));
    assert.deepEqual(fijarMetaAction.mock.calls[0]?.[0], {
      objetivo: 'vender',
      motivo: 'colchon',
      nivel: 'ambicioso',
    });
    await vi.waitFor(() => assert.equal(recargar.mock.calls.length, 1));
  });

  it('repetir keeps the closed goal’s own level', async () => {
    montar();
    fireEvent.click(screen.getByText('Repetir · +20%'));
    await vi.waitFor(() =>
      assert.deepEqual(fijarMetaAction.mock.calls[0]?.[0], {
        objetivo: 'vender',
        motivo: 'colchon',
        nivel: 'reto',
      }),
    );
  });

  it('cambiar goes back to the wizard — no re-fix, no reload', () => {
    const { onCambiar } = montar();
    fireEvent.click(screen.getByText('Cambiar'));
    assert.equal(onCambiar.mock.calls.length, 1);
    assert.equal(fijarMetaAction.mock.calls.length, 0);
    assert.equal(recargar.mock.calls.length, 0);
  });
});
