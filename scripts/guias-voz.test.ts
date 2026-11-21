/**
 * Don Cuentas's voice is generated, so it can go stale without anyone hearing
 * it: a step's words change and its audio still says the old ones (ADR-163).
 * A line's audio file is named after a hash of what it says and of the voice
 * that says it, so the file name is the record. These tests hold that rule, and
 * the last ones read the repository as it is.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'vitest';

import { GUIAS, VOZ_DON, type Guia } from '../packages/guias/src/index.js';
import { REFERENCIA, siguienteToma } from './guias-voz-grabar.js';
import { CARPETA, TOMAS, audios, estado, lineas } from './guias-voz-lineas.js';

const ROOT = join(import.meta.dirname, '..');

const guia = (id: string, voces: readonly (string | undefined)[]): Guia => ({
  id,
  superficie: 'caja',
  tema: 'ventas',
  titulo: id,
  minutos: 1,
  pasos: voces.map((voz, i) =>
    voz === undefined ? { texto: `paso ${i}` } : { texto: `paso ${i}`, voz },
  ),
  ir: { label: 'Cobrar', href: 'cobrar' },
  pantallas: ['cobrar'],
  publica: false,
});

const DOS = [guia('cobrar', ['Toca lo que te pidieron.', 'Toca Cobrar y listo.'])];
const V1 = { version: 1, ritmo: 1 };
const V2 = { version: 2, ritmo: 1 };

describe('lineas: what Don Cuentas has to say, and where each line is kept', () => {
  it('lists a line per step that has a voice, numbered from one', () => {
    const l = lineas(DOS, V1);
    assert.deepEqual(
      l.map((x) => [x.guia, x.paso, x.texto]),
      [
        ['cobrar', 1, 'Toca lo que te pidieron.'],
        ['cobrar', 2, 'Toca Cobrar y listo.'],
      ],
    );
    assert.match(l[0]?.archivo ?? '', /^packages\/guias\/voz\/cobrar\/1-[0-9a-f]{10}\.m4a$/);
  });

  it('skips a step with nothing to say', () => {
    assert.equal(lineas([guia('sin-voz', [undefined, 'Solo este.'])], V1).length, 1);
  });

  it('names the file after the words, so other words are another file', () => {
    const antes = lineas(DOS, V1)[0]?.archivo;
    const despues = lineas([guia('cobrar', ['Toca lo que pidió.', 'Toca Cobrar y listo.'])], V1);
    assert.notEqual(despues[0]?.archivo, antes);
    assert.equal(despues[1]?.archivo, lineas(DOS, V1)[1]?.archivo);
  });

  it('names the file after the voice too, so a new voice says every line again', () => {
    const uno = lineas(DOS, V1).map((x) => x.archivo);
    const dos = lineas(DOS, V2).map((x) => x.archivo);
    assert.ok(uno.every((archivo) => !dos.includes(archivo)));
  });

  it('names the file after the pace too, so a new pace says every line again', () => {
    const lento = lineas(DOS, V1).map((x) => x.archivo);
    const vivo = lineas(DOS, { version: 1, ritmo: 1.15 }).map((x) => x.archivo);
    assert.ok(lento.every((archivo) => !vivo.includes(archivo)));
  });
});

describe('estado: which lines lack their audio, and which audio lacks its line', () => {
  const esperadas = lineas(DOS, V1);
  const todos = esperadas.map((x) => x.archivo);

  it('finds nothing missing and nothing left over when every line has its file', () => {
    assert.deepEqual(estado(esperadas, todos), { faltan: [], sobran: [] });
  });

  it('reports a line with no audio', () => {
    const e = estado(esperadas, todos.slice(0, 1));
    assert.deepEqual(
      e.faltan.map((x) => x.paso),
      [2],
    );
    assert.deepEqual(e.sobran, []);
  });

  it('reports a line whose words changed: its audio is missing and the old file is left over', () => {
    const cambiadas = lineas([guia('cobrar', ['Toca lo que pidió.', 'Toca Cobrar y listo.'])], V1);
    const e = estado(cambiadas, todos);
    assert.deepEqual(
      e.faltan.map((x) => x.paso),
      [1],
    );
    assert.deepEqual(e.sobran, [todos[0]]);
  });

  it('reports an audio file that no line names', () => {
    const huerfano = `${CARPETA}/cobrar/9-0123456789.m4a`;
    assert.deepEqual(estado(esperadas, [...todos, huerfano]).sobran, [huerfano]);
  });

  it('reports everything as missing when nothing was recorded', () => {
    assert.equal(estado(esperadas, []).faltan.length, 2);
  });
});

describe('the repository', () => {
  it('has thirty lines for Don Cuentas to say, one per step of the eight guides', () => {
    assert.equal(lineas(GUIAS, VOZ_DON).length, 30);
  });

  it('describes the voice, and gives the sample something to say with no digits in it', () => {
    assert.ok(VOZ_DON.descripcion.length > 80);
    assert.doesNotMatch(VOZ_DON.muestra, /[0-9$«»"]/);
  });

  it('keeps the sample the owner approved: the file is the one the voice names', () => {
    // The voice-design model never makes the same voice twice, so this file is
    // the voice. Swapping it changes how every future line sounds; a new sample
    // gets a new fingerprint and a new version together.
    const sample = readFileSync(join(ROOT, REFERENCIA));
    assert.equal(createHash('sha256').update(sample).digest('hex'), VOZ_DON.huella);
  });

  it('has the audio of every line, and none that is stale or that no line names', () => {
    const e = estado(lineas(GUIAS, VOZ_DON), audios(ROOT));
    assert.deepEqual(
      e.faltan.map((l) => `${l.guia} ${l.paso}: run pnpm guias:voz lineas`),
      [],
    );
    assert.deepEqual(e.sobran, []);
  });
});

describe('audios: the line files on disk', () => {
  it('lists each guide’s audio and leaves out the sample and anything that is not audio', () => {
    const root = mkdtempSync(join(tmpdir(), 'guias-voz-'));
    try {
      mkdirSync(join(root, CARPETA, 'cobrar'), { recursive: true });
      writeFileSync(join(root, CARPETA, 'cobrar', '1-0123456789.m4a'), '');
      writeFileSync(join(root, CARPETA, 'cobrar', 'notas.txt'), '');
      writeFileSync(join(root, CARPETA, 'don-cuentas.wav'), '');
      assert.deepEqual(audios(root), [`${CARPETA}/cobrar/1-0123456789.m4a`]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('leaves out the takes folder: it is scratch, and no clone has the same one', () => {
    const root = mkdtempSync(join(tmpdir(), 'guias-voz-'));
    try {
      mkdirSync(join(root, TOMAS), { recursive: true });
      writeFileSync(join(root, TOMAS, 'todas-las-lineas.m4a'), '');
      assert.deepEqual(audios(root), []);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('finds none where nothing was ever recorded', () => {
    assert.deepEqual(audios(join(tmpdir(), 'guias-voz-no-existe')), []);
  });
});

describe('siguienteToma: the number of the next take of the voice', () => {
  it('starts at one', () => {
    assert.equal(siguienteToma([]), 1);
  });

  it('goes one past the highest take, whatever order they come in', () => {
    assert.equal(siguienteToma(['toma-2.wav', 'toma-10.wav', 'toma-1.wav']), 11);
  });

  it('ignores files that are not takes', () => {
    assert.equal(siguienteToma(['linea-de-prueba.wav', 'toma-3.m4a', 'toma-x.wav']), 1);
  });
});
