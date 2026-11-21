import type { Guia, Superficie } from './guia.js';
import { GUIAS } from './guias.js';
import { palabras, plano } from './plano.js';
import { PREGUNTAS, type Pregunta } from './preguntas.js';
import type { TemaId } from './temas.js';

/** What a search finds: the same shape as what it searches. */
export interface Hallazgos {
  readonly preguntas: readonly Pregunta[];
  readonly guias: readonly Guia[];
}

/** What a search runs over. */
export type Fuente = Hallazgos;

/** How a search is narrowed. With nothing named, nothing is left out. */
export interface Filtro {
  readonly tema?: TemaId | null;
  readonly superficie?: Superficie;
}

/** Everything Xangarro teaches. */
export const AYUDA: Fuente = { preguntas: PREGUNTAS, guias: GUIAS };

const cabe = (texto: string, buscadas: readonly string[]): boolean => {
  const llano = plano(texto);
  return buscadas.every((p) => llano.includes(p));
};

const dePregunta = (p: Pregunta): string => [p.q, p.a, ...(p.tambien ?? [])].join(' ');
const deGuia = (g: Guia): string => [g.titulo, ...g.pasos.map((p) => p.texto)].join(' ');

/**
 * Every word must appear somewhere in the question, its answer or its other
 * names («vincular» finds «¿Cómo conecto la caja?»), or in a guide's title or
 * steps. An empty search lists everything the filter lets through. The quick
 * answers are the owner's, so the caja gets none.
 */
export function buscarEn(fuente: Fuente, texto: string, filtro: Filtro = {}): Hallazgos {
  const buscadas = palabras(texto);
  const tema = filtro.tema ?? null;
  const enTema = (x: { readonly tema: TemaId }) => tema === null || x.tema === tema;
  const enSuperficie = (g: Guia) =>
    filtro.superficie === undefined || g.superficie === filtro.superficie;
  const preguntas = filtro.superficie === 'caja' ? [] : fuente.preguntas;
  return {
    preguntas: preguntas.filter(enTema).filter((p) => cabe(dePregunta(p), buscadas)),
    guias: fuente.guias
      .filter(enSuperficie)
      .filter(enTema)
      .filter((g) => cabe(deGuia(g), buscadas)),
  };
}

/** The portal's search: its answers and its guides, narrowed to a topic when one is picked. */
export function buscar(texto: string, tema: TemaId | null = null): Hallazgos {
  return buscarEn(AYUDA, texto, { tema, superficie: 'portal' });
}

/** How many answers and guides a topic holds in the portal, for its tile. */
export function cuantos(tema: TemaId): number {
  const h = buscar('', tema);
  return h.preguntas.length + h.guias.length;
}
