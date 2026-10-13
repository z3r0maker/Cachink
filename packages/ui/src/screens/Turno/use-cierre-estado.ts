/**
 * useCierreEstado — Cierre's local state (Track M, M-09; the web's
 * `use-cierre` state half): the count by denomination (a stepper writes
 * whole pieces, never below zero), the motivo and the nota, everything the
 * screen derives from them (`estadoDelConteo` in `@xangarro/caja`), and the
 * close itself, which builds its payload with `cargaDeCierre` and hands it
 * to the route's write. Mounted only while the route is on Cierre, so every
 * visit starts from zero.
 */
import { useCallback, useState } from 'react';
import {
  estadoDelConteo,
  cargaDeCierre,
  type EstadoConteo,
  type CierreData,
  type MotivoDiferencia,
} from '@xangarro/caja/cierre';
import type { ClaveDenominacion, ConteoDenominaciones } from '@xangarro/domain';

/** What the close write takes: the payload `cargaDeCierre` builds. */
export type CargaCierre = ReturnType<typeof cargaDeCierre>;

export interface CierreEstado {
  readonly e: EstadoConteo;
  readonly conteo: ConteoDenominaciones;
  readonly poner: (clave: ClaveDenominacion, n: number) => void;
  readonly limpiar: () => void;
  readonly motivo: MotivoDiferencia | null;
  readonly setMotivo: (m: MotivoDiferencia) => void;
  readonly nota: string;
  readonly setNota: (t: string) => void;
  readonly guardando: boolean;
  readonly error: string | null;
  readonly cerrado: boolean;
  /** Closes through the route's write; the failure stays on the screen. */
  readonly cerrar: (escribir: (c: CargaCierre) => Promise<string | null>) => void;
}

/** A stepper writes whole pieces of one denomination, never below zero. */
function ponerEn(
  setConteo: (fn: (c: ConteoDenominaciones) => ConteoDenominaciones) => void,
): (clave: ClaveDenominacion, n: number) => void {
  return (clave, n) =>
    setConteo((c) => ({ ...c, [clave]: Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0 }));
}

/** The close itself: build the payload, hand it over, keep the failure. */
function usarCerrar(
  e: EstadoConteo,
  motivo: MotivoDiferencia | null,
  nota: string,
  conteo: ConteoDenominaciones,
  setGuardando: (v: boolean) => void,
  setError: (v: string | null) => void,
  setCerrado: (v: boolean) => void,
) {
  return useCallback(
    (escribir: (c: CargaCierre) => Promise<string | null>) => {
      if (!e.puede) return;
      setGuardando(true);
      setError(null);
      void escribir(
        cargaDeCierre({ tipo: e.dif.tipo, motivo, nota, contado: e.contado, conteo }),
      ).then((fallo) => {
        setGuardando(false);
        if (fallo === null) setCerrado(true);
        else setError(fallo);
      });
    },
    [e.puede, e.dif.tipo, e.contado, motivo, nota, conteo, setGuardando, setError, setCerrado],
  );
}

export function useCierreEstado(data: CierreData): CierreEstado {
  const [conteo, setConteo] = useState<ConteoDenominaciones>(data.conteo);
  const [motivo, setMotivo] = useState<MotivoDiferencia | null>(null);
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cerrado, setCerrado] = useState(false);
  const e = estadoDelConteo(conteo, data.partes, motivo, nota);
  const poner = ponerEn(setConteo);
  const cerrar = usarCerrar(e, motivo, nota, conteo, setGuardando, setError, setCerrado);
  return {
    e,
    conteo,
    poner,
    limpiar: () => {
      setConteo({});
      setMotivo(null);
      setNota('');
    },
    motivo,
    setMotivo,
    nota,
    setNota,
    guardando,
    error,
    cerrado,
    cerrar,
  };
}
