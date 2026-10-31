'use client';

import { useState, type ReactNode } from 'react';

import type { PagoFactura } from '@/server/empresa/pago-factura-view';
import * as pp from '@/styles/mostrador-por-pagar.css';
import * as ms from '@/styles/mostrador-sat.css';
import * as m from '@/styles/mostrador.css';

import { Alerta, PanelCancelar } from './panel-cancelar';

interface Props {
  readonly pago: PagoFactura;
  readonly proveedor: string;
  readonly subtotal: string;
  readonly iva: string;
  readonly cancelable: boolean;
}

/** Still owed, it can be cancelled; paid, the money did leave the bank (owner, 2026-10-31). */
function Explica({ subtotal, iva, cancelable }: Props) {
  return cancelable ? (
    <span className={pp.explica}>
      Su gasto de {subtotal} y su IVA de {iva} siguen registrados, así que ya no se pueden deducir.
      Cancélala para revertirlos, o pide al proveedor la factura que la sustituye.
    </span>
  ) : (
    <span className={pp.explica}>
      Ya la pagaste: su gasto de {subtotal} y su IVA de {iva} siguen registrados, pero así ya no se
      pueden deducir. Pide al proveedor la factura que la sustituye o el reembolso.
    </span>
  );
}

function Aviso({ onCancelar, ...p }: Props & { onCancelar: () => void }) {
  return (
    <div className={pp.panelCentro} role="alert">
      <Alerta />
      <div className={pp.textoAncho}>
        <h3 className={pp.titulo}>El proveedor canceló esta factura en el SAT</h3>
        <Explica {...p} />
      </div>
      {p.cancelable ? (
        <button
          className={m.boton.peligro}
          type="button"
          aria-label={`Cancelar la factura de ${p.proveedor}`}
          onClick={onCancelar}
        >
          Cancelar la factura
        </button>
      ) : null}
    </div>
  );
}

/**
 * A registered invoice the SAT says the supplier cancelled (board CD-06g):
 * its row, and under it the warning. While still owed, «Cancelar la factura»
 * opens the same confirmation as ever (CD-06f); nothing is reversed until a
 * founder confirms. A paid one is only warned about.
 */
export function FilaAvisoSat({ children, ...p }: Props & { readonly children: ReactNode }) {
  const [cancelando, setCancelando] = useState(false);
  return (
    <>
      <tr className={ms.filaAvisoAbre} data-testid="factura-recibida">
        {children}
      </tr>
      <tr className={ms.filaAviso}>
        <td className={pp.celda} colSpan={7}>
          {cancelando ? (
            <PanelCancelar {...p} onCerrar={() => setCancelando(false)} />
          ) : (
            <Aviso {...p} onCancelar={() => setCancelando(true)} />
          )}
        </td>
      </tr>
    </>
  );
}
