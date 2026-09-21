'use client';

import { useState } from 'react';
import {
  diferenciaCorte,
  totalContado,
  type ConteoDenominaciones,
  type PesosDenominacion,
} from '@xangarro/domain';

import { motivoDominio } from '../vocabulario';
import { useCola } from '../shell/cola';
import { esperadoDe } from '../turno/desglose';
import type { CierreData, MotivoDiferencia } from './types';

/** The linked register's close write (O-36): the reason already in the domain's enum. */
export interface CerrarVivo {
  (p: {
    readonly montoCierreCentavos: bigint;
    readonly discrepancyReason: string | null;
    readonly explicacion: string | null;
    readonly denominaciones: Readonly<Record<string, number>> | null;
  }): Promise<void>;
}

/**
 * The count, the explanation and the close. Closing is blocked while the queue
 * holds records (the expected cash depends on them) and, with a difference,
 * until a reason and a note are given. Device-local until O-06.
 */
export function useCierre(data: CierreData, cerrarVivo?: CerrarVivo) {
  const cola = useCola();
  const [conteo, setConteo] = useState<ConteoDenominaciones>(data.conteo);
  const [motivo, setMotivo] = useState<MotivoDiferencia | null>(null);
  const [nota, setNota] = useState('');
  const [cerrado, setCerrado] = useState(false);
  const { contado, esperado, dif, faltaNota, puede } = derivados(conteo, data, motivo, nota, cola);
  const poner = ponerEn(setConteo);
  return {
    conteo,
    poner,
    contado,
    esperado,
    dif,
    motivo,
    setMotivo,
    nota,
    setNota,
    faltaNota,
    puede,
    pendientes: cola.pendientes,
    connection: cola.connection,
    enviando: cola.enviando,
    enviar: cola.enviar,
    cerrado,
    cerrar: () =>
      alCerrar({
        puede,
        cerrarVivo,
        motivo,
        tipo: dif.tipo,
        contado,
        nota,
        conteo,
        ok: setCerrado,
      }),
    reabrir: () => setCerrado(false),
  };
}

export type Cierre = ReturnType<typeof useCierre>;

/** Everything the screen derives from the count, in one place. */
function derivados(
  conteo: ConteoDenominaciones,
  data: CierreData,
  motivo: MotivoDiferencia | null,
  nota: string,
  cola: ReturnType<typeof useCola>,
) {
  const contado = totalContado(conteo);
  const dif = diferenciaCorte(contado, esperadoDe(data.partes));
  const faltaNota = faltaNota_(dif.tipo, motivo, nota);
  return {
    contado,
    esperado: esperadoDe(data.partes),
    dif,
    faltaNota,
    puede: cola.pendientes === 0 && !faltaNota,
  };
}

/** A stepper writes whole pieces, never below zero. */
function ponerEn(
  setConteo: React.Dispatch<React.SetStateAction<ConteoDenominaciones>>,
): (pesos: PesosDenominacion, n: number) => void {
  return (pesos, n) => setConteo((c) => ({ ...c, [pesos]: Math.max(0, Math.trunc(n)) }));
}

/** A difference needs both a reason and a note before the close unlocks. */
function faltaNota_(
  tipo: 'cuadra' | 'falta' | 'sobra',
  motivo: MotivoDiferencia | null,
  nota: string,
): boolean {
  return tipo !== 'cuadra' && (motivo === null || nota.trim() === '');
}

/** Close locally, and on a linked register through the use case (O-36). */
function alCerrar(p: {
  readonly puede: boolean;
  readonly cerrarVivo?: CerrarVivo;
  readonly motivo: MotivoDiferencia | null;
  readonly tipo: 'cuadra' | 'falta' | 'sobra';
  readonly contado: bigint;
  readonly nota: string;
  readonly conteo: ConteoDenominaciones;
  readonly ok: (v: boolean) => void;
}): void {
  if (!p.puede) return;
  p.ok(true);
  if (p.cerrarVivo === undefined) return;
  // D6: the screen's five reasons onto the enum's six, by direction.
  const reason =
    p.motivo === null ? null : motivoDominio(p.motivo, p.tipo === 'falta' ? 'falta' : 'sobra');
  void p
    .cerrarVivo({
      montoCierreCentavos: p.contado,
      discrepancyReason: reason,
      explicacion: p.nota.trim() === '' ? null : p.nota.trim(),
      denominaciones: { ...p.conteo },
    })
    .catch(() => p.ok(false));
}
