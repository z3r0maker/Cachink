import type { DocumentoMeta } from '@xangarro/application/corp';
import { formatMonth } from '@xangarro/domain';
import { CARPETAS, historial, vigentes, type Carpeta } from '@xangarro/domain/corp';
import type { Route } from 'next';

import { fechaCorta } from './fechas';

/**
 * The Expediente in the board's words (E-05, board CD-06): folders with
 * their counts, the current version of each document, and one document's
 * history. Nothing is deleted; a new version supersedes the last.
 */
export interface Vinculo {
  readonly texto: string;
  readonly href: Route;
}

export interface Contexto {
  /** Obligation id → «Agenda · ISR provisional de septiembre de 2026». */
  readonly obligaciones: ReadonlyMap<string, Vinculo>;
  /** Entry id → «Movimiento · Vercel». */
  readonly movimientos: ReadonlyMap<string, Vinculo>;
  /** Founder id → 1 or 2. */
  readonly socios: ReadonlyMap<string, 1 | 2>;
}

export interface FilaDocumento {
  readonly id: string;
  readonly titulo: string;
  readonly version: string;
  readonly periodo: string;
  readonly vinculo: Vinculo | null;
  readonly subido: string;
}

const FORMATO: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'application/xml': 'XML',
  'text/xml': 'XML',
};

function periodoCorto(p: string | null): string {
  if (p === null) return '—';
  if (p.length === 4) return p;
  const [mes = '', anio = ''] = formatMonth(p).split(' de ');
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1, 3)} ${anio}`;
}

const dia = (d: DocumentoMeta) => fechaCorta(d.subidoEn.slice(0, 10));

function vinculoDe(d: DocumentoMeta, c: Contexto): Vinculo | null {
  if (d.obligacionId !== null) return c.obligaciones.get(d.obligacionId) ?? null;
  if (d.entryId !== null) return c.movimientos.get(d.entryId) ?? null;
  return null;
}

export function conteos(docs: readonly DocumentoMeta[]): ReadonlyMap<Carpeta, number> {
  const out = new Map<Carpeta, number>(CARPETAS.map((x) => [x.id, 0]));
  for (const v of vigentes(docs)) out.set(v.doc.carpeta, (out.get(v.doc.carpeta) ?? 0) + 1);
  return out;
}

/** The folder's current documents, newest upload first. */
export function filasDe(
  docs: readonly DocumentoMeta[],
  carpeta: Carpeta,
  c: Contexto,
): readonly FilaDocumento[] {
  return vigentes(docs)
    .filter((v) => v.doc.carpeta === carpeta)
    .sort((a, b) => b.doc.subidoEn.localeCompare(a.doc.subidoEn))
    .map(({ doc, version }) => ({
      id: doc.id,
      titulo: doc.titulo,
      version: `${FORMATO[doc.mime] ?? 'Archivo'} · v${version}`,
      periodo: periodoCorto(doc.periodo),
      vinculo: vinculoDe(doc, c),
      subido: `${dia(doc)} · F${c.socios.get(doc.subidoPor) ?? '?'}`,
    }));
}

export interface LineaHistorial {
  readonly id: string;
  readonly texto: string;
  readonly vigente: boolean;
}

export interface Historial {
  readonly titulo: string;
  /** The id a new version supersedes: the current one. */
  readonly vigenteId: string;
  readonly lineas: readonly LineaHistorial[];
  readonly conservaHasta: string;
}

export function historialDe(
  docs: readonly DocumentoMeta[],
  id: string,
  c: Contexto,
): Historial | null {
  const versiones = historial(docs, id);
  const actual = versiones[0];
  if (actual === undefined) return null;
  const quien = (d: DocumentoMeta) => {
    const n = c.socios.get(d.subidoPor);
    return n === undefined ? '' : ` por Fundador ${n}`;
  };
  return {
    titulo: actual.doc.titulo,
    vigenteId: actual.doc.id,
    lineas: versiones.map((v) => ({
      id: v.doc.id,
      vigente: v.reemplazadoPor === null,
      texto: `v${v.version} · subida el ${dia(v.doc)}${quien(v.doc)} · ${
        v.reemplazadoPor === null ? 'vigente' : `reemplazada por v${v.version + 1}`
      }`,
    })),
    conservaHasta: actual.doc.retenerHasta.slice(0, 4),
  };
}
