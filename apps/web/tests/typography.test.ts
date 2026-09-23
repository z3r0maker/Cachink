import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { portalFontSizes } from '@xangarro/tokens';

/**
 * The portal's type contract (S-3, S-4, S-5).
 *
 * Three sizes drifted quietly: nav labels and the business name sat at 14
 * where the design says 15, the KPI figure at 32 where it says 34 — reaching
 * for the phone's ramp, which has no 34 at all — and headings nobody dressed
 * rendered at the browser's 2em/700.
 *
 * None of that is visible to a unit test through vanilla-extract, whose class
 * names are opaque at runtime. So this reads the stylesheets, the same way
 * `screen-states.test.ts` reads the screens: a size that must come from a
 * named token may not be a literal, and may not be the wrong token.
 */
const SRC = join(import.meta.dirname, '..', 'src');
const lee = (...p: readonly string[]) => readFileSync(join(SRC, ...p), 'utf8');

/** The declaration block of one exported style, up to its closing `});`. */
function bloque(fuente: string, nombre: string): string {
  const i = fuente.indexOf(`export const ${nombre} = style(`);
  assert.notEqual(i, -1, `no style called ${nombre}`);
  const fin = fuente.indexOf('});', i);
  return fuente.slice(i, fin === -1 ? undefined : fin);
}

describe('S-4 — body text is 15, not 14', () => {
  const sitios = [
    { archivo: ['shell', 'sidebar.css.ts'], estilo: 'navItem', que: 'the nav label' },
    { archivo: ['shell', 'header.css.ts'], estilo: 'bizName', que: 'the business name' },
    { archivo: ['components', 'states.css.ts'], estilo: 'stateBody', que: 'the empty-state body' },
    {
      archivo: ['app', '(portal)', '_inicio', 'inicio.css.ts'],
      estilo: 'pageDate',
      que: "Inicio's subtitle",
    },
  ] as const;

  for (const s of sitios) {
    it(`${s.que} uses portalFontSizes.body`, () => {
      const b = bloque(lee(...s.archivo), s.estilo);
      assert.ok(
        b.includes('portalFontSizes.body'),
        `${s.que} must be 15 (portalFontSizes.body), not the 14 it read before`,
      );
      assert.ok(!b.includes('fontSize: fontSizes.md'), `${s.que} still reaches for the 14 step`);
    });
  }

  it('portalFontSizes.body is still 15', () => {
    // The assertions above name a token; this one pins what the token means.
    assert.equal(portalFontSizes.body, 15);
  });
});

describe('S-5 — the KPI figure is 34, and 36 on Inicio', () => {
  const kpi = lee('components', 'kpi.css.ts');

  it('kpiFigure uses the portal ramp, not the phone one', () => {
    const b = bloque(kpi, 'kpiFigure');
    assert.ok(b.includes('portalFontSizes.xl6'), 'the figure must be 34');
    // The declaration, not the comment beside it that names the old value.
    assert.ok(
      !b.includes('fontSize: fontSizes.xl5'),
      "the phone's ramp has no 34 — reaching for it is what made this 32",
    );
    assert.equal(portalFontSizes.xl6, 34);
  });

  it('kpiFigureLg is the 36 step Resumen de hoy asks for', () => {
    assert.ok(kpi.includes('kpiFigureLg'), 'no large step defined');
    assert.ok(bloque(kpi, 'kpiFigureLg').includes('portalFontSizes.pageTitle'));
    assert.equal(portalFontSizes.pageTitle, 36);
  });

  it('Inicio actually asks for it', () => {
    // A step nothing passes is the same defect S-2 was about.
    const cards = lee('app', '(portal)', '_inicio', 'cards.tsx');
    const resumen = cards.slice(cards.indexOf('export function ResumenDeHoy'));
    const corte = resumen.indexOf('export function', 10);
    const cuerpo = corte === -1 ? resumen : resumen.slice(0, corte);
    assert.equal(
      (cuerpo.match(/size="lg"/g) ?? []).length,
      3,
      'all three Resumen de hoy cards take the 36 step',
    );
  });
});

describe('S-3 — headings have a house style', () => {
  const global = lee('styles', 'global.css.ts');

  it('a global rule dresses every heading', () => {
    assert.ok(global.includes("globalStyle('h1, h2, h3, h4, h5, h6'"), 'no heading rule at all');
    assert.ok(global.includes('weights.extraBold'), 'the design sets weight 800');
  });

  it('h1 is the page-title step at the design tracking', () => {
    const i = global.indexOf("globalStyle('h1',");
    assert.notEqual(i, -1, 'h1 has no size of its own');
    const regla = global.slice(i, global.indexOf('});', i));
    assert.ok(regla.includes('portalFontSizes.pageTitle'), 'h1 must be 36');
    assert.ok(regla.includes('letterSpacing.tighter'), '-0.03em, per "Main"');
  });

  it('the auth card keeps its own 30, against the global 36', () => {
    // It lives inside a 460px card; the design sets it apart deliberately.
    const b = bloque(lee('app', 'login', 'auth-card.css.ts'), 'tituloAcceso');
    assert.ok(b.includes('portalFontSizes.xl5'));
    assert.equal(portalFontSizes.xl5, 30);
  });
});
