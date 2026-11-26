/**
 * Finishes the file docx-js writes, with the three things it has no option for.
 *
 * 1. The ZIP's folder entries go: Word has refused a file that has them when it
 *    is opened through a cloud co-editing service.
 * 2. Each brand font gets an alternate name in the font table: the face Word
 *    shows where it neither finds the font nor honours the embedded copy.
 *    Measured on Word for Mac 16.115: without it the fallback is Cambria.
 * 3. The four bracketed fields become content controls, the way Word's own
 *    cover pages have them: one click selects the whole placeholder, typing
 *    replaces it and keeps its style.
 */

import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

import { FIELDS } from './fields.js';
import { SANS, SANS_EXTRABOLD } from './sources.js';

export const ALTERNATES: Readonly<Record<string, string>> = {
  [SANS]: 'Arial',
  [SANS_EXTRABOLD]: 'Arial Black',
};

/** Names each brand font's alternate. Running it twice changes nothing. */
export function altNames(fontTable: string): string {
  let xml = fontTable;
  for (const [name, alternate] of Object.entries(ALTERNATES)) {
    const font = `<w:font w:name="${name}">`;
    if (!xml.includes(font)) throw new Error(`the font table has no entry for ${name}`);
    if (xml.includes(`${font}<w:altName`)) continue;
    xml = xml.replace(font, `${font}<w:altName w:val="${alternate}"/>`);
  }
  return xml;
}

/** What Word offers inside each kind of control. The date is written «26 de noviembre de 2026». */
const KINDS = {
  text: '<w:text w:multiLine="1"/>',
  date:
    `<w:date><w:dateFormat w:val="d 'de' MMMM 'de' yyyy"/><w:lid w:val="es-MX"/>` +
    '<w:storeMappedDataAs w:val="dateTime"/><w:calendar w:val="gregorian"/></w:date>',
} as const;

/** The controls' ids: any numbers, as long as each is unique in the document. */
const FIRST_ID = 4100;

const literal = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

/** A run that holds exactly `text`, with its properties when it has them. */
const runOf = (text: string): RegExp =>
  new RegExp(
    String.raw`<w:r>(?:<w:rPr>(?:(?!</w:rPr>).)*</w:rPr>)?<w:t(?: xml:space="preserve")?>` +
      `${literal(text)}</w:t></w:r>`,
    'g',
  );

/** Wraps each field's placeholder in its control, and says how many it made. */
export function contentControls(document: string): { xml: string; made: number } {
  let xml = document;
  let made = 0;
  for (const [index, [tag, field]] of Object.entries(FIELDS).entries()) {
    const found = xml.match(runOf(field.placeholder))?.length ?? 0;
    if (found > 1) throw new Error(`${field.placeholder} appears ${found} times`);
    const properties =
      `<w:sdtPr><w:alias w:val="${field.alias}"/><w:tag w:val="${tag}"/>` +
      `<w:id w:val="${FIRST_ID + index}"/><w:lock w:val="sdtLocked"/><w:showingPlcHdr/>` +
      `${KINDS[field.kind]}</w:sdtPr>`;
    xml = xml.replace(
      runOf(field.placeholder),
      (run) => `<w:sdt>${properties}<w:sdtContent>${run}</w:sdtContent></w:sdt>`,
    );
    made += found;
  }
  return { xml, made };
}

const PATCHES: Readonly<Record<string, (xml: string) => string>> = {
  'word/fontTable.xml': altNames,
  'word/document.xml': (xml) => contentControls(xml).xml,
};

/** The finished .docx, from the bytes docx-js packed. */
export function finish(docx: Uint8Array): Uint8Array {
  const packed = unzipSync(docx);
  const parts: Record<string, Uint8Array> = {};
  for (const [name, data] of Object.entries(packed)) {
    if (name.endsWith('/')) continue;
    const patch = PATCHES[name];
    parts[name] = patch ? strToU8(patch(strFromU8(data))) : data;
  }
  for (const name of Object.keys(PATCHES)) {
    if (!(name in parts)) throw new Error(`the file has no ${name}`);
  }
  return zipSync(parts, { level: 9 });
}
