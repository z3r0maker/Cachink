/**
 * useAvisosVista — Avisos' own state (M-09; the web's `use-avisos.ts`): the
 * open tab, the read marks, the reply in flight and the toast. The data
 * arrives as props; each action updates the local copy at once and hands
 * the write to `vivo` (a linked caja persists marks device-local and
 * records the reply; a story has none).
 */
import { useCallback, useEffect, useState } from 'react';
import type { Aviso, AvisoGrupo, AvisosData, AvisosVivo } from '@xangarro/caja/avisos';
import { toastRespuesta } from '@xangarro/caja/avisos';

export interface AvisoToast {
  readonly texto: string;
  readonly ok: boolean;
}

export type AvisosTab = AvisoGrupo;

export interface AvisosVista {
  readonly tab: AvisosTab;
  readonly setTab: (t: AvisosTab) => void;
  readonly avisos: readonly Aviso[];
  readonly visibles: readonly Aviso[];
  readonly sinLeer: (g: AvisosTab) => number;
  readonly respondiendo: string | null;
  readonly abrirRespuesta: (id: string) => void;
  readonly cerrarRespuesta: () => void;
  readonly toast: AvisoToast | null;
  readonly cerrarToast: () => void;
  readonly marcarLeido: (id: string) => void;
  readonly marcarTodo: () => void;
  /** Returns null when it landed; the reason it did not when it failed. */
  readonly responder: (id: string, texto: string) => Promise<string | null>;
}

const FALLO = 'La respuesta no se guardó. Tu texto sigue aquí; inténtalo otra vez.';

/** The send: write through `vivo`, then show the reply and the toast. */
async function enviar(
  vivo: AvisosVivo | undefined,
  set: (fn: (all: readonly Aviso[]) => readonly Aviso[]) => void,
  avisa: (t: AvisoToast) => void,
  cierra: () => void,
  data: AvisosData | null,
  id: string,
  texto: string,
): Promise<string | null> {
  const aviso = (data?.avisos ?? []).find((x) => x.id === id);
  try {
    await vivo?.responder(id, texto);
  } catch {
    return FALLO;
  }
  set((all) => all.map((x) => (x.id === id ? { ...x, respuesta: texto, leido: true } : x)));
  cierra();
  avisa({
    texto: toastRespuesta(data?.dueno ?? 'el dueño', aviso?.responder?.asunto ?? 'su mensaje'),
    ok: true,
  });
  return null;
}

export function useAvisosVista(
  data: AvisosData | null,
  tabInicial: AvisosTab,
  vivo: AvisosVivo | undefined,
): AvisosVista {
  const [tab, setTab] = useState<AvisosTab>(tabInicial);
  const [avisos, setAvisos] = useState<readonly Aviso[]>(data?.avisos ?? []);
  const [respondiendo, setRespondiendo] = useState<string | null>(null);
  const [toast, setToast] = useState<AvisoToast | null>(null);
  useEffect(() => setAvisos(data?.avisos ?? []), [data]);

  const marcar = useCallback(
    (ids: readonly string[]): void => {
      if (ids.length === 0) return;
      const set = new Set(ids);
      setAvisos((all) => all.map((x) => (set.has(x.id) ? { ...x, leido: true } : x)));
      vivo?.marcar(ids);
    },
    [vivo],
  );

  const responder = useCallback(
    (id: string, texto: string) =>
      enviar(vivo, setAvisos, setToast, () => setRespondiendo(null), data, id, texto),
    [vivo, data],
  );

  return {
    tab,
    setTab,
    avisos,
    visibles: avisos.filter((x) => x.grupo === tab),
    sinLeer: (g) => avisos.filter((x) => x.grupo === g && !x.leido).length,
    respondiendo,
    abrirRespuesta: setRespondiendo,
    cerrarRespuesta: () => setRespondiendo(null),
    toast,
    cerrarToast: () => setToast(null),
    marcarLeido: (id) => marcar([id]),
    marcarTodo: () => marcar(avisos.filter((x) => !x.leido).map((x) => x.id)),
    responder,
  };
}
