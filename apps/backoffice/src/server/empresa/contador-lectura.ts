import 'server-only';

import { leerEstadoDeCodigos } from '@xangarro/application/corp';
import {
  createCodigosRepository,
  listarDocumentos,
  listFounders,
  recibidasDelPaquete,
  sumasPorTramo,
} from '@xangarro/data-corp';
import { ingresosDelPeriodo } from '@xangarro/data-pg';
import { balanzaDelMes, comprobantesDelMes, type EstadoCodigos } from '@xangarro/domain/corp';

import { db } from '../db/client';
import { requireCorpDb } from '../db/corp';
import { fuentesDe, type DatosCierre } from './cierre-view';
import { emitidasDelPaquete } from './contador-emitidas';
import type { DatosContador } from './contador-view';

/**
 * What «Paquete para el contador» reads (E-43, board CD-10d) on top of what
 * Cierre already did: the balanza and its codes, the month's CFDIs, and
 * what the Expediente holds for it. Counts only: the bytes are read when
 * the package is downloaded.
 */
export async function leerContador(
  datos: DatosCierre,
  faltanPasos: number,
): Promise<DatosContador> {
  const corp = requireCorpDb();
  const { mes, detalle } = datos;
  const [sumas, codigos, ingresos, recibidas, documentos] = await Promise.all([
    sumasPorTramo(corp, mes),
    leerEstadoDeCodigos(createCodigosRepository(corp)),
    ingresosDelPeriodo(db(), mes),
    recibidasDelPaquete(corp, mes),
    listarDocumentos(corp),
  ]);
  const impuestos = fuentesDe(detalle).impuestos;
  return {
    mes,
    cerrado: datos.cerrados.has(mes),
    faltanPasos,
    codigos,
    balanza: balanzaDelMes(sumas, codigos.lista?.codigos ?? new Map()),
    emitidas: emitidasDelPaquete(ingresos),
    recibidas: recibidas.length,
    noDeducibles: detalle.recibidas.noDeducibles,
    sinFactura: detalle.recibidas.sinFactura.length,
    comprobantes: comprobantesDelMes(documentos, mes).map((d) => d.titulo),
    impuestosPendientes: impuestos.obligada && !impuestos.presentada,
  };
}

/** Cierre › Códigos agrupadores: the newest list and who is who. */
export async function leerCodigos(): Promise<{
  readonly estado: EstadoCodigos;
  readonly socios: ReadonlyMap<string, string>;
}> {
  const corp = requireCorpDb();
  const [estado, socios] = await Promise.all([
    leerEstadoDeCodigos(createCodigosRepository(corp)),
    listFounders(corp),
  ]);
  return { estado, socios: new Map(socios.map((s) => [s.id, s.nombre])) };
}
