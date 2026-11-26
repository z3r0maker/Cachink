/**
 * A picture of a .docx as Microsoft Word shows it, and the proof it is one page.
 *
 * Word does the rendering, because Word is where the file will be opened: what
 * another renderer draws says nothing about Word's line breaks or its second
 * pages. So this needs a Mac with Word, and poppler for `pdfinfo` and
 * `pdftoppm`. Word must be allowed to be scripted (macOS asks the first time).
 *
 * The same file gives the same picture, byte for byte, with one exception seen
 * on 2026-11-26: Word's first export after sitting idle came out one pixel
 * lower, and exporting that file again gave the usual picture. A .png that
 * changes with no design change is that; run it once more before committing.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';

/** Word is sandboxed: the one place it may save without asking is its own container. */
const BOX = join(
  homedir(),
  'Library/Containers/com.microsoft.Word/Data/Documents/xangarro-brand-kit',
);
const EXPORT = join(import.meta.dirname, 'word-pdf.applescript');

const run = (command: string, args: readonly string[]): string =>
  execFileSync(command, [...args], { encoding: 'utf8' });

/** Writes `<name>.png` beside the .docx and returns its path. Refuses a file Word paginates. */
export function preview(docx: string): string {
  if (process.platform !== 'darwin') throw new Error('--preview needs Microsoft Word for Mac');
  const name = basename(docx);
  const pdf = join(BOX, name.replace(/\.docx$/, '.pdf'));
  const png = docx.replace(/\.docx$/, '.png');
  mkdirSync(BOX, { recursive: true });
  rmSync(pdf, { force: true });
  try {
    run('open', ['-g', '-a', 'Microsoft Word', docx]);
    run('osascript', [EXPORT, name, pdf]);
    const pages = /^Pages:\s+(\d+)/m.exec(run('pdfinfo', [pdf]))?.[1];
    if (pages !== '1') throw new Error(`Word lays ${name} out on ${pages ?? '?'} pages, not one`);
    run('pdftoppm', ['-png', '-r', '150', '-singlefile', pdf, png.replace(/\.png$/, '')]);
    return png;
  } finally {
    rmSync(pdf, { force: true });
  }
}
