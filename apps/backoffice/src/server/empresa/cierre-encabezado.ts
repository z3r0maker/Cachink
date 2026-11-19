import {
  assertPuedeCerrar,
  assertPuedePedirReabrir,
  CierreError,
  estadoDelCierre,
  pasosPendientes,
  type EstadoDelCierre,
  type PasoDelCierre,
} from '@xangarro/domain/corp';

import { hrefCierre, type DatosCierre } from './cierre-view';
import { cuandoFue } from './cierre-historial';
import { nombreMes, sumarDias } from './fechas';

/**
 * The top of board CD-10: the month's title, chip and progress, «Cerrar» with
 * the reason it is disabled, «Pedir reabrir», and the banner of a pending
 * request, which the other founder answers. Pure.
 */
export interface Pedido {
  readonly quien: string;
  readonly motivo: string;
  readonly cuando: string;
  /** The viewer asked: they wait, the other founder answers. */
  readonly mio: boolean;
}

export interface EncabezadoCierre {
  readonly titulo: string;
  readonly subtitulo: string;
  readonly chip: { readonly texto: string; readonly tono: 'cerrado' | 'ok' | 'off' };
  readonly hechos: number;
  readonly cerrado: boolean;
  readonly puedeCerrar: boolean;
  /** Why «Cerrar» is disabled, or what closing does. */
  readonly cierreTexto: string;
  /** «Pedir reabrir» opens its panel; null when the month may not be asked. */
  readonly reabrirHref: string | null;
  readonly pedido: Pedido | null;
}

const cap = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

function porQueNo(fn: () => void): string | null {
  try {
    fn();
    return null;
  } catch (e) {
    if (e instanceof CierreError) return e.message;
    throw e;
  }
}

function pedidoDe(estado: EstadoDelCierre, d: DatosCierre, founderId: string): Pedido | null {
  const p = estado.pedido;
  if (p === null) return null;
  return {
    quien: d.socios.get(p.founderId) ?? 'Un socio',
    motivo: p.motivo,
    cuando: cuandoFue(p.at),
    mio: p.founderId === founderId,
  };
}

function textos(d: DatosCierre, faltan: number, cerrado: boolean, listo: boolean) {
  const mes = nombreMes(d.mes);
  const ultimo = [...(d.eventos.get(d.mes) ?? [])].reverse().find((e) => e.kind === 'cerrado');
  if (cerrado) {
    const quien =
      ultimo === undefined ? '' : ` por ${d.socios.get(ultimo.founderId) ?? 'un socio'}`;
    return {
      titulo: `${cap(mes)} está cerrado`,
      subtitulo: `${ultimo === undefined ? 'Cerrado' : `Cerrado el ${cuandoFue(ultimo.at)}${quien}`}. No acepta movimientos ni reversiones con fecha de ${mes}.`,
    };
  }
  if (d.mes >= d.hoy.slice(0, 7)) {
    const siguiente = nombreMes(sumarDias(`${d.mes}-28`, 4).slice(0, 7));
    return {
      titulo: `${cap(mes)} todavía no termina`,
      subtitulo: `Se cierra a partir del 1 de ${siguiente}. Mientras, los pasos se van marcando solos.`,
    };
  }
  return listo
    ? {
        titulo: `${cap(mes)} está listo para cerrarse`,
        subtitulo: `Al cerrarlo, ${mes} ya no acepta movimientos. Una corrección se registra en un mes abierto.`,
      }
    : {
        titulo:
          faltan === 1
            ? `Falta 1 paso para cerrar ${mes}`
            : `Faltan ${faltan} pasos para cerrar ${mes}`,
        subtitulo:
          'Los pasos se marcan solos con lo que ya está en la consola. Solo el saldo del banco y los estados financieros los pones tú.',
      };
}

/** Why the month may not be closed, or reopened: null when it may. */
function razones(d: DatosCierre, pasos: readonly PasoDelCierre[], estado: EstadoDelCierre) {
  const cerrado = d.cerrados.has(d.mes);
  const cerrar = () =>
    assertPuedeCerrar({
      periodo: d.mes,
      mesActual: d.hoy.slice(0, 7),
      pasos,
      cerrados: d.cerrados,
      conMovimientos: d.conMovimientos,
    });
  const reabrir = () =>
    assertPuedePedirReabrir({ periodo: d.mes, cerrados: d.cerrados, estado, motivo: '-' });
  return {
    noCerrar: cerrado ? null : porQueNo(cerrar),
    noReabrir: cerrado ? porQueNo(reabrir) : null,
  };
}

const REABRIR =
  'Para reabrirlo, un socio lo pide con el motivo y el otro lo aprueba. Ambos quedan en el historial.';
const CERRAR = 'Lo cierra cualquiera de los dos socios. Para reabrirlo hacen falta los dos.';

function chipDe(cerrado: boolean, puede: boolean, hechos: number, total: number) {
  if (cerrado) return { texto: 'Cerrado', tono: 'cerrado' } as const;
  if (puede) return { texto: 'Listo', tono: 'ok' } as const;
  return { texto: `Abierto · ${hechos} de ${total}`, tono: 'off' } as const;
}

export function encabezadoDe(
  d: DatosCierre,
  pasos: readonly PasoDelCierre[],
  founderId: string,
): EncabezadoCierre {
  const estado = estadoDelCierre(d.eventos.get(d.mes) ?? []);
  const cerrado = d.cerrados.has(d.mes);
  const faltan = pasosPendientes(pasos);
  const { noCerrar, noReabrir } = razones(d, pasos, estado);
  const listo = !cerrado && faltan === 0 && d.mes < d.hoy.slice(0, 7);
  const hechos = pasos.length - faltan;
  return {
    ...textos(d, faltan, cerrado, listo),
    chip: chipDe(cerrado, noCerrar === null, hechos, pasos.length),
    hechos,
    cerrado,
    puedeCerrar: !cerrado && noCerrar === null,
    cierreTexto: cerrado ? (noReabrir ?? REABRIR) : (noCerrar ?? CERRAR),
    reabrirHref: cerrado && noReabrir === null ? hrefCierre(d.mes, 'reabrir') : null,
    pedido: pedidoDe(estado, d, founderId),
  };
}
