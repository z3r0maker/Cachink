import {
  assertClausula,
  assertPuedeMarcarEnviado,
  avisoDelCierre,
  resumenDelTrimestre,
  type Aviso,
  type Socio,
} from '@xangarro/domain/corp';

import type { AvisoGuardado, DatosDelTablero } from './ports.js';
import type { TableroDeps } from './tarjetas.js';

/**
 * The incumplimiento notice (E-20, board CD-13d): the clause typed in once,
 * the draft drawn from the decided quarter, and the day the partner who
 * cumplió sent it. Marking it sent files the PDF in the Expediente with the
 * clause as it read that day.
 */
export async function guardarClausula(
  deps: TableroDeps,
  input: { readonly numero: string; readonly texto: string; readonly founderId: string },
): Promise<string> {
  return deps.tablero.guardarClausula(assertClausula(input), input.founderId);
}

/** The notice the quarter calls for; throws when there is none to send. */
export function prepararAviso(datos: DatosDelTablero, trimestre: string, hoy: string): Aviso {
  const r = resumenDelTrimestre({ trimestre, tarjetas: datos.tarjetas, planes: datos.planes, hoy });
  return avisoDelCierre(r, datos.clausula);
}

export const avisoEnviado = (datos: DatosDelTablero, trimestre: string): AvisoGuardado | null =>
  datos.avisos.find((a) => a.trimestre === trimestre) ?? null;

export async function marcarAvisoEnviado(
  deps: TableroDeps,
  input: {
    readonly trimestre: string;
    readonly socio: Socio;
    readonly enviadoEl: string;
    readonly hoy: string;
    readonly founderId: string;
    /** Draws the PDF and files it in the Expediente; returns the document's id. */
    readonly archivar: (aviso: Aviso) => Promise<string>;
  },
): Promise<AvisoGuardado> {
  const datos = await deps.tablero.leer();
  const aviso = prepararAviso(datos, input.trimestre, input.hoy);
  assertPuedeMarcarEnviado(aviso, {
    ...input,
    yaEnviado: avisoEnviado(datos, input.trimestre) !== null,
  });
  const documentoId = await input.archivar(aviso);
  const guardado: AvisoGuardado = {
    trimestre: input.trimestre,
    para: aviso.para,
    enviadoEl: input.enviadoEl,
    clausulaId: datos.clausula?.id ?? '',
    documentoId,
    founderId: input.founderId,
  };
  await deps.tablero.registrarAviso(guardado);
  return guardado;
}
