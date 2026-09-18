'use client';

import { useState } from 'react';
import {
  diferenciaCorte,
  totalContado,
  type ConteoDenominaciones,
  type PesosDenominacion,
} from '@xangarro/domain';

import { useCola } from '../shell/cola';
import { esperadoDe } from '../turno/desglose';
import type { CierreData, MotivoDiferencia } from './types';

/**
 * The count, the explanation and the close. Closing is blocked while the queue
 * holds records (the expected cash depends on them) and, with a difference,
 * until a reason and a note are given. Device-local until O-06.
 */
export function useCierre(data: CierreData) {
  const cola = useCola();
  const [conteo, setConteo] = useState<ConteoDenominaciones>(data.conteo);
  const [motivo, setMotivo] = useState<MotivoDiferencia | null>(null);
  const [nota, setNota] = useState('');
  const [cerrado, setCerrado] = useState(false);
  const contado = totalContado(conteo);
  const esperado = esperadoDe(data.partes);
  const dif = diferenciaCorte(contado, esperado);
  const faltaNota = dif.tipo !== 'cuadra' && (motivo === null || nota.trim() === '');
  const puede = cola.pendientes === 0 && !faltaNota;
  const poner = (pesos: PesosDenominacion, n: number) =>
    setConteo((c) => ({ ...c, [pesos]: Math.max(0, Math.trunc(n)) }));
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
    cerrar: () => puede && setCerrado(true),
    reabrir: () => setCerrado(false),
  };
}

export type Cierre = ReturnType<typeof useCierre>;
