'use client';

import { useCallback, useState } from 'react';

import type { Aviso, AvisoGrupo, AvisosData } from './types';

/**
 * Avisos' device-local state: the open tab, read marks, replies and the draft.
 * Replies become `respuestas_operador` rows once C-19 lands (ADR-075).
 */
export function useAvisos(data: AvisosData, initialTab: AvisoGrupo) {
  const [tab, setTab] = useState<AvisoGrupo>(initialTab);
  const [avisos, setAvisos] = useState<readonly Aviso[]>(data.avisos);
  const [draft, setDraft] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
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
    markRead: (id: string) => update(id, { leido: true }),
    markAll: () => setAvisos((all) => all.map((x) => ({ ...x, leido: true }))),
    send: (x: Aviso) => {
      update(x.id, { respuesta: draft.trim(), leido: true });
      setDraft('');
      setToast(`${data.dueno} ya tiene tu respuesta sobre ${x.responder?.asunto ?? 'su mensaje'}.`);
    },
  };
}
