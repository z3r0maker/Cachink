import type { ObligacionGuardada } from '@xangarro/application/corp';
import { formatDate, parseIsoDate } from '@xangarro/domain';
import { sumarDiasHabiles, type Certificado, type Tenencias } from '@xangarro/domain/corp';

import { diasEntre, fechaCorta } from './fechas';

/**
 * The corporate book in the board's words (E-06, board CD-05 Corporativo):
 * each partner's shares, the beneficial-owner notice and the certificates.
 */
export function porcentaje(acciones: number, total: number): string {
  if (total === 0) return '0 %';
  const pct = (acciones * 100) / total;
  return `${pct.toLocaleString('es-MX', { maximumFractionDigits: 2 })} %`;
}

export const acciones = (n: number) => n.toLocaleString('es-MX');

export function lineaSocio(numero: 1 | 2, t: Tenencias): string {
  return `${acciones(t[numero])} acciones · ${porcentaje(t[numero], t.total)}`;
}

/** The latest share event's notice (CFF 32-B Ter): pending with its deadline, or done. */
export function beneficiario(
  avisos: readonly ObligacionGuardada[],
  hoy: string,
): { readonly texto: string; readonly alDia: boolean } {
  const ultimo = avisos
    .filter((o) => o.plantillaId === 'beneficiario_controlador')
    .sort((a, b) => b.periodo.localeCompare(a.periodo))[0];
  if (ultimo === undefined) return { texto: 'Sin cambios de acciones registrados', alDia: true };
  if (ultimo.estado === 'presentada') {
    return { texto: `Al día · último cambio del ${fechaCorta(ultimo.periodo)}`, alDia: true };
  }
  const vence = sumarDiasHabiles(ultimo.periodo, 15);
  const tarde = vence < hoy;
  return {
    texto: tarde
      ? `Aviso vencido el ${fechaCorta(vence)}`
      : `Aviso pendiente · vence el ${fechaCorta(vence)}`,
    alDia: false,
  };
}

const TITULAR: Record<Certificado['titular'], string> = {
  mexia: 'MEXIA',
  f1: 'Fundador 1',
  f2: 'Fundador 2',
};

export interface FilaCertificado {
  readonly id: string;
  readonly nombre: string;
  readonly vence: string;
  readonly tono: 'warn' | 'bad' | 'off';
}

/** «CSD de MEXIA · serie 0000…4821», and how soon it expires. */
export function filaCertificado(c: Certificado, hoy: string): FilaCertificado {
  const tipo = c.tipo === 'csd' ? 'CSD' : 'e.firma';
  const serie = c.serie.length > 8 ? `${c.serie.slice(0, 4)}…${c.serie.slice(-4)}` : c.serie;
  const dias = diasEntre(hoy, c.vence);
  const fecha = formatDate(parseIsoDate(c.vence));
  const mes = fecha.replace(/^\d+ /, '');
  let vence = mes.charAt(0).toUpperCase() + mes.slice(1);
  let tono: FilaCertificado['tono'] = 'off';
  if (dias < 0) [vence, tono] = [`Venció el ${fecha}`, 'bad'];
  else if (dias <= 60)
    [vence, tono] = [dias === 1 ? 'Vence mañana' : `Vence en ${dias} días`, 'warn'];
  return { id: c.id, nombre: `${tipo} de ${TITULAR[c.titular]} · serie ${serie}`, vence, tono };
}
