'use client';

import { formatMoney, pesosToCentavos } from '@xangarro/domain';
import { repartoDelDinero } from '@xangarro/domain/corp';
import { useActionState, useState } from 'react';

import { cerrarDinero } from '@/server/actions/empresa-socios';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';
import * as s from '@/styles/mostrador-socios.css';

import { Campo, submitWith } from '../movimientos/registrar/opciones';
import { Aviso } from './formas';

/**
 * The quarter's money close (E-03, agreement Quinta): a partner's additional
 * money counts 1:1 for the pool up to their finished deliverables; the rest
 * becomes a loan without interest. The preview is the domain's own function.
 */
export interface CierreSocio {
  readonly socio: 1 | 2;
  readonly nombre: string;
  /** Centavos of additional money in the quarter. */
  readonly adicional: bigint;
  readonly cerrado: { readonly bolsa: bigint; readonly prestamo: bigint } | null;
}

function Vista({
  adicional,
  entregables,
}: {
  readonly adicional: bigint;
  readonly entregables: string;
}) {
  const tope = pesosToCentavos(entregables);
  if (tope === null) return null;
  const { bolsa, prestamo } = repartoDelDinero(adicional, tope);
  const pct = adicional === 0n ? 0 : Number((bolsa * 100n) / adicional);
  return (
    <div className={s.preview} data-testid="vista-reparto">
      <span className={s.previewStrong}>
        De {formatMoney(adicional)}, {formatMoney(bolsa)} cuentan para la bolsa y{' '}
        {formatMoney(prestamo)} quedan como préstamo.
      </span>
      <span>
        El tope del trimestre es el valor de sus entregables terminados. Lo que pasa del tope es un
        préstamo sin intereses que la empresa devuelve antes de repartir utilidades.
      </span>
      <div className={s.splitBar} aria-hidden="true">
        <div className={s.splitBolsa} style={{ flexBasis: `${pct}%` }} />
      </div>
    </div>
  );
}

type SocioProps = {
  readonly c: CierreSocio;
  readonly trimestre: string;
  readonly nombre: string;
};

function FormaCierre({ c, trimestre, nombre }: SocioProps) {
  const [state, action, pending] = useActionState(cerrarDinero, null);
  const [entregables, setEntregables] = useState('');
  return (
    <form onSubmit={submitWith(action)} className={d.form} data-testid={`cierre-${c.socio}`}>
      <input type="hidden" name="socio" value={c.socio} />
      <input type="hidden" name="trimestre" value={trimestre} />
      <p className={m.sub}>
        {c.nombre}: {formatMoney(c.adicional)} de aportaciones adicionales en el {nombre}.
      </p>
      <Campo
        label="Valor de sus entregables terminados"
        name="entregables"
        inputMode="decimal"
        required
        value={entregables}
        onChange={(e) => setEntregables(e.target.value)}
        hint="El que acordaron en el Tablero del trimestre."
      />
      <Vista adicional={c.adicional} entregables={entregables} />
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.primario} type="submit" disabled={pending}>
          Cerrar el dinero del {nombre}
        </button>
      </div>
    </form>
  );
}

function Socio(props: SocioProps) {
  const { c } = props;
  if (c.cerrado !== null) {
    return (
      <p className={m.sub} data-testid={`cerrado-${c.socio}`}>
        {c.nombre}: cerrado. {formatMoney(c.cerrado.bolsa)} cuentan para la bolsa y{' '}
        {formatMoney(c.cerrado.prestamo)} quedaron como préstamo.
      </p>
    );
  }
  if (c.adicional === 0n) return <p className={m.sub}>{c.nombre}: sin aportaciones adicionales.</p>;
  return <FormaCierre {...props} />;
}

export function Cierre(props: {
  readonly trimestre: string;
  readonly nombre: string;
  readonly socios: readonly CierreSocio[];
}) {
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="cierre">
      <h2 id="cierre" className={s.sectionTitle}>
        Dinero adicional del {props.nombre}
      </h2>
      {props.socios.map((c) => (
        <Socio key={c.socio} c={c} trimestre={props.trimestre} nombre={props.nombre} />
      ))}
    </section>
  );
}
