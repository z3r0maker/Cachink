import { DENOMINACIONES_MXN, formatMoney, type PesosDenominacion } from '@xangarro/domain';
import { colors, portalFontSizes } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as c from '../cobranza/cobranza.css';
import * as u from '../ui/ui.css';
import * as v from '../ventas/ventas.css';
import * as s from './cierre.css';
import type { Cierre } from './use-cierre';

const MENOS = 'M5 12h14';
const MAS = 'M12 5v14M5 12h14';

/** Each bill its own tint; coins share gray. */
const TINTE: Record<PesosDenominacion, string> = {
  1000: colors.purpleSoft,
  500: colors.peachSoft,
  200: colors.greenSoft,
  100: colors.redSoft,
  50: colors.blueSoft,
  20: colors.yellowSoft,
  10: colors.gray100,
  5: colors.gray100,
  2: colors.gray100,
  1: colors.gray100,
};

/** «Cuenta el efectivo de la caja»: $1,000 to $1, each with − / pieces / + and its amount. */
export function Conteo({ x }: { readonly x: Cierre }) {
  return (
    <div className={u.listCard}>
      <div className={c.abonosHead}>
        <span className={u.eyebrow}>Cuenta el efectivo de la caja</span>
      </div>
      <div className={s.conteo}>
        {DENOMINACIONES_MXN.map((d) => (
          <Denominacion key={d.pesos} d={d} n={x.conteo[d.pesos] ?? 0} poner={x.poner} />
        ))}
      </div>
      <div className={s.contado}>
        <span className={s.rotulo}>Contado</span>
        <span className={s.cifra} style={{ fontSize: portalFontSizes.total }}>
          {formatMoney(x.contado)}
        </span>
      </div>
    </div>
  );
}

function Denominacion(p: {
  readonly d: (typeof DENOMINACIONES_MXN)[number];
  readonly n: number;
  readonly poner: Cierre['poner'];
}) {
  const { d, n } = p;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span className={s.denom} style={{ background: TINTE[d.pesos] }}>{`$${d.pesos}`}</span>
      <span className={s.tipo}>{d.tipo}</span>
      <Pasos d={d} n={n} poner={p.poner} />
      <span className={s.importe} data-cero={n === 0 ? '' : undefined}>
        {n === 0 ? '—' : formatMoney(d.valor * BigInt(n))}
      </span>
    </div>
  );
}

/** − / pieces / +: 40 px squares around a 62 px field. */
function Pasos(p: {
  readonly d: (typeof DENOMINACIONES_MXN)[number];
  readonly n: number;
  readonly poner: Cierre['poner'];
}) {
  const { d, n } = p;
  return (
    <div
      style={{ marginLeft: 'auto', flex: 'none', display: 'flex', alignItems: 'center', gap: 7 }}
    >
      <button
        type="button"
        className={v.square}
        title="Uno menos"
        onClick={() => p.poner(d.pesos, n - 1)}
      >
        <Icon path={MENOS} size={15} strokeWidth={2.8} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={`Cantidad de $${d.pesos}`}
        className={s.piezas}
        value={String(n)}
        onChange={(e) =>
          p.poner(d.pesos, Number.parseInt(e.target.value.replace(/\D/g, '') || '0', 10))
        }
      />
      <button
        type="button"
        className={v.square}
        style={{ background: colors.yellow }}
        title="Uno más"
        onClick={() => p.poner(d.pesos, n + 1)}
      >
        <Icon path={MAS} size={15} strokeWidth={2.8} />
      </button>
    </div>
  );
}
