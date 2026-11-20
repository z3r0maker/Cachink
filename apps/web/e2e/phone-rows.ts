/**
 * Wire rows a phone pushes beyond `sync-phone.ts`'s tickets and lines: a caja
 * turno, a gasto, an operator's reply. They live in `@xangarro/testing/tenant`
 * since S-02 (ADR-153 §4); this file re-exports them so no spec's import
 * changed.
 */
export {
  gasto,
  respuesta,
  turno,
  type Cierre,
  type GastoRow,
  type TurnoRow,
} from '@xangarro/testing/tenant';
