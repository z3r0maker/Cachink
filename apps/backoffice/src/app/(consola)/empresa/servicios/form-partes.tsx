'use client';

import type { CobroServicio } from '@xangarro/domain/corp';
import type { Route } from 'next';
import Link from 'next/link';

import * as d from '@/styles/mostrador-data.css';
import * as mv from '@/styles/mostrador-movimientos.css';
import * as s from '@/styles/mostrador-servicios.css';
import * as m from '@/styles/mostrador.css';

import { Campo } from '../movimientos/registrar/opciones';

/** The drawer's lower half (E-24, board CD-18d): what pays it, its two boxes and its footer. */
const RECURRENTE: Record<CobroServicio, string> = {
  fijo: 'Cada mes aparece en Recurrentes para registrarlo con un clic.',
  uso: 'Cada mes aparece en Recurrentes sin monto: lo pones al ver el cargo de la tarjeta.',
  anual: 'Cada año, en su fecha, aparece en Recurrentes.',
  gratis:
    'Un servicio gratis no crea gasto. Al cambiar a un plan de pago, edítalo y elige cómo cobra.',
  comision: 'La comisión sale de cada depósito de Stripe; no lleva gasto recurrente.',
};

const PIE: Record<CobroServicio, string> = {
  fijo: 'Su promedio al mes sale de los gastos registrados de los últimos 3 meses.',
  uso: 'El costo de cada mes sale de los gastos registrados. La proyección del mes aparece con 3 días de uso.',
  anual: 'Su promedio al mes es el cargo anual entre 12.',
  gratis: 'El uso lo actualiza un socio cuando lo revisa en el panel del proveedor.',
  comision: 'Su costo sale de las comisiones de cada depósito de Stripe.',
};

export function PagaCon(props: { readonly valor: string; readonly conocidos: readonly string[] }) {
  return (
    <>
      <Campo
        label="Se paga con"
        name="pagaCon"
        defaultValue={props.valor}
        list="medios-conocidos"
        autoComplete="off"
        hint="Una tarjeta solo por sus últimos 4 dígitos: «Tarjeta •••• 4821»."
      />
      <datalist id="medios-conocidos">
        {props.conocidos.map((x) => (
          <option key={x} value={x} />
        ))}
      </datalist>
    </>
  );
}

export function PorContratar(props: {
  readonly marcada: boolean;
  readonly onChange: (v: boolean) => void;
}) {
  return (
    <label className={mv.casilla}>
      <input
        className={mv.casillaInput}
        type="checkbox"
        name="porContratar"
        value="si"
        checked={props.marcada}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      <span className={mv.casillaText}>
        <span className={mv.casillaTitle}>Todavía no lo contratamos</span>
        <span className={d.hint}>
          Queda «Por contratar», sin gasto recurrente hasta contratarlo.
        </span>
      </span>
    </label>
  );
}

/** «Crear su gasto recurrente en Movimientos», only for a contracted service that charges on a day. */
export function Recurrente(props: {
  readonly cobro: CobroServicio;
  readonly lleva: boolean;
  readonly porContratar: boolean;
  readonly marcada: boolean;
}) {
  return (
    <label className={`${mv.casilla} ${s.casilla}`}>
      <input
        className={mv.casillaInput}
        type="checkbox"
        name="recurrente"
        value="si"
        defaultChecked={props.lleva && props.marcada}
        disabled={!props.lleva}
      />
      <span className={mv.casillaText}>
        <span className={mv.casillaTitle}>
          {props.lleva ? 'Crear su gasto recurrente en Movimientos' : 'Sin gasto recurrente'}
        </span>
        <span className={d.hint}>
          {props.porContratar ? 'Se crea al contratarlo.' : RECURRENTE[props.cobro]}
        </span>
      </span>
    </label>
  );
}

export function Pie(props: {
  readonly cobro: CobroServicio;
  readonly cerrar: string;
  readonly pending: boolean;
}) {
  return (
    <div className={m.row}>
      <p className={d.hint}>{PIE[props.cobro]}</p>
      <Link className={m.boton.secundario} href={props.cerrar as Route} scroll={false}>
        Cancelar
      </Link>
      <button className={m.boton.primario} type="submit" disabled={props.pending}>
        Guardar servicio
      </button>
    </div>
  );
}
