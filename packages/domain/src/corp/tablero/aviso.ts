import type { Money } from '../../money/index.js';
import { formatMoney } from '../../format/money.js';
import type { Socio } from '../ledger/movements.js';
import { nombreTrimestre } from '../socios/dinero.js';
import { TableroError } from './errors.js';
import type { EstadoPlan } from './plan.js';
import { otroSocio } from './tipos.js';
import type { FuenteCompromiso, ResumenTrimestre, TarjetaEnTrimestre } from './trimestre.js';

/**
 * The incumplimiento notice (OD-4 §6, §8). It applies when one partner falls
 * under the minimum and the other does not; the console drafts it from the
 * Tablero and quotes the agreement's clause word for word, and the partner
 * who cumplió sends it and marks the day.
 */
export interface Clausula {
  readonly numero: string;
  readonly texto: string;
}

export function assertClausula(c: Clausula): Clausula {
  const numero = c.numero.trim();
  const texto = c.texto.trim();
  if (numero === '') throw new TableroError('CLAUSULA_NUMERO');
  if (texto === '') throw new TableroError('CLAUSULA_TEXTO');
  return { numero, texto };
}

export interface NoAceptada {
  readonly titulo: string;
  readonly valor: Money;
  readonly razon: string;
}

export interface Aviso {
  readonly trimestre: string;
  readonly de: Socio;
  readonly para: Socio;
  readonly plan: EstadoPlan;
  readonly fuente: FuenteCompromiso;
  readonly comprometido: Money;
  readonly aceptado: Money;
  readonly porcentaje: number;
  readonly noAceptadas: readonly NoAceptada[];
  readonly clausula: Clausula;
}

const LARGA = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
/** «14 de noviembre de 2026». */
export const fechaEnTexto = (iso: string): string => LARGA.format(new Date(`${iso}T12:00:00Z`));

export function razonNoAceptada(t: TarjetaEnTrimestre): string {
  const e = t.estado;
  if (e.mediadorNo !== null) return `el mediador no la aceptó el ${fechaEnTexto(e.mediadorNo)}.`;
  if (e.fase === 'objetada' && e.objecion !== null) {
    return `objetada el ${fechaEnTexto(e.objecion.fecha)}, «${e.objecion.motivo}» No se corrigió.`;
  }
  if (e.fase === 'aceptada') return 'se terminó después del trimestre.';
  if (e.fase === 'por_hacer') return 'no se empezó.';
  return 'no se terminó.';
}

export function avisoDelCierre(r: ResumenTrimestre, clausula: Clausula | null): Aviso {
  if (r.incumple === null) throw new TableroError('AVISO_NO_APLICA', nombreTrimestre(r.trimestre));
  if (clausula === null) throw new TableroError('AVISO_SIN_CLAUSULA');
  const para = r.incumple;
  const s = r.socios.find((x) => x.socio === para) ?? r.socios[0];
  const noAceptadas = r.arrastre
    .filter((t) => t.tarjeta.tipo === 'entregable' && t.tarjeta.responsable === para)
    .map((t) => ({
      titulo: t.tarjeta.titulo,
      valor: t.valor.valor ?? 0n,
      razon: razonNoAceptada(t),
    }));
  return {
    trimestre: r.trimestre,
    de: otroSocio(para),
    para,
    plan: r.plan,
    fuente: s.fuente,
    comprometido: s.comprometido,
    aceptado: s.aceptado,
    porcentaje: s.porcentaje ?? 0,
    noAceptadas,
    clausula,
  };
}

export function assertPuedeMarcarEnviado(
  a: Aviso,
  p: {
    readonly socio: Socio;
    readonly enviadoEl: string;
    readonly hoy: string;
    readonly yaEnviado: boolean;
  },
): void {
  if (p.yaEnviado) throw new TableroError('AVISO_YA_ENVIADO');
  if (p.socio !== a.de) throw new TableroError('AVISO_EL_OTRO');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.enviadoEl) || p.enviadoEl > p.hoy) {
    throw new TableroError('AVISO_FECHA');
  }
}

export interface TextoAviso {
  readonly titulo: string;
  readonly para: string;
  readonly de: string;
  readonly cuerpo: readonly string[];
  readonly lista: readonly string[];
  readonly conforme: string;
  readonly cita: string;
}

/** The notice in plain words; the screen and the PDF both print this. */
export function textoDelAviso(a: Aviso, nombres: Readonly<Record<Socio, string>>): TextoAviso {
  const t = nombreTrimestre(a.trimestre);
  const compromiso =
    a.plan.fase === 'aprobado'
      ? `En el tablero del ${t}, aprobado por ambos el ${fechaEnTexto(a.plan.el)}, te comprometiste a entregables por ${formatMoney(a.comprometido)}.`
      : `El ${t} no tuvo plan aprobado, así que tu compromiso fue el del trimestre anterior: entregables por ${formatMoney(a.comprometido)}.`;
  return {
    titulo: `Aviso de incumplimiento del ${t}`,
    para: nombres[a.para],
    de: `${nombres[a.de]}, socio de MEXIA, S.A.S.`,
    cuerpo: [
      `${compromiso} Al cierre del trimestre se aceptaron ${formatMoney(a.aceptado)}, el ${a.porcentaje} %, por debajo del mínimo de 50 %.`,
      a.noAceptadas.length > 0 ? 'No se aceptaron:' : 'Ningún entregable quedó pendiente.',
    ],
    lista: a.noAceptadas.map((n) => `${n.titulo}, ${formatMoney(n.valor)}: ${n.razon}`),
    conforme: `Conforme a la cláusula ${a.clausula.numero} del acuerdo de socios:`,
    cita: `«${a.clausula.texto}»`,
  };
}
