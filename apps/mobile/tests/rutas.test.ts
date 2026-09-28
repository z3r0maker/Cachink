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
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RUTAS_DE_AVISO, rutaDeAviso } from '../src/shell/ruta-de-aviso';

const MOBILE = join(__dirname, '..');
const APP = join(MOBILE, 'src/app');
const FUENTES = [join(MOBILE, 'src'), join(MOBILE, '../../packages/ui/src')];
const OMITIR = /(\.test\.|\.stories\.|story-|ruta-de-aviso\.ts$)/;

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? archivos(p) : /\.tsx?$/.test(n) ? [p] : [];
  });
}

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

function sinComentarios(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Route-looking literals: '/turno', `/cobranza/${id}?abonar=1`. */
function rutasNombradas(): { ruta: string; archivo: string }[] {
  const rx = /['"`](\/[a-z][a-z0-9_-]*(?:\/[^'"`?#\s]*)?)(?:[?#][^'"`]*)?['"`]/g;
  return FUENTES.flatMap(archivos)
    .filter((f) => !OMITIR.test(f))
    .flatMap((f) => {
      const texto = sinComentarios(readFileSync(f, 'utf8'));
      return [...texto.matchAll(rx)].map((m) => ({
        ruta: m[1] ?? '',
        archivo: relative(MOBILE, f),
      }));
    });
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
