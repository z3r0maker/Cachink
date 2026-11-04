'use client';

import { useActionState } from 'react';

import { cancelarFacturaAction } from '@/server/actions/empresa-factura-por-pagar';
import type { PagoFactura } from '@/server/empresa/pago-factura-view';
import * as pp from '@/styles/mostrador-por-pagar.css';
import * as m from '@/styles/mostrador.css';

import { submitWith } from '../movimientos/registrar/opciones';
import { Botones, Falla } from './panel-comun';

function Alerta() {
  return (
    <svg
      className={pp.alerta}
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="7" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/** What is reversed, when, and when it is right to do it. */
function Pregunta({ pregunta, subtotal, iva }: Record<'pregunta' | 'subtotal' | 'iva', string>) {
  return (
    <div className={pp.textoAncho}>
      <h3 className={pp.titulo}>{pregunta}</h3>
      <span className={pp.explica}>
        Revertimos hoy su gasto de {subtotal} y su IVA por acreditar de {iva}, y deja de estar por
        pagar. El movimiento queda en el historial como revertido.
      </span>
      <span className={pp.nota}>
        Hazlo solo si el proveedor la canceló en el SAT o llegó con error. No se puede deshacer.
      </span>
    </div>
  );
}

/** «Cancelar» asks first (board CD-06f), its focus on the way back. */
export function PanelCancelar({
  pago,
  proveedor,
  subtotal,
  iva,
  onCerrar,
}: {
  readonly pago: PagoFactura;
  readonly proveedor: string;
  readonly subtotal: string;
  readonly iva: string;
  readonly onCerrar: () => void;
}) {
  const [state, action, pending] = useActionState(cancelarFacturaAction, null);
  const pregunta = `¿Cancelar la factura de ${proveedor}?`;
  return (
    <form className={pp.panelCentro} onSubmit={submitWith(action)} aria-label={pregunta}>
      <input type="hidden" name="uuid" value={pago.uuid} />
      <input type="hidden" name="mes" value={pago.desde.slice(0, 7)} />
      <Alerta />
      <Pregunta {...{ pregunta, subtotal, iva }} />
      <Botones
        confirmar="Sí, cancelar la factura"
        clase={m.boton.peligro}
        enfocarRegreso
        {...{ pending, onCerrar }}
      />
      <Falla state={state} />
    </form>
  );
}
