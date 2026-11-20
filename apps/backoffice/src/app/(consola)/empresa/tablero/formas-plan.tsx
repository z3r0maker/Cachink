'use client';

import { useActionState } from 'react';

import {
  avanceAction,
  clausulaAction,
  crearObjetivoAction,
  enviarPlanAction,
  marcarAvisoAction,
  responderPlanAction,
} from '@/server/actions/empresa-tablero-plan';
import type { FormState } from '@/server/actions/form-state';
import * as d from '@/styles/mostrador-data.css';
import * as t from '@/styles/mostrador-tablero.css';
import * as m from '@/styles/mostrador.css';

import { Campo, Opciones, submitWith } from '../movimientos/registrar/opciones';
import { Aviso } from '../socios/formas';

/** Board CD-13d's forms: the plan sent and answered, an objective and its progress, the clause, the notice. */
type Action = (prev: FormState, form: FormData) => Promise<FormState>;

function Boton(props: {
  readonly action: Action;
  readonly campos: Readonly<Record<string, string>>;
  readonly texto: string;
  readonly estilo: 'primario' | 'secundario' | 'peligro';
}) {
  const [state, action, pending] = useActionState(props.action, null);
  return (
    <form onSubmit={submitWith(action)} className={m.stack}>
      {Object.entries(props.campos).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <Aviso state={state} />
      <button className={m.boton[props.estilo]} type="submit" disabled={pending}>
        {props.texto}
      </button>
    </form>
  );
}

export function EnviarPlanForm({ trimestre }: { readonly trimestre: string }) {
  return (
    <Boton
      action={enviarPlanAction}
      campos={{ t: trimestre }}
      texto="Enviar el plan"
      estilo="primario"
    />
  );
}

export function ResponderPlanForm(props: {
  readonly trimestre: string;
  readonly aprobar: boolean;
  readonly texto: string;
}) {
  return (
    <Boton
      action={responderPlanAction}
      campos={{ t: props.trimestre, respuesta: props.aprobar ? 'aprobar' : 'rechazar' }}
      texto={props.texto}
      estilo={props.aprobar ? 'primario' : 'secundario'}
    />
  );
}

export function NuevoObjetivoForm(props: {
  readonly trimestre: string;
  readonly nombres: Readonly<Record<1 | 2, string>>;
}) {
  const [state, action, pending] = useActionState(crearObjetivoAction, null);
  return (
    <form onSubmit={submitWith(action)} className={d.form} data-testid="objetivo-form">
      <input type="hidden" name="t" value={props.trimestre} />
      <Campo
        label="Objetivo"
        name="titulo"
        required
        autoComplete="off"
        hint="Un resultado que se mide, como «90 negocios pagando»."
      />
      <Opciones
        legend="De quién"
        name="quien"
        value="ambos"
        opciones={[
          { value: 'ambos', title: 'Ambos' },
          { value: '1', title: props.nombres[1] },
          { value: '2', title: props.nombres[2] },
        ]}
      />
      <div className={d.fields}>
        <Campo label="Meta" name="meta" inputMode="numeric" required />
        <Campo label="Unidad" name="unidad" required placeholder="negocios" />
      </div>
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.primario} type="submit" disabled={pending}>
          Agregar el objetivo
        </button>
      </div>
    </form>
  );
}

export function AvanceForm(props: {
  readonly trimestre: string;
  readonly objetivo: string;
  readonly hint: string;
}) {
  const [state, action, pending] = useActionState(avanceAction, null);
  return (
    <form onSubmit={submitWith(action)} className={d.form} data-testid="avance-form">
      <input type="hidden" name="t" value={props.trimestre} />
      <input type="hidden" name="objetivo" value={props.objetivo} />
      <Campo label="Avance" name="valor" inputMode="numeric" required hint={props.hint} />
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.primario} type="submit" disabled={pending}>
          Guardar el avance
        </button>
      </div>
    </form>
  );
}

export function ClausulaForm({ trimestre }: { readonly trimestre: string }) {
  const [state, action, pending] = useActionState(clausulaAction, null);
  return (
    <form onSubmit={submitWith(action)} className={d.form} data-testid="clausula-form">
      <input type="hidden" name="t" value={trimestre} />
      <Campo label="Número de la cláusula" name="numero" required autoComplete="off" />
      <div className={d.field}>
        <label className={d.label} htmlFor="clausula-texto">
          Su texto
        </label>
        <textarea
          id="clausula-texto"
          className={t.area}
          name="texto"
          required
          aria-describedby="clausula-hint"
        />
        <span id="clausula-hint" className={d.hint}>
          Cópiala tal como está en el acuerdo firmado del Expediente. La consola no la resume ni la
          cambia.
        </span>
      </div>
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.primario} type="submit" disabled={pending}>
          Guardar la cláusula
        </button>
      </div>
    </form>
  );
}

export function MarcarAvisoForm({
  trimestre,
  hoy,
}: {
  readonly trimestre: string;
  readonly hoy: string;
}) {
  const [state, action, pending] = useActionState(marcarAvisoAction, null);
  return (
    <form onSubmit={submitWith(action)} className={d.form} data-testid="aviso-form">
      <input type="hidden" name="t" value={trimestre} />
      <Campo
        label="Enviado el"
        name="enviadoEl"
        type="date"
        required
        max={hoy}
        defaultValue={hoy}
      />
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.primario} type="submit" disabled={pending}>
          Marcar como enviado
        </button>
      </div>
    </form>
  );
}
