/**
 * Inicio over the register's own rows (O-39): the same live read as Mi turno,
 * said the way Inicio says it. Pure, so the mapping is tested without a
 * Worker. The owner's messages are Avisos' (hidden here while live).
 */

import type { CortePara, RecurrentePara, TurnoVivoPara } from '../runtime/turno-shapes';
import { detalleRecurrente } from '../turno/vivo';
import type { CorteReciente, InicioData, ResultadoCorte, Situacion, Tarea } from './types';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** A shift this long asks to be closed (the design's «Llevas 12 horas»). */
export const HORAS_PARA_CERRAR = 12;

/** «Ana Robledo» → «Ana». */
export const primerNombre = (nombre: string): string => nombre.trim().split(/\s+/)[0] ?? nombre;

/** «Sábado 26 de septiembre · Taquería, Caja 1». */
export function fechaInicio(ahora: Date, negocio: string | null, caja: string): string {
  const dia = `${DIAS[ahora.getDay()] ?? ''} ${ahora.getDate()} de ${MESES[ahora.getMonth()] ?? ''}`;
  return `${dia} · ${negocio === null ? caja : `${negocio}, ${caja}`}`;
}

/** «menos de un minuto», «1 minuto», «6 minutos», «2 horas». */
export function haceCuanto(desdeIso: string, ahora: Date): string {
  const min = Math.max(0, Math.floor((ahora.getTime() - Date.parse(desdeIso)) / 60_000));
  if (min < 1) return 'menos de un minuto';
  if (min < 60) return min === 1 ? '1 minuto' : `${min} minutos`;
  const h = Math.floor(min / 60);
  return h === 1 ? '1 hora' : `${h} horas`;
}

export const horasDesde = (iso: string, ahora: Date): number =>
  Math.max(0, Math.floor((ahora.getTime() - Date.parse(iso)) / 3_600_000));

/** Counted minus expected: zero squares, positive is a surplus. */
export function resultadoDe(diferencia: bigint): ResultadoCorte {
  if (diferencia === 0n) return { tipo: 'cuadro' };
  if (diferencia > 0n) return { tipo: 'sobro', monto: diferencia };
  return { tipo: 'falto', monto: -diferencia };
}

const dos = (n: number) => String(n).padStart(2, '0');
const localIso = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;

/** «Hoy · Caja 1», «Ayer · Caja 1», «12 sep · Caja 1». */
export function etiquetaCorte(fecha: string, ahora: Date, caja: string): string {
  const ayer = new Date(ahora);
  ayer.setDate(ayer.getDate() - 1);
  if (fecha === localIso(ahora)) return `Hoy · ${caja}`;
  if (fecha === localIso(ayer)) return `Ayer · ${caja}`;
  const [, m = 1, d = 1] = fecha.split('-').map(Number);
  return `${d} ${(MESES[m - 1] ?? '').slice(0, 3)} · ${caja}`;
}

export const comoCorte = (c: CortePara, ahora: Date, caja: string): CorteReciente => ({
  etiqueta: etiquetaCorte(c.fecha, ahora, caja),
  resultado: resultadoDe(BigInt(c.diferenciaCentavos)),
});

const minuscula = (s: string): string => `${s.charAt(0).toLowerCase()}${s.slice(1)}`;

/** «Registrar gas · Se repite cada semana» from a recurring expense already due. */
export const comoTarea = (r: RecurrentePara): Tarea => ({
  id: r.id,
  tipo: 'gasto',
  titulo: `Registrar ${minuscula(r.concepto)}`,
  detalle: `Se repite ${minuscula(detalleRecurrente(r))}`,
});

export function situacionDe(v: TurnoVivoPara, ahora: Date): Situacion {
  if (v.cierre.cerrado) return 'turno-cerrado';
  return horasDesde(v.aperturaAt, ahora) >= HORAS_PARA_CERRAR ? 'hora-de-cerrar' : 'vendiendo';
}

export interface Entorno {
  readonly nombre: string;
  readonly negocio: string | null;
  readonly caja: string;
  readonly offline: boolean;
  readonly pendientes: number;
  /** Fiado still owed across the business, for the closed turno's figures. */
  readonly porCobrar: { readonly monto: bigint; readonly clientes: number };
  readonly ahora: Date;
}

/** The live read as Inicio's data. */
export function comoInicio(v: TurnoVivoPara, e: Entorno): InicioData {
  const c = v.cierre;
  const cortes = v.cortes.map((x) => comoCorte(x, e.ahora, e.caja));
  return {
    nombre: primerNombre(e.nombre),
    fecha: fechaInicio(e.ahora, e.negocio, e.caja),
    dueno: 'el dueño',
    situacion: situacionDe(v, e.ahora),
    offline: e.offline,
    pendientes: e.pendientes,
    turno: {
      desde: c.desde,
      ventas: c.resumen.ventas,
      canceladas: c.resumen.canceladas,
      ultimaCancelada: v.ultimaCancelada,
      cobrado: BigInt(c.resumen.cobradoCentavos),
      esperado: BigInt(c.esperadoCentavos),
      fiado: BigInt(c.resumen.fiadoCentavos),
      clientesFiados: v.fiadoClientes.length,
      ultimaVentaHace: v.ultimaVentaAt === null ? '' : haceCuanto(v.ultimaVentaAt, e.ahora),
      horasAbierto: horasDesde(v.aperturaAt, e.ahora),
    },
    ultimoTurno: {
      cobrado: BigInt(c.resumen.cobradoCentavos),
      cuando: 'Hoy',
      ventas: c.resumen.ventas,
      resultado: cortes[0]?.resultado ?? { tipo: 'cuadro' },
      fondoSugerido: BigInt(c.fondoCentavos),
      porCobrar: e.porCobrar.monto,
      clientesConSaldo: e.porCobrar.clientes,
    },
    // Only the «corte-por-aclarar» situation reads it, and live data never picks it.
    corteAclarar: { dia: '', caja: e.caja, monto: 0n, hora: '' },
    tareas: v.recurrentes.map(comoTarea),
    mensajes: [],
    cortes,
  };
}
