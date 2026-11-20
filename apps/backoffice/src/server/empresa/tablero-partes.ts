import { formatMoneyEntero } from '@xangarro/domain';
import {
  nombreTrimestre,
  razonNoAceptada,
  resultadoDelObjetivo,
  trimestreAnterior,
  trimestreDe,
  trimestreSiguiente,
  type Objetivo,
  type ResumenSocio,
  type ResumenTrimestre,
  type Socio,
} from '@xangarro/domain/corp';

import { fechaCorta } from './fechas';
import { lineaDeValor, type Tono } from './tablero-tarjeta-vista';
import { hrefTablero, iniciales } from './tablero-view';

/**
 * The Tablero's panels in board CD-13b's words (E-20): each partner's tile,
 * the objectives, what rolled over, and the plan's table.
 */
const dinero = (c: bigint): string => formatMoneyEntero(c);
const pct = (a: bigint, c: bigint): number =>
  c === 0n ? 0 : Math.min(100, Number((a * 100n) / c));

export interface SocioVista {
  readonly socio: Socio;
  readonly iniciales: string;
  readonly nombre: string;
  readonly chip: string;
  readonly tono: Tono;
  readonly comprometido: string;
  readonly aceptado: string;
  readonly revision: string;
  readonly anchoAceptado: number;
  readonly anchoRevision: number;
  readonly nota: string;
}

function chipDe(
  r: ResumenTrimestre,
  s: ResumenSocio,
  planeando: boolean,
): { chip: string; tono: Tono } {
  if (r.decidido) {
    const p = s.porcentaje === null ? 'sin compromiso' : `${s.porcentaje} %`;
    return s.cumple === true
      ? { chip: `Cumplió · ${p}`, tono: 'ok' }
      : { chip: `No cumplió · ${p}`, tono: 'bad' };
  }
  if (planeando) {
    const fase = r.plan.fase === 'enviado' ? 'por aprobar' : 'borrador';
    return { chip: `Plan · ${fase}`, tono: 'warn' };
  }
  if (!r.terminado) return { chip: 'En curso', tono: 'off' };
  const n = r.tarjetas.filter(
    (t) =>
      t.tarjeta.responsable === s.socio &&
      (t.estado.fase === 'en_revision' || t.estado.fase === 'al_mediador'),
  ).length;
  return n === 0
    ? { chip: 'Sin revisiones pendientes', tono: 'off' }
    : { chip: n === 1 ? 'Espera 1 revisión' : `Espera ${n} revisiones`, tono: 'warn' };
}

function notaDe(r: ResumenTrimestre, s: ResumenSocio): string {
  if (s.fuente === 'anterior') {
    return `Sin plan aprobado: el compromiso es el del ${nombreTrimestre(trimestreAnterior(r.trimestre))}`;
  }
  const propias = r.tarjetas.filter(
    (t) => t.tarjeta.tipo === 'entregable' && t.tarjeta.responsable === s.socio,
  );
  const sinValor = propias.filter((t) => t.valor.valor === null).length;
  const base = propias.length === 1 ? '1 entregable' : `${propias.length} entregables`;
  return sinValor === 0 ? base : `${base}, ${sinValor} sin valor todavía`;
}

export function sociosDe(
  r: ResumenTrimestre,
  nombre: (s: Socio) => string,
  planeando: boolean,
): SocioVista[] {
  return r.socios.map((s) => ({
    socio: s.socio,
    iniciales: iniciales(s.socio),
    nombre: nombre(s.socio),
    ...chipDe(r, s, planeando),
    comprometido: dinero(s.comprometido),
    aceptado: dinero(s.aceptado),
    revision: dinero(s.enRevision),
    anchoAceptado: pct(s.aceptado, s.comprometido),
    anchoRevision: pct(s.aceptado + s.enRevision, s.comprometido),
    nota: notaDe(r, s),
  }));
}

export interface ObjetivoVista {
  readonly id: string;
  readonly quien: string;
  readonly titulo: string;
  readonly avance: string;
  readonly ancho: number;
  readonly nota: string;
  readonly href: string | null;
}

export function objetivosDe(
  objetivos: readonly Objetivo[],
  r: ResumenTrimestre,
  hoy: string,
  nombre: (s: Socio) => string,
): ObjetivoVista[] {
  const enCurso = trimestreDe(hoy) === r.trimestre;
  return objetivos
    .filter((o) => o.trimestre === r.trimestre)
    .map((o) => {
      const res = resultadoDelObjetivo(o, hoy);
      const ligados = r.tarjetas.filter((t) => t.tarjeta.objetivoId === o.id).length;
      const ultimo = o.avances.at(-1);
      const empezado = ultimo !== undefined || r.plan.fase === 'aprobado';
      const avance =
        res.cumplido === null
          ? `${res.avance} de ${o.meta} ${o.unidad}`
          : `${res.cumplido ? 'Cumplido' : 'No cumplido'} · ${res.avance} de ${o.meta}`;
      const nota =
        res.cumplido !== null
          ? `Al cerrar el ${nombreTrimestre(r.trimestre)}`
          : ultimo === undefined
            ? `Sin avance todavía · ${ligados} ligados`
            : `Actualizado por ${nombre(ultimo.socio)} el ${fechaCorta(ultimo.fecha)} · ${ligados} ligados`;
      return {
        id: o.id,
        quien: o.quien === null ? 'Ambos' : nombre(o.quien),
        titulo: o.titulo,
        avance: empezado || res.cumplido !== null ? avance : `Meta: ${o.meta} ${o.unidad}`,
        ancho: Math.min(100, Math.round((res.avance / o.meta) * 100)),
        nota,
        href: enCurso ? hrefTablero(r.trimestre, { objetivo: o.id }) : null,
      };
    });
}

export interface Arrastre {
  readonly titulo: string;
  readonly texto: string;
  readonly filas: readonly {
    titulo: string;
    porque: string;
    quien: string;
    valor: string | null;
  }[];
}

export function arrastreDe(r: ResumenTrimestre): Arrastre | null {
  const pasaron = r.arrastre.filter((t) => t.tarjeta.descartadaEn === null);
  if (pasaron.length === 0) return null;
  const q = nombreTrimestre(r.trimestre);
  const siguiente = nombreTrimestre(trimestreSiguiente(r.trimestre));
  const n =
    pasaron.length === 1
      ? '1 tarjeta no se aceptó y pasó'
      : `${pasaron.length} tarjetas no se aceptaron y pasaron`;
  return {
    titulo: `Del ${q}: ${n} al ${siguiente}`,
    texto: `Quedan como no cumplidas en el ${q} y su valor no suma a su corte. En el ${siguiente} cuentan como comprometidas otra vez.`,
    filas: pasaron.map((t) => ({
      titulo: t.tarjeta.titulo,
      porque: razonNoAceptada(t),
      quien: iniciales(t.tarjeta.responsable),
      valor: t.valor.valor === null ? null : dinero(t.valor.valor),
    })),
  };
}

export interface FilaPlan {
  readonly clave: string;
  readonly href: string;
  readonly titulo: string;
  readonly criterio: string;
  readonly quien: string;
  readonly v1: string;
  readonly v2: string;
  readonly valor: string;
  readonly tono: Tono;
}

export function filasDelPlan(
  r: ResumenTrimestre,
  yo: Socio,
  nombre: (s: Socio) => string,
): FilaPlan[] {
  const v = (x: bigint | null, s: Socio) =>
    x !== null ? dinero(x) : s === yo ? 'Falta tu valor' : 'Falta su valor';
  return r.tarjetas.map((t) => {
    const c = t.tarjeta;
    const tarea = c.tipo === 'tarea';
    const linea = lineaDeValor(t.valor, c);
    const valor = t.valor.valor === null ? linea.estado : dinero(t.valor.valor);
    return {
      clave: c.id,
      href: hrefTablero(r.trimestre, { tarjeta: c.id }),
      titulo: c.titulo,
      criterio: t.arrastrada
        ? `Viene del ${nombreTrimestre(c.trimestre)}: ${c.criterio}`
        : c.criterio,
      quien: nombre(c.responsable),
      v1: tarea ? '—' : v(c.valores[1], 1),
      v2: tarea ? '—' : v(c.valores[2], 2),
      valor: tarea ? 'Tarea, sin valor' : valor,
      tono: tarea || t.valor.valor !== null ? 'off' : linea.tono,
    };
  });
}
