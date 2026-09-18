import { colors } from '@xangarro/tokens';
import { formatMoney } from '@xangarro/domain';

import type { KpiItem } from '../ui/parts';
import { enPalabras } from './copy';
import type { InicioData, ResultadoCorte, TurnoAbierto, UltimoTurno } from './types';

const BLACK = colors.black;

/**
 * The four Inicio figures: the open turno's, or — with no turno — the last
 * one's plus the suggested float. Undesigned cases (no cancellation, several,
 * a last turno that did not balance) show no invented copy; they are listed
 * for the design project in the O-14 Done line.
 */
export function kpisFor(d: InicioData): readonly KpiItem[] {
  const t = d.situacion === 'turno-cerrado' ? null : d.turno;
  return t ? abierto(t) : cerrado(d.ultimoTurno);
}

function canceladas(t: TurnoAbierto): string {
  if (t.canceladas === 1 && t.ultimaCancelada) return `Una cancelada a las ${t.ultimaCancelada}`;
  return '';
}

function abierto(t: TurnoAbierto): readonly KpiItem[] {
  return [
    {
      label: 'Ventas de tu turno',
      value: String(t.ventas),
      color: BLACK,
      hint: canceladas(t),
    },
    {
      label: 'Cobrado',
      value: formatMoney(t.cobrado),
      color: colors.greenText,
      hint: 'Todos los métodos',
    },
    {
      label: 'Efectivo esperado',
      value: formatMoney(t.esperado),
      color: BLACK,
      hint: 'Es lo que debes contar al cerrar',
      bg: colors.yellowSoft,
    },
    {
      label: 'Fiado de hoy',
      value: formatMoney(t.fiado),
      color: colors.warningText,
      hint: `${enPalabras(t.clientesFiados)} clientes`,
    },
  ];
}

function cerro(r: ResultadoCorte): Pick<KpiItem, 'value' | 'color' | 'hint'> {
  if (r.tipo === 'cuadro') {
    return { value: 'Cuadrado', color: colors.greenText, hint: 'Sin diferencia en el conteo' };
  }
  const signo = r.tipo === 'sobro' ? '+' : '−';
  return { value: `${signo}${formatMoney(r.monto)}`, color: BLACK, hint: '' };
}

function cerrado(u: UltimoTurno): readonly KpiItem[] {
  return [
    {
      label: 'Tu último turno',
      value: formatMoney(u.cobrado),
      color: BLACK,
      hint: `${u.cuando}, ${u.ventas} ventas`,
    },
    { label: 'Cerró', ...cerro(u.resultado) },
    {
      label: 'Fondo sugerido',
      value: formatMoney(u.fondoSugerido),
      color: BLACK,
      hint: 'Con el que abriste las últimas veces',
      bg: colors.yellowSoft,
    },
    {
      label: 'Por cobrar',
      value: formatMoney(u.porCobrar),
      color: colors.warningText,
      hint: `${enPalabras(u.clientesConSaldo)} clientes fiados`,
    },
  ];
}
