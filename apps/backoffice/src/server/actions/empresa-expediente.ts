'use server';

import { createHash } from 'node:crypto';

import {
  subirDocumento,
  subirVersion,
  type Archivo,
  type DocumentoMeta,
} from '@xangarro/application/corp';
import { createCorpLedgerRepository, createDocumentRepository } from '@xangarro/data-corp';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auditedMutation } from '../audited';
import { hoyEnMexico, requireCorpDb } from '../db/corp';
import { failed } from '../empresa/fallas';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * The Expediente's writes (E-05): file a document, attach one to a movement,
 * upload a new version. Founders only, each with its staff audit row after
 * the corp write commits. Nothing here deletes.
 */
const deps = () => {
  const db = requireCorpDb();
  return {
    documentos: createDocumentRepository(db),
    ledger: createCorpLedgerRepository(db),
    sha256: async (b: Uint8Array) => createHash('sha256').update(b).digest('hex'),
  };
};

async function archivoDe(form: FormData): Promise<Archivo | null> {
  const f = form.get('archivo');
  if (!(f instanceof File)) return null;
  return { nombre: f.name, mime: f.type, contenido: new Uint8Array(await f.arrayBuffer()) };
}

const audit = (action: string) => (d: DocumentoMeta) => ({
  action,
  payload: { documentoId: d.id, sha256: d.sha256, carpeta: d.carpeta, reemplazaA: d.reemplazaA },
});

const SIN_ARCHIVO: FormState = { ok: false, message: 'Elige el archivo.' };

async function subir(form: FormData, entryId: string | null): Promise<DocumentoMeta | FormState> {
  const { founder } = await requireFounder();
  const archivo = await archivoDe(form);
  if (archivo === null) return SIN_ARCHIVO;
  const { result } = await auditedMutation(audit('empresa.documento_subido'), () =>
    subirDocumento(deps(), {
      carpeta: entryId === null ? field(form, 'carpeta') : 'comprobantes',
      titulo: field(form, 'titulo'),
      periodo: field(form, 'periodo'),
      entryId,
      tipo: 'otro',
      archivo,
      hoy: hoyEnMexico(),
      founderId: founder.id,
    }),
  );
  revalidatePath('/empresa', 'layout');
  return result;
}

export async function subirDocumentoAction(_p: FormState, form: FormData): Promise<FormState> {
  let doc: DocumentoMeta;
  try {
    const r = await subir(form, null);
    if (r === null || !('id' in r)) return r;
    doc = r;
  } catch (error) {
    return failed(error, 'subirDocumento');
  }
  redirect(`/empresa/expediente?carpeta=${doc.carpeta}&doc=${doc.id}`);
}

export async function adjuntarAMovimientoAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const r = await subir(form, field(form, 'entryId'));
    return r === null || !('id' in r) ? r : { ok: true, message: `Guardado: ${r.nombre}.` };
  } catch (error) {
    return failed(error, 'adjuntarAMovimiento');
  }
}

export async function subirVersionAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const archivo = await archivoDe(form);
    if (archivo === null) return SIN_ARCHIVO;
    const { result } = await auditedMutation(audit('empresa.version_subida'), () =>
      subirVersion(deps(), {
        documentoId: field(form, 'documentoId'),
        archivo,
        hoy: hoyEnMexico(),
        founderId: founder.id,
      }),
    );
    revalidatePath('/empresa', 'layout');
    return { ok: true, message: `Nueva versión guardada: ${result.nombre}.` };
  } catch (error) {
    return failed(error, 'subirVersion');
  }
}
