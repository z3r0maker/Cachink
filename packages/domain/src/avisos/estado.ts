/**
 * An aviso's lifecycle (P-31, ADR-060): `nuevo` → `leido` → closed as `listo`
 * (dealt with) or `descartado` (not relevant). Closed is final — reading a
 * closed aviso must not bring it back to the inbox — and reading twice is
 * harmless, because the bell and the page can both do it.
 */
export type EstadoAviso = 'nuevo' | 'leido' | 'listo' | 'descartado';
export type AccionAviso = 'leer' | 'resolver' | 'descartar';

export class AvisoTransicionError extends Error {
  readonly code = 'AVISO_TRANSICION' as const;

  constructor(
    readonly desde: string,
    readonly accion: AccionAviso,
  ) {
    super('Ese aviso ya está cerrado.');
    this.name = 'AvisoTransicionError';
  }
}

const ABIERTO: readonly string[] = ['nuevo', 'leido'];

export function transicionAviso(estado: EstadoAviso, accion: AccionAviso): EstadoAviso {
  if (!ABIERTO.includes(estado)) throw new AvisoTransicionError(estado, accion);
  if (accion === 'leer') return 'leido';
  return accion === 'resolver' ? 'listo' : 'descartado';
}
