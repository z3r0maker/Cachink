/**
 * guias-voz.ts — what Don Cuentas still has to say (ADR-163, G-07).
 *
 * The voice is generated on the owner's machine, outside the workspace. This
 * is the workspace's half: it lists the lines whose audio is missing, writes
 * them where the runner reads them, and says which audio no line names any more.
 *
 * Usage: `pnpm guias:voz` (lists, and writes the pending list)
 *        `pnpm guias:voz --check` (exit 1 while a line lacks its audio or an
 *        audio lacks its line: what the clips are built against)
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GUIAS, VOZ_DON } from '../packages/guias/src/index.js';
import { CARPETA, audios, estado, lineas, type Estado } from './guias-voz-lineas.js';

const ROOT = join(fileURLToPath(import.meta.url), '../..');
/** The one sample every line is said in. Committed: it is the voice. */
const REFERENCIA = `${CARPETA}/don-cuentas.wav`;
/** What the runner reads. Rewritten on every run and not committed. */
const PENDIENTES = `${CARPETA}/pendientes.json`;

const out = (line: string): void => void process.stdout.write(`${line}\n`);

function escribirPendientes(e: Estado): void {
  mkdirSync(join(ROOT, CARPETA), { recursive: true });
  const voz = { ...VOZ_DON, referencia: REFERENCIA };
  writeFileSync(join(ROOT, PENDIENTES), `${JSON.stringify({ voz, lineas: e.faltan }, null, 2)}\n`);
}

function informe(total: number, e: Estado): void {
  out(`${total} lines, ${e.faltan.length} with no audio, ${e.sobran.length} audio left over.`);
  for (const l of e.faltan) out(`  to say   ${l.guia} ${l.paso}: ${l.texto}`);
  for (const a of e.sobran) out(`  delete   ${a} (no line says this any more)`);
  if (!existsSync(join(ROOT, REFERENCIA))) {
    out(`No sample yet: python scripts/guias-voz-qwen.py muestra (writes ${REFERENCIA}).`);
  } else if (e.faltan.length > 0) {
    out('Say them: python scripts/guias-voz-qwen.py lineas');
  }
}

function main(args: readonly string[]): number {
  const esperadas = lineas(GUIAS, VOZ_DON.version);
  const e = estado(esperadas, audios(ROOT));
  informe(esperadas.length, e);
  if (args.includes('--check')) return e.faltan.length + e.sobran.length === 0 ? 0 : 1;
  escribirPendientes(e);
  out(`Wrote ${PENDIENTES}.`);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
