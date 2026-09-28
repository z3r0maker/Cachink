'use client';

import { useState } from 'react';
import {
  diferenciaCorte,
  totalContado,
  type ClaveDenominacion,
  type ConteoDenominaciones,
} from '@xangarro/domain';

import { motivoDominio } from '@xangarro/caja';
import { useCola } from '../shell/cola';
import { esperadoDe } from '@xangarro/caja/turno';
import type { CerrarVivo, CierreData, MotivoDiferencia } from '@xangarro/caja/cierre';

/**
 * The count, the explanation and the close. Records still to send do not
 * block it (ADR-123, DS-06 (a)): the expected cash is this caja's own rows,
 * and the queue goes up by itself. With a difference, closing waits for a
 * reason (and, for «Otra razón», a note). The count is in centavos end to
 * end: each piece times its denomination's value.
 */
export function useCierre(data: CierreData, cerrarVivo?: CerrarVivo) {
  const cola = useCola();
  const [conteo, setConteo] = useState<ConteoDenominaciones>(data.conteo);
  const [motivo, setMotivo] = useState<MotivoDiferencia | null>(null);
  const [nota, setNota] = useState('');
  const [cerrado, setCerrado] = useState(false);
  const d = derivados(conteo, data, motivo, nota);
  const { contado, dif, puede } = d;
  const poner = ponerEn(setConteo);
  return {
    ...d,
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
    // The queue as the pill counts it: pendientes, reintentando, connection, enviar.
    ...cola,
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
  };
}

export type Cierre = ReturnType<typeof useCierre>;

/** Everything the screen derives from the count, in one place. */
function derivados(
  conteo: ConteoDenominaciones,
  data: CierreData,
  motivo: MotivoDiferencia | null,
  nota: string,
) {
  const contado = totalContado(conteo);
  const dif = diferenciaCorte(contado, esperadoDe(data.partes));
  const faltaMotivo = dif.tipo !== 'cuadra' && motivo === null;
  const faltaNota = dif.tipo !== 'cuadra' && motivo === 'Otra razón' && nota.trim() === '';
  return {
    contado,
    esperado: esperadoDe(data.partes),
    dif,
    faltaMotivo,
    faltaNota,
    puede: !faltaMotivo && !faltaNota,
  };
}

/** A stepper writes whole pieces of one denomination (billete-20 and moneda-20 apart), never below zero. */
function ponerEn(
  setConteo: React.Dispatch<React.SetStateAction<ConteoDenominaciones>>,
): (clave: ClaveDenominacion, n: number) => void {
  return (clave, n) =>
    setConteo((c) => ({ ...c, [clave]: Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0 }));
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
  const motivo = p.tipo === 'cuadra' ? null : p.motivo;
  const reason =
    motivo === null ? null : motivoDominio(motivo, p.tipo === 'falta' ? 'falta' : 'sobra');
  const nota = motivo === 'Otra razón' ? p.nota.trim() : '';
  void p
    .cerrarVivo({
      montoCierreCentavos: p.contado,
      discrepancyReason: reason,
      explicacion: nota === '' ? null : nota,
      denominaciones: { ...p.conteo },
    })
    .catch(() => p.ok(false));
}
