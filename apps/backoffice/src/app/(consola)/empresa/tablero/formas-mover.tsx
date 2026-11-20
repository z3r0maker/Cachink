'use client';

import { useActionState } from 'react';

import { moverTarjetaAction } from '@/server/actions/empresa-tablero';
import * as d from '@/styles/mostrador-data.css';
import * as t from '@/styles/mostrador-tablero.css';
import * as m from '@/styles/mostrador.css';

import { Campo, Opciones } from '../movimientos/registrar/opciones';
import { Aviso } from '../socios/formas';
import { useEnvioConArchivo } from '../subida-directa';
import { Ocultos, type Ids } from './formas-tarjeta';

/**
 * Board CD-13c's moves: start, finish with evidence, accept or object, take
 * it to the mediator and record the ruling. One action, the move in `accion`.
 */
function useMover() {
  const [state, action, pending] = useActionState(moverTarjetaAction, null);
  const { onSubmit, subiendo } = useEnvioConArchivo(action);
  return { state, onSubmit, ocupado: pending || subiendo };
}

/** A move with nothing to fill: start, accept, mark a task done. */
export function BotonMover(props: {
  readonly ids: Ids;
  readonly accion: string;
  readonly texto: string;
  readonly primario?: boolean;
}) {
  const { state, onSubmit, ocupado } = useMover();
  return (
    <form onSubmit={onSubmit} className={m.stack}>
      <Ocultos ids={props.ids} />
      <input type="hidden" name="accion" value={props.accion} />
      <Aviso state={state} />
      <button
        className={props.primario === true ? m.boton.primario : m.boton.secundario}
        type="submit"
        disabled={ocupado}
      >
        {props.texto}
      </button>
    </form>
  );
}

export function TerminarForm({ ids, plazo }: { readonly ids: Ids; readonly plazo: string }) {
  const { state, onSubmit, ocupado } = useMover();
  return (
    <form onSubmit={onSubmit} className={d.form} data-testid="terminar-form">
      <Ocultos ids={ids} />
      <input type="hidden" name="accion" value="terminar" />
      <span className={d.hint}>
        Con la evidencia de que se cumple el criterio: un archivo o un enlace.
      </span>
      <div className={d.fields}>
        <Campo label="Archivo" name="archivo" type="file" />
        <Campo label="O un enlace" name="enlace" type="url" placeholder="https://" />
      </div>
      <span className={d.hint}>{plazo}</span>
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.primario} type="submit" disabled={ocupado}>
          Marcar terminado
        </button>
      </div>
    </form>
  );
}

/** A move that names why: an objection, taking it to the mediator. */
export function MotivoForm(props: {
  readonly ids: Ids;
  readonly accion: 'objetar' | 'mediador';
  readonly label: string;
  readonly texto: string;
}) {
  const { state, onSubmit, ocupado } = useMover();
  return (
    <form onSubmit={onSubmit} className={d.form} data-testid={`${props.accion}-form`}>
      <Ocultos ids={props.ids} />
      <input type="hidden" name="accion" value={props.accion} />
      <div className={d.field}>
        <label className={d.label} htmlFor={`motivo-${props.accion}`}>
          {props.label}
        </label>
        <textarea id={`motivo-${props.accion}`} className={t.area} name="motivo" required />
      </div>
      <Aviso state={state} />
      <div className={m.row}>
        <button
          className={props.accion === 'objetar' ? m.boton.peligro : m.boton.secundario}
          type="submit"
          disabled={ocupado}
        >
          {props.texto}
        </button>
      </div>
    </form>
  );
}

export function ResolverForm({ ids }: { readonly ids: Ids }) {
  const { state, onSubmit, ocupado } = useMover();
  return (
    <form onSubmit={onSubmit} className={d.form} data-testid="resolver-form">
      <Ocultos ids={ids} />
      <input type="hidden" name="accion" value="resolver" />
      <Opciones
        legend="Lo que resolvió el mediador"
        name="aceptada"
        value="si"
        opciones={[
          { value: 'si', title: 'Se acepta', text: 'Cuenta en el trimestre en que se terminó' },
          {
            value: 'no',
            title: 'No se acepta',
            text: 'El responsable la corrige y la marca otra vez',
          },
        ]}
      />
      <Campo label="El documento del mediador" name="archivo" type="file" required />
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.primario} type="submit" disabled={ocupado}>
          Registrar la resolución
        </button>
      </div>
    </form>
  );
}
