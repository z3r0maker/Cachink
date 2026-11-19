import type { EventoCierre } from '@xangarro/domain/corp';

import { hrefCierre, type DatosCierre } from './cierre-view';
import { fechaCorta, nombreMes } from './fechas';

/**
 * «Meses de <año>» under board CD-10: each month of the year that has
 * movements or a close, with its history in one sentence: who closed it,
 * who asked to reopen it and why, who approved or rejected. Pure.
 */
export interface MesHistorial {
  readonly mes: string;
  readonly nombre: string;
  readonly detalle: string;
  readonly estado: 'Cerrado' | 'Abierto' | 'Reabrir pedido';
  readonly href: string;
}

const HORA = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const DIA = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' });

/** «20 nov a las 18:05», in Mexico. */
export function cuandoFue(at: string): string {
  const d = new Date(at);
  return `${fechaCorta(DIA.format(d))} a las ${HORA.format(d)}`;
}

const dia = (at: string) => fechaCorta(DIA.format(new Date(at)));

function respuesta(pedido: EventoCierre, e: EventoCierre, socio: (id: string) => string) {
  const [accion, verbo] =
    e.kind === 'reabierto' ? ['reabierto', 'aprobó'] : ['reapertura rechazada', 'rechazó'];
  return `${accion} el ${dia(e.at)} (pidió ${socio(pedido.founderId)}, ${verbo} ${socio(e.founderId)}: «${pedido.motivo ?? ''}»)`;
}

function frase(eventos: readonly EventoCierre[], socio: (id: string) => string): string {
  const partes: string[] = [];
  let pedido: EventoCierre | null = null;
  for (const e of eventos) {
    if (e.kind === 'cerrado') {
      const antes = partes.length > 0 ? 'cerrado otra vez' : 'Cerrado';
      partes.push(`${antes} el ${dia(e.at)} por ${socio(e.founderId)}`);
    } else if (e.kind === 'reapertura_pedida') {
      pedido = e;
    } else if (pedido !== null) {
      partes.push(respuesta(pedido, e, socio));
      pedido = null;
    }
  }
  if (pedido !== null) {
    partes.push(
      `${socio(pedido.founderId)} pidió reabrirlo el ${dia(pedido.at)}: «${pedido.motivo ?? ''}»`,
    );
  }
  return partes.join(' · ');
}

export function historialDe(d: DatosCierre): readonly MesHistorial[] {
  const anio = d.mes.slice(0, 4);
  const meses = new Set(
    [d.mes, ...d.conMovimientos, ...d.cerrados, ...d.eventos.keys()].filter(
      (m) => m.startsWith(anio) && m < d.hoy.slice(0, 7),
    ),
  );
  const socio = (id: string) => d.socios.get(id) ?? 'un socio';
  return [...meses]
    .sort()
    .reverse()
    .map((mes) => {
      const eventos = d.eventos.get(mes) ?? [];
      const cerrado = d.cerrados.has(mes);
      const pedido = cerrado && eventos.at(-1)?.kind === 'reapertura_pedida';
      const texto = frase(eventos, socio);
      return {
        mes,
        nombre: `${nombreMes(mes).charAt(0).toUpperCase()}${nombreMes(mes).slice(1)}`,
        detalle: texto !== '' ? texto : cerrado ? 'Cerrado' : 'Sin cerrar',
        estado: pedido ? 'Reabrir pedido' : cerrado ? 'Cerrado' : 'Abierto',
        href: hrefCierre(mes),
      };
    });
}
