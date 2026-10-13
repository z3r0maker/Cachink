// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import type { Aviso } from '../src/app/(portal)/avisos/tarjeta';

/**
 * One aviso (P-31): the link goes where the aviso points and marks it read
 * on the way — only for a writer on an unread one; «Listo» closes it; solo
 * lectura sees no actions at all; and the server's refusal lands on the
 * card, in its own words.
 */

const cambiarEstadoAviso = vi.fn();
const refresh = vi.fn();

vi.mock('@/server/actions/avisos', () => ({ cambiarEstadoAviso }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
vi.mock('next/link', () => ({
  default: (p: {
    readonly href: string;
    readonly children: unknown;
    readonly onClick?: () => void;
  }) => createElement('a', { href: p.href, onClick: p.onClick }, p.children),
}));
vi.mock('../src/shell/icon', () => ({
  Icon: () => createElement('span', { 'data-icon': true }),
}));
vi.mock('../src/app/(portal)/avisos/tarjeta.css', () => ({
  tarjeta: 'tarjeta',
  punto: 'punto',
  hueco: 'hueco',
  ficha: 'ficha',
  texto: 'texto',
  meta: 'meta',
  ceja: 'ceja',
  titulo: 'titulo',
  cuerpo: 'cuerpo',
  error: 'error',
  acciones: 'acciones',
  ir: 'ir',
  listo: 'listo',
}));
vi.mock('../src/app/(portal)/avisos/cuando', () => ({ cuando: () => 'hace 2 h' }));
vi.mock('../src/app/(portal)/avisos/tipo', () => ({
  tipoDe: () => ({ bg: '#fff', fg: '#000', icono: '', ceja: 'Venta' }),
}));

const { AvisoTarjeta } = await import('../src/app/(portal)/avisos/tarjeta');

const AVISO = {
  id: 'a-1',
  state: 'nuevo',
  title: 'Venta de $480',
  body: 'Ana hizo una venta grande.',
  createdAt: '2026-09-28T10:00:00.000Z',
  ctaHref: '/ventas',
  ctaLabel: 'Ver venta',
} as unknown as Aviso;

function montar(n: Aviso = AVISO, mayWrite = true) {
  render(createElement(AvisoTarjeta, { n, mayWrite }));
}

beforeEach(() => {
  vi.clearAllMocks();
  cambiarEstadoAviso.mockResolvedValue({ ok: true });
});

afterEach(cleanup);

describe('AvisoTarjeta', () => {
  it('an unread aviso carries the dot, the cta link, and «Listo» for a writer', () => {
    montar();
    assert.ok(screen.getByRole('img', { name: 'Sin leer' }));
    const ir = screen.getByText('Ver venta').closest('a');
    assert.equal(ir?.getAttribute('href'), '/ventas');
    assert.ok(screen.getByRole('button', { name: /Listo, quitar este aviso/ }));
  });

  it('a read aviso has no dot; the link no longer marks anything', () => {
    montar({ ...AVISO, state: 'leido' } as Aviso);
    assert.ok(screen.queryByRole('img', { name: 'Sin leer' }) === null);
    // The cta stays a link — it just no longer marks read on the way.
    fireEvent.click(screen.getByText('Ver venta'));
    assert.equal(cambiarEstadoAviso.mock.calls.length, 0);
  });

  it('«Listo» resolves the aviso and refreshes; the link of an unread one marks it read', async () => {
    montar();
    fireEvent.click(screen.getByRole('button', { name: /Listo, quitar este aviso/ }));
    await waitFor(() => assert.deepEqual(cambiarEstadoAviso.mock.calls, [['a-1', 'resolver']]));
    await waitFor(() => assert.equal(refresh.mock.calls.length, 1));

    fireEvent.click(screen.getByText('Ver venta'));
    await waitFor(() => assert.deepEqual(cambiarEstadoAviso.mock.calls[1], ['a-1', 'leer']));
  });

  it('solo lectura sees no «Listo» and marks nothing', () => {
    montar(AVISO, false);
    assert.ok(screen.queryByRole('button') === null);
    fireEvent.click(screen.getByText('Ver venta'));
    assert.equal(cambiarEstadoAviso.mock.calls.length, 0);
  });

  it('the server’s refusal lands on the card, in its own words', async () => {
    cambiarEstadoAviso.mockResolvedValue({ ok: false, message: 'No pudimos guardarlo.' });
    montar();
    fireEvent.click(screen.getByRole('button', { name: /Listo, quitar este aviso/ }));
    await waitFor(() => assert.ok(screen.getByText('No pudimos guardarlo.')));
    assert.equal(refresh.mock.calls.length, 0);
  });

  it('an aviso without a cta shows no link', () => {
    montar({ ...AVISO, ctaHref: null } as Aviso);
    assert.ok(screen.queryByRole('link') === null);
  });
});
