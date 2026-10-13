// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';

/**
 * Step 2's review (P-07): the counts before anything is written, the filter
 * that narrows to what needs fixing, the CSV of exactly those rows, and the
 * Importar button naming how many rows will land — disabled while pending or
 * with nothing to do.
 */

const descargar = vi.fn();
const importar = vi.fn();

vi.mock('@/components', () => ({
  Button: (p: {
    readonly children: unknown;
    readonly disabled?: boolean;
    readonly onClick?: () => void;
  }) => createElement('button', { disabled: p.disabled, onClick: p.onClick }, p.children),
}));
vi.mock('../src/app/(portal)/_primeros/iconos', () => ({
  IconoBajar: () => createElement('span', { 'data-icon': true }),
  IconoFlecha: () => createElement('span', { 'data-icon': true }),
}));
vi.mock('../src/app/(portal)/_primeros/primeros.css', () => ({ nota: 'nota' }));
vi.mock('../src/app/(portal)/importar/revision.css', () => {
  const v = (n: string) => (k: string) => `${n}-${k}`;
  return {
    resumen: 'resumen',
    resumenFila: 'resumenFila',
    cuenta: v('cuenta'),
    filtros: 'filtros',
    filtro: 'filtro',
    nadaQueVer: 'nadaQueVer',
    barra: 'barra',
    liga: 'liga',
    empuja: 'empuja',
  };
});
vi.mock('../src/app/(portal)/importar/tabla-revision', () => ({
  TablaRevision: (p: { readonly rows: readonly unknown[] }) =>
    createElement('div', { 'data-testid': 'tabla' }, `${p.rows.length} filas`),
}));

const { Revision } = await import('../src/app/(portal)/importar/revision');
import type { PreviewRow } from '../src/server/import/templates';
import type { TemplateMeta } from '../src/app/(portal)/importar/plantillas';

const META = { key: 'productos', label: 'Productos' } as unknown as TemplateMeta;

const fila = (kind: PreviewRow['kind'], over: Partial<PreviewRow> = {}): PreviewRow =>
  ({
    kind,
    line: 2,
    sku: 'A-1',
    nombre: 'Queso Oaxaca',
    errors: [],
    ...over,
  }) as unknown as PreviewRow;

function montar(rows: readonly PreviewRow[], pending = false) {
  importar.mockClear();
  render(
    createElement(Revision, {
      rows,
      meta: META,
      f: { pending, importar } as never,
    }),
  );
}

beforeEach(() => {
  const crear = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
    const el = crear(tag);
    if (tag === 'a') {
      Object.defineProperty(el, 'click', { value: () => descargar(el.getAttribute('download')) });
    }
    return el;
  }) as never);
  URL.createObjectURL = (() => 'blob:x') as never;
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Revision', () => {
  it('the summary counts each kind in its own words', () => {
    montar([
      fila('nuevo'),
      fila('nuevo'),
      fila('actualizar'),
      fila('sin-cambios'),
      fila('sin-cambios'),
      fila('sin-cambios'),
      fila('error', { errors: ['nombre vacío'] }),
    ]);
    const resumen = screen.getByTestId('import-resumen').textContent ?? '';
    assert.ok(resumen.includes('2 nuevos'));
    assert.ok(resumen.includes('1 se actualiza'));
    assert.ok(resumen.includes('3 sin cambios'));
    assert.ok(resumen.includes('1 por revisar'));
  });

  it('the filter narrows to Por revisar and says so; Todas brings them back', () => {
    montar([fila('nuevo'), fila('error', { errors: ['x'] }), fila('sin-cambios')]);
    assert.equal(screen.getByTestId('tabla').textContent, '3 filas');
    assert.ok(screen.queryByText(/Estas no se importan/) === null);

    fireEvent.click(screen.getByRole('button', { name: /Por revisar · 1/ }));
    assert.equal(screen.getByTestId('tabla').textContent, '1 filas');
    assert.ok(screen.getByText(/Estas no se importan/));

    fireEvent.click(screen.getByRole('button', { name: /Todas · 3/ }));
    assert.equal(screen.getByTestId('tabla').textContent, '3 filas');
  });

  it('the CSV of errors downloads exactly the rows that need fixing', () => {
    montar([
      fila('nuevo'),
      fila('error', { line: 5, errors: ['nombre vacío', 'costo no es un monto'] }),
      fila('error', { line: 7, sku: 'B-2', errors: ['otro'] }),
    ]);
    fireEvent.click(screen.getByRole('button', { name: /Descargar los que faltan/ }));
    assert.deepEqual(descargar.mock.calls, [['errores-importacion.csv']]);
  });

  it('no errors, no download link', () => {
    montar([fila('nuevo'), fila('sin-cambios')]);
    assert.ok(screen.queryByRole('button', { name: /Descargar/ }) === null);
  });

  it('the Importar button names what lands, and waits', () => {
    montar([
      fila('nuevo'),
      fila('actualizar'),
      fila('sin-cambios'),
      fila('error', { errors: ['x'] }),
    ]);
    const boton = screen.getByRole('button', { name: /Importar 2 productos/ });
    fireEvent.click(boton);
    assert.equal(importar.mock.calls.length, 1);

    cleanup();
    montar([fila('nuevo')], true);
    assert.ok(screen.getByText('Importando…').closest('button')?.disabled);
    assert.ok(screen.queryByText(/Importar 1 producto/) === null);
  });

  it('nothing to do disables the import', () => {
    montar([fila('sin-cambios')]);
    assert.ok(screen.getByRole('button', { name: /Importar 0 productos/ }).disabled);
  });
});
