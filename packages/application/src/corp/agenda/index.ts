export {
  agregarVencimiento,
  guardarInscripcion,
  marcarObligacion,
  subirEvidencia,
  type AgregarVencimientoInput,
  type MarcarInput,
  type SubirEvidenciaInput,
} from './casos.js';
export { InscripcionFuturaError } from './errors.js';
export type {
  AgendaRepository,
  DocumentoMeta,
  DocumentRepository,
  NuevoDocumento,
  ObligacionGuardada,
} from './ports.js';
export { agendaDe, vistaDe, type AgendaInput, type ObligacionVista } from './vista.js';
