import { PREGUNTAS, type Pregunta, type TemaId } from './contenido';
import { GUIAS, type Guia } from './guias';

/** Accents and case aside, like the ⌘K palette. */
const plano = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const cabe = (texto: string, palabras: readonly string[]) =>
  palabras.every((p) => plano(texto).includes(p));

export interface Hallazgos {
  readonly preguntas: readonly Pregunta[];
  readonly guias: readonly Guia[];
}

/**
 * Every word must appear somewhere in the question, its answer, or its other
 * names («vincular» finds «¿Cómo conecto la caja?»). An empty search and no
 * topic lists everything.
 */
export function buscar(texto: string, tema: TemaId | null = null): Hallazgos {
  const palabras = plano(texto).split(/\s+/).filter(Boolean);
  const enTema = <T extends { readonly tema: TemaId }>(x: T) => tema === null || x.tema === tema;
  return {
    preguntas: PREGUNTAS.filter(enTema).filter((p) =>
      cabe([p.q, p.a, ...(p.tambien ?? [])].join(' '), palabras),
    ),
    guias: GUIAS.filter(enTema).filter((g) => cabe([g.titulo, ...g.pasos].join(' '), palabras)),
  };
}

/** How many answers and guides a topic holds, for its tile. */
export function cuantos(tema: TemaId): number {
  const h = buscar('', tema);
  return h.preguntas.length + h.guias.length;
}
