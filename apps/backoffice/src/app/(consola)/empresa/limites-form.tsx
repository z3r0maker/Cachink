'use client';

import { formatMoney } from '@xangarro/domain';
import type { TopesDelAnio } from '@xangarro/domain/corp';
import { useActionState } from 'react';

import { guardarTopesAction } from '@/server/actions/empresa-limites';
import * as c from '@/styles/mostrador-limites.css';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

import { Campo, submitWith } from './movimientos/registrar/opciones';
import { Aviso } from './socios/formas';

function Explicacion({ anio }: { readonly anio: number }) {
  return (
    <div>
      <h3 id="falta" className={`${c.subtitulo} ${c.falta}`}>
        Falta capturar los topes de {anio}
      </h3>
      <p className={m.sub}>
        El tope de la SAS cambia cada año: el DOF lo publica en diciembre. Hasta capturarlo no se
        calcula el avance de {anio}; no se usa el de {anio - 1}.
      </p>
    </div>
  );
}

/**
 * «Falta capturar los topes» (E-15, board CD-12d): a year's two caps. Last
 * year's are shown as a hint, never used: the DOF updates the SAS's.
 */
export function LimitesForm(props: {
  readonly anio: number;
  readonly anterior: TopesDelAnio | null;
}) {
  const [state, action, pending] = useActionState(guardarTopesAction, null);
  const fue = (v: bigint | undefined, extra = '') =>
    v === undefined ? undefined : `En ${props.anio - 1} fue ${formatMoney(v)}.${extra}`;
  return (
    <section className={c.captura} aria-labelledby="falta">
      <Explicacion anio={props.anio} />
      <form onSubmit={submitWith(action)} className={d.form}>
        <input type="hidden" name="anio" value={props.anio} />
        <Campo
          label={`Tope de la SAS para ${props.anio}`}
          name="sas"
          inputMode="decimal"
          required
          hint={fue(props.anterior?.sas)}
        />
        <Campo
          label={`Tope de RESICO persona moral para ${props.anio}`}
          name="resico"
          inputMode="decimal"
          required
          hint={fue(
            props.anterior?.resico,
            ' La ley no lo actualiza cada año; se confirma cada enero.',
          )}
        />
        <Aviso state={state} />
        <button className={m.boton.primario} type="submit" disabled={pending}>
          Guardar los topes de {props.anio}
        </button>
      </form>
    </section>
  );
}
