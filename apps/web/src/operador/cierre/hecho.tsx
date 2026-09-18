import Link from 'next/link';
import { formatMoney } from '@xangarro/domain';
import { colors, portalFontSizes } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import { OPERADOR_BASE } from '../shell/nav';
import * as inv from '../inventario/inventario.css';
import * as u from '../ui/ui.css';
import * as s from './cierre.css';
import * as h from './hecho.css';
import { bandaCuerpo, conSigno, DIF, lineaCerrado } from './copy';
import type { CierreData } from './types';
import type { Cierre } from './use-cierre';

const CHECK = 'M20 6 9 17l-5-5';
const ALERTA = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 8v4M12 16h.01';

/** The amber band that blocks the close while records wait to be sent. */
export function Banda({ x }: { readonly x: Cierre }) {
  return (
    <div className={h.banda}>
      <span className={inv.tile} style={{ background: colors.white, color: colors.warningText }}>
        <Icon path={ALERTA} size={21} strokeWidth={2.4} />
      </span>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div className={h.bandaTitulo}>{`Tienes ${x.pendientes} registros sin enviar.`}</div>
        <div className={s.texto} style={{ marginTop: 2 }}>
          {bandaCuerpo(x.connection)}
        </div>
      </div>
      <button type="button" className={h.bandaBoton} aria-busy={x.enviando} onClick={x.enviar}>
        Reintentar envío
      </button>
    </div>
  );
}

/** «Turno cerrado»: counted, expected, difference, sales; then a new turno. */
export function Hecho({ x, data }: { readonly x: Cierre; readonly data: CierreData }) {
  const datos: readonly (readonly [string, string, string])[] = [
    ['Contado', formatMoney(x.contado), colors.black],
    ['Esperado', formatMoney(x.esperado), colors.black],
    ['Diferencia', conSigno(x.dif), DIF[x.dif.tipo].color],
    ['Ventas', String(data.resumen.ventas), colors.black],
  ];
  return (
    <div className={h.hecho}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className={h.hechoTile}>
          <Icon path={CHECK} size={24} strokeWidth={2.8} />
        </span>
        <div>
          <div className={h.hechoTitulo}>Turno cerrado</div>
          <div className={s.texto} style={{ fontSize: portalFontSizes.md, marginTop: 2 }}>
            {lineaCerrado(x.dif, x.motivo, data.dueno)}
          </div>
        </div>
      </div>
      <Datos datos={datos} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link href={OPERADOR_BASE} className={h.otroTurno} data-onyellow="">
          Abrir otro turno
        </Link>
        <button type="button" className={h.verConteo} onClick={x.reabrir}>
          Ver el conteo otra vez
        </button>
      </div>
    </div>
  );
}

const DATOS_GRID = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
} as const;

function Datos({ datos }: { readonly datos: readonly (readonly [string, string, string])[] }) {
  return (
    <div style={DATOS_GRID}>
      {datos.map(([label, value, color]) => (
        <div key={label} className={h.dato}>
          <div className={u.eyebrow}>{label}</div>
          <div className={h.datoValor} style={{ color }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
