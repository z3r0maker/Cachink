/**
 * What Fiado y abonos says on the phone (MvCobranza, MvRecordarSaldo) over
 * the caja's derivations (`@xangarro/caja/cobranza`): the state chip's tone,
 * an open sale's second line, the abono sheet's figures and its button, and
 * the reminder's phone number. Pure.
 */
import { parseRecibido } from '@xangarro/caja/caja';
import {
  estadoCuenta,
  vistaAbono,
  type Abierta,
  type CuentaCliente,
  type EstadoCliente,
  type VistaAbono,
} from '@xangarro/caja/cobranza';
import { formatMoney, type Money } from '@xangarro/domain';
import { borderColors, colors } from '../../theme';

export interface Tono {
  readonly fondo: string;
  readonly tinta: string;
  readonly borde: string;
}

/** «Atrasado» red, «Al día» quiet, «Sin saldo» green (the web's `TONO`). */
export const TONO_ESTADO: Readonly<Record<EstadoCliente, Tono>> = {
  Atrasado: { fondo: colors.redSoft, tinta: colors.redText, borde: colors.redText },
  'Al día': { fondo: colors.gray100, tinta: colors.black, borde: borderColors.quiet },
  'Sin saldo': { fondo: colors.greenSoft, tinta: colors.greenText, borde: colors.greenText },
};

/** A balance owed reads amber; nothing owed, green. */
export const colorSaldo = (saldo: Money): string =>
  saldo > 0n ? colors.warningText : colors.greenText;

/** «28 abr · de $800.00, ya abonó $400.00», or just the day when nothing was paid. */
export function lineaAbierta(a: Abierta): string {
  const parcial =
    a.pagado > 0n ? ` · de ${formatMoney(a.venta.monto)}, ya abonó ${formatMoney(a.pagado)}` : '';
  return `${a.venta.dia}${parcial}`;
}

export interface EstadoAbono {
  readonly monto: Money | null;
  readonly vista: VistaAbono | null;
  /** «Se aplica a: …». */
  readonly aplica: string;
  /** The balance once this amount is in. */
  readonly restante: Money;
  readonly listo: boolean;
  readonly cta: string;
}

/**
 * The sheet's figures for what is typed: where it lands, oldest ticket first
 * (`vistaAbono`, by folio as the web's client detail says it), the new balance
 * and the button. An amount over the balance is taken whole: the rest is saldo
 * a favor (ADR-083 D5), as on the web.
 */
export function estadoAbono(c: CuentaCliente, tecleado: string): EstadoAbono {
  const e = estadoCuenta(c);
  const limpio = tecleado.endsWith('.') ? tecleado.slice(0, -1) : tecleado;
  const parsed = limpio === '' ? null : parseRecibido(limpio);
  const monto = parsed !== null && parsed > 0n ? parsed : null;
  if (monto === null) {
    return {
      monto,
      vista: null,
      aplica: 'Elige un monto',
      restante: e.saldo,
      listo: false,
      cta: 'Escribe cuánto abona',
    };
  }
  const vista = vistaAbono(c, e, monto, false);
  return {
    monto,
    vista,
    aplica: vista.texto,
    restante: vista.restante,
    listo: true,
    cta: `Recibir abono de ${formatMoney(monto)}`,
  };
}

/** «1,234.5» while typing; «0.00» (drawn gray) before anything is typed. */
export function montoTecleado(tecleado: string): string {
  if (tecleado === '') return '0.00';
  const [ent = '0', dec] = tecleado.split('.');
  const miles = Number(ent || '0').toLocaleString('es-MX');
  return dec === undefined ? miles : `${miles}.${dec}`;
}

/** The number's digits; a Mexican mobile is ten after the +52. */
export const digitosTel = (tel: string): string => {
  const d = tel.replace(/\D/g, '');
  return d.length === 12 && d.startsWith('52') ? d.slice(2) : d;
};

export const telValido = (tel: string): boolean => digitosTel(tel).length === 10;
