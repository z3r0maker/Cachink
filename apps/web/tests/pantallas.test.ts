import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { PANTALLAS, pantallaDeRuta, pantallaPorHref } from '../src/shell/pantallas';

/**
 * The portal's screens by name (P-48): what «¿En qué pantalla?» shows, what
 * «Fue en otra» lists, and the only screens a report may name.
 */
describe('the portal’s screens', () => {
  it('lists the menu, the account’s settings and the personal pages, once each', () => {
    const labels = PANTALLAS.map((p) => p.label);
    for (const label of ['Hoy', 'Ventas y gastos', 'Mi negocio', 'Avisos', 'Seguridad']) {
      assert.ok(labels.includes(label), `«${label}» is listed`);
    }
    assert.equal(new Set(labels).size, labels.length);
    assert.equal(new Set(PANTALLAS.map((p) => p.href)).size, PANTALLAS.length);
  });

  it('never lists Ayuda: nobody reports from where they are reporting', () => {
    assert.equal(pantallaPorHref('/ayuda'), null);
    assert.equal(pantallaDeRuta('/ayuda'), null);
    assert.equal(pantallaDeRuta('/ayuda/escribir'), null);
  });

  it('names a screen from the path the browser is on', () => {
    assert.equal(pantallaDeRuta('/movimientos')?.label, 'Ventas y gastos');
    assert.equal(pantallaDeRuta('/')?.label, 'Hoy');
    assert.equal(pantallaDeRuta('/privacidad/solicitud')?.label, 'Privacidad y mis datos');
  });

  it('a page that lights another menu entry is named by that entry', () => {
    assert.equal(pantallaDeRuta('/cortes')?.href, '/equipo');
    assert.equal(pantallaDeRuta('/empleados')?.label, 'Equipo y nómina');
  });

  it('a path that only starts like a screen is not that screen', () => {
    assert.equal(pantallaDeRuta('/movimientos-viejos'), null);
    assert.equal(pantallaDeRuta('/desconocida'), null);
    assert.equal(pantallaDeRuta(''), null);
  });

  it('finds a screen by its own address and nothing else', () => {
    assert.equal(pantallaPorHref('/estados')?.label, 'Estados financieros');
    assert.equal(pantallaPorHref('/estados?tab=flujo'), null);
    assert.equal(pantallaPorHref('https://example.com/estados'), null);
  });
});
