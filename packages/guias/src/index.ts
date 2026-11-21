/**
 * `@xangarro/guias` — what Xangarro teaches, written once (ADR-163).
 *
 * The quick answers, Don Cuentas's guides and the search over them. The
 * portal reads them today; the caja and xangarro.mx read the same ones, so a
 * guide's words never exist twice.
 *
 * Zero runtime dependencies, deliberately, like `@xangarro/tokens`: a web
 * page, a phone build and a prerendered site all consume it.
 */

export { plano, palabras } from './plano.js';
export { TEMAS, type Tema, type TemaId } from './temas.js';
export { PREGUNTAS, type Pregunta } from './preguntas.js';
export type { Guia, Paso, Superficie } from './guia.js';
export { GUIAS } from './guias.js';
export {
  AYUDA,
  buscar,
  buscarEn,
  cuantos,
  type Filtro,
  type Fuente,
  type Hallazgos,
} from './buscar.js';
