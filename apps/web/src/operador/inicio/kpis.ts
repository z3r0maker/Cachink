import { colors } from '@xangarro/tokens';
import { formatMoney } from '@xangarro/domain';

import type { KpiItem } from '../ui/parts';
import { hintCanceladas } from '../ui/frases';
import { enPalabras } from './copy';
import type { InicioData, ResultadoCorte, TurnoAbierto, UltimoTurno } from './types';

const BLACK = colors.black;

/**
 * The four Inicio figures: the open turno's, or — with no turno — the last
 * one's plus the suggested float.
 */
export function kpisFor(d: InicioData): readonly KpiItem[] {
  const t = d.situacion === 'turno-cerrado' ? null : d.turno;
  return t ? abierto(t) : cerrado(d.ultimoTurno);
}

function abierto(t: TurnoAbierto): readonly KpiItem[] {
  return [
    {
      label: 'Ventas de tu turno',
      value: String(t.ventas),
      color: BLACK,
      hint: hintCanceladas(t.canceladas, t.ultimaCancelada),
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
  if (r.tipo === 'falto') {
    const motivo = r.motivo ? `, los explicaste como «${r.motivo}»` : '';
    const hint = `Faltaron ${formatMoney(r.monto)}${motivo}`;
    return { value: 'Con faltante', color: colors.redText, hint };
  }
  return { value: `+${formatMoney(r.monto)}`, color: BLACK, hint: '' };
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
