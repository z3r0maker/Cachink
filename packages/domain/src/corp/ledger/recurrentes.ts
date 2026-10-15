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

export type EstadoRecurrente = 'registrado' | 'sugerido' | 'proximo';

export interface RecurrenteDelMes {
  readonly plantilla: PlantillaRecurrente;
  /** The charge date in the month, `YYYY-MM-DD`. */
  readonly fecha: string;
  readonly estado: EstadoRecurrente;
  /** The entry that registered it, when `estado` is `registrado`. */
  readonly entryId: string | null;
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

function estadoDe(fecha: string, mes: string, hoy: string): EstadoRecurrente {
  if (mes < hoy.slice(0, 7)) return 'sugerido';
  return fecha <= hoy ? 'sugerido' : 'proximo';
}

/**
 * Each template's charge in `mes`, by date: registered (with its entry),
 * suggested once its day has come, or still to come. A stopped template only
 * shows in a month it was registered.
 */
export function recurrentesDelMes(
  plantillas: readonly PlantillaRecurrente[],
  registradas: ReadonlyMap<string, string>,
  mes: string,
  hoy: string,
): readonly RecurrenteDelMes[] {
  return plantillas
    .filter((p) => p.desde <= mes && (p.activo || registradas.has(p.id)))
    .map((plantilla): RecurrenteDelMes => {
      const fecha = fechaDeCargo(plantilla.diaCargo, mes);
      const entryId = registradas.get(plantilla.id) ?? null;
      const estado = entryId === null ? estadoDe(fecha, mes, hoy) : 'registrado';
      return { plantilla, fecha, estado, entryId };
    })
    .sort(
      (a, b) =>
        a.fecha.localeCompare(b.fecha) || a.plantilla.nombre.localeCompare(b.plantilla.nombre),
    );
}
