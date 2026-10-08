import type { DocumentoMeta, ObligacionVista } from '@xangarro/application/corp';
import type { Paso, TipoEvidencia } from '@xangarro/domain/corp';
import type { Route } from 'next';

import { hrefDe } from './agenda-view';
import { diasEntre } from './fechas';

/**
 * Agenda › Evidencias (E-04, board CD-05b): each monthly obligation by month,
 * with the proof each step needs: there, still on time, or late.
 */
export type Pill = { readonly texto: string; readonly tono: 'ok' | 'warn' | 'bad' };

export interface Celda {
  readonly mes: string;
  readonly href: Route | null;
  /** Empty for a month not yet due. */
  readonly pills: readonly Pill[];
}

export interface FilaEvidencia {
  readonly titulo: string;
  readonly prueba: string;
  readonly celdas: readonly Celda[];
}

const CORTO: Record<TipoEvidencia, string> = {
  acuse: 'acuse',
  linea_captura: 'línea de captura',
  comprobante_pago: 'pago',
  opinion_32d: 'opinión',
  captura: 'revisión',
  otro: 'documento',
};

const LISTO: Partial<Record<TipoEvidencia, string>> = {
  acuse: '✓ Acuse',
  comprobante_pago: '✓ Pago',
  opinion_32d: '✓ Descargada',
  captura: '✓ Revisado',
};

const PRUEBA: Record<string, string> = {
  acuse: 'Acuse',
  comprobante_pago: 'comprobante de pago',
  opinion_32d: 'PDF del SAT',
  captura: 'Captura de la revisión',
};

function pills(o: ObligacionVista, docs: readonly DocumentoMeta[], hoy: string): Pill[] {
  const tiene = new Set(docs.map((d) => d.tipo));
  return (['presentada', 'pagada'] as const satisfies readonly Paso[]).flatMap((paso): Pill[] => {
    const tipo = o.plantilla.evidencia[paso];
    if (tipo === undefined) return [];
    if (tiene.has(tipo)) return [{ texto: LISTO[tipo] ?? `✓ ${CORTO[tipo]}`, tono: 'ok' }];
    if (paso === 'pagada' && o.sinPago) return [{ texto: '✓ Sin pago', tono: 'ok' }];
    const late = o.vence < hoy;
    return [
      {
        texto: late ? 'Vencida' : `Falta ${CORTO[tipo]}`,
        tono: late ? ('bad' as const) : ('warn' as const),
      },
    ];
  });
}

const dedupe = (ps: Pill[]) =>
  ps.filter((p, i) => p.texto !== 'Vencida' || ps.findIndex((q) => q.texto === 'Vencida') === i);

/** The monthly obligations over `meses` (`YYYY-MM`); a month not due within 31 days stays empty. */
export function matriz(
  vistas: readonly ObligacionVista[],
  docs: ReadonlyMap<string, readonly DocumentoMeta[]>,
  ids: ReadonlyMap<string, string>,
  meses: readonly string[],
  hoy: string,
): readonly FilaEvidencia[] {
  const mensuales = vistas.filter((o) => /^\d{4}-\d{2}$/.test(o.periodo));
  const plantillas = [...new Map(mensuales.map((o) => [o.plantilla.id, o.plantilla])).values()];
  return plantillas.map((p) => ({
    titulo: p.titulo,
    prueba: Object.values(p.evidencia)
      .map((t) => PRUEBA[t] ?? CORTO[t])
      .join(' y '),
    celdas: meses.map((mes) => {
      const o = mensuales.find((v) => v.plantilla.id === p.id && v.periodo === mes);
      if (o === undefined) return { mes, href: null, pills: [] };
      const id = ids.get(`${p.id}~${mes}`);
      const lista = pills(o, id === undefined ? [] : (docs.get(id) ?? []), hoy);
      const lejos = diasEntre(hoy, o.vence) > 31 && lista.every((x) => x.tono !== 'ok');
      return { mes, href: hrefDe(o), pills: lejos ? [] : dedupe(lista) };
    }),
  }));
}
