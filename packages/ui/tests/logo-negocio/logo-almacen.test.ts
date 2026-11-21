/**
 * The logo's cache on the phone's file system (N-19), over a fake of the
 * `expo-file-system/legacy` slice it uses: one file per ETag, a pointer to the
 * current one, and the conditional GET with the ETag held.
 */
import { describe, expect, it } from 'vitest';
import type { LogoGuardado } from '@xangarro/application';
import {
  archivoDe,
  LogoDescargaError,
  logoAlmacenDe,
  type LogoFs,
} from '../../src/logo-negocio/logo-almacen.shared';

const DOCS = 'file:///docs/';
const DIR = `${DOCS}logo-negocio/`;

type Respuesta = { status: number; headers: Record<string, string>; cuerpo?: string };

function fsFalso(respuesta: Respuesta = { status: 200, headers: {} }) {
  const archivos = new Map<string, string>();
  const pedidos: { url: string; headers: Record<string, string> }[] = [];
  const fs: LogoFs = {
    documentDirectory: DOCS,
    cacheDirectory: 'file:///cache/',
    getInfoAsync: async (uri) => ({ exists: archivos.has(uri) }),
    readAsStringAsync: async (uri) => {
      const v = archivos.get(uri);
      if (v === undefined) throw new Error(`ENOENT ${uri}`);
      return v;
    },
    writeAsStringAsync: async (uri, s) => void archivos.set(uri, s),
    deleteAsync: async (uri) => {
      for (const k of [...archivos.keys()]) if (k === uri || k.startsWith(uri)) archivos.delete(k);
    },
    makeDirectoryAsync: async () => undefined,
    readDirectoryAsync: async (dir) =>
      [...archivos.keys()].filter((k) => k.startsWith(dir)).map((k) => k.slice(dir.length)),
    downloadAsync: async (url, fileUri, o) => {
      pedidos.push({ url, headers: o?.headers ?? {} });
      if (respuesta.cuerpo !== undefined) archivos.set(fileUri, respuesta.cuerpo);
      return { status: respuesta.status, headers: respuesta.headers, md5: 'abc', mimeType: null };
    },
  };
  return { fs, archivos, pedidos };
}

const logo = (over: Partial<LogoGuardado> = {}): LogoGuardado => ({
  url: 'https://app.xangarro.mx/api/logos/01HZ8XQN9GZJXV8AKQ5X0BNS01',
  etag: '"AbC-12_x"',
  revision: '2026-11-01T10:00:00.000Z',
  mime: 'image/png',
  base64: 'iVBORw0KGgo=',
  ...over,
});

describe('logoAlmacenDe', () => {
  it('stores the bytes under their ETag and reads the copy back', async () => {
    const { fs, archivos } = fsFalso();
    const a = logoAlmacenDe(fs)!;
    await a.guardar(logo());
    expect(archivoDe('"AbC-12_x"')).toBe('AbC-12_x.logo');
    expect(archivos.get(`${DIR}AbC-12_x.logo`)).toBe('iVBORw0KGgo=');
    expect(await a.leer()).toEqual(logo());
  });

  it('rewrites only the pointer when the same ETag is checked again', async () => {
    const { fs, archivos } = fsFalso();
    const a = logoAlmacenDe(fs)!;
    await a.guardar(logo());
    archivos.set(`${DIR}AbC-12_x.logo`, 'sin-tocar');
    await a.guardar(logo({ revision: 'r2' }));
    expect(archivos.get(`${DIR}AbC-12_x.logo`)).toBe('sin-tocar');
    expect((await a.leer())?.revision).toBe('r2');
  });

  it('removes the previous logo’s file when a new one is stored', async () => {
    const { fs, archivos } = fsFalso();
    const a = logoAlmacenDe(fs)!;
    await a.guardar(logo());
    await a.guardar(logo({ etag: 'W/"nuevo"', base64: 'bnVldm8=' }));
    expect([...archivos.keys()].sort()).toEqual([`${DIR}actual.json`, `${DIR}nuevo.logo`]);
  });

  it('reads no copy when there is none, or it is torn, and clears it all', async () => {
    const { fs, archivos } = fsFalso();
    const a = logoAlmacenDe(fs)!;
    expect(await a.leer()).toBeNull();
    await a.guardar(logo());
    archivos.delete(`${DIR}AbC-12_x.logo`);
    expect(await a.leer()).toBeNull();
    await a.borrar();
    expect(archivos.size).toBe(0);
  });

  it('sends the ETag held and reads a 304 as no change, leaving no temp file', async () => {
    const { fs, archivos, pedidos } = fsFalso({ status: 304, headers: {} });
    const a = logoAlmacenDe(fs)!;
    expect(await a.descargar(logo().url, '"AbC-12_x"')).toEqual({ cambio: false });
    expect(pedidos[0]?.headers).toEqual({ 'If-None-Match': '"AbC-12_x"' });
    expect(archivos.size).toBe(0);
  });

  it('returns new bytes with their ETag and mime, whatever case the headers come in', async () => {
    const { fs, pedidos } = fsFalso({
      status: 200,
      headers: { Etag: '"dos"', 'content-type': 'image/PNG; charset=binary' },
      cuerpo: 'bnVldm8=',
    });
    const r = await logoAlmacenDe(fs)!.descargar(logo().url, null);
    expect(r).toEqual({ cambio: true, etag: '"dos"', mime: 'image/png', base64: 'bnVldm8=' });
    expect(pedidos[0]?.headers).toEqual({});
  });

  it('refuses any other status with a coded error', async () => {
    const { fs } = fsFalso({ status: 404, headers: {} });
    await expect(logoAlmacenDe(fs)!.descargar(logo().url, null)).rejects.toBeInstanceOf(
      LogoDescargaError,
    );
  });

  it('is absent where the platform has no document directory', () => {
    const { fs } = fsFalso();
    expect(logoAlmacenDe({ ...fs, documentDirectory: null })).toBeNull();
  });
});
