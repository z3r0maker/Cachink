/**
 * guias-voz-grabar.ts — the files of Don Cuentas's voice (ADR-163, G-07):
 * takes of the sample, the one that is kept, and each line said in its voice.
 *
 * Takes are scratch and are not committed. The kept sample is: it is the
 * voice, and a line said next year has to sound like the ones said today.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { CARPETA, TOMAS, type Linea } from './guias-voz-lineas.js';
import { decir, pedirLinea, pedirMuestra, type Servidor, type Voz } from './guias-voz-omlx.js';
import { apretar } from './guias-voz-ritmo.js';

/** The one sample every line is said in. */
export const REFERENCIA = `${CARPETA}/don-cuentas.wav`;

/** The next take's number: one more than the highest among these file names. */
export function siguienteToma(nombres: readonly string[]): number {
  const numeros = nombres.flatMap((nombre) => {
    const n = /^toma-(\d+)\.wav$/.exec(nombre)?.[1];
    return n === undefined ? [] : [Number(n)];
  });
  return Math.max(0, ...numeros) + 1;
}

/** A new take of the voice. Resolves to its path from the repo root. */
export async function grabarMuestra(root: string, servidor: Servidor, voz: Voz): Promise<string> {
  mkdirSync(join(root, TOMAS), { recursive: true });
  const toma = `${TOMAS}/toma-${siguienteToma(readdirSync(join(root, TOMAS)))}.wav`;
  writeFileSync(join(root, toma), await decir(servidor, pedirMuestra(voz)));
  return toma;
}

/** Keeps take `n` as the voice. Returns the take's path and the kept file's SHA-256. */
export function usarToma(
  root: string,
  n: string,
): { readonly toma: string; readonly huella: string } {
  const toma = `${TOMAS}/toma-${n}.wav`;
  if (!existsSync(join(root, toma))) throw new Error(`There is no ${toma}.`);
  copyFileSync(join(root, toma), join(root, REFERENCIA));
  const kept = readFileSync(join(root, REFERENCIA));
  return { toma, huella: createHash('sha256').update(kept).digest('hex') };
}

/** WAV to mono AAC: small enough to commit, and what the clips carry anyway. */
function aM4a(wav: Buffer, destino: string): void {
  const tmp = mkdtempSync(join(tmpdir(), 'guias-voz-'));
  try {
    const entrada = join(tmp, 'linea.wav');
    writeFileSync(entrada, wav);
    mkdirSync(dirname(destino), { recursive: true });
    const salida = ['-ac', '1', '-c:a', 'aac', '-b:a', '64k', destino];
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', entrada, ...salida]);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/**
 * Says each of these lines in the kept sample's voice, at the voice's pace,
 * telling `hecho` as each one lands.
 */
export async function grabarLineas(
  root: string,
  servidor: Servidor,
  voz: Voz & { readonly ritmo: number },
  faltan: readonly Linea[],
  hecho: (linea: Linea) => void,
): Promise<void> {
  const muestra = apretar(readFileSync(join(root, REFERENCIA)), voz.ritmo);
  for (const linea of faltan) {
    const wav = await decir(servidor, pedirLinea(linea.texto, voz, muestra));
    aM4a(wav, join(root, linea.archivo));
    hecho(linea);
  }
}
