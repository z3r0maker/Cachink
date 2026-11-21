/**
 * guias-voz-ritmo.ts — how fast Don Cuentas speaks (ADR-163, G-07).
 *
 * Qwen3-TTS has no speed setting: mlx-audio 0.6.3 takes `speed` and ignores
 * it. What the model does is copy the pace of the sample it hears, and the
 * kept sample is slow, a third of it pauses. So the model is given the sample
 * tightened: edges trimmed, long pauses cut short, and played `ritmo` times
 * faster with the pitch kept. Only the model hears that copy. The kept file is
 * not touched, and no line's audio is stretched: he says it faster himself.
 *
 * Measured on six lines on 2026-11-21, in words a minute over the spoken part:
 * 145 with the sample as kept, 166 at a pace of 1, 179 at 1.15, 199 at 1.3.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Past this the sample stops being a fair copy of his voice. */
export const RITMO_MAX = 1.5;

/** Quieter than this is silence. */
const UMBRAL = '-38dB';
/** A pause longer than this many seconds is cut down to `QUEDA`. */
const PAUSA_LARGA = 0.3;
const QUEDA = 0.22;

/** The ffmpeg filter the sample goes through before the model hears it. */
export function filtroRitmo(ritmo: number): string {
  if (!(ritmo >= 1 && ritmo <= RITMO_MAX))
    throw new Error(`The pace must be between 1 and ${RITMO_MAX}; it is ${ritmo}.`);
  const pausas =
    `silenceremove=start_periods=1:start_threshold=${UMBRAL}:start_silence=0.05:` +
    `stop_periods=-1:stop_duration=${PAUSA_LARGA}:stop_threshold=${UMBRAL}:stop_silence=${QUEDA}`;
  return ritmo === 1 ? pausas : `${pausas},atempo=${ritmo}`;
}

/** The sample as the model hears it: the kept WAV, tightened to this pace. */
export function apretar(muestra: Uint8Array, ritmo: number): Buffer {
  const filtro = filtroRitmo(ritmo);
  const tmp = mkdtempSync(join(tmpdir(), 'guias-ritmo-'));
  try {
    const entrada = join(tmp, 'muestra.wav');
    const salida = join(tmp, 'apretada.wav');
    writeFileSync(entrada, muestra);
    const como = ['-af', filtro, '-ar', '24000', '-ac', '1', salida];
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', entrada, ...como]);
    return readFileSync(salida);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
