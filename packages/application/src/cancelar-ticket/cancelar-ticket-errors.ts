/**
 * Why a cancellation was refused (audit F-08). The `code` is what a caller
 * branches on: only `PIN_INCORRECTO` counts toward the device's NIP lockout.
 *
 * It stays a `TypeError` with the messages the use case always threw, so a
 * caller that shows `e.message` or `String(e)` reads the same text as before.
 */

export type CancelarTicketErrorCode =
  | 'USUARIO_NO_ENCONTRADO'
  | 'PIN_INCORRECTO'
  | 'SIN_PERMISO'
  | 'VENTA_NO_ENCONTRADA'
  | 'VENTA_YA_CANCELADA';

const MESSAGES: Readonly<Record<CancelarTicketErrorCode, string>> = {
  USUARIO_NO_ENCONTRADO: 'Usuario no encontrado',
  PIN_INCORRECTO: 'PIN incorrecto',
  SIN_PERMISO: 'No tienes permiso para cancelar ventas',
  VENTA_NO_ENCONTRADA: 'Venta no encontrada',
  VENTA_YA_CANCELADA: 'Esta venta ya fue cancelada',
};

export class CancelarTicketError extends TypeError {
  readonly code: CancelarTicketErrorCode;

  constructor(code: CancelarTicketErrorCode) {
    super(MESSAGES[code]);
    this.code = code;
  }
}

/**
 * True for a refused NIP, told by its `code` and never by its text. Reads
 * the code structurally, so it also holds for an error rebuilt on the far
 * side of a boundary.
 */
export function isWrongPin(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { readonly code?: unknown }).code === 'PIN_INCORRECTO'
  );
}
