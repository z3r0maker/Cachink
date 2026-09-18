import { formatMoney, type EstadoCuenta } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { KpiRow, type KpiItem } from '../../ui/parts';
import * as u from '../../ui/ui.css';
import type { EstadoCliente } from '../derive';
import * as s from './cliente.css';
import { abiertas, estadoCliente, libre, ultimoAbono } from './derive';
import type { CuentaCliente } from './types';

const TONO: Record<EstadoCliente, { hero: string; bg: string; color: string }> = {
  'Al día': { hero: colors.white, bg: colors.gray100, color: colors.gray600 },
  Atrasado: { hero: colors.warningSoft, bg: colors.warningSoft, color: colors.warningText },
  'Sin saldo': { hero: colors.greenSoft, bg: colors.greenSoft, color: colors.greenText },
};

/** Who, their state, the balance, and the one action. */
export function Heroe(p: {
  readonly c: CuentaCliente;
  readonly e: EstadoCuenta;
  readonly onAbonar: () => void;
}) {
  const est = estadoCliente(p.c, p.e);
  const debe = p.e.saldo > 0n;
  return (
    <div className={s.hero} style={{ background: TONO[est].hero }}>
      <span className={s.avatar}>{p.c.iniciales}</span>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          <span className={s.nombre}>{p.c.nombre}</span>
          <span className={s.chip} style={{ background: TONO[est].bg, color: TONO[est].color }}>
            {est}
          </span>
        </div>
        <div className={s.sub}>{`${p.c.telefono} · cliente desde ${p.c.desde}`}</div>
      </div>
      <div style={{ flex: 'none', textAlign: 'right' }}>
        <div className={u.eyebrow}>Saldo</div>
        <div className={s.saldo}>{formatMoney(p.e.saldo)}</div>
      </div>
      <button
        type="button"
        className={s.cta}
        data-onyellow=""
        disabled={!debe}
        onClick={p.onAbonar}
      >
        {debe ? 'Recibir abono' : 'Sin saldo por cobrar'}
      </button>
    </div>
  );
}

/** Open tickets, the owner's limit, what is left, and the last abono. */
export function Indicadores(p: {
  readonly c: CuentaCliente;
  readonly e: EstadoCuenta;
  readonly dueno: string;
}) {
  return <KpiRow min={210} valueSize={26} items={indicadores(p.c, p.e, p.dueno)} />;
}

function indicadores(c: CuentaCliente, e: EstadoCuenta, dueno: string): readonly KpiItem[] {
  const vieja = abiertas(c, e)[0];
  const ultimo = ultimoAbono(c);
  return [
    {
      label: 'Ventas abiertas',
      value: String(abiertas(c, e).length),
      color: colors.black,
      hint: vieja ? `La más antigua es del ${vieja.venta.dia}` : 'Ninguna pendiente',
    },
    {
      label: 'Límite de fiado',
      value: formatMoney(c.limite),
      color: e.saldo * 10n > c.limite * 8n ? colors.redText : colors.black,
      hint: `Lo fijó ${dueno} · plazo ${c.plazo}`,
    },
    {
      label: 'Disponible',
      value: formatMoney(libre(c, e)),
      color: colors.greenText,
      hint: 'Lo que le puedes fiar hoy',
    },
    {
      label: 'Último abono',
      value: ultimo ? formatMoney(ultimo.monto) : '—',
      color: colors.black,
      hint: ultimo ? `${ultimo.dia} · ${ultimo.metodo.toLowerCase()}` : 'Todavía no ha abonado',
    },
  ];
}
