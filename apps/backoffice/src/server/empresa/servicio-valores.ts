import { toPesosString } from '@xangarro/domain';
import type { CobroServicio, Servicio } from '@xangarro/domain/corp';

/**
 * The drawer's fields as text (E-24, board CD-18d), from a stored service for
 * «Editar», or blank for «Nuevo servicio». Plain strings, so they cross to the
 * client form as they are. Pure.
 */
export interface ValoresServicio {
  readonly id: string;
  readonly nombre: string;
  readonly para: string;
  readonly categoria: string;
  readonly cobro: CobroServicio;
  readonly porContratar: boolean;
  readonly moneda: 'MXN' | 'USD';
  readonly monto: string;
  readonly dia: string;
  readonly renueva: string;
  readonly tarifa: string;
  readonly aviso: string;
  readonly limite: string;
  readonly usoPlan: string;
  readonly unidad: string;
  readonly gastoMes: string;
  readonly gastoAl: string;
  readonly pagaCon: string;
}

const pesosDe = (v: bigint | null) => (v === null ? '' : toPesosString(v));
const textoDe = (v: string | number | null) => (v === null ? '' : String(v));

export function valoresDe(s: Servicio): ValoresServicio {
  return {
    id: s.id,
    nombre: s.nombre,
    para: textoDe(s.para),
    categoria: s.categoria,
    cobro: s.cobro,
    porContratar: s.estado === 'por_contratar',
    moneda: s.moneda,
    monto: pesosDe(s.monto),
    dia: textoDe(s.diaCargo),
    renueva: textoDe(s.renueva),
    tarifa: textoDe(s.tarifa),
    aviso: pesosDe(s.aviso),
    limite: textoDe(s.limite),
    usoPlan: textoDe(s.usoPlan),
    unidad: textoDe(s.unidad),
    gastoMes: pesosDe(s.gastoMes),
    gastoAl: textoDe(s.gastoAl),
    pagaCon: textoDe(s.pagaCon),
  };
}

export function valoresNuevos(id: string): ValoresServicio {
  return {
    id,
    nombre: '',
    para: '',
    categoria: 'costo_servicio',
    cobro: 'fijo',
    porContratar: false,
    moneda: 'MXN',
    monto: '',
    dia: '',
    renueva: '',
    tarifa: '',
    aviso: '',
    limite: '',
    usoPlan: '',
    unidad: '',
    gastoMes: '',
    gastoAl: '',
    pagaCon: '',
  };
}
