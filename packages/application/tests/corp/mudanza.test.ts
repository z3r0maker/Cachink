import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'vitest';

import {
  moverDocumentos,
  type Almacen,
  type BlobStore,
  type DocumentoPorMover,
} from '../../src/corp/index.js';

/**
 * E-26's one-time move: each file is copied from Postgres to Azure, checked
 * against the SHA-256 recorded at upload on both sides, and only then is its
 * row pointed at the new store. Nothing is ever deleted from either store.
 */
const sha = async (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
const bytes = (s: string) => new TextEncoder().encode(s);

class MemStore implements BlobStore {
  readonly maxBytes = 25 * 1024 * 1024;
  readonly blobs = new Map<string, Uint8Array>();
  writes = 0;
  constructor(readonly almacen: Almacen) {}
  async guardar(key: string, b: Uint8Array) {
    if (this.blobs.has(key)) throw new Error('exists');
    this.writes += 1;
    this.blobs.set(key, b);
  }
  async leer(key: string) {
    return this.blobs.get(key) ?? null;
  }
}

async function escenario(contenidos: Record<string, string>) {
  const origen = new MemStore('pg');
  const destino = new MemStore('azure');
  const docs: DocumentoPorMover[] = [];
  for (const [id, texto] of Object.entries(contenidos)) {
    origen.blobs.set(id, bytes(texto));
    docs.push({ id, blobKey: id, sha256: await sha(bytes(texto)), mime: 'application/pdf' });
  }
  const marcados: [string, Almacen][] = [];
  const deps = {
    origen,
    destino,
    pendientes: async () => docs.filter((d) => !marcados.some(([id]) => id === d.id)),
    marcarMovido: async (id: string, almacen: Almacen) => {
      marcados.push([id, almacen]);
    },
    sha256: sha,
  };
  return { origen, destino, docs, marcados, deps };
}

describe('moverDocumentos', () => {
  it('copies each file, checks it and points its row at the new store', async () => {
    const e = await escenario({ a: '%PDF acta', b: '%PDF acuse' });
    const r = await moverDocumentos(e.deps);
    assert.deepEqual(r, { movidos: ['a', 'b'], fallidos: [] });
    assert.deepEqual(e.marcados, [
      ['a', 'azure'],
      ['b', 'azure'],
    ]);
    assert.deepEqual(e.destino.blobs.get('a'), bytes('%PDF acta'));
    // The originals stay until someone empties the old store on purpose.
    assert.equal(e.origen.blobs.size, 2);
  });

  it('refuses to copy a file whose bytes no longer match their SHA-256', async () => {
    const e = await escenario({ a: '%PDF acta' });
    e.origen.blobs.set('a', bytes('%PDF otra cosa'));
    const r = await moverDocumentos(e.deps);
    assert.deepEqual(r, { movidos: [], fallidos: [{ id: 'a', motivo: 'sha_origen' }] });
    assert.equal(e.destino.writes, 0);
    assert.deepEqual(e.marcados, []);
  });

  it('reports a row whose bytes are missing, and moves the rest', async () => {
    const e = await escenario({ a: '%PDF acta', b: '%PDF acuse' });
    e.origen.blobs.delete('a');
    const r = await moverDocumentos(e.deps);
    assert.deepEqual(r, { movidos: ['b'], fallidos: [{ id: 'a', motivo: 'sin_bytes' }] });
  });

  it('resumes after an interrupted run without writing a file twice', async () => {
    const e = await escenario({ a: '%PDF acta' });
    e.destino.blobs.set('a', bytes('%PDF acta'));
    const r = await moverDocumentos(e.deps);
    assert.deepEqual(r.movidos, ['a']);
    assert.equal(e.destino.writes, 0);
  });

  it('leaves the row where it was when the copy does not match', async () => {
    const e = await escenario({ a: '%PDF acta' });
    e.destino.blobs.set('a', bytes('%PDF a medias'));
    const r = await moverDocumentos(e.deps);
    assert.deepEqual(r, { movidos: [], fallidos: [{ id: 'a', motivo: 'sha_destino' }] });
    assert.deepEqual(e.marcados, []);
  });
});
