'use client';

import { formatMoney } from '@xangarro/domain';
import { colors, portalFontSizes } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import { OpModal } from '../ui/modal';
import * as u from '../ui/ui.css';
import * as c from './cobro.css';
import { Credito } from './credito';
import { Efectivo } from './efectivo';
import { importe } from './ticket';
import type { CajaData } from './types';
import type { Caja } from './use-caja';

const METODOS = [
  {
    label: 'Efectivo',
    paso: 'efectivo',
    bg: colors.greenSoft,
    icon: 'M3 7h18v10H3V7Zm9 2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5',
  },
  { label: 'Transferencia', paso: null, bg: colors.blueSoft, icon: 'M4 12h16M14 6l6 6-6 6' },
  { label: 'Tarjeta', paso: null, bg: colors.purpleSoft, icon: 'M3 6h18v12H3V6Zm0 4h18' },
  {
    label: 'Fiado',
    paso: 'credito',
    bg: colors.warningSoft,
    icon: 'M16 20v-2a4 4 0 0 0-8 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  },
] as const;

const TITLES = {
  metodo: 'Cómo paga',
  efectivo: 'Pago en efectivo',
  credito: 'Venta fiada',
} as const;
const BACK = 'M15 6l-6 6 6 6';

export interface CobroProps {
  readonly caja: Caja;
  readonly data: CajaData;
  /** False on a linked register: fiado needs an existing client (O-33). */
  readonly permitirNuevo?: boolean;
}

/** Cobrar: the method, then cash with change or credit with a client. */
export function Cobro({ caja, data, permitirNuevo = true }: CobroProps) {
  const paso = caja.paso === 'catalogo' ? null : caja.paso;
  return (
    <OpModal
      open={paso !== null && caja.count > 0}
      onClose={() => caja.setPaso('catalogo')}
      title={paso ? TITLES[paso] : ''}
      titleSize={portalFontSizes.lgx}
      width={760}
      headBg={colors.yellow}
      square={34}
      headGap={12}
      before={
        paso && paso !== 'metodo' ? <Volver onClick={() => caja.setPaso('metodo')} /> : undefined
      }
      after={
        <span className={c.figure} style={{ fontSize: portalFontSizes.xl2 }}>
          {formatMoney(caja.total)}
        </span>
      }
      bodyGap={null}
    >
      <div className={c.grid}>
        <Resumen caja={caja} />
        <div className={c.step}>
          {paso === 'metodo' ? <Metodos caja={caja} /> : null}
          {paso === 'efectivo' ? <Efectivo caja={caja} /> : null}
          {paso === 'credito' ? (
            <Credito caja={caja} clientes={data.clientes} permitirNuevo={permitirNuevo} />
          ) : null}
        </div>
      </div>
    </OpModal>
  );
}

function Volver({ onClick }: { readonly onClick: () => void }) {
  return (
    <button type="button" className={c.back} title="Volver" data-onyellow="" onClick={onClick}>
      <Icon path={BACK} size={17} strokeWidth={2.5} />
    </button>
  );
}

function Resumen({ caja }: { readonly caja: Caja }) {
  return (
    <div className={c.resumen}>
      <div className={u.eyebrow}>Ticket · {caja.count}</div>
      <div className={c.resumenLines}>
        {caja.lines.map((l) => (
          <div key={l.productoId} className={c.resumenLine}>
            <span className={c.resumenQty}>{l.cantidad}×</span>
            <span className={c.resumenName}>{l.nombre}</span>
            <span className={c.resumenAmount}>{formatMoney(importe(l))}</span>
          </div>
        ))}
      </div>
      <div className={c.resumenTotal}>
        <span className={u.eyebrow}>Total</span>
        <span className={c.figure} style={{ fontSize: portalFontSizes.xl3 }}>
          {formatMoney(caja.total)}
        </span>
      </div>
    </div>
  );
}

function Metodos({ caja }: { readonly caja: Caja }) {
  const pick = (m: (typeof METODOS)[number]) => {
    if (m.paso) return caja.setPaso(m.paso);
    caja.vender({
      metodo: m.label,
      cambio: null,
      nota: `Pago recibido por ${m.label.toLowerCase()}.`,
    });
  };
  return (
    <div className={c.methods}>
      {METODOS.map((m) => (
        <button
          key={m.label}
          type="button"
          className={c.method}
          style={{ background: m.bg }}
          onClick={() => pick(m)}
        >
          <span className={c.methodIcon}>
            <Icon path={m.icon} size={20} strokeWidth={2.3} />
          </span>
          <span className={c.methodLabel}>{m.label}</span>
        </button>
      ))}
    </div>
  );
}
