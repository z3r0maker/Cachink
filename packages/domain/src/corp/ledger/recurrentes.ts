import type { Money } from '../../money/index.js';
import type { CategoriaGasto } from './accounts.js';
import { PlantillaInvalidaError } from './errors.js';

/**
 * Recurring templates (E-02, board CD-03 «Hacer recurrente cada mes»): a
 * monthly service a founder pays by card or transfer. A template never posts
 * on its own; each month it suggests its charge in Movimientos until a founder
 * registers it with the real amount and, for USD, the day's rate.
 */
export interface PlantillaRecurrente {
  readonly id: string;
  /** The movement's concepto, e.g. «Vercel». */
  readonly nombre: string;
  readonly contraparte: string | null;
  /**
   * The supplier's RFC when it invoices every month (E-11, board CD-01f): an
   * invoice of this RFC dated in a month registers that month.
   */
  readonly rfc: string | null;
  readonly categoria: CategoriaGasto;
  readonly moneda: 'MXN' | 'USD';
  /** The usual charge, IVA included, in `moneda` centavos. */
  readonly montoEstimado: Money;
  /** 1–31; a shorter month charges on its last day. */
  readonly diaCargo: number;
  /** Null for a cost shared by every project. */
  readonly projectId: string | null;
  readonly deducible: boolean;
  readonly activo: boolean;
  /** `YYYY-MM`: the first month it charges. */
  readonly desde: string;
}

/** `falta_factura`: a supplier with an RFC whose day came without its invoice. */
export type EstadoRecurrente = 'registrado' | 'sugerido' | 'falta_factura' | 'proximo';

export interface RecurrenteDelMes {
  readonly plantilla: PlantillaRecurrente;
  /** The charge date in the month, `YYYY-MM-DD`. */
  readonly fecha: string;
  readonly estado: EstadoRecurrente;
  /** The entry that registered it, when `estado` is `registrado`. */
  readonly entryId: string | null;
  /** `YYYY-MM-DD` of the invoice that registered it, when one did. */
  readonly facturaDel: string | null;
}

/** The registered invoice of a template's RFC in a month: its expense and its date. */
export interface FacturaDeRecurrente {
  readonly entryId: string;
  readonly fecha: string;
}

const MES = /^(\d{4})-(0[1-9]|1[0-2])$/;

function assertDia(dia: number): void {
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
    throw new PlantillaInvalidaError('el día de cargo va del 1 al 31');
  }
}

/** The day `diaCargo` falls on in `mes`, the month's last day when it is shorter. */
export function fechaDeCargo(diaCargo: number, mes: string): string {
  assertDia(diaCargo);
  const m = MES.exec(mes);
  if (m === null) throw new PlantillaInvalidaError(`«${mes}» no es un mes`);
  const ultimo = new Date(Date.UTC(Number(m[1]), Number(m[2]), 0)).getUTCDate();
  return `${mes}-${String(Math.min(diaCargo, ultimo)).padStart(2, '0')}`;
}

export function assertPlantilla(
  p: Pick<PlantillaRecurrente, 'nombre' | 'montoEstimado' | 'diaCargo' | 'desde'>,
): void {
  if (p.nombre.trim() === '') throw new PlantillaInvalidaError('ponle nombre al servicio');
  if (p.montoEstimado <= 0n) throw new PlantillaInvalidaError('el monto debe ser mayor a cero');
  assertDia(p.diaCargo);
  if (!MES.test(p.desde)) throw new PlantillaInvalidaError(`«${p.desde}» no es un mes`);
}

/**
 * The `sourceRef` of a template's charge: the template, the month it pays and
 * the form's nonce. The month is in the ref, not read off the date, because a
 * September charge may be paid on the 1st of October.
 */
export function refRecurrente(plantillaId: string, mes: string, nonce: string): string {
  if (plantillaId === '' || plantillaId.includes(':') || nonce === '') {
    throw new PlantillaInvalidaError('referencia de plantilla incompleta');
  }
  if (!MES.test(mes)) throw new PlantillaInvalidaError(`«${mes}» no es un mes`);
  return `${plantillaId}:${mes}:${nonce}`;
}

const REF = /^([^:]+):(\d{4}-(?:0[1-9]|1[0-2])):.+$/;

export function leerRefRecurrente(
  ref: string,
): { readonly plantillaId: string; readonly mes: string } | null {
  const m = REF.exec(ref);
  return m === null ? null : { plantillaId: m[1] as string, mes: m[2] as string };
}

/** Due once its day has come (any day of a past month); a supplier with an RFC owes its invoice. */
function estadoDe(p: PlantillaRecurrente, fecha: string, mes: string, hoy: string) {
  const vencido = mes < hoy.slice(0, 7) || fecha <= hoy;
  if (!vencido) return 'proximo';
  return p.rfc === null ? 'sugerido' : 'falta_factura';
}

function delMes(
  plantilla: PlantillaRecurrente,
  mes: string,
  hoy: string,
  registrada: string | null,
  factura: FacturaDeRecurrente | null,
): RecurrenteDelMes {
  const fecha = fechaDeCargo(plantilla.diaCargo, mes);
  const entryId = factura?.entryId ?? registrada;
  const estado = entryId === null ? estadoDe(plantilla, fecha, mes, hoy) : 'registrado';
  return { plantilla, fecha, estado, entryId, facturaDel: factura?.fecha ?? null };
}

/**
 * Each template's charge in `mes`, by date: registered (with its entry, or
 * with the invoice of its RFC dated in the month), suggested once its day has
 * come (asking for the invoice when it has an RFC), or still to come. A
 * stopped template only shows in a month it was registered.
 */
export function recurrentesDelMes(
  plantillas: readonly PlantillaRecurrente[],
  registradas: ReadonlyMap<string, string>,
  mes: string,
  hoy: string,
  facturadas: ReadonlyMap<string, FacturaDeRecurrente> = new Map(),
): readonly RecurrenteDelMes[] {
  return plantillas
    .filter((p) => p.desde <= mes && (p.activo || registradas.has(p.id) || facturadas.has(p.id)))
    .map((p) => delMes(p, mes, hoy, registradas.get(p.id) ?? null, facturadas.get(p.id) ?? null))
    .sort(
      (a, b) =>
        a.fecha.localeCompare(b.fecha) || a.plantilla.nombre.localeCompare(b.plantilla.nombre),
    );
}
