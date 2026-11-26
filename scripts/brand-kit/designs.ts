/**
 * The brand kit's pages: the three covers the owner approved (2026-11-26) and
 * the folder front. Each names its art, its type and where its text sits, in
 * inches from the page's corner.
 *
 * Amarillo and Negro bleed to the edge; Moneda keeps everything inside ordinary
 * print margins; the folder is printed straight onto a paper folder.
 */

import { AlignmentType, Paragraph, TextRun, VerticalAlignTable, type TableCell } from 'docx';

import { colors } from '../../packages/tokens/src/index.js';

import { AMARILLO, FOLDER_FRONT, MONEDA, NEGRO, type ArtPage } from './art-pages.js';
import { cell, hex, p, pt, type Grid } from './docx-parts.js';
import type { Theme } from './docx-styles.js';
import { COPY, type Copy } from './fields.js';
import { FOLDER, SANS } from './sources.js';

export interface Design {
  /** Where the file goes, under `brand-kit/`. */
  readonly file: string;
  readonly art: ArtPage;
  /** The section's margins, in inches, for whatever is written after the page. */
  readonly margin: number;
  /** The art, described for a screen reader. */
  readonly description: string;
  readonly theme: Theme;
  readonly grid: Grid;
  /** The colour under each text, which `designs.test.ts` holds to 4.5:1. */
  readonly ground: { readonly lema: string; readonly titulo: string; readonly meta: string };
}

const { LEFT, CENTER } = AlignmentType;
const V = VerticalAlignTable;
const LOGO = 'Logotipo de Xangarro: la moneda amarilla con la X y la palabra XANGARRO!';

const lema = (copy: Copy): Paragraph[] => [p('PortadaLema', copy.lema)];
const titulo = (copy: Copy): Paragraph[] => [
  p('PortadaTitulo', copy.titulo),
  p('PortadaSubtitulo', copy.subtitulo),
];
/** A label and what goes under it. */
const dato = (label: string, value: string): Paragraph[] => [
  p('PortadaEtiqueta', label),
  p('PortadaDato', value),
];
/** The date and the author, side by side. */
const meta =
  (copy: Copy) =>
  (half: number): TableCell[] => [
    cell({ width: half, v: V.CENTER, children: dato(copy.fechaLabel, copy.fecha) }),
    cell({ width: half, v: V.CENTER, children: dato(copy.autorLabel, copy.autor) }),
  ];

const amarillo = (copy: Copy): Design => ({
  file: 'portada/Portada Xangarro - Amarillo.docx',
  art: AMARILLO,
  margin: 1,
  description: `${LOGO} Fondo amarillo con una tarjeta blanca para el título.`,
  ground: { lema: colors.yellow, titulo: colors.white, meta: colors.yellow },
  theme: {
    align: CENTER,
    metaAlign: CENTER,
    lema: { size: 15, color: colors.ink, align: CENTER, before: 0.1 },
    titulo: { size: 30, color: colors.black },
    subtitulo: { size: 13, color: colors.gray600 },
    etiqueta: colors.ink,
    dato: colors.black,
  },
  grid: {
    left: 1,
    width: 6.5,
    rows: [
      { from: 4.38, to: 5.5, children: lema(copy) },
      { from: 5.5, to: 8.3, v: V.CENTER, pad: { left: 0.5, right: 0.5 }, children: titulo(copy) },
      { from: 9.16, to: 9.86, cells: meta(copy) },
    ],
  },
});

const negro = (copy: Copy): Design => ({
  file: 'portada/Portada Xangarro - Negro.docx',
  art: NEGRO,
  margin: 1,
  description: `${LOGO} Fondo negro con la moneda en grande y una franja amarilla abajo.`,
  ground: { lema: colors.black, titulo: colors.black, meta: colors.yellow },
  theme: {
    align: LEFT,
    metaAlign: LEFT,
    lema: { size: 11, color: colors.yellow, align: LEFT },
    titulo: { size: 36, color: colors.white },
    subtitulo: { size: 14, color: colors.gray200 },
    etiqueta: colors.ink,
    dato: colors.black,
  },
  grid: {
    left: 0.9,
    width: 6.7,
    rows: [
      { from: 1.62, to: 2.12, children: lema(copy) },
      { from: 2.12, to: 8.6, v: V.BOTTOM, children: titulo(copy) },
      { from: 9.2, to: 9.95, cells: meta(copy) },
    ],
  },
});

const moneda = (copy: Copy): Design => ({
  file: 'portada/Portada Xangarro - Moneda.docx',
  art: MONEDA,
  margin: 1,
  description: `${LOGO} Hoja blanca con la moneda al centro y el título entre dos líneas.`,
  ground: { lema: colors.white, titulo: colors.white, meta: colors.white },
  theme: {
    align: CENTER,
    metaAlign: CENTER,
    lema: { size: 15, color: colors.ink, align: CENTER, before: 0.1 },
    titulo: { size: 30, color: colors.black },
    subtitulo: { size: 13, color: colors.gray600 },
    etiqueta: colors.gray600,
    dato: colors.black,
  },
  grid: {
    left: 1.25,
    width: 6,
    rows: [
      { from: 4.8, to: 5.6, children: lema(copy) },
      { from: 5.95, to: 8.25, v: V.CENTER, pad: { left: 0.3, right: 0.3 }, children: titulo(copy) },
      { from: 8.7, to: 9.5, cells: meta(copy) },
    ],
  },
});

/** The site's address, at the foot of the folder. It has no style of its own. */
function site(): Paragraph {
  const run = { font: SANS, bold: true, size: pt(11), color: hex(colors.black) };
  return new Paragraph({
    alignment: CENTER,
    children: [new TextRun({ text: 'xangarro.mx', ...run })],
  });
}

/** The folder has no fields: «Contenido» and «Fecha» are lines to write on by hand. */
function folder(copy: Copy): Design {
  const pad = { left: 0.45, right: 0.45, bottom: 0.06 };
  return {
    file: 'folder/Folder Xangarro.docx',
    art: FOLDER_FRONT,
    margin: 0.79,
    description: `${LOGO} Frente de fólder con un recuadro para anotar el contenido y la fecha.`,
    ground: { lema: colors.white, titulo: colors.white, meta: colors.white },
    theme: {
      align: CENTER,
      metaAlign: LEFT,
      lema: { size: 16, color: colors.black, align: CENTER },
      titulo: { size: 30, color: colors.black },
      subtitulo: { size: 13, color: colors.ink },
      etiqueta: colors.ink,
      dato: colors.black,
      datoSize: 13,
    },
    grid: {
      left: (FOLDER.w - 6.65) / 2,
      width: 6.65,
      rows: [
        { from: 4, to: 4.6, v: V.CENTER, children: lema(copy) },
        { from: 7.22, to: 8.02, v: V.BOTTOM, pad, children: dato('Contenido', ' ') },
        { from: 8.22, to: 9.02, v: V.BOTTOM, pad, children: dato(copy.fechaLabel, ' ') },
        { from: 10.05, to: 10.45, v: V.CENTER, children: [site()] },
      ],
    },
  };
}

/** Every page of the kit, with the template's copy unless another is given. */
export const designs = (copy: Copy = COPY): Design[] => [
  amarillo(copy),
  negro(copy),
  moneda(copy),
  folder(copy),
];
