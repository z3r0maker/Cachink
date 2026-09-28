/**
 * The first download of a big business, page by page (DS-10, EsMvDescarga):
 * after «Vincular» accepted the code and the first page landed, the gate
 * stays on the activation screen and brings the rest with manual sync runs,
 * reading `snapshotProgress` for «3 de 7». A run that stops short leaves
 * what came down and offers «Reintentar». If the app closes mid-way the
 * activation record is already there: it opens and Inventario says
 * «Terminando de descargar el inventario…» until the next sync finishes it.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProgresoDescarga } from '@xangarro/caja';
import { snapshotProgress, type SyncRunResult } from '@xangarro/sync';
import { useAppConfigRepository } from '../app/repository-provider';
import { useCloudSync } from '../app/cloud-sync-bridge';

export interface DescargaInicial {
  readonly fase: 'descargando' | 'interrumpida';
  readonly progreso: ProgresoDescarga | null;
}

const LEER_CADA_MS = 400;
/** Runs one activation may take: each fetches up to 200 pages. */
const MAX_RUNS = 10;

const corto = (r: SyncRunResult | null): boolean =>
  r === null || r.deferred === true || (r.pull?.error ?? r.push?.error ?? null) !== null;

/** The loop behind «Descargando…»: runs until complete (then `abrir`), or where it stopped. */
async function descargarResto(d: {
  readonly leer: () => Promise<ProgresoDescarga | null>;
  readonly runNow: () => Promise<SyncRunResult | null>;
  readonly abrir: () => Promise<void>;
  readonly poner: (x: DescargaInicial) => void;
}): Promise<void> {
  let ultimo = await d.leer();
  d.poner({ fase: 'descargando', progreso: ultimo });
  const t = setInterval(() => {
    void d.leer().then((p) => {
      if (p === null) return;
      ultimo = p;
      d.poner({ fase: 'descargando', progreso: p });
    });
  }, LEER_CADA_MS);
  try {
    for (let i = 0; i < MAX_RUNS; i += 1) {
      if (corto(await d.runNow())) break;
      if ((await d.leer()) === null) return d.abrir();
    }
    d.poner({ fase: 'interrumpida', progreso: ultimo });
  } finally {
    clearInterval(t);
  }
}

export function useDescargaInicial(abrir: () => Promise<void>): {
  readonly descarga: DescargaInicial | null;
  readonly bajar: () => void;
} {
  const appConfig = useAppConfigRepository();
  const { runNow } = useCloudSync();
  const [descarga, setDescarga] = useState<DescargaInicial | null>(null);
  const corriendo = useRef(false);
  const vivo = useRef(true);
  useEffect(
    () => () => {
      vivo.current = false;
    },
    [],
  );
  const bajar = useCallback(() => {
    if (corriendo.current) return;
    corriendo.current = true;
    void descargarResto({
      leer: () => snapshotProgress(appConfig).catch(() => null),
      runNow,
      abrir,
      poner: (d) => {
        if (vivo.current) setDescarga(d);
      },
    }).finally(() => {
      corriendo.current = false;
    });
  }, [appConfig, runNow, abrir]);
  return { descarga, bajar };
}
