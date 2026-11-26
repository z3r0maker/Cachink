/**
 * The Word pieces a page is assembled from: the art, anchored to the page behind
 * the text, and a borderless table of fixed-height rows that holds the text.
 *
 * Both are placed from the page's corner, not from the margins, so the layout
 * survives being pasted into a document with other margins, and replacing a
 * placeholder never moves anything else.
 */

import {
  BorderStyle,
  HeightRule,
  HorizontalPositionRelativeFrom,
  ImageRun,
  LineRuleType,
  Paragraph,
  Table,
  TableAnchorType,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  TextWrappingType,
  VerticalAlignTable,
  VerticalPositionRelativeFrom,
  WidthType,
} from 'docx';

import { place, type Band } from './layout.js';
import type { PageSize } from './sources.js';

/** Inches to twentieths of a point, Word's unit for lengths. */
export const tw = (inches: number): number => Math.round(inches * 1440);
/** Points to half-points, Word's unit for type sizes. */
export const pt = (points: number): number => Math.round(points * 2);
/** Points to twentieths of a point, Word's unit for tracking. */
export const track = (points: number): number => Math.round(points * 20);
/** A token colour as Word writes it: no leading «#». */
export const hex = (color: string): string => color.slice(1);

export type VAlign = (typeof VerticalAlignTable)[keyof typeof VerticalAlignTable];

/** A cell's padding, in inches. */
export interface Pad {
  readonly top?: number;
  readonly bottom?: number;
  readonly left?: number;
  readonly right?: number;
}

/** A band of text: one cell across, or two side by side when `cells` is given. */
export interface Row extends Band {
  readonly v?: VAlign;
  readonly pad?: Pad;
  readonly children?: readonly Paragraph[];
  /** `half` is each cell's width, in twentieths of a point. */
  readonly cells?: (half: number) => TableCell[];
}

/** The text's table: its left edge and width in inches, and its rows. */
export interface Grid {
  readonly left: number;
  readonly width: number;
  readonly rows: readonly Row[];
}

const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE };
/** A one-point line: the least room Word gives a paragraph. */
const HAIRLINE = { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT };

/** A paragraph in one of the cover's named styles. */
export const p = (style: string, text: string): Paragraph =>
  new Paragraph({ style, children: [new TextRun({ text })] });

/** An empty one-point paragraph, for a cell or a page that must hold something. */
export const blank = (): Paragraph =>
  new Paragraph({ spacing: HAIRLINE, children: [new TextRun({ text: '', size: 2 })] });

interface CellOptions {
  /** Twentieths of a point. */
  readonly width: number;
  readonly span?: number;
  readonly v?: VAlign;
  readonly pad?: Pad;
  readonly children?: readonly Paragraph[];
}

export function cell({ width, span, v, pad = {}, children }: CellOptions): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    columnSpan: span,
    verticalAlign: v ?? VerticalAlignTable.TOP,
    borders: NO_BORDERS,
    margins: {
      top: tw(pad.top ?? 0),
      bottom: tw(pad.bottom ?? 0),
      left: tw(pad.left ?? 0),
      right: tw(pad.right ?? 0),
    },
    children: children ? [...children] : [blank()],
  });
}

const tableRow = (height: number, children: TableCell[]): TableRow =>
  new TableRow({
    height: { value: tw(height), rule: HeightRule.EXACT },
    cantSplit: true,
    children,
  });

/** The table, floating over the page from its corner, with an empty row for every gap. */
export function grid({ left, width, rows }: Grid): Table {
  const full = tw(width);
  const half = full / 2;
  const across = (row?: Row): TableCell[] => [cell({ ...row, width: full, span: 2 })];
  const built = place(rows).flatMap(({ gap, height, band }) => [
    ...(gap > 0 ? [tableRow(gap, across())] : []),
    tableRow(height, band.cells ? band.cells(half) : across(band)),
  ]);
  return new Table({
    width: { size: full, type: WidthType.DXA },
    columnWidths: [half, half],
    layout: TableLayoutType.FIXED,
    borders: { ...NO_BORDERS, insideHorizontal: NONE, insideVertical: NONE },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    float: {
      horizontalAnchor: TableAnchorType.PAGE,
      verticalAnchor: TableAnchorType.PAGE,
      absoluteHorizontalPosition: tw(left),
      absoluteVerticalPosition: tw(rows[0]?.from ?? 0),
      leftFromText: 0,
      rightFromText: 0,
      topFromText: 0,
      bottomFromText: 0,
    },
    rows: built,
  });
}

/**
 * The art, anchored to the page from the body's first paragraph and sent behind
 * the text. It lives in the body, not the header, because Word dims header
 * content on screen while the body is being edited, and because a body anchor
 * travels with the page when the cover is copied into another file.
 */
export function artAnchor(png: Buffer, size: PageSize, description: string): Paragraph {
  const image = new ImageRun({
    type: 'png',
    data: png,
    transformation: { width: size.w * 96, height: size.h * 96 },
    altText: { name: 'Xangarro', title: 'Xangarro', description },
    floating: {
      horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
      verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
      wrap: { type: TextWrappingType.NONE },
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      behindDocument: true,
      allowOverlap: true,
      lockAnchor: true,
    },
  });
  return new Paragraph({ spacing: HAIRLINE, children: [image] });
}
