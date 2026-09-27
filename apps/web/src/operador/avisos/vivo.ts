/**
 * Avisos, live (O-16, ADR-075): the Worker's messages and the caja's real
 * state said the way the design's cards say them. Pure, so the tests pin
 * every wording. The owner is named as the last pull sent it, «el dueño» until
 * then (`ui/dueno`).
 */

import type { AvisosPara, MensajePara, StockBajoPara } from '../runtime/cola-shapes';
import { hhmmLocal } from '../runtime/fechas';
import { ICONS, OPERADOR_BASE } from '../shell/nav';
import { DUENO_GENERICO, nombreDueno } from '../ui/dueno';
import type { Aviso, AvisosData } from './types';

export { DUENO_GENERICO };

const PERSONA = 'M16 20v-2a4 4 0 0 0-8 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8';
const NUBE = 'M21 11a9 9 0 0 0-15-5.5L3 8m0-5v5h5m-5 3a9 9 0 0 0 15 5.5l3-2.5m0 5v-5h-5';

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
] as const;

/** «13 de mayo» from "2026-05-13". */
export function diaLargo(fecha: string): string {
  const [, m, d] = fecha.slice(0, 10).split('-').map(Number);
  return `${d ?? ''} de ${MESES[(m ?? 1) - 1] ?? ''}`;
}

const dos = (n: number) => String(n).padStart(2, '0');
const fechaLocal = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;

/** «Hoy 09:12», «Ayer 19:40», «13 may 08:00» in the device's local time. */
export function cuando(iso: string, hoy: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dia = fechaLocal(d);
  const ayer = new Date(`${hoy}T12:00:00`);
  ayer.setDate(ayer.getDate() - 1);
  const hora = hhmmLocal(iso);
  if (dia === hoy) return `Hoy ${hora}`;
  if (dia === fechaLocal(ayer)) return `Ayer ${hora}`;
  return `${d.getDate()} ${(MESES[d.getMonth()] ?? '').slice(0, 3)} ${hora}`;
}

/** «La gringa sube a $65.00 desde mañana.» + the rest, from one message body. */
export function partir(cuerpo: string): { readonly titulo: string; readonly resto: string } {
  const texto = cuerpo.trim();
  const corte = texto.search(/[.!?](\s|$)/);
  if (corte < 0 || corte === texto.length - 1) return { titulo: texto, resto: '' };
  return { titulo: texto.slice(0, corte + 1), resto: texto.slice(corte + 1).trim() };
}

function mensaje(m: MensajePara, leidos: ReadonlySet<string>, hoy: string): Aviso {
  const base = {
    id: m.id,
    grupo: 'dueno' as const,
    tipo: 'Mensaje del dueño',
    hora: cuando(m.creado, hoy),
    icono: PERSONA,
    leido: leidos.has(m.id) || m.respuesta !== null,
    ...(m.respuesta === null ? {} : { respuesta: m.respuesta }),
  };
  if (m.severidad === 'aclaracion') {
    const asunto = m.corte === null ? 'el corte' : `el corte del ${diaLargo(m.corte)}`;
    return {
      ...base,
      titulo: m.corte === null ? 'Aclara un corte' : `Aclara el corte del ${diaLargo(m.corte)}`,
      cuerpo: m.cuerpo,
      tono: 'alerta',
      responder: { asunto },
    };
  }
  const { titulo, resto } = partir(m.cuerpo);
  return { ...base, titulo, cuerpo: resto, tono: 'dueno' };
}

function cola(c: AvisosPara['cola'], hoy: string): Aviso[] {
  if (c.cuantos === 0) return [];
  return [
    {
      id: `cola:${c.cuantos}`,
      grupo: 'caja',
      tipo: 'Sincronización',
      titulo:
        c.cuantos === 1
          ? '1 registro sigue sin enviarse'
          : `${c.cuantos} registros siguen sin enviarse`,
      cuerpo:
        'Viven en este navegador hasta que suban. No podrás cerrar el turno hasta que se envíen.',
      hora: c.desde === null ? 'Ahora' : cuando(c.desde, hoy),
      icono: NUBE,
      tono: 'atencion',
      cta: { label: 'Ver la cola', href: `${OPERADOR_BASE}/pendientes` },
      leido: false,
    },
  ];
}

function rechazados(n: number): Aviso[] {
  if (n === 0) return [];
  return [
    {
      id: `rechazados:${n}`,
      grupo: 'caja',
      tipo: 'Sincronización',
      titulo: n === 1 ? '1 registro no se pudo enviar' : `${n} registros no se pudieron enviar`,
      cuerpo: 'El portal no los aceptó. El dueño los revisa en Sincronización; no se borran.',
      hora: 'Ahora',
      icono: NUBE,
      tono: 'alerta',
      leido: false,
    },
  ];
}

function stock(p: StockBajoPara): Aviso {
  const quedan = Math.max(0, p.existencias);
  return {
    id: `stock:${p.id}:${quedan}`,
    grupo: 'caja',
    tipo: 'Inventario',
    titulo: quedan === 0 ? `Se acabó ${p.nombre}` : `${p.nombre} está por debajo del umbral`,
    cuerpo: `Quedan ${quedan} y el umbral es ${p.umbral}. Si llega mercancía, registra la entrada para que el stock cuadre.`,
    hora: 'Ahora',
    icono: ICONS.inventario,
    tono: 'alerta',
    cta: { label: 'Ir a inventario', href: `${OPERADOR_BASE}/inventario` },
    leido: false,
  };
}

/** Everything Avisos lists, read marks applied. `hoy` is the device's "YYYY-MM-DD". */
export function avisosVivos(a: AvisosPara, hoy: string): AvisosData {
  const leidos = new Set(a.leidos);
  const marcar = (x: Aviso): Aviso => (leidos.has(x.id) ? { ...x, leido: true } : x);
  return {
    dueno: nombreDueno(a.dueno),
    avisos: [
      ...a.mensajes.map((m) => mensaje(m, leidos, hoy)),
      ...[...cola(a.cola, hoy), ...rechazados(a.rechazados), ...a.stockBajo.map(stock)].map(marcar),
    ],
  };
}

export const sinLeer = (avisos: readonly Aviso[]): number => avisos.filter((x) => !x.leido).length;

export { aDueno, deDueno, mayuscula } from '../ui/dueno';
