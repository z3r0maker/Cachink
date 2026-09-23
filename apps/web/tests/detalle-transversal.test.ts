import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The transversal details (D-1…D-4).
 *
 * Four small defects that shared one shape: something the design pairs was
 * only half applied. A tile with a colour and no glyph, a tone with a
 * background and no ink, a state with a word and no visual encoding, a
 * primary action wearing the panel's own colour.
 *
 * Each of these is a couple of characters away from regressing, and none of
 * them is visible to a unit test through vanilla-extract, so these read the
 * source the way `typography.test.ts` does.
 */
const SRC = join(import.meta.dirname, '..', 'src');
const lee = (...p: readonly string[]) => readFileSync(join(SRC, ...p), 'utf8');

describe('D-1 — every Negocio tile carries a glyph', () => {
  const parts = lee('app', '(portal)', 'negocio', 'parts.tsx');

  it('every tone with a background also has an icon', () => {
    const tonos = (bloque: string) => (bloque.match(/^\s{2}(\w+):/gm) ?? []).map((l) => l.trim());
    const fondos = parts.slice(parts.indexOf('const TILE_BG'), parts.indexOf('const TILE_ICON'));
    const iconos = parts.slice(parts.indexOf('const TILE_ICON'));
    assert.deepEqual(
      tonos(fondos),
      tonos(iconos.slice(0, iconos.indexOf('} as const;'))),
      'a tone with a fill and no glyph is the blank square D-1 found',
    );
  });

  it('the tile renders the icon rather than closing on itself', () => {
    // `<span className={sectionTile} … />` — self-closing — was the defect.
    assert.ok(parts.includes('<Icon path={TILE_ICON[props.tone]}'), 'the tile draws nothing');
  });
});

describe('D-2 — the save bar wears the dark button', () => {
  it('«Guardar cambios» is not yellow on yellow', () => {
    const bar = lee('app', '(portal)', 'negocio', 'edicion', 'save-bar.tsx');
    const guardar = bar.slice(
      bar.indexOf('onClick={e.save}') - 200,
      bar.indexOf('onClick={e.save}'),
    );
    assert.ok(guardar.includes('variant="dark"'), 'the primary must be the dark variant');
  });
});

describe('D-3 — severity pairs a tone with its ink', () => {
  const linea = lee('avisos', 'linea.tsx');
  const bloque = linea.slice(linea.indexOf('const SEVERITY'), linea.indexOf('const FUENTE'));

  it('each severity names both a background and a foreground', () => {
    const filas = bloque.match(/(critical|warning|info|success): \{[^}]*\}/g) ?? [];
    assert.equal(filas.length, 4, 'all four severities must be present');
    for (const f of filas) {
      assert.ok(f.includes('bg:'), `${f.split(':')[0]} has no background`);
      assert.ok(f.includes('fg:'), `${f.split(':')[0]} has no ink — colour alone carries it`);
    }
  });

  it('the ink is a contrast-checked *Text token, not the raw hue', () => {
    const inks = bloque.match(/fg: colors\.(\w+)/g) ?? [];
    assert.equal(inks.length, 4);
    for (const i of inks) {
      assert.ok(i.endsWith('Text'), `${i} is the surface colour, not the paired ink`);
    }
    // And four different ones: a shared ink would flatten the pairing.
    assert.equal(new Set(inks).size, 4);
  });

  it('the tile actually applies it', () => {
    assert.ok(linea.includes('color: s.fg'), 'the ink is computed and never used');
  });
});

describe('D-4 — unread is a state, not a word', () => {
  const linea = lee('avisos', 'linea.tsx');

  it('no longer prints «Sin leer» / «Leído» where the meta belongs', () => {
    assert.ok(!linea.includes("'Leído'"), 'the read state is still spelled out in the row');
    assert.ok(linea.includes('meta(n)'), 'the meta line never replaced it');
  });

  it('encodes the state three ways, so none of them is load-bearing alone', () => {
    for (const canal of ['unreadDot', 'noticeRowLeido', 'noticeTitleLeido']) {
      assert.ok(linea.includes(canal), `${canal} — the dot, the ground and the weight`);
    }
  });

  it('keeps «Sin leer» for assistive technology', () => {
    // Dropping the word from the row must not drop it from the accessible name.
    assert.ok(linea.includes("aria-label={sinLeer ? 'Sin leer' : undefined}"));
  });

  it('the meta names the time and the source', () => {
    const m = linea.slice(
      linea.indexOf('function meta('),
      linea.indexOf('export function AvisoLinea'),
    );
    assert.ok(m.includes('formatFechaHora(n.createdAt)'));
    assert.ok(m.includes('FUENTE[n.source]'));
  });
});
