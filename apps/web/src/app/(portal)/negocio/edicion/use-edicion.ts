'use client';

import type { NegocioErrores } from '@xangarro/domain';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { guardarNegocio } from '@/server/actions/guardar-negocio';

import { draftOf, formOf, type Business, type Draft } from './draft';

const NINGUNO: NegocioErrores = { campos: {}, atributos: {} };

/** Which drawer is open (CfgNegocio): each panel edits its own section. */
export type Seccion = 'generales' | 'fiscales' | 'atributos';

/**
 * Edit mode for Negocio (P-08): the drawer holds a draft of the whole
 * business, so its «Guardar cambios» is still one validated patch and one
 * change for the phones; «Cancelar» throws the draft away.
 */
export function useEdicion(business: Business) {
  const [seccion, setSeccion] = useState<Seccion | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errores, setErrores] = useState<NegocioErrores>(NINGUNO);
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const set = (patch: Partial<Draft>) => setDraft((d) => (d === null ? d : { ...d, ...patch }));
  const start = (s: Seccion) => {
    setSeccion(s);
    setDraft(draftOf(business));
    setErrores(NINGUNO);
    setNote(null);
  };
  const cancel = () => {
    setDraft(null);
    setSeccion(null);
  };
  const save = () =>
    startTransition(async () => {
      if (draft === null) return;
      const r = await guardarNegocio(formOf(business, draft));
      if (!r.ok) {
        setErrores(r.errores);
        setNote(r.message);
        return;
      }
      setDraft(null);
      setSeccion(null);
      setNote(r.warnings[0] ?? null);
      router.refresh();
    });

  return { seccion, draft, set, errores, note, pending, start, cancel, save };
}

export type Edicion = ReturnType<typeof useEdicion>;
