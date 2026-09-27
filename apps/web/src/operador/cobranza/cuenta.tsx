'use client';

import type { Money } from '@xangarro/domain';
import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import { Lateral } from '../ui/lateral';
import { estadoCuenta, recordatorio } from './cliente/derive';
import { Recordar } from './cliente/recordar';
import type { CuentaCliente } from './cliente/types';
import { AbonoCaja, RecibirBoton, useAbonoCuenta, type AbonoCuenta } from './cuenta-abono';
import { Abiertas, Abonos } from './cuenta-listas';
import * as k from './cuenta.css';
import { EstadoChip } from './tarjeta';
import type { MetodoAbono } from './types';

const WA =
  'M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719';

export interface CuentaLateralProps {
  readonly c: CuentaCliente;
  readonly negocio: string;
  /** Opened from «Recibir abono»: the amount takes the focus. */
  readonly foco: boolean;
  readonly recordar: boolean;
  readonly setRecordar: (v: boolean) => void;
  readonly onClose: () => void;
  readonly onSave: (metodo: MetodoAbono, monto: Money) => void;
}

/** «Cuenta de fiado»: the balance, open tickets, the latest abonos, and a new abono. */
export function CuentaLateral(p: CuentaLateralProps) {
  const x = useAbonoCuenta(p.c);
  const debe = x.saldo > 0n;
  return (
    <Lateral
      width={500}
      onClose={p.onClose}
      eyebrow="Cuenta de fiado"
      chip={<EstadoChip x={p.c} />}
      title={p.c.nombre}
      titleSize="md"
      lead={
        <span className={k.avatar} style={{ background: p.c.tint }} aria-hidden="true">
          {p.c.iniciales}
        </span>
      }
      sub={<span className={k.sub}>{subtitulo(p.c)}</span>}
      head={<Saldo c={p.c} saldo={x.saldo} />}
      footer={<Pie x={x} debe={debe} p={p} />}
    >
      <Abiertas c={p.c} />
      <Abonos c={p.c} />
      {debe ? (
        <AbonoCaja x={x} foco={p.foco} />
      ) : (
        <div className={k.alCorriente}>
          No debe nada. Cuando le fíes algo, aquí vas a ver sus ventas abiertas.
        </div>
      )}
      {p.recordar ? (
        <Recordar
          nombre={p.c.nombre}
          telefono={p.c.telefono}
          mensaje={recordatorio(p.c, estadoCuenta(p.c), p.negocio)}
          onClose={() => p.setRecordar(false)}
        />
      ) : null}
    </Lateral>
  );
}

const subtitulo = (c: CuentaCliente) =>
  [c.telefono, `cliente desde ${c.desde}`].filter(Boolean).join(' · ');

function Saldo({ c, saldo }: { readonly c: CuentaCliente; readonly saldo: Money }) {
  const meta = [
    c.plazo && `Plazo ${c.plazo}`,
    c.limite > 0n && `límite ${formatMoney(c.limite)}`,
  ].filter(Boolean);
  return (
    <div className={k.saldoRow}>
      <span
        className={k.saldo}
        style={{ color: saldo > 0n ? colors.warningText : colors.greenText }}
      >
        {formatMoney(saldo)}
      </span>
      <span className={k.meta}>{meta.join(' · ')}</span>
    </div>
  );
}

function Pie(p: {
  readonly x: AbonoCuenta;
  readonly debe: boolean;
  readonly p: CuentaLateralProps;
}) {
  return (
    <>
      {p.debe ? <RecibirBoton x={p.x} onSave={p.p.onSave} /> : null}
      <button type="button" className={k.whatsapp} onClick={() => p.p.setRecordar(true)}>
        <Icon path={WA} size={18} strokeWidth={2.2} />
        Mandarle recordatorio por WhatsApp
      </button>
    </>
  );
}
