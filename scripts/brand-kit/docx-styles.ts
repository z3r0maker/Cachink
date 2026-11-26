/**
 * The cover's named styles. Every text on the page is in one of them, so a
 * typed title keeps the size, weight and colour it was designed with, and the
 * styles show by name in Word («Portada título», «Portada dato»…).
 */

import {
  LineRuleType,
  type AlignmentType,
  type IParagraphStyleOptions,
  type IStylesOptions,
} from 'docx';

import { colors } from '../../packages/tokens/src/index.js';

import { hex, pt, track, tw } from './docx-parts.js';
import { SANS, SANS_EXTRABOLD } from './sources.js';

export type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

interface Face {
  /** Points. */
  readonly size: number;
  /** A token colour. */
  readonly color: string;
}

/** What differs between one design and the next. */
export interface Theme {
  /** The title and the subtitle. */
  readonly align: Align;
  /** The date and the author. */
  readonly metaAlign: Align;
  /** The tagline; `before` is the space above it, in inches. */
  readonly lema: Face & { readonly align: Align; readonly before?: number };
  readonly titulo: Face;
  readonly subtitulo: Face;
  /** The colour of the labels «Fecha» and «Autor». */
  readonly etiqueta: string;
  /** The colour of what goes under them, and its size in points. */
  readonly dato: string;
  readonly datoSize?: number;
}

type Run = NonNullable<IParagraphStyleOptions['run']>;
type Para = NonNullable<IParagraphStyleOptions['paragraph']>;

const style = (id: string, name: string, run: Run, paragraph: Para): IParagraphStyleOptions => ({
  id,
  name,
  basedOn: 'Normal',
  next: 'Normal',
  quickFormat: true,
  run,
  paragraph,
});

/** `before` and `after` in inches. */
const para = (alignment: Align, before = 0, after = 0): Para => ({
  alignment,
  spacing: { before: tw(before), after: tw(after) },
});

const display = (face: Face, tracking: number): Run => ({
  font: SANS_EXTRABOLD,
  size: pt(face.size),
  color: hex(face.color),
  characterSpacing: track(tracking),
});

function titulo(t: Theme): IParagraphStyleOptions {
  // Exact leading, 1.06 of the size: a three-line title stays inside its band.
  const line = Math.round(t.titulo.size * 20 * 1.06);
  return style('PortadaTitulo', 'Portada título', display(t.titulo, -0.8), {
    alignment: t.align,
    spacing: { before: 0, after: 0, line, lineRule: LineRuleType.EXACT },
  });
}

const etiqueta = (t: Theme): IParagraphStyleOptions =>
  style(
    'PortadaEtiqueta',
    'Portada etiqueta',
    {
      font: SANS,
      bold: true,
      allCaps: true,
      size: pt(8.5),
      color: hex(t.etiqueta),
      characterSpacing: track(0.8),
    },
    para(t.metaAlign, 0, 0.05),
  );

export function styles(t: Theme): IStylesOptions {
  const body = { font: SANS, size: pt(11), color: hex(colors.ink), language: { value: 'es-MX' } };
  const subtitulo = { font: SANS, size: pt(t.subtitulo.size), color: hex(t.subtitulo.color) };
  const dato = { font: SANS, bold: true, size: pt(t.datoSize ?? 12.5), color: hex(t.dato) };
  return {
    default: { document: { run: body } },
    paragraphStyles: [
      style(
        'PortadaLema',
        'Portada lema',
        display(t.lema, -0.2),
        para(t.lema.align, t.lema.before),
      ),
      titulo(t),
      style('PortadaSubtitulo', 'Portada subtítulo', subtitulo, para(t.align, 0.16)),
      etiqueta(t),
      style('PortadaDato', 'Portada dato', dato, para(t.metaAlign)),
    ],
  };
}
