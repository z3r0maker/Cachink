/**
 * The operator's guides (G-03, ADR-163) name real things: the control a step is
 * about, by the testID a Maestro flow taps, and the screen a guide ends on. Both
 * can be renamed in the app without the guides noticing, so this reads the
 * flows and the two routers and holds the guides to them.
 *
 * The route tables below are this test's own until the phone (G-10) and the web
 * caja (G-11) each map `PANTALLAS_CAJA` to their routes; then those maps are
 * what gets checked.
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';

import { GUIAS, PANTALLAS_CAJA, type PantallaCaja } from '../packages/guias/src/index.js';

const ROOT = join(import.meta.dirname, '..');
const FLOWS = join(ROOT, 'apps/mobile/maestro/flows');
const caja = GUIAS.filter((g) => g.superficie === 'caja');

/** Every `.yaml` under the flows folder, subflows included. */
function flows(dir: string = FLOWS): readonly string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const here = join(dir, e.name);
    if (e.isDirectory()) return flows(here);
    return e.name.endsWith('.yaml') ? [here] : [];
  });
}

/** `id: "x"` on a line of its own, read from the line already trimmed. */
const ID = /^(?:- )?id: ?["']?([\w-]+)["']?$/;

/** Every testID some flow names with `id:`. */
function idsEnFlujos(): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const file of flows()) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const id = ID.exec(line.trim())?.[1];
      if (id !== undefined) ids.add(id);
    }
  }
  return ids;
}

const TELEFONO: Readonly<Record<PantallaCaja, string>> = {
  inicio: '(tabs)/inicio.tsx',
  cobrar: '(tabs)/cobrar.tsx',
  ventas: '(tabs)/ventas.tsx',
  'mi-turno': '(tabs)/turno/index.tsx',
  gastos: 'gastos.tsx',
  inventario: 'productos/index.tsx',
  cierre: 'cierre.tsx',
};

const WEB: Readonly<Record<PantallaCaja, string>> = {
  inicio: 'page.tsx',
  cobrar: 'caja/page.tsx',
  ventas: 'ventas/page.tsx',
  'mi-turno': 'turno/page.tsx',
  gastos: 'gastos/page.tsx',
  inventario: 'inventario/page.tsx',
  cierre: 'cierre/page.tsx',
};

describe('the operator’s guides name things the caja really has', () => {
  it('reads the flows, so the checks below mean something', () => {
    const ids = idsEnFlujos();
    assert.ok(ids.size > 100, `only ${ids.size} testIDs read from the flows`);
    assert.ok(!ids.has('un-control-que-no-existe'));
  });

  it('points every step at a control some Maestro flow taps', () => {
    const ids = idsEnFlujos();
    for (const g of caja) {
      for (const p of g.pasos) {
        if (p.control !== undefined) assert.ok(ids.has(p.control), `${g.id}: ${p.control}`);
      }
    }
  });

  it('has a phone route for every screen a guide can name', () => {
    for (const pantalla of PANTALLAS_CAJA) {
      const file = join(ROOT, 'apps/mobile/src/app', TELEFONO[pantalla]);
      assert.ok(existsSync(file), `${pantalla}: ${TELEFONO[pantalla]}`);
    }
  });

  it('has a web caja page for every screen a guide can name', () => {
    for (const pantalla of PANTALLAS_CAJA) {
      const file = join(ROOT, 'apps/web/src/app/operador', WEB[pantalla]);
      assert.ok(existsSync(file), `${pantalla}: ${WEB[pantalla]}`);
    }
  });
});
