'use client';

import { useActionState } from 'react';

import { cancelarFacturaAction, registrarPagoAction } from '@/server/actions/empresa-facturas';
import type { FormState } from '@/server/actions/form-state';
import type { PorPagarDestino } from '@/server/empresa/facturas-view';
import * as p from '@/styles/mostrador-facturas-paneles.css';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

import { Campo, submitWith } from '../movimientos/registrar/opciones';

/**
 * The two panels an invoice on credit opens under its row (E-11): «Registrar
 * el pago» on the day it left the bank (board CD-06e), and the confirmation
 * before «Cancelar» reverses its expense (board CD-06f).
 */
interface PanelProps {
  readonly destino: PorPagarDestino;
  readonly proveedor: string;
  readonly mes: string;
  readonly onRegresar: () => void;
}

function Falla({ state }: { readonly state: FormState }) {
  if (state === null || state.ok) return null;
  return (
    <p className={`${d.messageBad} ${p.aviso}`} role="alert">
      {state.message}
    </p>
  );
}

function Monto({ label, valor }: { readonly label: string; readonly valor: string }) {
  return (
    <div className={p.monto}>
      <dt className={p.montoLabel}>{label}</dt>
      <dd className={p.montoValor}>{valor}</dd>
    </div>
  );
}

/** «No, regresar» and the panel's own submit, side by side. */
function Botones(props: {
  readonly onRegresar: () => void;
  readonly regresarPrimero?: boolean;
  readonly clase: string;
  readonly pending: boolean;
  readonly texto: string;
}) {
  return (
    <div className={p.botones}>
      <button
        className={m.boton.secundario}
        type="button"
        onClick={props.onRegresar}
        autoFocus={props.regresarPrimero}
      >
        No, regresar
      </button>
      <button className={props.clase} type="submit" disabled={props.pending}>
        {props.texto}
      </button>
    </div>
  );
}

function FechaDePago({
  destino,
  hoy,
}: {
  readonly destino: PorPagarDestino;
  readonly hoy: string;
}) {
  return (
    <div className={p.fecha}>
      <Campo
        label="Fecha de pago"
        name="fecha"
        type="date"
        required
        autoFocus
        defaultValue={hoy < destino.desde ? destino.desde : hoy}
        min={destino.desde}
        max={hoy}
        hint={`El día que salió del banco. No puede ser antes del ${destino.desdeLarga}, la fecha de la factura, ni caer en un mes ya cerrado.`}
      />
    </div>
  );
}

export function PanelPago({ destino, proveedor, hoy, onRegresar }: PanelProps & { hoy: string }) {
  const [state, action, pending] = useActionState(registrarPagoAction, null);
  return (
    <form
      className={p.panel}
      aria-label={`Registrar el pago a ${proveedor}`}
      onSubmit={submitWith(action)}
    >
      <input type="hidden" name="uuid" value={destino.uuid} />
      <div className={p.cabeza}>
        <h3 className={p.titulo}>Registrar el pago</h3>
        <span className={p.tenue}>
          Lo registramos como salida del banco
          {destino.iva === null ? '.' : ' y su IVA pasa a acreditable.'}
        </span>
      </div>
      <FechaDePago destino={destino} hoy={hoy} />
      <dl className={p.montos}>
        <Monto label="Sale del banco" valor={destino.saleDelBanco} />
        {destino.iva === null ? null : <Monto label="IVA acreditable" valor={destino.iva} />}
      </dl>
      <Botones
        onRegresar={onRegresar}
        clase={m.boton.primario}
        pending={pending}
        texto="Confirmar pago"
      />
      <Falla state={state} />
    </form>
  );
}

function Alerta() {
  return (
    <svg
      className={p.icono}
      width={28}
      height={28}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M12 7v6M12 17h.01" />
    </svg>
  );
}

export function PanelCancelar({ destino, proveedor, mes, onRegresar }: PanelProps) {
  const [state, action, pending] = useActionState(cancelarFacturaAction, null);
  const iva = destino.iva === null ? '' : ` y su IVA por acreditar de ${destino.iva}`;
  return (
    <form
      className={p.panelCancelar}
      aria-label={`Confirmar la cancelación de la factura de ${proveedor}`}
      onSubmit={submitWith(action)}
    >
      <input type="hidden" name="uuid" value={destino.uuid} />
      <input type="hidden" name="mes" value={mes} />
      <Alerta />
      <div className={p.texto}>
        <h3 className={p.titulo}>¿Cancelar la factura de {proveedor}?</h3>
        <span className={p.explica}>
          Revertimos hoy su gasto de {destino.gasto}
          {iva}, y deja de estar por pagar. El movimiento queda en el historial como revertido.
        </span>
        <span className={p.tenue}>
          Hazlo solo si el proveedor la canceló en el SAT o llegó con error. No se puede deshacer.
        </span>
      </div>
      <Botones
        onRegresar={onRegresar}
        regresarPrimero
        clase={m.boton.peligro}
        pending={pending}
        texto="Sí, cancelar la factura"
      />
      <Falla state={state} />
    </form>
  );
}
