/**
 * guias-voz.ts — Don Cuentas's voice, from the workspace's side (ADR-163, G-07).
 *
 * The voice is made by a model the owner runs on his machine behind oMLX. This
 * says what is missing, asks oMLX for it, and holds the result to the lines:
 *
 *   pnpm guias:voz            what has no audio, and which audio no line names
 *   pnpm guias:voz --check    exit 1 while either list is not empty
 *   pnpm guias:voz muestra    a new take of the voice, to listen to
 *   pnpm guias:voz usar 2     keep take 2 as the voice
 *   pnpm guias:voz lineas     say every line that has no audio, in that voice
 *
 * `OMLX_URL` moves it off http://localhost:8000; `OMLX_API_KEY` is sent when set.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GUIAS, VOZ_DON } from '../packages/guias/src/index.js';
import { REFERENCIA, grabarLineas, grabarMuestra, usarToma } from './guias-voz-grabar.js';
import { audios, estado, lineas, type Estado } from './guias-voz-lineas.js';
import type { Servidor } from './guias-voz-omlx.js';

const ROOT = join(fileURLToPath(import.meta.url), '../..');
const out = (line: string): void => void process.stdout.write(`${line}\n`);

function servidor(): Servidor {
  const url = process.env.OMLX_URL ?? 'http://localhost:8000';
  const clave = process.env.OMLX_API_KEY;
  return clave === undefined || clave === '' ? { url } : { url, clave };
}

const actual = (): { readonly total: number; readonly e: Estado } => {
  const esperadas = lineas(GUIAS, VOZ_DON.version);
  return { total: esperadas.length, e: estado(esperadas, audios(ROOT)) };
};

function informe(): Estado {
  const { total, e } = actual();
  out(`${total} lines, ${e.faltan.length} with no audio, ${e.sobran.length} audio left over.`);
  for (const l of e.faltan) out(`  to say   ${l.guia} ${l.paso}: ${l.texto}`);
  for (const a of e.sobran) out(`  delete   ${a} (no line says this any more)`);
  if (!existsSync(join(ROOT, REFERENCIA))) out('No voice yet: pnpm guias:voz muestra');
  else if (e.faltan.length > 0) out('Say them: pnpm guias:voz lineas');
  return e;
}

const ORDENES: Readonly<Record<string, (valor?: string) => Promise<number> | number>> = {
  '': () => {
    informe();
    return 0;
  },
  '--check': () => {
    const e = informe();
    return e.faltan.length + e.sobran.length === 0 ? 0 : 1;
  },
  muestra: async () => {
    const toma = await grabarMuestra(ROOT, servidor(), VOZ_DON);
    out(`Wrote ${toma}. Listen to it; to keep it: pnpm guias:voz usar <its number>`);
    return 0;
  },
  usar: (n) => {
    if (n === undefined) throw new Error('Which take? pnpm guias:voz usar 2');
    out(`${usarToma(ROOT, n)} is now the voice (${REFERENCIA}).`);
    out(
      'If lines were already said in another voice, raise `version` in packages/guias/src/voz.ts.',
    );
    return 0;
  },
  lineas: async () => {
    if (!existsSync(join(ROOT, REFERENCIA)))
      throw new Error('No voice yet: pnpm guias:voz muestra');
    const hecho = (l: { guia: string; paso: number; archivo: string }): void =>
      out(`  said     ${l.guia} ${l.paso}: ${l.archivo}`);
    await grabarLineas(ROOT, servidor(), VOZ_DON, actual().e.faltan, hecho);
    return informe().faltan.length === 0 ? 0 : 1;
  },
};

async function main(args: readonly string[]): Promise<number> {
  const orden = ORDENES[args[0] ?? ''];
  if (orden === undefined)
    throw new Error(`Unknown: ${args[0]}. See the top of scripts/guias-voz.ts.`);
  return orden(args[1]);
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  },
);
