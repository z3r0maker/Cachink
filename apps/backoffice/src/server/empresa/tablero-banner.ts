import type { AvisoGuardado } from '@xangarro/application/corp';
import {
  nombreTrimestre,
  otroSocio,
  trimestreAnterior,
  ultimoDiaDelTrimestre,
  type ResumenTrimestre,
  type Socio,
} from '@xangarro/domain/corp';

import { fechaCorta } from './fechas';
import type { Tono } from './tablero-tarjeta-vista';
import { hrefTablero } from './tablero-view';

/**
 * The banner over the Tablero (board CD-13b): where the quarter's plan stands
 * while it is built, that its values are frozen once approved, what the close
 * waits for, and the close itself with the notice it calls for.
 */
export interface BannerVista {
  readonly titulo: string;
  readonly texto: string;
  readonly tono: Tono;
  readonly accion: { readonly texto: string; readonly href: string } | null;
}

type Nombre = (s: Socio) => string;

/** What the approver still has to do: their value, a quote. */
function pendientesDe(r: ResumenTrimestre, yo: Socio): string {
  const sinMiValor = r.tarjetas.filter(
    (t) => t.tarjeta.tipo === 'entregable' && t.tarjeta.valores[yo] === null,
  );
  const cotizar = r.tarjetas.filter((t) => t.valor.fuente === 'cotizacion_requerida');
  const partes = [
    ...(sinMiValor.length > 0
      ? [`pon tu valor en ${sinMiValor.map((t) => `«${t.tarjeta.titulo}»`).join(', ')}`]
      : []),
    ...(cotizar.length > 0
      ? [
          `adjunta la cotización de ${cotizar.map((t) => `«${t.tarjeta.titulo}»`).join(', ')}, que tiene valores de más del doble`,
        ]
      : []),
  ];
  const al = 'Al aprobarlo, los valores se congelan.';
  return partes.length === 0
    ? `Todas las tarjetas tienen valor. ${al}`
    : `Antes de aprobarlo: ${partes.join(' y ')}. ${al}`;
}

function delPlan(r: ResumenTrimestre, yo: Socio, n: Nombre, hoy: string): BannerVista | null {
  const q = nombreTrimestre(r.trimestre);
  const limite = fechaCorta(r.limitePlan);
  const anterior = nombreTrimestre(trimestreAnterior(r.trimestre));
  if (r.plan.fase === 'aprobado') return null;
  if (hoy > r.limitePlan) {
    return {
      titulo: `El ${q} no tuvo plan aprobado`,
      texto: `El compromiso de cada socio es el del ${anterior}. Una tarjeta nueva cuenta cuando los dos le ponen valor.`,
      tono: 'warn',
      accion: null,
    };
  }
  if (r.plan.fase === 'enviado' && r.plan.por !== yo) {
    return {
      titulo: `${n(r.plan.por)} envió el plan del ${q} para que lo apruebes`,
      texto: pendientesDe(r, yo),
      tono: 'warn',
      accion: { texto: 'Revisar y aprobar', href: hrefTablero(r.trimestre, { panel: 'plan' }) },
    };
  }
  if (r.plan.fase === 'enviado') {
    return {
      titulo: `Enviaste el plan del ${q}`,
      texto: `Lo aprueba ${n(otroSocio(yo))} hasta el ${limite}. Mientras, los dos pueden poner su valor en cada tarjeta.`,
      tono: 'info',
      accion: null,
    };
  }
  return {
    titulo: `El plan del ${q} se arma aquí`,
    texto: `Cada socio pone su valor en cada entregable. Uno lo envía y el otro lo aprueba hasta el ${limite}; sin plan aprobado, el compromiso es el del ${anterior}.`,
    tono: 'off',
    accion: null,
  };
}

function delCierre(r: ResumenTrimestre, n: Nombre, aviso: AvisoGuardado | null): BannerVista {
  const q = nombreTrimestre(r.trimestre);
  const [a, b] = r.socios;
  const cifras = `${n(a.socio)} cumplió con ${a.porcentaje ?? 100} % de lo comprometido; ${n(b.socio)}, con ${b.porcentaje ?? 100} %.`;
  if (r.incumple === null) {
    const ambos = a.cumple === true;
    return {
      titulo: ambos
        ? `Cierre del ${q}: los dos cumplieron`
        : `Cierre del ${q}: ninguno llegó al mínimo`,
      texto: ambos
        ? cifras
        : `${cifras} Cuando los dos quedan bajo el 50 %, no hay aviso ni consecuencia.`,
      tono: ambos ? 'ok' : 'warn',
      accion: null,
    };
  }
  const enviado = aviso === null ? '' : ` El aviso se envió el ${fechaCorta(aviso.enviadoEl)}.`;
  return {
    titulo: `Cierre del ${q}: ${n(r.incumple)} no llegó al mínimo`,
    texto: `${cifras} El acuerdo pide un aviso por escrito: lo preparamos con la cláusula y se lo mandas tú.${enviado}`,
    tono: 'bad',
    accion: {
      texto: aviso === null ? 'Preparar el aviso' : 'Ver el aviso',
      href: hrefTablero(r.trimestre, { panel: 'aviso' }),
    },
  };
}

function enEspera(r: ResumenTrimestre): BannerVista {
  const q = nombreTrimestre(r.trimestre);
  const fin = fechaCorta(ultimoDiaDelTrimestre(r.trimestre));
  const titulos = r.tarjetas
    .filter((t) => t.estado.fase === 'en_revision' || t.estado.fase === 'al_mediador')
    .map((t) => `«${t.tarjeta.titulo}»`)
    .join(', ');
  return {
    titulo:
      r.cierraEl === null
        ? `El ${q} terminó el ${fin}. Cierra cuando resuelva el mediador`
        : `El ${q} terminó el ${fin}. Cierra el ${fechaCorta(r.cierraEl)}`,
    texto: `${titulos} sigue en revisión. Cuenta en el ${q} si se acepta; el resto ya está decidido.`,
    tono: 'info',
    accion: null,
  };
}

export function bannerDe(
  r: ResumenTrimestre,
  yo: Socio,
  n: Nombre,
  hoy: string,
  aviso: AvisoGuardado | null,
): BannerVista {
  if (r.decidido) return delCierre(r, n, aviso);
  if (r.terminado) return enEspera(r);
  const plan = delPlan(r, yo, n, hoy);
  if (plan !== null) return plan;
  const el = r.plan.fase === 'aprobado' ? r.plan : null;
  return {
    titulo: `El plan del ${nombreTrimestre(r.trimestre)} lo aprobó ${el === null ? '' : `${n(el.por)} el ${fechaCorta(el.el)}`}`,
    texto:
      'Desde entonces los valores están congelados. Una tarjeta nueva cuenta cuando los dos le ponen valor.',
    tono: 'off',
    accion: null,
  };
}
