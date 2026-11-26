/**
 * `finish` rewrites two parts of the file docx-js packed, with string edits on
 * its XML. These hold the edits to what Word needs: the alternate ahead of a
 * font's other properties, and a control around a whole run and nothing less.
 */

import assert from 'node:assert/strict';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { describe, it } from 'vitest';

import { FIELDS } from './fields.js';
import { altNames, contentControls, finish } from './finish.js';

const FONTS =
  '<w:fonts><w:font w:name="Plus Jakarta Sans"><w:charset w:val="00"/></w:font>' +
  '<w:font w:name="Plus Jakarta Sans ExtraBold"><w:charset w:val="00"/></w:font></w:fonts>';

const run = (text: string, properties = ''): string =>
  `<w:r>${properties}<w:t xml:space="preserve">${text}</w:t></w:r>`;
const body = (...runs: string[]): string =>
  `<w:body>${runs.map((r) => `<w:p>${r}</w:p>`).join('')}</w:body>`;

describe('altNames: the face Word shows without the brand font', () => {
  it('names an alternate for each brand font, ahead of its other properties', () => {
    const xml = altNames(FONTS);
    assert.ok(
      xml.includes('<w:font w:name="Plus Jakarta Sans"><w:altName w:val="Arial"/><w:charset'),
    );
    assert.ok(
      xml.includes(
        '<w:font w:name="Plus Jakarta Sans ExtraBold"><w:altName w:val="Arial Black"/><w:charset',
      ),
    );
  });

  it('changes nothing the second time', () => {
    assert.equal(altNames(altNames(FONTS)), altNames(FONTS));
  });

  it('refuses a font table that lost a brand font', () => {
    assert.throws(
      () => altNames('<w:fonts><w:font w:name="Plus Jakarta Sans"></w:font></w:fonts>'),
      /no entry for Plus Jakarta Sans ExtraBold/,
    );
  });
});

describe('contentControls: the four fields', () => {
  const all = body(...Object.values(FIELDS).map((field) => run(field.placeholder)));

  it('wraps each placeholder in a control named and tagged for its field', () => {
    const { xml, made } = contentControls(all);
    assert.equal(made, 4);
    for (const [tag, field] of Object.entries(FIELDS)) {
      assert.ok(xml.includes(`<w:alias w:val="${field.alias}"/><w:tag w:val="${tag}"/>`), tag);
    }
    assert.equal(xml.match(/<w:id w:val="\d+"\/>/g)?.length, 4);
    assert.equal(new Set(xml.match(/<w:id w:val="\d+"\/>/g)).size, 4);
  });

  it('keeps the run whole inside the control, with its properties', () => {
    const titulo = run(FIELDS.titulo.placeholder, '<w:rPr><w:b/></w:rPr>');
    const { xml } = contentControls(body(titulo));
    assert.ok(xml.includes(`<w:sdtContent>${titulo}</w:sdtContent></w:sdt>`));
  });

  it('makes the date a date written the Mexican way, and the rest text', () => {
    const { xml } = contentControls(all);
    assert.equal(xml.match(/<w:date>/g)?.length, 1);
    assert.ok(xml.includes(`<w:dateFormat w:val="d 'de' MMMM 'de' yyyy"/><w:lid w:val="es-MX"/>`));
    assert.equal(xml.match(/<w:text w:multiLine="1"\/>/g)?.length, 3);
  });

  it('marks each as showing its placeholder, and locks the control, not its text', () => {
    const { xml } = contentControls(all);
    assert.equal(xml.match(/<w:lock w:val="sdtLocked"\/><w:showingPlcHdr\/>/g)?.length, 4);
  });

  it('makes none where the copy is not the placeholders', () => {
    const sample = body(run('Plan de negocio'), run('26 de noviembre de 2026'));
    assert.deepEqual(contentControls(sample), { xml: sample, made: 0 });
  });

  it('leaves a run alone when the placeholder is only part of its text', () => {
    const partial = body(run(`Ver ${FIELDS.autor.placeholder}`));
    assert.deepEqual(contentControls(partial), { xml: partial, made: 0 });
  });

  it('refuses a placeholder that appears twice: two controls would share a tag', () => {
    const twice = body(run(FIELDS.fecha.placeholder), run(FIELDS.fecha.placeholder));
    assert.throws(() => contentControls(twice), /appears 2 times/);
  });
});

describe('finish: the package', () => {
  const document = body(run(FIELDS.titulo.placeholder));
  const packed = (parts: Record<string, string>): Uint8Array =>
    zipSync(Object.fromEntries(Object.entries(parts).map(([name, xml]) => [name, strToU8(xml)])));
  const full = {
    'word/': '',
    'word/document.xml': document,
    'word/fontTable.xml': FONTS,
    'word/styles.xml': '<w:styles/>',
  };

  it('patches the two parts and leaves the rest byte for byte', () => {
    const parts = unzipSync(finish(packed(full)));
    assert.equal(
      strFromU8(parts['word/document.xml'] ?? new Uint8Array()),
      contentControls(document).xml,
    );
    assert.equal(strFromU8(parts['word/fontTable.xml'] ?? new Uint8Array()), altNames(FONTS));
    assert.equal(strFromU8(parts['word/styles.xml'] ?? new Uint8Array()), '<w:styles/>');
  });

  it('drops the folder entries Word has refused', () => {
    assert.ok('word/' in unzipSync(packed(full)), 'the fixture has a folder entry');
    assert.deepEqual(Object.keys(unzipSync(finish(packed(full)))).sort(), [
      'word/document.xml',
      'word/fontTable.xml',
      'word/styles.xml',
    ]);
  });

  it('refuses a package without a font table', () => {
    assert.throws(() => finish(packed({ 'word/document.xml': document })), /no word\/fontTable/);
  });

  it('refuses a package without a document', () => {
    assert.throws(() => finish(packed({ 'word/fontTable.xml': FONTS })), /no word\/document/);
  });
});
