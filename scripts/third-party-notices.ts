/**
 * `pnpm notices`: writes the third-party notices the phone app carries in
 * its bundle (`apps/mobile/assets/legal/avisos-de-terceros.txt`). Decided
 * with the owner 2026-11-20: MIT, BSD and Apache ask for their notice in
 * every copy, not for a screen, so the app ships the file and shows nothing.
 * Each package's own licence file is read, so every copyright line is kept;
 * identical texts are written once with their packages under them.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
export const AVISOS_PATH = join(ROOT, 'apps/mobile/assets/legal/avisos-de-terceros.txt');

export interface Paquete {
  readonly name: string;
  readonly version: string;
  /** The licence the package declares (SPDX id, or «Unknown»). */
  readonly license: string;
  /** Its licence file's text, or null when it ships none. */
  readonly texto: string | null;
}

interface Listado {
  readonly name: string;
  readonly versions: readonly string[];
  readonly paths: readonly string[];
}

const ARCHIVO = /^(licen[cs]e|copying|notice)(\.(md|txt|markdown))?$/i;

/** The package's licence file(s), NOTICE included (Apache-2.0 §4d). */
function textoDe(dir: string | undefined): string | null {
  if (dir === undefined || !existsSync(dir)) return null;
  const archivos = readdirSync(dir)
    .filter((f) => ARCHIVO.test(f))
    .sort();
  if (archivos.length === 0) return null;
  return archivos.map((f) => readFileSync(join(dir, f), 'utf8').trim()).join('\n\n');
}

/**
 * Where each name@version is installed. The workspace installs hoisted, so
 * the store paths `pnpm licenses` prints don't exist on disk: walk every
 * `node_modules` once instead and read each package.json.
 */
function indiceInstalado(): Map<string, string> {
  const indice = new Map<string, string>();
  const visitar = (nm: string, hondo: number): void => {
    if (hondo > 6 || !existsSync(nm)) return;
    for (const e of readdirSync(nm, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name.startsWith('.')) continue;
      const dirs = e.name.startsWith('@')
        ? readdirSync(join(nm, e.name)).map((s) => join(nm, e.name, s))
        : [join(nm, e.name)];
      for (const dir of dirs) registrar(indice, dir, (sub) => visitar(sub, hondo + 1));
    }
  };
  for (const raiz of [
    '',
    'apps/mobile',
    ...readdirSync(join(ROOT, 'packages')).map((p) => `packages/${p}`),
  ]) {
    visitar(join(ROOT, raiz, 'node_modules'), 0);
  }
  return indice;
}

function registrar(indice: Map<string, string>, dir: string, hijos: (nm: string) => void): void {
  const pj = join(dir, 'package.json');
  if (!existsSync(pj)) return;
  try {
    const { name, version } = JSON.parse(readFileSync(pj, 'utf8')) as {
      name?: string;
      version?: string;
    };
    const clave = `${name}@${version}`;
    if (name !== undefined && !indice.has(clave)) indice.set(clave, dir);
  } catch {
    return;
  }
  hijos(join(dir, 'node_modules'));
}

/**
 * True for a native binary of the machine that builds the app, the kind a
 * package marks with `os` or `cpu` (`fsevents`, `@sentry/cli-darwin`). pnpm
 * installs only the one that matches the host, so counting them made the file
 * differ between a Mac and the Linux CI; none ships inside the app's bundle.
 */
export function esDelAnfitrion(manifiesto: {
  readonly os?: unknown;
  readonly cpu?: unknown;
}): boolean {
  const restringe = (v: unknown): boolean => Array.isArray(v) && v.length > 0;
  return restringe(manifiesto.os) || restringe(manifiesto.cpu);
}

function delAnfitrion(dir: string | undefined): boolean {
  const pj = dir === undefined ? '' : join(dir, 'package.json');
  if (!existsSync(pj)) return false;
  try {
    return esDelAnfitrion(JSON.parse(readFileSync(pj, 'utf8')) as Record<string, unknown>);
  } catch {
    return false;
  }
}

/** Every production dependency of the phone app, as pnpm resolves it, without the host's binaries. */
export function collectPackages(): Paquete[] {
  const json = execFileSync(
    'pnpm',
    ['--filter', '@xangarro/mobile', 'licenses', 'list', '--prod', '--json'],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  const porLicencia = JSON.parse(json) as Record<string, readonly Listado[]>;
  const indice = indiceInstalado();
  return Object.entries(porLicencia).flatMap(([license, xs]) =>
    xs.flatMap((x) =>
      x.versions.flatMap((version, i) => {
        const dir = indice.get(`${x.name}@${version}`) ?? x.paths[i];
        if (delAnfitrion(dir)) return [];
        return [{ name: x.name, version, license, texto: textoDe(dir) }];
      }),
    ),
  );
}

const CABEZA = [
  'Avisos de software de terceros',
  '',
  'Xangarro (MEXIA, S.A.S.) se construye con software de código abierto.',
  'Este archivo reúne las licencias de los paquetes que la app incluye, con sus avisos de copyright.',
  'Se genera con `pnpm notices` a partir de las dependencias de producción de la app.',
].join('\n');

const RAYA = '='.repeat(72);

/** One block per distinct licence text, sorted, so the file only changes when the tree does. */
export function renderNotices(paquetes: readonly Paquete[]): string {
  const bloques = new Map<string, string[]>();
  for (const p of paquetes) {
    const texto =
      p.texto ?? `Licencia declarada: ${p.license} (el paquete no trae archivo de licencia).`;
    const lista = bloques.get(texto) ?? [];
    lista.push(`${p.name} ${p.version}`);
    bloques.set(texto, lista);
  }
  const ordenados = [...bloques.entries()]
    .map(([texto, nombres]) => ({ texto, nombres: [...new Set(nombres)].sort() }))
    .sort((a, b) => (a.nombres[0] ?? '').localeCompare(b.nombres[0] ?? ''));
  const cuerpo = ordenados.map((b) => `${RAYA}\n${b.nombres.join('\n')}\n\n${b.texto}`);
  return `${CABEZA}\n\n${cuerpo.join('\n\n')}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const paquetes = collectPackages();
  writeFileSync(AVISOS_PATH, renderNotices(paquetes));
  console.log(`wrote ${AVISOS_PATH} (${paquetes.length} paquetes)`);
}
