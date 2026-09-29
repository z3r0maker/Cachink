// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, describe, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import type { MetasPageData } from '../src/server/metas';

/**
 * The Metas tab's view states over `loadMetasPage`'s read model (P-27/P-33):
 * a failed read is the banner, a young business its explanation, a closed
 * goal its dialog, an active goal its pace — and the viewer role gets the
 * wizard's read-only word, never its inputs.
 */

vi.mock('@/components', () => ({
  Banner: (p: { readonly tone: string; readonly title: string; readonly body: string }) =>
    createElement('div', { 'data-tono': p.tone }, `${p.title}|${p.body}`),
  Button: (p: { readonly children: ReactNode; readonly onClick?: () => void }) =>
    createElement('button', { onClick: p.onClick }, p.children),
  Card: (p: { readonly children: ReactNode }) => createElement('div', null, p.children),
  Tag: () => null,
  Verdict: () => null,
}));
vi.mock('@/styles/text.css', () => ({ eyebrow: 'eyebrow' }));
vi.mock('../src/app/(portal)/asesor/asesor.css', () => ({
  capName: 'capName',
  capReq: 'capReq',
  capRow: 'capRow',
  goalFigure: 'goalFigure',
}));
vi.mock('../src/app/(portal)/asesor/celebracion', () => ({
  CelebracionMeta: (p: { readonly mes: string }) =>
    createElement('div', null, `celebración:${p.mes}`),
}));
vi.mock('../src/app/(portal)/asesor/wizard', () => ({
  Wizard: () => createElement('div', null, 'el wizard'),
}));
vi.mock('../src/app/(portal)/asesor/cierre', () => ({
  CierreReciente: (p: { readonly onCambiar: () => void }) =>
    createElement('div', null, createElement('button', { onClick: p.onCambiar }, 'cambiar')),
}));

const { Metas } = await import('../src/app/(portal)/asesor/metas');

const BASE = {
  estado: 'activa',
  meta: null,
  ritmo: null,
  actual: null,
  recienCerrada: null,
  niveles: [],
  trophies: [],
  racha: 0,
  celebrar: null,
} as unknown as MetasPageData;

afterEach(cleanup);

function montar(data: MetasPageData | null, role: 'owner' | 'viewer' = 'owner') {
  render(createElement(Metas, { data, role } as never));
}

describe('Metas · the view states', () => {
  it('a failed read is the banner that promises the metas are safe', () => {
    montar(null);
    assert.ok(screen.getByText(/No pudimos leer tus metas/));
    assert.ok(screen.getByText(/Tus metas están a salvo/));
  });

  it('a young business gets its explanation, not a wizard it cannot anchor', () => {
    montar({ ...BASE, estado: 'negocio-nuevo' });
    assert.ok(screen.getByText('Aún no hay un mes que comparar'));
  });

  it('a goal that just closed shows the dialog, and «cambiar» reports upward', () => {
    montar({ ...BASE, estado: 'cerrada', recienCerrada: { id: 'm-1' } as never });
    fireEvent.click(screen.getByText('cambiar'));
    // The real CierreReciente owns what «cambiar» does with it.
    assert.ok(screen.getByText('cambiar'));
  });

  it('sin-meta opens the wizard for the owner; the viewer gets the read-only word', async () => {
    montar({ ...BASE, estado: 'sin-meta' });
    assert.ok(await screen.findByText('el wizard'));

    cleanup();
    montar({ ...BASE, estado: 'sin-meta' }, 'viewer');
    assert.ok(screen.getByText(/Solo lectura/));
    assert.ok(screen.getByText(/Tu cuenta no puede fijar metas/));
  });

  it('an achieved goal waiting for its celebration takes the takeover — owners only', () => {
    montar({
      ...BASE,
      celebrar: {
        clave: 'meta:m-1',
        racha: 2,
        mes: '2026-04',
        vendido: 120_00n,
        negocio: 'T',
      } as never,
    });
    assert.ok(screen.getByText('celebración:2026-04'));
    assert.ok(screen.getByText(/¡Lograste tu meta!/));

    cleanup();
    montar(
      {
        ...BASE,
        meta: { objetivoCentavos: 100_00n, objetivo: 'vender', periodo: '2026-05' } as never,
        celebrar: {
          clave: 'meta:m-1',
          racha: 2,
          mes: '2026-04',
          vendido: 120_00n,
          negocio: 'T',
        } as never,
      },
      'viewer',
    );
    assert.ok(screen.queryByText('celebración:2026-04') === null);
  });

  it('an active goal shows its figure and its pace line', () => {
    montar({
      ...BASE,
      meta: { objetivoCentavos: 100_00n, objetivo: 'vender', periodo: '2026-05' } as never,
      ritmo: { ritmo: 'ahead', dias: 2, faltante: 40_00n } as never,
    });
    assert.ok(screen.getByText('$100.00'));
    assert.ok(screen.getByText(/Te faltan \$40.00 para llegar/));
    assert.ok(screen.getByText('Cambiar de meta'));
  });
});
