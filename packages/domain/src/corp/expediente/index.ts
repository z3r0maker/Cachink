import type { Autoridad } from '../agenda/obligaciones.js';

/**
 * The Expediente (E-05, board CD-06): every kept document sits in one of the
 * board's folders, and nothing is deleted: a new version supersedes the
 * previous one, and both stay.
 */
export const CARPETAS = [
  { id: 'constitucion', nombre: 'Constitución' },
  { id: 'sat', nombre: 'SAT' },
  { id: 'economia', nombre: 'Secretaría de Economía' },
  { id: 'impi', nombre: 'IMPI' },
  { id: 'estados_financieros', nombre: 'Estados financieros' },
  { id: 'contratos', nombre: 'Contratos' },
  { id: 'acuerdo_socios', nombre: 'Acuerdo de socios' },
  { id: 'comprobantes', nombre: 'Comprobantes' },
] as const;

export type Carpeta = (typeof CARPETAS)[number]['id'];

export function isCarpeta(value: string): value is Carpeta {
  return CARPETAS.some((c) => c.id === value);
}

export function nombreCarpeta(id: Carpeta): string {
  return CARPETAS.find((c) => c.id === id)?.nombre ?? id;
}

const POR_AUTORIDAD: Record<Autoridad, Carpeta> = {
  SAT: 'sat',
  Economía: 'economia',
  IMPI: 'impi',
};

/** Where an obligation's evidence is filed. */
export const carpetaDeAutoridad = (a: Autoridad): Carpeta => POR_AUTORIDAD[a];

const PERIODO = /^\d{4}(-(0[1-9]|1[0-2]))?$/;

/** A document's period is a month (`YYYY-MM`), a year (`YYYY`), or none (empty). */
export const periodoValido = (p: string): boolean => p === '' || PERIODO.test(p);

export interface Versionado {
  readonly id: string;
  readonly reemplazaA: string | null;
}

export interface Version<T extends Versionado> {
  readonly doc: T;
  /** 1 for the first upload, counting up. */
  readonly version: number;
  /** The version that replaced it; null for the current one. */
  readonly reemplazadoPor: string | null;
}

function cadenas<T extends Versionado>(docs: readonly T[]): T[][] {
  const siguiente = new Map(
    docs.flatMap((d) => (d.reemplazaA === null ? [] : [[d.reemplazaA, d]])),
  );
  return docs
    .filter((d) => d.reemplazaA === null)
    .map((primero) => {
      const cadena = [primero];
      for (let d = siguiente.get(primero.id); d !== undefined; d = siguiente.get(d.id))
        cadena.push(d);
      return cadena;
    });
}

const numeradas = <T extends Versionado>(cadena: readonly T[]): Version<T>[] =>
  cadena.map((doc, i) => ({ doc, version: i + 1, reemplazadoPor: cadena[i + 1]?.id ?? null }));

/** The current version of each document, in upload order of their first versions. */
export function vigentes<T extends Versionado>(docs: readonly T[]): readonly Version<T>[] {
  return cadenas(docs).flatMap((c) => numeradas(c).slice(-1));
}

/** Every version of the document `id` belongs to, newest first. */
export function historial<T extends Versionado>(
  docs: readonly T[],
  id: string,
): readonly Version<T>[] {
  const cadena = cadenas(docs).find((c) => c.some((d) => d.id === id));
  return cadena === undefined ? [] : numeradas(cadena).reverse();
}
