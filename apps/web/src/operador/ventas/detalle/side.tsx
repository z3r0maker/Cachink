import Link from 'next/link';

import { OPERADOR_BASE } from '@xangarro/caja';
import { fichas, type Ficha, type VentaDetalle } from '@xangarro/caja/ventas';
import * as s from './side.css';

/** The four tiles: how it was paid (or why it was cancelled), who cobró, where. */
export function Fichas(p: {
  readonly venta: VentaDetalle;
  readonly ctx: { readonly operador: string; readonly caja: string; readonly desde: string };
}) {
  return (
    <section className={s.fichas} aria-label="Datos de la venta">
      {fichas(p.venta, p.ctx).map((f: Ficha) => (
        <div key={f.k} className={s.ficha}>
          <span className={s.fichaK}>{f.k}</span>
          <span className={s.fichaV} style={f.color ? { color: f.color } : undefined}>
            {f.v}
          </span>
        </div>
      ))}
    </section>
  );
}

/** The red note of a cancelled sale; the amber one of a fiado sale, with a way to collect. */
export function Notas({ venta }: { readonly venta: VentaDetalle }) {
  if (venta.cancelada)
    return (
      <div className={s.notaTono.cancelada}>
        Se canceló por: {venta.cancelada.motivo}. Ya no cuenta en tus ventas ni en tu corte.
      </div>
    );
  if (!venta.fiado) return null;
  return (
    <div className={s.notaTono.fiado}>
      Esta venta se fue a la cuenta de {venta.fiado.cliente}. No entró dinero a tu caja.{' '}
      <Link href={`${OPERADOR_BASE}/cobranza`} className={s.enlace}>
        Recibir un abono
      </Link>
    </div>
  );
}

/** What the cancellation just did (the linked register says the cash to return). */
export function Hecho({ texto }: { readonly texto: string }) {
  return (
    <div role="status" className={s.notaTono.hecho}>
      {texto}
    </div>
  );
}
