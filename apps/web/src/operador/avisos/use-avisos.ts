'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Aviso, AvisoGrupo, AvisosData, AvisosVivo } from './types';
import { mayuscula } from './vivo';

interface Envio {
  readonly draft: string;
  readonly setDraft: (s: string) => void;
  readonly setToast: (s: string | null) => void;
  readonly update: (id: string, patch: Partial<Aviso>) => void;
  readonly dueno: string;
  readonly vivo: AvisosVivo | undefined;
}

/** The reply shows at once; one that didn't save goes back to the form, with its text. */
function enviarRespuesta(c: Envio, x: Aviso): void {
  const texto = c.draft.trim();
  c.update(x.id, { respuesta: texto, leido: true });
  c.setDraft('');
  c.setToast(
    `${mayuscula(c.dueno)} ya tiene tu respuesta sobre ${x.responder?.asunto ?? 'su mensaje'}.`,
  );
  c.vivo?.responder(x.id, texto).catch(() => {
    c.update(x.id, { respuesta: undefined });
    c.setDraft(texto);
    c.setToast(null);
  });
}

/**
 * Avisos' state: the open tab, read marks, replies and the draft. Unlinked,
 * all of it lives on screen; a linked caja persists the marks (device-local,
 * ADR-075) and writes each reply as a `respuestas_operador` row.
 */
export function useAvisos(data: AvisosData, initialTab: AvisoGrupo, vivo?: AvisosVivo) {
  const [tab, setTab] = useState<AvisoGrupo>(initialTab);
  const [avisos, setAvisos] = useState<readonly Aviso[]>(data.avisos);
  const [draft, setDraft] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  useEffect(() => setAvisos(data.avisos), [data]);
  const update = (id: string, patch: Partial<Aviso>) =>
    setAvisos((all) => all.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  return {
    tab,
    setTab,
    draft,
    setDraft,
    toast,
    closeToast,
    visibles: avisos.filter((x) => x.grupo === tab),
    sinLeer: (g: AvisoGrupo) => avisos.filter((x) => x.grupo === g && !x.leido).length,
    markRead: (id: string) => {
      update(id, { leido: true });
      vivo?.marcar([id]);
    },
    markAll: () => {
      setAvisos((all) => all.map((x) => ({ ...x, leido: true })));
      vivo?.marcar(avisos.filter((x) => !x.leido).map((x) => x.id));
    },
    send: (x: Aviso) =>
      enviarRespuesta({ draft, setDraft, setToast, update, dueno: data.dueno, vivo }, x),
  };
}
