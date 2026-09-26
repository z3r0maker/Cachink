'use client';

import { formatMoney } from '@xangarro/domain';

import { Drawer } from '@/components';
import type { MermaFila } from '@/server/estados';

import * as s from './lado.css';

/**
 * What «Se echó a perder o se dañó» is made of (ADR-107): every movement
 * recorded as «Merma / daño» in the period, at cost. The owner sees what was
 * lost, not only how much.
 */
export function MermaDrawer(props: {
  readonly abierto: boolean;
  readonly onCerrar: () => void;
  readonly mermas: readonly MermaFila[];
  readonly total: bigint;
}) {
  return (
    <Drawer
      open={props.abierto}
      onOpenChange={(o) => (o ? undefined : props.onCerrar())}
      eyebrow="Merma"
      heading="Se echó a perder o se dañó"
      subtitle={`${formatMoney(props.total)} al costo en este periodo`}
      description="Los productos que se registraron como merma o daño en el periodo."
    >
      <ul className={s.mermas}>
        {props.mermas.map((m, i) => (
          <li key={`${m.fecha}-${m.producto}-${i}`} className={s.merma}>
            <span>
              <strong>{m.producto}</strong>
              <span className={s.mermaSub}>
                {m.cantidad} {m.cantidad === 1 ? 'unidad' : 'unidades'} · {m.fecha}
              </span>
            </span>
            <strong className={s.mermaMonto}>−{formatMoney(m.monto)}</strong>
          </li>
        ))}
      </ul>
      <p className={s.mermaNota}>
        Se registra en Productos, con un movimiento de salida por «Merma / daño».
      </p>
    </Drawer>
  );
}
