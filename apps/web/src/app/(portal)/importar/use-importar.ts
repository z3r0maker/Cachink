'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  importarDatos,
  previsualizarImportacion,
  type ImportResult,
} from '@/server/actions/importar';
import type { PreviewRow } from '@/server/import/templates';
import type { TemplateId } from '@/server/import/templates';

/**
 * The import's three steps (P-07, generalised N-16): pick a file → preview →
 * import. The file stays in the browser and is sent again on commit; the
 * server re-plans it rather than trusting the preview.
 */
export type Step =
  | { name: 'archivo' }
  | { name: 'revision'; rows: readonly PreviewRow[] }
  | { name: 'listo'; result: Extract<ImportResult, { ok: true }> };

const asForm = (file: File, plantilla: TemplateId): FormData => {
  const form = new FormData();
  form.append('archivo', file);
  form.append('plantilla', plantilla);
  return form;
};

export function useImportar(plantilla: TemplateId) {
  const [step, setStep] = useState<Step>({ name: 'archivo' });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = (fn: (f: File) => Promise<void>) => {
    if (file === null) return setError('Elige un archivo .xlsx o .csv.');
    setError(null);
    startTransition(() => fn(file));
  };
  const revisar = () =>
    run(async (f) => {
      const r = await previsualizarImportacion(asForm(f, plantilla));
      if (r.ok) setStep({ name: 'revision', rows: r.rows });
      else setError(r.message);
    });
  const importar = () =>
    run(async (f) => {
      const r = await importarDatos(asForm(f, plantilla));
      if (!r.ok) return setError(r.message);
      setStep({ name: 'listo', result: r });
      router.refresh();
    });
  const reset = () => {
    setStep({ name: 'archivo' });
    setFile(null);
    setError(null);
  };
  return { step, setFile, error, pending, revisar, importar, reset };
}
