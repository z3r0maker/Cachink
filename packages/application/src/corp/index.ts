export {
  ConceptoRequeridoError,
  MovimientoDesconocidoError,
  ProyectoDesconocidoError,
  YaRevertidoError,
} from './errors.js';
export type { CorpLedgerRepository, EntrySource, LedgerEntry, NewLedgerEntry } from './ports.js';
export {
  RegistrarMovimientoUseCase,
  type RegistrarMovimientoInput,
} from './registrar-movimiento.js';
export { RevertirMovimientoUseCase, type RevertirMovimientoInput } from './revertir-movimiento.js';
