/**
 * Every page of the kit, built for real by docx-js with a one-pixel picture in
 * place of the art, so no browser is needed. What Word does with the file (one
 * page, a click selects a field) is not tested here: `--preview` checks the
 * first, a person the second.
 */

import assert from 'node:assert/strict';
import { strFromU8, unzipSync } from 'fflate';
import { beforeAll, describe, it } from 'vitest';

import { designs, type Design } from './designs.js';
import { tw } from './docx-parts.js';
import { toDocx } from './document.js';
import { FIELDS, SAMPLE } from './fields.js';
import { assertFits } from './layout.js';

const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

type Parts = Record<string, Uint8Array>;
const text = (parts: Parts, name: string): string => strFromU8(parts[name] ?? new Uint8Array());

/** WCAG relative luminance of a `#RRGGBB` colour. */
function luminance(color: string): number {
  const channel = (at: number): number => {
    const c = Number.parseInt(color.slice(at, at + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}
function contrast(a: string, b: string): number {
  const [light = 0, dark = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const ALL = designs();
const COVERS = ALL.filter((design) => design.file.startsWith('portada/'));
const FOLDER = ALL.find((design) => design.file.startsWith('folder/'));
const built = new Map<Design, Parts>();

beforeAll(async () => {
  for (const design of ALL) built.set(design, unzipSync(await toDocx(design, PIXEL)));
});

const parts = (design: Design): Parts => built.get(design) ?? {};

describe('the brand kit: three covers and the folder front', () => {
  it('is the four files the owner approved', () => {
    assert.deepEqual(
      ALL.map((design) => design.file),
      [
        'portada/Portada Xangarro - Amarillo.docx',
        'portada/Portada Xangarro - Negro.docx',
        'portada/Portada Xangarro - Moneda.docx',
        'folder/Folder Xangarro.docx',
      ],
    );
  });

  it.each(ALL)('$file keeps its text on one page, with the long copy too', (design) => {
    const sample = designs(SAMPLE).find((other) => other.file === design.file);
    assert.ok(sample);
    assert.doesNotThrow(() => assertFits(sample.grid.rows, sample.art.size, sample.margin));
  });

  it.each(ALL)('$file sets every text at 4.5:1 or better on its ground', (design) => {
    const { theme, ground } = design;
    const pairs: Array<[string, string, string]> = [
      ['lema', theme.lema.color, ground.lema],
      ['título', theme.titulo.color, ground.titulo],
      ['subtítulo', theme.subtitulo.color, ground.titulo],
      ['etiqueta', theme.etiqueta, ground.meta],
      ['dato', theme.dato, ground.meta],
    ];
    for (const [name, ink, paper] of pairs) {
      assert.ok(contrast(ink, paper) >= 4.5, `${name}: ${contrast(ink, paper).toFixed(2)}:1`);
    }
  });

  it.each(ALL)('$file says nothing the copy rules forbid', (design) => {
    const xml = text(parts(design), 'word/document.xml');
    const said = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>|descr="([^"]*)"/g)]
      .map((match) => match[1] ?? match[2] ?? '')
      .join(' ');
    assert.ok(said.includes('Finanzas para emprendedores.'));
    assert.equal(said.includes('—'), false, 'an em dash');
    assert.equal(/pronto|próximamente/i.test(said), false, '«Pronto»');
  });
});

describe('toDocx: the file Word opens', () => {
  it.each(COVERS)('$file has its four fields as controls, each once', (design) => {
    const xml = text(parts(design), 'word/document.xml');
    for (const [tag, field] of Object.entries(FIELDS)) {
      assert.equal(xml.split(`<w:tag w:val="${tag}"/>`).length - 1, 1, tag);
      assert.equal(xml.split(field.placeholder).length - 1, 1, field.placeholder);
    }
  });

  it('the folder has no fields: its lines are written on by hand', () => {
    assert.ok(FOLDER);
    const xml = text(parts(FOLDER), 'word/document.xml');
    assert.equal(xml.includes('<w:sdt>'), false);
    assert.ok(xml.includes('>Contenido<'));
  });

  it.each(ALL)('$file is the size of its sheet, with its margins', (design) => {
    const xml = text(parts(design), 'word/document.xml');
    const { w, h } = design.art.size;
    assert.ok(xml.includes(`<w:pgSz w:w="${tw(w)}" w:h="${tw(h)}"`), 'page size');
    assert.ok(xml.includes(`w:top="${tw(design.margin)}"`), 'top margin');
  });

  it.each(ALL)('$file floats its text from the corner and keeps the art behind it', (design) => {
    const xml = text(parts(design), 'word/document.xml');
    assert.ok(xml.includes('w:horzAnchor="page"') && xml.includes('w:vertAnchor="page"'));
    assert.ok(xml.includes('behindDoc="1"'));
    assert.ok(xml.includes(`w:tblpY="${tw(design.grid.rows[0]?.from ?? 0)}"`));
  });

  it.each(ALL)('$file carries the three faces, each family with an alternate', (design) => {
    const names = Object.keys(parts(design));
    assert.equal(names.filter((name) => name.endsWith('.odttf')).length, 3);
    const fonts = text(parts(design), 'word/fontTable.xml');
    assert.ok(fonts.includes('<w:embedRegular') && fonts.includes('<w:embedBold'));
    assert.equal(fonts.split('<w:altName').length - 1, 2);
  });

  it.each(ALL)('$file is written in es-MX, in the named styles', (design) => {
    const styles = text(parts(design), 'word/styles.xml');
    assert.ok(styles.includes('w:val="es-MX"'));
    for (const id of ['PortadaLema', 'PortadaTitulo', 'PortadaSubtitulo', 'PortadaDato']) {
      assert.ok(styles.includes(`w:styleId="${id}"`), id);
    }
  });

  it.each(ALL)('$file has no folder entries in its package', (design) => {
    assert.deepEqual(
      Object.keys(parts(design)).filter((name) => name.endsWith('/')),
      [],
    );
  });

  it('refuses a design whose text would spill onto a second page', async () => {
    const [cover] = COVERS;
    assert.ok(cover);
    const tall = { ...cover, grid: { ...cover.grid, rows: [{ from: 9, to: 10.4 }] } };
    await assert.rejects(toDocx(tall, PIXEL), /second page/);
  });
});
