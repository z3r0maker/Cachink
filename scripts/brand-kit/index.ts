/**
 * Generates the brand kit's Word pages: the three covers in `brand-kit/portada/`
 * and the folder front in `brand-kit/folder/`.
 *
 *   pnpm brand:portadas                    # rewrite the four .docx
 *   pnpm brand:portadas moneda             # only the files whose name has «moneda»
 *   pnpm brand:portadas --preview          # also redraw each .png through Word for Mac
 *   pnpm brand:portadas --sample --out <dir> --preview
 *                                          # long copy, to check a layout still holds
 *
 * Run it after the logo, a token colour or a design in `designs.ts` changes,
 * and commit only the files that design touches: two runs are never the same
 * bytes, because Word's font embedding is keyed at random and the package
 * records when it was made. Do not edit the .docx by hand; the next run would
 * undo it.
 *
 * What is drawn and what is typed: the art (`art-pages.ts`) is a picture behind
 * the text, shot by the repo's Chromium; every word on the page is live text in
 * a named style (`designs.ts`), in the embedded Plus Jakarta Sans. Where a
 * machine neither has the font nor honours the embedded copy, Word shows Arial.
 *
 * Checked by hand in Word for Mac 16.115 and not by any test: clicking a field
 * selects its placeholder, and typing replaces it in its style. `--preview`
 * checks the rest: that Word lays each file out on exactly one page.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { withArt } from './art.js';
import { designs, type Design } from './designs.js';
import { toDocx } from './document.js';
import { COPY, SAMPLE } from './fields.js';
import { preview } from './preview.js';
import { ROOT } from './sources.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: 'string' },
    preview: { type: 'boolean', default: false },
    sample: { type: 'boolean', default: false },
  },
});

if (values.sample && values.out === undefined) {
  console.error('--sample needs --out: sample copy never goes into brand-kit/.');
  process.exit(1);
}

const out = resolve(values.out ?? join(ROOT, 'brand-kit'));
const wanted = (design: Design): boolean =>
  positionals.length === 0 ||
  positionals.some((word) => basename(design.file).toLowerCase().includes(word.toLowerCase()));
const chosen = designs(values.sample ? SAMPLE : COPY).filter(wanted);

if (chosen.length === 0) {
  console.error(`No page is named like: ${positionals.join(', ')}`);
  process.exit(1);
}

await withArt(async (draw) => {
  for (const design of chosen) {
    const path = join(out, design.file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, await toDocx(design, await draw(design.art)));
    console.log(`Wrote ${relative(process.cwd(), path)}`);
    if (values.preview)
      console.log(`  one page in Word: ${relative(process.cwd(), preview(path))}`);
  }
});
