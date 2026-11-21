/**
 * guias-voz-lineas.ts — what Don Cuentas has to say and where each line's
 * audio is kept (ADR-163, G-07).
 *
 * A line's file is named after a hash of its words and of the voice's version:
 * `packages/guias/voz/<guía>/<paso>-<huella>.m4a`. So the name is the record.
 * Change a word and the line's file is no longer there, and the old one is a
 * file no line names; nothing has to remember which audio said what.
 */

import { createHash } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import type { Guia } from '../packages/guias/src/index.js';

/** Where the audio lives, from the repo root. */
export const CARPETA = 'packages/guias/voz';
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

const huella = (version: number, texto: string): string =>
  createHash('sha256').update(`${version}\n${texto}`).digest('hex').slice(0, 10);

/** Every step that has a voice, with the file its audio belongs in. */
export function lineas(guias: readonly Guia[], version: number): readonly Linea[] {
  return guias.flatMap((g) =>
    g.pasos.flatMap((p, i) => {
      if (p.voz === undefined) return [];
      const archivo = `${CARPETA}/${g.id}/${i + 1}-${huella(version, p.voz)}${EXT}`;
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
 * guide's folder. The sample and the pending list sit beside those folders and
 * are not lines.
 */
export function audios(root: string): readonly string[] {
  const carpeta = join(root, CARPETA);
  if (!existsSync(carpeta)) return [];
  return readdirSync(carpeta, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .flatMap((dir) =>
      readdirSync(join(carpeta, dir.name))
        .filter((f) => f.endsWith(EXT))
        .map((f) => `${CARPETA}/${dir.name}/${f}`),
    )
    .sort();
}
