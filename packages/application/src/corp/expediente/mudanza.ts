import type { Almacen, BlobStore } from '../agenda/ports.js';

/**
 * E-26's one-time move between blob stores (ADR-127 §5): Postgres to Azure.
 * Each file is checked against the SHA-256 recorded at upload before it is
 * copied and again after, and only then is its row pointed at the new store.
 * Nothing is deleted: emptying the old store is a separate, deliberate step.
 * A run can be repeated; a file already copied is checked, not written again.
 */
export interface DocumentoPorMover {
  readonly id: string;
  readonly blobKey: string;
  readonly sha256: string;
  readonly mime: string;
}

export interface MudanzaDeps {
  readonly origen: BlobStore;
  readonly destino: BlobStore;
  /** The documents still in `origen`. */
  readonly pendientes: () => Promise<readonly DocumentoPorMover[]>;
  readonly marcarMovido: (id: string, almacen: Almacen) => Promise<void>;
  readonly sha256: (bytes: Uint8Array) => Promise<string>;
}

export type MotivoFallido = 'sin_bytes' | 'sha_origen' | 'sha_destino';

export interface ResultadoMudanza {
  readonly movidos: readonly string[];
  readonly fallidos: readonly { readonly id: string; readonly motivo: MotivoFallido }[];
}

async function moverUno(deps: MudanzaDeps, doc: DocumentoPorMover): Promise<MotivoFallido | null> {
  const bytes = await deps.origen.leer(doc.blobKey);
  if (bytes === null) return 'sin_bytes';
  if ((await deps.sha256(bytes)) !== doc.sha256) return 'sha_origen';
  if ((await deps.destino.leer(doc.blobKey)) === null) {
    await deps.destino.guardar(doc.blobKey, bytes, doc.mime);
  }
  const copia = await deps.destino.leer(doc.blobKey);
  if (copia === null || (await deps.sha256(copia)) !== doc.sha256) return 'sha_destino';
  await deps.marcarMovido(doc.id, deps.destino.almacen);
  return null;
}

export async function moverDocumentos(deps: MudanzaDeps): Promise<ResultadoMudanza> {
  const movidos: string[] = [];
  const fallidos: { id: string; motivo: MotivoFallido }[] = [];
  for (const doc of await deps.pendientes()) {
    const motivo = await moverUno(deps, doc);
    if (motivo === null) movidos.push(doc.id);
    else fallidos.push({ id: doc.id, motivo });
  }
  return { movidos, fallidos };
}
