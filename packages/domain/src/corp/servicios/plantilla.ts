import type { Money } from '../../money/index.js';
import type { CategoriaGasto } from '../ledger/accounts.js';
import { fechaDeCargo, type PlantillaRecurrente } from '../ledger/recurrentes.js';
import { CERCA_DEL_LIMITE, usoDelPlan } from './costos.js';
import type { Servicio } from './tipos.js';

/**
 * A service and its recurring template (E-24 «Each service owns its recurring
 * template in E-02»). A template made by «Hacer recurrente cada mes» has no
 * service yet: it shows as a fixed one under the template's own id, and saving
 * it makes the service.
 */
export interface DatosDePlantilla {
  readonly nombre: string;
  readonly categoria: CategoriaGasto;
  readonly moneda: 'MXN' | 'USD';
  /** 0 for one that charges by use: «sin monto fijo», typed when the charge is seen. */
  readonly montoEstimado: Money;
  readonly diaCargo: number;
  readonly periodicidad: 'mensual' | 'anual';
  /** `YYYY-MM`: a monthly one from this month, an annual one from its renewal. */
  readonly desde: string;
}

/** Only a paid, contracted service that charges on a day suggests its charge. */
export function llevaPlantilla(s: Servicio): boolean {
  return s.estado === 'activo' && (s.cobro === 'fijo' || s.cobro === 'uso' || s.cobro === 'anual');
}

/** What `s`'s template holds, as of `hoy`; null for a service that has none. */
export function plantillaDeServicio(s: Servicio, hoy: string): DatosDePlantilla | null {
  if (!llevaPlantilla(s)) return null;
  const base = { nombre: s.nombre.trim(), categoria: s.categoria };
  if (s.cobro === 'anual' && s.renueva !== null && s.monto !== null) {
    const dia = Number(s.renueva.slice(8, 10));
    return {
      ...base,
      moneda: s.moneda,
      montoEstimado: s.monto,
      diaCargo: dia,
      periodicidad: 'anual',
      desde: s.renueva.slice(0, 7),
    };
  }
  if (s.diaCargo === null) return null;
  const mensual = {
    ...base,
    diaCargo: s.diaCargo,
    periodicidad: 'mensual' as const,
    desde: hoy.slice(0, 7),
  };
  if (s.cobro === 'uso') return { ...mensual, moneda: 'MXN', montoEstimado: 0n };
  return s.monto === null ? null : { ...mensual, moneda: s.moneda, montoEstimado: s.monto };
}

const VACIO = {
  tarifa: null,
  aviso: null,
  limite: null,
  usoPlan: null,
  unidad: null,
  gastoMes: null,
  gastoAl: null,
  pagaCon: null,
} as const;

/** A template without a service, read as the service it is. */
export function servicioDePlantilla(p: PlantillaRecurrente): Servicio {
  const anual = p.periodicidad === 'anual';
  const uso = !anual && p.montoEstimado === 0n;
  return {
    ...VACIO,
    id: p.id,
    nombre: p.nombre,
    para: p.contraparte,
    categoria: p.categoria,
    cobro: anual ? 'anual' : uso ? 'uso' : 'fijo',
    estado: p.activo ? 'activo' : 'baja',
    moneda: p.moneda,
    monto: uso ? null : p.montoEstimado,
    diaCargo: anual ? null : p.diaCargo,
    renueva: anual ? fechaDeCargo(p.diaCargo, p.desde) : null,
    plantillaId: p.id,
  };
}

/** The services, and every template no service owns, by name. */
export function conPlantillasSueltas(
  servicios: readonly Servicio[],
  plantillas: readonly PlantillaRecurrente[],
): readonly Servicio[] {
  const propias = new Set(servicios.map((s) => s.plantillaId));
  const sueltas = plantillas.filter((p) => !propias.has(p.id)).map(servicioDePlantilla);
  return [...servicios, ...sueltas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export type EstadoVisible = 'activo' | 'cerca_del_limite' | 'por_contratar' | 'nuevo' | 'baja';

/** The list's state chip: a free plan near its limit, or a paid one that posted nothing yet. */
export function estadoVisible(s: Servicio, conCostos: boolean): EstadoVisible {
  if (s.estado !== 'activo') return s.estado;
  if (s.cobro === 'gratis' && s.limite !== null && s.usoPlan !== null) {
    return usoDelPlan(s.usoPlan, s.limite) >= CERCA_DEL_LIMITE ? 'cerca_del_limite' : 'activo';
  }
  return llevaPlantilla(s) && !conCostos ? 'nuevo' : 'activo';
}
