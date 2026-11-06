'use client';

import { useState, type ReactNode } from 'react';

import type { PagoFactura } from '@/server/empresa/pago-factura-view';
import * as mf from '@/styles/mostrador-facturas.css';
import * as d from '@/styles/mostrador-data.css';
import * as pp from '@/styles/mostrador-por-pagar.css';
import * as m from '@/styles/mostrador.css';

import { PanelCancelar } from './panel-cancelar';
import { PanelPago } from './panel-pago';

type Abierto = 'pago' | 'cancelar' | null;

export interface FilaPorPagarProps {
  readonly pago: PagoFactura;
  readonly proveedor: string;
  /** The expense and its IVA, as the row shows them: what «Cancelar» reverses. */
  readonly subtotal: string;
  readonly iva: string;
  /** `YYYY-MM-DD` in Mexico, the payment date offered first. */
  readonly hoy: string;
  /** The row's other cells, rendered on the server. */
  readonly children: ReactNode;
}

/** «Por pagar», and while no panel is open, the two buttons that open one. */
function Acciones({
  proveedor,
  abierto,
  abrir,
}: {
  readonly proveedor: string;
  readonly abierto: Abierto;
  readonly abrir: (a: Abierto) => void;
}) {
  return (
    <div className={mf.porPagar}>
      <span className={`${m.tagBase} ${mf.tono.aviso}`}>Por pagar</span>
      {abierto === null ? (
        <>
          <button
            className={m.boton.primario}
            type="button"
            aria-label={`Registrar pago a ${proveedor}`}
            onClick={() => abrir('pago')}
          >
            Registrar pago
          </button>
          <button
            className={m.boton.secundario}
            type="button"
            aria-label={`Cancelar la factura de ${proveedor}`}
            onClick={() => abrir('cancelar')}
          >
            Cancelar
          </button>
        </>
      ) : null}
    </div>
  );
}

/**
 * An invoice on credit still owed (owner decision 9): «Registrar pago» opens a
 * panel under the row to pay it on a date (board CD-06e); «Cancelar» opens one
 * that asks before reversing its expense (board CD-06f).
 */
export function FilaPorPagar({ children, ...p }: FilaPorPagarProps) {
  const [abierto, setAbierto] = useState<Abierto>(null);
  const onCerrar = () => setAbierto(null);
  return (
    <>
      <tr className={abierto === null ? undefined : pp.abierta} data-testid="factura-recibida">
        {children}
        <td className={d.td}>
          <Acciones proveedor={p.proveedor} abierto={abierto} abrir={setAbierto} />
        </td>
      </tr>
      {abierto === null ? null : (
        <tr className={pp.abierta}>
          <td className={pp.celda} colSpan={7}>
            {abierto === 'pago' ? (
              <PanelPago {...p} onCerrar={onCerrar} />
            ) : (
              <PanelCancelar {...p} onCerrar={onCerrar} />
            )}
          </td>
        </tr>
      )}
    </>
  );
}
