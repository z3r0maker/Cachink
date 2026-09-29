// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, describe, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';

/**
 * «Producto nuevo en caja» (OpProductoNuevo): the three questions and the
 * live tile. The name and the price type straight through (money only in the
 * price), the type picks among four radio chips, and the preview shows the
 * tile as it will land in the catalogue — the icon suggested by the name, or
 * the one picked by hand once «cambiar» opens the picker.
 */

vi.mock('../../src/operador/ui/use-dueno', () => ({ useDueno: () => 'Pedro' }));
vi.mock('../../src/operador/ui/parts', () => ({
  Glyph: () => createElement('span', { 'data-glyph': true }),
}));
vi.mock('../../src/operador/shell/icon', () => ({
  Icon: () => createElement('span', { 'data-icon': true }),
}));
vi.mock('../../src/operador/ui/mostrador.css', () => ({
  campo: 'campo',
  campoInput: 'campoInput',
  chip: 'chip',
  eyebrow: 'eyebrow',
}));
vi.mock('../../src/operador/caja/catalogo.css', () => ({
  tile: 'tile',
  tileIcon: 'tileIcon',
  tileName: 'tileName',
  tileText: 'tileText',
  price: 'price',
}));
vi.mock('../../src/operador/caja/nuevo-dialogo.css', () => ({
  preguntas: 'preguntas',
  pregunta: 'pregunta',
  label: 'label',
  campoGrande: 'campoGrande',
  nombre: 'nombre',
  precioCampo: 'precioCampo',
  peso: 'peso',
  precio: 'precio',
  fieldset: 'fieldset',
  chips: 'chips',
  muestra: 'muestra',
  h3: 'h3',
  numero: 'numero',
  cambiar: 'cambiar',
  icono: 'icono',
  iconos: 'iconos',
  info: 'info',
  nota: 'nota',
}));

const { Preguntas, Muestra } = await import('../../src/operador/caja/nuevo-partes');
import type { Nuevo } from '../../src/operador/caja/nuevo';

/** A fresh state shape like useNuevo's, with recording setters. */
function falso(over: Partial<Record<string, unknown>> = {}): Nuevo {
  return {
    nombre: '',
    precio: '',
    cat: 'Guisados',
    icono: 'utensils',
    cambiar: false,
    monto: null,
    ok: false,
    iconoNota: 'Ícono general, no reconocí el nombre',
    setNombre: vi.fn(),
    setPrecio: vi.fn(),
    setCat: vi.fn(),
    setElegido: vi.fn(),
    setCambiar: vi.fn(),
    add: vi.fn(),
    ...over,
  } as unknown as Nuevo;
}

afterEach(cleanup);

describe('Preguntas', () => {
  it('the three questions in order, the name typing through', () => {
    const f = falso();
    render(createElement(Preguntas, { f }));
    for (const pregunta of ['¿Cómo se llama?', '¿En cuánto lo vendes?', '¿De qué tipo es?']) {
      assert.ok(screen.getByText(new RegExp(pregunta)), pregunta);
    }
    fireEvent.change(screen.getByLabelText(/¿Cómo se llama\?/), { target: { value: 'Volcán' } });
    assert.deepEqual(f.setNombre.mock.calls, [['Volcán']]);
  });

  it('the price keeps only digits and the point', () => {
    const f = falso();
    render(createElement(Preguntas, { f }));
    fireEvent.change(screen.getByLabelText(/¿En cuánto lo vendes\?/), {
      target: { value: '5a0.5b0' },
    });
    assert.deepEqual(f.setPrecio.mock.calls, [['50.50']]);
  });

  it('four type chips, the chosen one checked, picking reports it', () => {
    const f = falso({ cat: 'Bebidas' });
    render(createElement(Preguntas, { f }));
    const grupo = screen.getByRole('radiogroup', { name: 'Tipo de producto' });
    const chips = [...grupo.querySelectorAll('[role="radio"]')];
    assert.deepEqual(
      chips.map((c) => c.textContent),
      ['Tacos', 'Guisados', 'Bebidas', 'Extras'],
    );
    assert.equal(chips[2]?.getAttribute('aria-checked'), 'true');

    fireEvent.click(chips[0] as HTMLElement);
    assert.deepEqual(f.setCat.mock.calls, [['Tacos']]);
  });
});

describe('Muestra', () => {
  it('the tile as it will land: name, price, and the icon note', () => {
    const f = falso({ nombre: 'Volcán', precio: '55', monto: 5500n, ok: true });
    render(createElement(Muestra, { f }));
    assert.ok(screen.getByText('Volcán'));
    assert.ok(screen.getByText('$55.00'));
    assert.ok(screen.getByText(/Ícono general, no reconocí el nombre/));
  });

  it('an icon picked by hand says so', () => {
    const f = falso({ nombre: 'Volcán', iconoNota: 'Ícono escogido por ti' });
    render(createElement(Muestra, { f }));
    assert.ok(screen.getByText(/Ícono escogido por ti/));
  });
});
