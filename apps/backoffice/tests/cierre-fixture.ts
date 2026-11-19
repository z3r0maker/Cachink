import { vistaDe, type DocumentoMeta, type ObligacionVista } from '@xangarro/application/corp';
import { plantilla, type Estado, type EventoCierre } from '@xangarro/domain/corp';

import type { DatosCierre, DetalleCierre } from '../src/server/empresa/cierre-view';

/**
 * Board CD-10's October 2026, seen on 21 November: September closed, every
 * step of October done but the bank balance and the contador's statements
 * («En curso»). `listo`, `cerrado` and `pedido` build the board's other states.
 */
const obligacion = (id: string, estado: Estado): ObligacionVista => {
  const p = plantilla(id);
  if (p === undefined) throw new Error(`no template ${id}`);
  return vistaDe(p, '2026-10', {
    id,
    plantillaId: id,
    periodo: '2026-10',
    titulo: null,
    estado,
    sinPago: false,
  });
};

export const ESTADOS: DocumentoMeta = {
  id: 'doc-ef',
  almacen: 'pg',
  blobKey: 'k',
  tipo: 'otro',
  carpeta: 'estados_financieros',
  titulo: 'Estados financieros de octubre 2026',
  periodo: '2026-10',
  nombre: 'balanza-octubre-2026.pdf',
  mime: 'application/pdf',
  tamano: 10,
  sha256: 'a'.repeat(64),
  obligacionId: null,
  entryId: null,
  retenerHasta: '2031-11-18',
  reemplazaA: null,
  subidoPor: 'f1',
  subidoEn: '2026-11-18T17:00:00.000Z',
};

export const enCurso: DetalleCierre = {
  emitidas: {
    global: { pagos: 31, total: '$12,480.00', timbrada: true, uuid: 'ABCD1234', bandejaHref: null },
    porEmitir: 0,
    pagos: 38,
    sinImportar: 0,
    cobradoSinIva: 12_480_00n,
  },
  recibidas: { gastos: 13, noDeducibles: 1, sinFactura: [], porRevisar: 0 },
  banco: { consola: 48_210_55n, confirmado: null },
  impuestos: obligacion('impuestos_mensual', 'presentada'),
  agenda: {
    otras: [obligacion('opinion_32d', 'presentada'), obligacion('buzon', 'presentada')],
    exentas: ['DIOT'],
  },
  estados: null,
};

export const listo: DetalleCierre = {
  ...enCurso,
  banco: { consola: 48_210_55n, confirmado: 48_210_55n },
  estados: ESTADOS,
};

const ev = (
  kind: EventoCierre['kind'],
  founderId: string,
  at: string,
  motivo: string | null = null,
) => ({
  kind,
  founderId,
  motivo,
  at,
});

export const CERRADO_OCT = ev('cerrado', 'f1', '2026-11-21T00:05:00.000Z');
export const PEDIDO_OCT = ev(
  'reapertura_pedida',
  'f1',
  '2026-11-21T16:42:00.000Z',
  'Falta la comisión del banco del 31 de octubre, $17.40.',
);

export function datos(detalle: DetalleCierre, o: Partial<DatosCierre> = {}): DatosCierre {
  return {
    mes: '2026-10',
    hoy: '2026-11-21',
    detalle,
    eventos: new Map([['2026-09', [ev('cerrado', 'f2', '2026-10-18T18:00:00.000Z')]]]),
    cerrados: new Set(['2026-08', '2026-09']),
    conMovimientos: new Set(['2026-08', '2026-09', '2026-10', '2026-11']),
    socios: new Map([
      ['f1', 'Eduardo'],
      ['f2', 'Ana'],
    ]),
    ...o,
  };
}

/** October closed by Eduardo, with or without his request to reopen it. */
export function cerrado(conPedido: boolean): DatosCierre {
  const base = datos(listo);
  return {
    ...base,
    cerrados: new Set(['2026-08', '2026-09', '2026-10']),
    eventos: new Map([
      ...base.eventos,
      ['2026-10', conPedido ? [CERRADO_OCT, PEDIDO_OCT] : [CERRADO_OCT]],
    ]),
  };
}
