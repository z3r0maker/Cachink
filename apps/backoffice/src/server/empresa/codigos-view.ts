import {
  ACCOUNTS,
  CUENTAS_DEL_CATALOGO,
  cuentasPorGrupo,
  type AccountKey,
  type EstadoCodigos,
} from '@xangarro/domain/corp';

import { diaDe, fechaCorta } from './fechas';

/**
 * Cierre del mes › Códigos agrupadores (E-43, board CD-10e): where the list
 * stands, the three steps until there is one, «Marcar como validada» once
 * all are in, and each account with its code under the board's headings.
 * Pure.
 */
export interface FilaCodigo {
  readonly cuenta: AccountKey;
  readonly nombre: string;
  readonly naturaleza: 'Deudora' | 'Acreedora';
  readonly codigo: string;
  /** Marked while capturing: a list exists and this account has no code. */
  readonly falta: boolean;
}

export interface VistaCodigos {
  readonly titulo: string;
  readonly texto: string;
  readonly chip: { readonly texto: string; readonly tono: 'ok' | 'warn' };
  /** The three steps, until there is a list. */
  readonly pasos: boolean;
  /** «Marcar como validada» may be used: the newest list, complete. */
  readonly validar: { readonly listaId: string; readonly hoy: string } | null;
  /** Why it may not be marked yet; null when it may, or already is. */
  readonly noValidar: string | null;
  readonly guardarTexto: string;
  readonly grupos: readonly { readonly nombre: string; readonly filas: readonly FilaCodigo[] }[];
}

const TOTAL = CUENTAS_DEL_CATALOGO.length;

function textosDe(e: EstadoCodigos, socios: ReadonlyMap<string, string>) {
  const faltan = e.faltan.length;
  if (e.lista === null || faltan === TOTAL)
    return {
      titulo: 'Aún no hay códigos agrupadores',
      texto:
        'El contador los valida una vez. Mientras falten, la balanza del paquete para el contador sale con esas celdas vacías: la consola no propone ninguno.',
    };
  if (e.validacion !== null) {
    const quien = socios.get(e.lista.capturadaPor) ?? 'un socio';
    return {
      titulo: `Validados por el contador el ${fechaCorta(e.validacion.validadaEl)}`,
      texto: `Los ${TOTAL} códigos los capturó ${quien} el ${diaDe(e.lista.capturadaAt)}. Si cambias uno, la lista vuelve a quedar sin validar hasta que la marques otra vez.`,
    };
  }
  return faltan === 0
    ? {
        titulo: `Las ${TOTAL} cuentas tienen su código`,
        texto:
          'Marca la lista como validada con la fecha en que el contador la revisó. Desde entonces el paquete sale sin aviso de códigos.',
      }
    : {
        titulo: `${TOTAL - faltan} de ${TOTAL} cuentas con su código`,
        texto: `${faltan === 1 ? 'Falta 1' : `Faltan ${faltan}`}. Cuando estén las ${TOTAL}, marca la lista como validada con la fecha en que lo hizo el contador.`,
      };
}

function noValidarDe(e: EstadoCodigos): string | null {
  const faltan = e.faltan.length;
  if (e.validacion !== null || (e.lista !== null && faltan === 0)) return null;
  if (e.lista === null || faltan === TOTAL)
    return `Se marca cuando las ${TOTAL} cuentas tengan código.`;
  return faltan === 1 ? 'Falta 1 código para marcarla.' : `Faltan ${faltan} códigos para marcarla.`;
}

export function vistaDeCodigos(
  e: EstadoCodigos,
  socios: ReadonlyMap<string, string>,
  hoy: string,
): VistaCodigos {
  const vacio = e.lista === null || e.faltan.length === TOTAL;
  const validada = e.validacion !== null;
  const codigos = e.lista?.codigos ?? new Map<AccountKey, string>();
  return {
    ...textosDe(e, socios),
    chip: validada
      ? { texto: 'Validados', tono: 'ok' }
      : { texto: `Sin validar · ${TOTAL - e.faltan.length} de ${TOTAL}`, tono: 'warn' },
    pasos: vacio,
    validar:
      !validada && e.lista !== null && e.faltan.length === 0 ? { listaId: e.lista.id, hoy } : null,
    noValidar: noValidarDe(e),
    guardarTexto: validada
      ? 'Cambiar un código deja la lista sin validar.'
      : 'Puedes guardar con códigos pendientes y seguir después.',
    grupos: cuentasPorGrupo().map((g) => ({
      nombre: g.nombre,
      filas: g.cuentas.map((c) => ({
        cuenta: c,
        nombre: ACCOUNTS[c].nombre,
        naturaleza: ACCOUNTS[c].naturaleza === 'deudora' ? 'Deudora' : 'Acreedora',
        codigo: codigos.get(c) ?? '',
        falta: !vacio && !codigos.has(c),
      })),
    })),
  };
}
