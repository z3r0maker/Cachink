'use client';

import { startTransition, useState, type FormEvent } from 'react';

import { firmarSubidaAction } from '@/server/actions/empresa-subidas';

/**
 * Sends a «Empresa» form that carries a file (E-26). With Azure configured,
 * the browser first puts the file in the inbox with a one-time URL and the
 * form carries only its key, so up to 25 MB never meets the console's 4.5 MB
 * request cap; without Azure, the file travels in the form as before. A
 * failed upload reaches the action as `archivoError`, so the form shows it
 * where it shows every other error.
 */
const FALLO = 'No se pudo subir el archivo. Intenta de nuevo.';

async function subirALaBandeja(form: FormData, f: File): Promise<void> {
  const firma = await firmarSubidaAction({ nombre: f.name, mime: f.type, tamano: f.size });
  if (firma === null) return;
  form.delete('archivo');
  if ('error' in firma) {
    form.set('archivoError', firma.error);
    return;
  }
  const res = await fetch(firma.url, {
    method: 'PUT',
    body: f,
    headers: { 'x-ms-blob-type': 'BlockBlob', 'content-type': f.type },
  });
  if (!res.ok) throw new Error(`upload answered ${res.status}`);
  form.set('archivoSubido', JSON.stringify({ key: firma.key, nombre: f.name, mime: f.type }));
}

async function prepararArchivo(form: FormData): Promise<FormData> {
  const f = form.get('archivo');
  if (!(f instanceof File) || f.size === 0) return form;
  try {
    await subirALaBandeja(form, f);
  } catch {
    form.delete('archivo');
    form.delete('archivoSubido');
    form.set('archivoError', FALLO);
  }
  return form;
}

/** `subiendo` covers the upload, before the action's own pending state begins. */
export function useEnvioConArchivo(action: (form: FormData) => void) {
  const [subiendo, setSubiendo] = useState(false);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubiendo(true);
    void prepararArchivo(form).then((listo) => {
      setSubiendo(false);
      startTransition(() => action(listo));
    });
  };
  return { onSubmit, subiendo } as const;
}
