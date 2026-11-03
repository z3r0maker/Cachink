import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { EMPRESA_NAV, entryOf, isEntryActive } from '../src/shell/empresa-nav';

/**
 * «Empresa»'s grouped navigation (E-07, plan §2): built entries only, each
 * lit on any of its tabs' routes, and every route owned by exactly one entry.
 */
const entry = (id: string) => {
  const e = EMPRESA_NAV.find((x) => x.id === id);
  assert.ok(e, `entry ${id}`);
  return e;
};

describe('EMPRESA_NAV', () => {
  it('lists the built entries in the plan order, with Dinero’s and Cumplimiento’s tabs', () => {
    assert.deepEqual(
      EMPRESA_NAV.map((e) => e.label),
      ['Resumen', 'Dinero', 'Resultados', 'Socios', 'Cumplimiento'],
    );
    assert.deepEqual(
      entry('dinero').tabs.map((t) => t.label),
      ['Movimientos', 'Facturas'],
    );
    assert.deepEqual(
      entry('cumplimiento').tabs.map((t) => t.label),
      ['Agenda', 'Expediente', 'Corporativo'],
    );
  });

  it('gives every route to exactly one entry', () => {
    const hrefs = EMPRESA_NAV.flatMap((e) => e.tabs.map((t) => t.href));
    assert.equal(new Set(hrefs).size, hrefs.length);
  });
});

describe('isEntryActive', () => {
  it('lights an entry on any of its tabs and their sub-pages', () => {
    const c = entry('cumplimiento');
    assert.equal(isEntryActive(c, '/empresa/agenda'), true);
    assert.equal(isEntryActive(c, '/empresa/agenda/evidencias'), true);
    assert.equal(isEntryActive(c, '/empresa/corporativo/registros/abc'), true);
  });

  it('leaves the other entries dark', () => {
    assert.equal(isEntryActive(entry('dinero'), '/empresa/agenda'), false);
    assert.equal(isEntryActive(entry('socios'), '/empresa/movimientos'), false);
  });

  it('does not match a route that only shares a prefix', () => {
    assert.equal(isEntryActive(entry('socios'), '/empresa/sociosx'), false);
  });

  it('lights the Resumen on the area root alone', () => {
    const r = entry('resumen');
    assert.equal(isEntryActive(r, '/empresa'), true);
    assert.equal(isEntryActive(r, '/empresa/agenda'), false);
    assert.equal(isEntryActive(entry('dinero'), '/empresa'), false);
  });

  it('lights nothing outside the area', () => {
    for (const path of ['/', '/tenants', '/empresax']) {
      assert.equal(
        EMPRESA_NAV.some((e) => isEntryActive(e, path)),
        false,
        path,
      );
    }
  });
});

describe('entryOf', () => {
  it('finds the entry that owns a route', () => {
    assert.equal(entryOf('/empresa/expediente')?.label, 'Cumplimiento');
    assert.equal(entryOf('/empresa/movimientos')?.label, 'Dinero');
    assert.equal(entryOf('/empresa')?.label, 'Resumen');
  });
});
