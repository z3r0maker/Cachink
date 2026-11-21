import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { GUIAS, PREGUNTAS, TEMAS } from '../src/index.js';

const temas = new Set(TEMAS.map((t) => t.id));

/** Every piece of copy the package holds, with a name to report it by. */
const copia: readonly (readonly [string, string])[] = [
  ...TEMAS.map((t) => [`tema ${t.id}`, t.label] as const),
  ...PREGUNTAS.flatMap((p) => [
    [`pregunta «${p.q}»`, `${p.q} ${p.a} ${p.ir?.label ?? ''}`] as const,
  ]),
  ...GUIAS.flatMap((g) => [
    [`guía ${g.id}`, `${g.titulo} ${g.ir.label}`] as const,
    ...g.pasos.map((p, i) => [`guía ${g.id}, paso ${i + 1}`, `${p.texto} ${p.voz ?? ''}`] as const),
  ]),
];

describe('the guides and answers themselves (ADR-163)', () => {
  it('gives every guide an id of its own', () => {
    const ids = GUIAS.map((g) => g.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('keeps every guide between two and five steps, none of them empty', () => {
    for (const g of GUIAS) {
      assert.ok(g.pasos.length >= 2 && g.pasos.length <= 5, g.id);
      for (const p of g.pasos) assert.ok(p.texto.trim().length > 0, g.id);
    }
  });

  it('files every guide and every answer under a topic that exists', () => {
    for (const g of GUIAS) assert.ok(temas.has(g.tema), g.id);
    for (const p of PREGUNTAS) assert.ok(temas.has(p.tema), p.q);
  });

  it('writes no em dash anywhere', () => {
    for (const [donde, texto] of copia) assert.ok(!texto.includes('—'), donde);
  });

  it('sends a portal guide only to the portal’s own screens', () => {
    for (const g of GUIAS.filter((x) => x.superficie === 'portal')) {
      for (const ruta of [g.ir.href, ...g.pantallas]) assert.match(ruta, /^\/[a-z-]/, g.id);
    }
    for (const p of PREGUNTAS) if (p.ir) assert.match(p.ir.href, /^\/[a-z-]/, p.q);
  });

  it('names a clip, when a guide has one, by a plain slug', () => {
    for (const g of GUIAS) if (g.clip !== undefined) assert.match(g.clip, /^[a-z0-9-]+$/, g.id);
  });

  it('names a step’s control, when it has one, by a testID that is not blank', () => {
    for (const g of GUIAS) {
      for (const p of g.pasos) if (p.control !== undefined) assert.ok(p.control.trim(), g.id);
    }
  });
});
