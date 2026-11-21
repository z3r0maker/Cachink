/**
 * guias-voz-lineas.ts — what Don Cuentas has to say and where each line's
 * audio is kept (ADR-163, G-07).
 *
 * A line's file is named after a hash of its words and of what makes the voice
 * sound as it does, its version and its pace:
 * `packages/guias/voz/<guía>/<paso>-<huella>.m4a`. So the name is the record.
 * Change a word, or the pace, and the line's file is no longer there, and the
 * old one is a file no line names; nothing has to remember which audio said what.
 */

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import type { Guia } from '../packages/guias/src/index.js';

/** Where the audio lives, from the repo root. */
export const CARPETA = 'packages/guias/voz';
/** Takes to listen to and choose from. Scratch: git ignores it, and it holds no line. */
export const TOMAS = `${CARPETA}/muestras`;
/** Mono AAC: small enough to commit, and what the clips carry anyway. */
const EXT = '.m4a';

/** One line to say. */
export interface Linea {
  readonly guia: string;
  /** The step, from one. */
  readonly paso: number;
  readonly texto: string;
  /** Its audio file, from the repo root. */
  readonly archivo: string;
}

export interface Estado {
  /** Lines with no audio that says their words. */
  readonly faltan: readonly Linea[];
  /** Audio files no line names: stale, or never a line's. */
  readonly sobran: readonly string[];
}

/** What in the voice decides how a line sounds: which sample, and how fast. */
export interface Sonido {
  readonly version: number;
  readonly ritmo: number;
}

const huella = (voz: Sonido, texto: string): string =>
  createHash('sha256').update(`${voz.version}\n${voz.ritmo}\n${texto}`).digest('hex').slice(0, 10);

/** Every step that has a voice, with the file its audio belongs in. */
export function lineas(guias: readonly Guia[], voz: Sonido): readonly Linea[] {
  return guias.flatMap((g) =>
    g.pasos.flatMap((p, i) => {
      if (p.voz === undefined) return [];
      const archivo = `${CARPETA}/${g.id}/${i + 1}-${huella(voz, p.voz)}${EXT}`;
      return [{ guia: g.id, paso: i + 1, texto: p.voz, archivo }];
    }),
  );
}

/** What is missing and what is left over, given the audio files there are. */
export function estado(esperadas: readonly Linea[], archivos: readonly string[]): Estado {
  const hay = new Set(archivos);
  const nombrados = new Set(esperadas.map((l) => l.archivo));
  return {
    faltan: esperadas.filter((l) => !hay.has(l.archivo)),
    sobran: archivos.filter((a) => !nombrados.has(a)),
  };
}

/**
 * The line files on disk, as paths from the repo root: the `.m4a` inside each
 * guide's folder. The sample sits beside those folders and is not a line, and
 * the takes folder is scratch that no two machines share.
 */
export function audios(root: string): readonly string[] {
  const carpeta = join(root, CARPETA);
  if (!existsSync(carpeta)) return [];
  return readdirSync(carpeta, { withFileTypes: true })
    .filter((e) => e.isDirectory() && `${CARPETA}/${e.name}` !== TOMAS)
    .flatMap((dir) =>
      readdirSync(join(carpeta, dir.name))
        .filter((f) => f.endsWith(EXT))
        .map((f) => `${CARPETA}/${dir.name}/${f}`),
    )
    .sort();
}

/** A line's audio and nothing else: a guide's folder under the voice folder, one `.m4a`. */
const DE_LINEA = /^[a-z0-9-]+\/[^/]+\.m4a$/;

/**
 * Deletes the audio no line names; a new pace or a new voice leaves every old
 * file over at once. Refuses the whole list if any of it is not a line's audio.
 */
export function limpiar(root: string, sobran: readonly string[]): number {
  const ajeno = sobran.find(
    (a) => !a.startsWith(`${CARPETA}/`) || !DE_LINEA.test(a.slice(CARPETA.length + 1)),
  );
  if (ajeno !== undefined) throw new Error(`Not a line's audio: ${ajeno}`);
  for (const archivo of sobran) rmSync(join(root, archivo));
  return sobran.length;
}
