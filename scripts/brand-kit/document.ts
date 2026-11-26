/**
 * One design and its art, as a finished .docx.
 *
 * The page is: the art, anchored to the page behind the text; the floating
 * table that holds the text; and one empty paragraph, which is where a person
 * starts writing after the cover. The fonts travel inside the file.
 */

import { basename } from 'node:path';

import { CharacterSet, Document, Packer } from 'docx';

import type { Design } from './designs.js';
import { artAnchor, blank, grid, tw } from './docx-parts.js';
import { styles } from './docx-styles.js';
import { finish } from './finish.js';
import { assertFits } from './layout.js';
import { SANS, SANS_EXTRABOLD, sansTtf } from './sources.js';

export async function toDocx(design: Design, art: Buffer): Promise<Uint8Array> {
  const { size } = design.art;
  assertFits(design.grid.rows, size, design.margin);
  const edge = tw(design.margin);
  const doc = new Document({
    creator: 'Xangarro',
    title: basename(design.file, '.docx'),
    description: 'Plantilla de marca de Xangarro',
    compatabilityModeVersion: 15,
    fonts: [
      { name: SANS, data: sansTtf(400), bold: sansTtf(700), characterSet: CharacterSet.ANSI },
      { name: SANS_EXTRABOLD, data: sansTtf(800), characterSet: CharacterSet.ANSI },
    ],
    styles: styles(design.theme),
    sections: [
      {
        properties: {
          page: {
            size: { width: tw(size.w), height: tw(size.h) },
            margin: { top: edge, bottom: edge, left: edge, right: edge, header: 0, footer: 0 },
          },
        },
        children: [artAnchor(art, size, design.description), grid(design.grid), blank()],
      },
    ],
  });
  return finish(new Uint8Array(await Packer.toBuffer(doc)));
}
