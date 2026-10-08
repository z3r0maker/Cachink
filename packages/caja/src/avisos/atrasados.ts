/**
 * «De tu caja» notices about fiado (MvAvisos «COBRANZA»): the clients whose
 * account is late and who paid nothing today, most days without an abono
 * first, a few at most (Fiado y abonos has the rest). Said from the same derivations as Fiado y abonos
 * (`estado`, `antiguedad`, `saldo`), so both screens agree. Pure.
 */

import { formatMoney } from '@xangarro/domain';

import { antiguedad, haceDiasTexto } from '../cobranza/antiguedad';
import type { CuentaCliente } from '../cobranza/cliente/types';
import { estado, saldo } from '../cobranza/derive';
import { OPERADOR_BASE } from '../rutas';
import type { Aviso } from './types';

/** Lucide `user-plus`, the caja's glyph for fiado and abonos. */
const FIADO =
  'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6';

export const MAX_ATRASADOS = 3;

/** Days without paying: since the last abono, or since the debt began when there is none. */
function diasSinAbonar(c: CuentaCliente, hoy: string): number {
  const a = antiguedad(c, hoy);
  return a.diasAbono ?? a.diasDeuda ?? 0;
}

/** «lleva 16 días sin abonar», or «debe desde hace 16 días» with no abono at all. */
function titulo(c: CuentaCliente, hoy: string): string {
  const a = antiguedad(c, hoy);
  if (a.diasAbono === null) return `${c.nombre} debe desde hace ${haceDiasTexto(a.diasDeuda ?? 0)}`;
  return `${c.nombre} lleva ${haceDiasTexto(a.diasAbono)} sin abonar`;
}

function aviso(c: CuentaCliente, hoy: string, leidos: ReadonlySet<string>): Aviso {
  const debe = saldo(c);
  const id = `fiado:${c.id}:${debe.toString()}`;
  return {
    id,
    grupo: 'caja',
    tipo: 'Cobranza',
    titulo: titulo(c, hoy),
    cuerpo: `Debe ${formatMoney(debe)}. Si pasa por aquí, puedes recibirle un abono.`,
    hora: 'Ahora',
    icono: FIADO,
    tono: 'info',
    cta: { label: 'Ir a Fiado y abonos', href: `${OPERADOR_BASE}/cobranza` },
    leido: leidos.has(id),
  };
}

/** The late accounts as notices, read marks applied (`leidos`, device-local like the rest). */
export function avisosAtrasados(
  cuentas: readonly CuentaCliente[],
  hoy: string,
  leidos: readonly string[] = [],
): readonly Aviso[] {
  const vistos = new Set(leidos);
  return (
    cuentas
      // A late account that paid something today has nothing new to flag.
      .filter((c) => estado(c) === 'Atrasado' && antiguedad(c, hoy).diasAbono !== 0)
      .sort((a, b) => diasSinAbonar(b, hoy) - diasSinAbonar(a, hoy))
      .slice(0, MAX_ATRASADOS)
      .map((c) => aviso(c, hoy, vistos))
  );
}
