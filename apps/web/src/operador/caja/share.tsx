'use client';

import { useState } from 'react';
import { formatMoney } from '@xangarro/domain';

import { Icon } from '../../shell/icon';
import { DialogoCerrar, DialogoMostrador, DialogoTitulo } from '../ui/dialogo-mostrador';
import * as m from '../ui/mostrador.css';
import { leerTelefono, type Comprobante } from './receipt';
import * as s from './share-dialogo.css';
import { Lado } from './share-lado';
import type { ShareVariant } from './share-options';
import { Recibo } from './share-recibo';

const CHECK = 'M20 6 9 17l-5-5';

/**
 * «Mandar comprobante» (OpComprobante): the receipt as the customer gets it,
 * beside WhatsApp (a `wa.me` link, no API: Track N row 13), «Guardar imagen»
 * and «Copiar texto». There is no printing. After a sale (`caja`) it also
 * says what was charged and closes into the next sale.
 */
export function Share({
  comprobante,
  onClose,
  variant = 'caja',
  cliente,
}: {
  readonly comprobante: Comprobante | null;
  readonly onClose: () => void;
  readonly variant?: ShareVariant;
  /** The cliente this venta went to: their phone is the one remembered. */
  readonly cliente?: string;
}) {
  const [tel, setTel] = useState(() => (comprobante === null ? '' : leerTelefono(cliente)));
  const [hecho, setHecho] = useState<string | null>(null);
  if (!comprobante) return null;
  return (
    <DialogoMostrador open onClose={onClose} width={900}>
      <Cabeza c={comprobante} variant={variant} />
      <div className={s.cuerpo}>
        <section aria-labelledby="sh-muestra" className={s.muestra}>
          <span id="sh-muestra" className={m.eyebrow}>
            Así le llega al cliente
          </span>
          <Recibo c={comprobante} cliente={cliente} />
        </section>
        <Lado
          c={comprobante}
          cliente={cliente}
          tel={tel}
          setTel={setTel}
          hecho={hecho}
          onHecho={setHecho}
        />
      </div>
      <Pie variant={variant} onClose={onClose} />
    </DialogoMostrador>
  );
}

function Pie({
  variant,
  onClose,
}: {
  readonly variant: ShareVariant;
  readonly onClose: () => void;
}) {
  return (
    <div className={s.pie}>
      <span className={s.pieNota}>
        {variant === 'caja'
          ? 'La venta ya quedó guardada en la caja.'
          : 'Puedes mandarlo las veces que quieras.'}
      </span>
      <button type="button" className={`${m.boton.primario} ${s.listo}`} onClick={onClose}>
        {variant === 'caja' ? 'Listo, siguiente venta' : 'Listo'}
      </button>
    </div>
  );
}

/** After a sale: the green check and what was charged; from Ventas: the sale's method. */
function Cabeza({ c, variant }: { readonly c: Comprobante; readonly variant: ShareVariant }) {
  const { venta } = c;
  const cambio = venta.cambio === null ? '' : ` · Cambio ${formatMoney(venta.cambio)}`;
  return (
    <div className={s.cabeza}>
      {variant === 'caja' ? (
        <span className={s.check} aria-hidden="true">
          <Icon path={CHECK} size={22} strokeWidth={3} />
        </span>
      ) : null}
      <span className={s.titulos}>
        <span className={`${m.eyebrow} ${variant === 'caja' ? s.verde : ''}`}>
          {variant === 'caja'
            ? `¡Listo! Cobraste ${formatMoney(venta.total)}${cambio}`
            : `Venta · ${venta.metodo}`}
        </span>
        <DialogoTitulo className={s.titulo}>Mandar comprobante · {c.folio}</DialogoTitulo>
      </span>
      <span className={s.cerrar}>
        <DialogoCerrar label="Cerrar" />
      </span>
    </div>
  );
}
