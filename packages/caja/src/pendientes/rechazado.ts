/**
 * A row the server refused, said the way the phone's «Registros por enviar»
 * says it (M-09): what the record is, the server's sentence in words the
 * operator can act on, and what to do next — never to capture it again,
 * which would count it twice (R5). Pure, so the tests pin every wording; the
 * sentences match the catalog's (`sync.errors.*`, es-MX) so the phone and
 * the portal tell the same story.
 */

import { formatMoney, type Money } from '@xangarro/domain';
import { aDueno } from '../comun/dueno';

/** What the sync engine reports about a refused row (`RejectedEntry`). */
export interface RechazoCrudo {
  readonly tableName: string;
  readonly rowId: string;
  readonly code: string;
  /** The raw server message: logged, never shown (it can be English). */
  readonly message: string;
  /** True while automatic retries are still scheduled. */
  readonly retryable: boolean;
}

/** One refused record as a row of «El servidor no aceptó». */
export interface RechazoVisto {
  readonly key: string;
  /** The refused row's coordinates, for the retry that requeues it. */
  readonly tabla: string;
  readonly fila: string;
  /** «Venta», «Egreso · Gas»… what the operator captured. */
  readonly titulo: string;
  /** Money and names the row carries; empty when it carries none. */
  readonly detalle: string;
  /** The server's sentence. */
  readonly razon: string;
  /** What to do about it, when there is something to do. */
  readonly pista: string | null;
  /** Automatic retries are still scheduled: no manual button needed. */
  readonly reintentando: boolean;
}

const CLASE: Readonly<Record<string, string>> = {
  sales: 'Venta',
  expenses: 'Egreso',
  inventory_movements: 'Movimiento de inventario',
  caja_turnos: 'Turno de caja',
  caja_movimientos: 'Movimiento de caja',
  cancelacion_logs: 'Cancelación',
  day_closes: 'Corte de día',
  products: 'Producto',
  clients: 'Cliente',
  client_payments: 'Pago de cliente',
};

const RAZON: Readonly<Record<string, string>> = {
  PROTOCOL_UNSUPPORTED: 'Actualiza la app para seguir sincronizando.',
  UNAUTHENTICATED: 'Este dispositivo necesita vincularse de nuevo.',
  DEVICE_REVOKED: 'Este dispositivo fue desvinculado desde el portal.',
  RATE_LIMITED: 'El servidor está ocupado. Se reintentará solo.',
  INTERNAL: 'Falla temporal del servidor. Se reintentará solo.',
  VALIDATION: 'El registro tiene datos que el servidor no acepta.',
  BUSINESS_MISMATCH: 'El registro pertenece a otro negocio.',
  TABLE_NOT_WRITABLE: 'Este tipo de registro solo se cambia en el portal.',
  // The catalogue's own codes (`ERROR_CATALOG`, contracts): `HYBRID_UPDATE`
  // and `DUPLICATE` never arrived, so those fell to the server's English (R5).
  HYBRID_UPDATE_FORBIDDEN: 'Los cambios a este registro se hacen en el portal.',
  BUSINESS_SUSPENDED: 'El negocio está suspendido en el portal.',
  FK_PRODUCT_MISSING: 'El producto de este registro ya no existe en el portal.',
  FK_USER_MISSING: 'El operador de este registro ya no existe en el portal.',
  FK_CLIENT_MISSING: 'El cliente de este registro ya no existe en el portal.',
  FK_MENSAJE_MISSING: 'El aviso que respondiste ya no existe en el portal.',
  DUPLICATE_CONFLICT: 'El servidor ya tiene un registro distinto con este mismo identificador.',
};

/** Said when the code is one this version doesn't know: never the server's words. */
const RAZON_DESCONOCIDA = 'El servidor no aceptó este registro.';

/** The records said in the feminine («la venta»); the rest are «lo». */
const FEMENINO: ReadonlySet<string> = new Set(['sales', 'cancelacion_logs']);

/** Capturing it again would count it twice: the row is still on the device. */
const noOtraVez = (tabla: string): string =>
  `No ${FEMENINO.has(tabla) ? 'la' : 'lo'} vuelvas a capturar: se contaría dos veces.`;

/** What the owner can do in the portal, then the retry (RvEnvio). */
function pista(code: string, tabla: string, dueno: string): string | null {
  const pide = `Pídele ${aDueno(dueno)}`;
  if (code === 'FK_PRODUCT_MISSING' || code === 'FK_CLIENT_MISSING') {
    const que = code === 'FK_PRODUCT_MISSING' ? 'el producto' : 'el cliente';
    return `${pide} que recupere ${que} en el portal y toca Reintentar. ${noOtraVez(tabla)}`;
  }
  if (code === 'FK_USER_MISSING') return `${pide} que revise en el portal al operador.`;
  if (code === 'DUPLICATE_CONFLICT')
    return `${pide} que lo revise en el portal. ${noOtraVez(tabla)}`;
  if (code === 'BUSINESS_SUSPENDED') return `${pide} que lo revise en el portal.`;
  return null;
}

function texto(row: Readonly<Record<string, unknown>> | null, campo: string): string | null {
  const v = row?.[campo];
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function dinero(row: Readonly<Record<string, unknown>> | null, campo: string): string | null {
  const v = row?.[campo];
  if (typeof v === 'bigint') return formatMoney(v as Money);
  if (typeof v === 'string' && /^-?\d+$/.test(v)) return formatMoney(BigInt(v) as Money);
  return null;
}

/** «$120.00 · Tacos · 2026-05-14»: the row's own money, names and dates. */
export function detalleRechazo(row: Readonly<Record<string, unknown>> | null): string {
  return [dinero(row, 'monto'), texto(row, 'concepto') ?? texto(row, 'nombre'), texto(row, 'fecha')]
    .filter((p): p is string => p !== null)
    .join(' · ');
}

/**
 * The refused row's face; the row itself may be gone (null), the refusal
 * stays. `dueno` is the owner as the caja says them, «el dueño» until known.
 */
export function describeRechazado(
  r: RechazoCrudo,
  row: Readonly<Record<string, unknown>> | null,
  dueno = 'el dueño',
): RechazoVisto {
  return {
    key: `${r.tableName}:${r.rowId}`,
    tabla: r.tableName,
    fila: r.rowId,
    titulo: CLASE[r.tableName] ?? 'Registro',
    detalle: detalleRechazo(row),
    razon: RAZON[r.code] ?? RAZON_DESCONOCIDA,
    pista: pista(r.code, r.tableName, dueno),
    reintentando: r.retryable,
  };
}

/** The panel's head: «2 registros»: what the server refused, counted apart. */
export function cuentaRechazados(n: number): string {
  return n === 1 ? '1 registro' : `${n} registros`;
}
