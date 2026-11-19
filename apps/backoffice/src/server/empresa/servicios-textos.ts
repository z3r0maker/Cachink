import type { CargoDeServicio } from '@xangarro/data-corp';
import { formatMoney } from '@xangarro/domain';
import {
  ACCOUNTS,
  estadoVisible,
  promedioMensual,
  usoDelPlan,
  type CostosPorMes,
  type Servicio,
} from '@xangarro/domain/corp';

/**
 * The words Servicios uses for a service (E-24, boards CD-18 and CD-18c),
 * shared by the list, the detail and the Resumen's signals. Pure.
 */
export interface DatosServicios {
  /** The services and the templates no service owns, read as services. */
  readonly servicios: readonly Servicio[];
  readonly cargos: readonly CargoDeServicio[];
  /** Stripe's fee per month, a `comision` service's cost. */
  readonly comisiones: ReadonlyMap<string, bigint>;
  readonly hoy: string;
}

/** What the service posted per month: its template's charges, or Stripe's fees. */
export function costosDe(
  s: Servicio,
  d: Pick<DatosServicios, 'cargos' | 'comisiones'>,
): CostosPorMes {
  if (s.cobro === 'comision') return d.comisiones;
  const out = new Map<string, bigint>();
  if (s.plantillaId === null) return out;
  for (const c of d.cargos) {
    if (c.plantillaId === s.plantillaId) out.set(c.mes, (out.get(c.mes) ?? 0n) + c.monto);
  }
  return out;
}

/** «USD 20.00» or «$3,500.00»: in the service's own currency, never converted. */
export function montoEn(moneda: Servicio['moneda'], centavos: bigint): string {
  const m = formatMoney(centavos);
  return moneda === 'USD' ? `USD ${m.replace('$', '')}` : m;
}

export const categoriaDe = (s: Servicio) => ACCOUNTS[s.categoria].nombre;

/** «Cómo cobra» in the list: «Fijo · USD 20.00», «Gratis · hasta 500 MB». */
export function cobroTexto(s: Servicio): string {
  const monto = s.monto === null ? '' : ` · ${montoEn(s.moneda, s.monto)}`;
  switch (s.cobro) {
    case 'fijo':
      return `Fijo${monto}`;
    case 'anual':
      return `Anual${monto}`;
    case 'uso':
      return 'Por uso';
    case 'comision':
      return `Comisión · ${s.tarifa ?? ''}`;
    case 'gratis':
      return s.limite === null
        ? 'Gratis'
        : `Gratis · hasta ${s.limite.toLocaleString('es-MX')} ${s.unidad ?? ''}`.trim();
  }
}

/** «Promedio al mes»: posted, else the usual charge as an estimate, else «—». */
export function promedioTexto(s: Servicio, costos: CostosPorMes, mes: string): string {
  const p = promedioMensual(s.cobro, costos, mes);
  if (p !== null) return formatMoney(p);
  if (s.cobro === 'gratis') return formatMoney(0n);
  if (s.monto === null || (s.cobro !== 'fijo' && s.cobro !== 'anual')) return '—';
  const mensual = s.cobro === 'anual' ? (s.monto * 2n + 12n) / 24n : s.monto;
  return `Est. ${montoEn(s.moneda, mensual)}`;
}

export type TonoEstado = 'ok' | 'aviso' | 'info' | 'nuevo' | 'off';

export interface EstadoTexto {
  readonly texto: string;
  readonly tono: TonoEstado;
}

/** The state chip: «Activo», «62 % del límite», «Por contratar», «Nuevo», «De baja». */
export function estadoTexto(s: Servicio, costos: CostosPorMes): EstadoTexto {
  switch (estadoVisible(s, costos.size > 0)) {
    case 'cerca_del_limite':
      return { texto: `${usoDelPlan(s.usoPlan ?? 0, s.limite ?? 1)} % del límite`, tono: 'aviso' };
    case 'por_contratar':
      return { texto: 'Por contratar', tono: 'info' };
    case 'nuevo':
      return { texto: 'Nuevo', tono: 'nuevo' };
    case 'baja':
      return { texto: 'De baja', tono: 'off' };
    case 'activo':
      return { texto: 'Activo', tono: 'ok' };
  }
}

export const hrefServicio = (id: string) => `/empresa/servicios/${encodeURIComponent(id)}`;
