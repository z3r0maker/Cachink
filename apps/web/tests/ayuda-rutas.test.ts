import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GUIAS, PREGUNTAS } from '@xangarro/guias';
import { describe, it } from 'vitest';

const APP = fileURLToPath(new URL('../src/app', import.meta.url));

/** Every `page.tsx` under the app, as the address a person types: route groups dropped. */
function rutas(dir: string = APP): readonly string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const aqui = join(dir, e.name);
    if (e.isDirectory()) return rutas(aqui);
    if (e.name !== 'page.tsx') return [];
    const tramos = relative(APP, dir)
      .split(sep)
      .filter((t) => t !== '' && !t.startsWith('('));
    return [`/${tramos.join('/')}`];
  });
}

/** An address without its `?query`. */
const sinConsulta = (href: string) => href.split('?')[0] ?? href;

describe('Ayuda only sends the owner to screens that exist (ADR-163)', () => {
  const existentes = new Set(rutas());

  it('finds the portal’s own pages, so the checks below mean something', () => {
    assert.ok(existentes.has('/ayuda'));
    assert.ok(!existentes.has('/no-existe'));
  });

  it('ends every portal guide on a real screen', () => {
    for (const g of GUIAS.filter((x) => x.superficie === 'portal')) {
      assert.ok(existentes.has(sinConsulta(g.ir.href)), `${g.id}: ${g.ir.href}`);
    }
  });

  it('files every portal guide under screens that exist', () => {
    for (const g of GUIAS.filter((x) => x.superficie === 'portal')) {
      assert.ok(g.pantallas.length > 0, g.id);
      for (const p of g.pantallas) assert.ok(existentes.has(p), `${g.id}: ${p}`);
    }
  });

  it('links every answer to a real screen', () => {
    for (const p of PREGUNTAS) {
      if (p.ir) assert.ok(existentes.has(sinConsulta(p.ir.href)), `${p.q}: ${p.ir.href}`);
    }
  });
});
