import type { Money } from '../../money/index.js';
import type { Servicio } from './tipos.js';

export class ServicioInvalidoError extends Error {
  readonly code = 'SERVICIO_INVALIDO' as const;
  constructor(detalle: string) {
    super(`Servicio inválido: ${detalle}.`);
    this.name = 'ServicioInvalidoError';
  }
}

const FECHA = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** A real calendar day, `YYYY-MM-DD`. */
export function esFecha(value: string): boolean {
  const m = FECHA.exec(value);
  if (m === null) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCDate() === Number(m[3]);
}

function falla(cond: boolean, detalle: string): void {
  if (cond) throw new ServicioInvalidoError(detalle);
}

const positivo = (v: Money | null): boolean => v !== null && v > 0n;

function assertDia(dia: number | null): void {
  falla(dia === null || !Number.isInteger(dia) || dia < 1 || dia > 31, 'el día va del 1 al 31');
}

function assertUso(s: Servicio): void {
  assertDia(s.diaCargo);
  falla(s.aviso !== null && s.aviso <= 0n, 'el aviso debe ser mayor a cero');
  falla((s.gastoMes === null) !== (s.gastoAl === null), 'lo que va del mes lleva su fecha');
  falla(s.gastoMes !== null && s.gastoMes < 0n, 'lo que va del mes no puede ser negativo');
  falla(s.gastoAl !== null && !esFecha(s.gastoAl), `«${s.gastoAl}» no es una fecha`);
}

function assertGratis(s: Servicio): void {
  const entero = (v: number | null) => v !== null && Number.isSafeInteger(v);
  falla(!entero(s.limite) || (s.limite ?? 0) <= 0, 'el límite del plan debe ser mayor a cero');
  falla(
    s.usoPlan !== null && (!entero(s.usoPlan) || s.usoPlan < 0),
    'el uso no puede ser negativo',
  );
}

/** What each way of charging needs (board CD-18d); fields it does not use are ignored. */
export function assertServicio(s: Servicio): void {
  falla(s.nombre.trim() === '', 'ponle nombre');
  switch (s.cobro) {
    case 'fijo':
      falla(!positivo(s.monto), 'el monto debe ser mayor a cero');
      return assertDia(s.diaCargo);
    case 'uso':
      return assertUso(s);
    case 'anual':
      falla(!positivo(s.monto), 'el monto debe ser mayor a cero');
      return falla(s.renueva === null || !esFecha(s.renueva), 'falta la fecha en que renueva');
    case 'gratis':
      return assertGratis(s);
    case 'comision':
      return falla((s.tarifa ?? '').trim() === '', 'escribe cuánto cobra por pago');
  }
}
