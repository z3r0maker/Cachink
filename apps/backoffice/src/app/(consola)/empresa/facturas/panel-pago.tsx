'use client';

import { useActionState } from 'react';

import { registrarPagoAction } from '@/server/actions/empresa-factura-por-pagar';
import type { MontoPago, PagoFactura } from '@/server/empresa/pago-factura-view';
import * as pp from '@/styles/mostrador-por-pagar.css';
import * as m from '@/styles/mostrador.css';

import { Campo, submitWith } from '../movimientos/registrar/opciones';
import { Botones, Falla } from './panel-comun';

function Montos({ montos }: { readonly montos: readonly MontoPago[] }) {
  return (
    <dl className={pp.montos}>
      {montos.map((x) => (
        <div key={x.label} className={pp.monto}>
          <dt className={pp.montoLabel}>{x.label}</dt>
          <dd className={pp.montoValor}>{x.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Today, unless the invoice is newer; never before the invoice. */
function FechaPago({ desde, hoy }: { readonly desde: string; readonly hoy: string }) {
  return (
    <div className={pp.fecha}>
      <Campo
        label="Fecha de pago"
        name="fecha"
        type="date"
        required
        autoFocus
        min={desde}
        defaultValue={hoy < desde ? desde : hoy}
      />
    </div>
  );
}

/**
 * «Registrar pago» (board CD-06e): the day the money left the bank, today
 * unless the invoice is newer, and what the payment moves.
 */
export function PanelPago({
  pago,
  proveedor,
  hoy,
  onCerrar,
}: {
  readonly pago: PagoFactura;
  readonly proveedor: string;
  readonly hoy: string;
  readonly onCerrar: () => void;
}) {
  const [state, action, pending] = useActionState(registrarPagoAction, null);
  const aria = `Registrar el pago a ${proveedor}`;
  return (
    <form className={pp.panel} onSubmit={submitWith(action)} aria-label={aria}>
      <input type="hidden" name="uuid" value={pago.uuid} />
      <div className={pp.texto}>
        <h3 className={pp.titulo}>Registrar el pago</h3>
        <span className={pp.explica}>
          Lo registramos como salida del banco y su IVA pasa a acreditable.
        </span>
      </div>
      <FechaPago desde={pago.desde} hoy={hoy} />
      <Montos montos={pago.montos} />
      <Botones confirmar="Confirmar pago" clase={m.boton.primario} {...{ pending, onCerrar }} />
      <span className={pp.nota}>
        El día que salió del banco. No puede ser antes del {pago.desdeTexto}, la fecha de la
        factura, ni caer en un mes ya cerrado.
      </span>
      <Falla state={state} />
    </form>
  );
}
