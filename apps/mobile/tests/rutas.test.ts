/**
 * Every route the phone's code names exists (Track M, M-12).
 *
 * Reads the Expo Router tree under `src/app` and every string literal that
 * looks like a route in `src/` and `packages/ui/src` (comments, stories and
 * tests left out), and fails on a path no screen answers: the check that
 * would have caught `/caja-reportes` and `/merma-reportes` outliving their
 * screens. The legacy routes `rutaDeAviso` translates are checked on their
 * targets, not their keys.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RUTAS_DE_AVISO, rutaDeAviso } from '../src/shell/ruta-de-aviso';

const MOBILE = join(__dirname, '..');
const APP = join(MOBILE, 'src/app');
const FUENTES = [join(MOBILE, 'src'), join(MOBILE, '../../packages/ui/src')];
const OMITIR = /(\.test\.|\.stories\.|story-|ruta-de-aviso\.ts$)/;

/** One recursive listing, no `statSync` per entry (see `FUENTES_LEIDAS`). */
function archivos(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((n) => /\.tsx?$/.test(n))
    .map((n) => join(dir, n));
}

function sinComentarios(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/**
 * The sources, walked and read **once**, while the file is collected. The walk
 * used to run inside the test with a `statSync` per entry and a read per file
 * (~500 files): 130 ms alone, over 5 s under `pnpm test`, which failed a
 * pre-push gate on 2026-10-28.
 */
const FUENTES_LEIDAS = FUENTES.flatMap(archivos)
  .filter((f) => !OMITIR.test(f))
  .map((f) => ({ archivo: relative(MOBILE, f), texto: sinComentarios(readFileSync(f, 'utf8')) }));

/** `(tabs)/turno.tsx` → `turno`; `cobranza/[cliente].tsx` → `cobranza/[cliente]`. */
function rutasDeLaApp(): string[][] {
  return archivos(APP)
    .map((f) =>
      relative(APP, f)
        .replace(/\.tsx?$/, '')
        .split('/'),
    )
    .filter((s) => !s.some((x) => x.startsWith('_') || x.startsWith('+')))
    .map((s) => s.filter((x) => !/^\(.*\)$/.test(x)))
    .map((s) => (s[s.length - 1] === 'index' ? s.slice(0, -1) : s));
}

/** Route-looking literals: '/turno', `/cobranza/${id}?abonar=1`. */
function rutasNombradas(): { ruta: string; archivo: string }[] {
  const rx = /['"`](\/[a-z][a-z0-9_-]*(?:\/[^'"`?#\s]*)?)(?:[?#][^'"`]*)?['"`]/g;
  return FUENTES_LEIDAS.flatMap(({ archivo, texto }) =>
    [...texto.matchAll(rx)].map((m) => ({ ruta: m[1] ?? '', archivo })),
  );
}

function existe(ruta: string, rutas: readonly string[][]): boolean {
  const s = ruta
    .split(/[?#]/)[0]!
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean);
  return rutas.some(
    (r) => r.length === s.length && r.every((x, i) => x === s[i] || /^\[.+\]$/.test(x)),
  );
}

describe('routes the phone names', () => {
  const rutas = rutasDeLaApp();

  it('reads the app tree', () => {
    expect(rutas.length).toBeGreaterThan(10);
    expect(existe('/cobranza/c1', rutas)).toBe(true);
    expect(existe('/caja-reportes', rutas)).toBe(false);
  });

  it('every route literal in the phone and packages/ui has a screen', () => {
    const nombradas = rutasNombradas();
    expect(nombradas.length).toBeGreaterThan(20);
    const faltan = nombradas.filter((n) => !existe(n.ruta, rutas));
    expect(faltan).toEqual([]);
  });

  it('a tapped notification always lands on a screen', () => {
    for (const r of RUTAS_DE_AVISO) expect(existe(r, rutas)).toBe(true);
    expect(rutaDeAviso(undefined)).toBe('/avisos');
    expect(rutaDeAviso('/caja-reportes')).toBe('/turno');
    expect(rutaDeAviso('/merma-reportes')).toBe('/inventario');
    expect(rutaDeAviso('/productos/p-1')).toBe('/inventario');
    expect(rutaDeAviso('/egresos')).toBe('/egresos');
  });
});
