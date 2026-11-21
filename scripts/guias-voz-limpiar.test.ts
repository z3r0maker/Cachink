/**
 * A new pace or a new voice renames every line's file, so thirty old files are
 * left over at once. `limpiar` deletes them, and only ever a line's audio.
 */

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'vitest';

import { CARPETA, limpiar } from './guias-voz-lineas.js';

const VIEJO = `${CARPETA}/cobrar/1-0123456789.m4a`;
const VIGENTE = `${CARPETA}/cobrar/1-abcdef0123.m4a`;

function conArchivos(prueba: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), 'guias-limpiar-'));
  try {
    mkdirSync(join(root, CARPETA, 'cobrar'), { recursive: true });
    for (const archivo of [VIEJO, VIGENTE, `${CARPETA}/don-cuentas.wav`])
      writeFileSync(join(root, archivo), '');
    prueba(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe('limpiar: deleting the audio no line names', () => {
  it('deletes what is left over, says how many, and leaves the rest', () => {
    conArchivos((root) => {
      assert.equal(limpiar(root, [VIEJO]), 1);
      assert.equal(existsSync(join(root, VIEJO)), false);
      assert.equal(existsSync(join(root, VIGENTE)), true);
    });
  });

  it('does nothing when nothing is left over', () => {
    conArchivos((root) => {
      assert.equal(limpiar(root, []), 0);
      assert.equal(existsSync(join(root, VIEJO)), true);
    });
  });

  it('refuses the sample: it is the voice, not a line', () => {
    conArchivos((root) => {
      assert.throws(() => limpiar(root, [`${CARPETA}/don-cuentas.wav`]), /Not a line's audio/);
      assert.equal(existsSync(join(root, CARPETA, 'don-cuentas.wav')), true);
    });
  });

  it('refuses a path that climbs out of the voice folder', () => {
    conArchivos((root) => {
      assert.throws(() => limpiar(root, [`${CARPETA}/../../x/1.m4a`]), /Not a line's audio/);
    });
  });

  it('refuses everything when one path is wrong, before deleting any', () => {
    conArchivos((root) => {
      assert.throws(() => limpiar(root, [VIEJO, 'package.json']), /Not a line's audio/);
      assert.equal(existsSync(join(root, VIEJO)), true);
    });
  });
});
