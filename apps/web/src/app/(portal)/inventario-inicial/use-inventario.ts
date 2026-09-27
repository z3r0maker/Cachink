'use client';

import { useState, useTransition } from 'react';

import { capturarInventarioInicial } from '@/server/actions/apertura';

import type { AvisoTono } from '../_primeros/aviso';
import { centavosDe, dinero, sinComas } from '../_primeros/formato';
import { avisoPrellenado, prellenarCsv, type Fila } from './grid';
import { cantidadDe, valorDe } from './tabla';

export interface ProductoGrid {
  readonly id: string;
  readonly nombre: string;
  readonly sku: string;
  readonly unidad: string;
  readonly icono: string | null;
  readonly costo: string;
}

export type AvisoEstado = { readonly tono: AvisoTono; readonly texto: string } | null;

/** The grid's state: fecha, rows, the notice, the prefill and the one capture. */
export function useInventario(productos: readonly ProductoGrid[], hoy: string) {
  const [fecha, setFecha] = useState<string>(hoy);
  const [filas, setFilas] = useState<Fila[]>(() => filasDe(productos));
  const [aviso, setAviso] = useState<AvisoEstado>(null);
  const [pendiente, start] = useTransition();

  const validas = filas.filter((f) => cantidadDe(f) > 0);
  const total = validas.reduce((t, f) => t + valorDe(f), 0n);
  const alArchivo = async (file: File | null) => {
    if (file === null) return;
    const porNombre = new Map(productos.map((x) => [x.nombre.trim().toLowerCase(), x.id]));
    const r = await prellenarCsv(file, filas, porNombre);
    setFilas(r.filas);
    setAviso(avisoPrellenado(file.name, r));
  };
  const capturar = capturarCon(fecha, validas, start, setAviso);
  return {
    fecha,
    setFecha,
    filas,
    setFilas,
    aviso,
    setAviso,
    pendiente,
    validas,
    total,
    alArchivo,
    capturar,
  };
}

function capturarCon(
  fecha: string,
  validas: readonly Fila[],
  start: (fn: () => Promise<void>) => void,
  setAviso: (a: AvisoEstado) => void,
) {
  return () =>
    start(async () => {
      const r = await capturarInventarioInicial(
        fecha,
        validas.map((f) => ({
          productoId: f.productoId,
          cantidad: cantidadDe(f),
          costo: sinComas(f.costo),
        })),
      );
      setAviso(
        r.ok
          ? {
              tono: 'success',
              texto: `Capturado: ${r.movimientos} productos, valuación ${dinero(centavosDe(r.total))}.`,
            }
          : { tono: 'critical', texto: r.message },
      );
    });
}

export type Inventario = ReturnType<typeof useInventario>;

function filasDe(productos: readonly ProductoGrid[]): Fila[] {
  return productos.map((x) => ({
    productoId: x.id,
    nombre: x.nombre,
    sku: x.sku,
    unidad: x.unidad,
    icono: x.icono,
    cantidad: '',
    costo: x.costo,
  }));
}
