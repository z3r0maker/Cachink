'use client';

import { formatMoney, pesosToCentavos } from '@xangarro/domain';
import { useActionState, useState } from 'react';

import {
  prepararPresupuestoAction,
  responderPresupuestoAction,
} from '@/server/actions/empresa-presupuesto';
import type { VistaPresupuesto } from '@/server/empresa/presupuesto-view';
import * as d from '@/styles/mostrador-data.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

import { Campo, submitWith } from '../movimientos/registrar/opciones';
import { Aviso } from '../socios/formas';

/** Board CD-15e's budget forms: preparing a quarter's, and the other founder's answer. */
export interface CampoPresupuesto {
  readonly categoria: string;
  readonly nombre: string;
  /** Pesos, as the field starts. */
  readonly inicial: string;
  readonly hint: string;
}

function useMontos(campos: readonly CampoPresupuesto[]) {
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(campos.map((c) => [c.categoria, c.inicial])),
  );
  const total = campos.reduce(
    (t, c) => t + (pesosToCentavos(valores[c.categoria] || '0') ?? 0n),
    0n,
  );
  const poner = (categoria: string, v: string) => setValores((s) => ({ ...s, [categoria]: v }));
  return { valores, total, poner };
}

function Total({ total, antes }: { readonly total: bigint; readonly antes: string | null }) {
  const sub = [`${formatMoney(total * 3n)} en el trimestre`, antes].filter(Boolean).join(' · ');
  return (
    <div className={i.aviso} role="status">
      <span>
        <span className={i.pasoTitulo} data-testid="preparar-total">
          {`Total al mes ${formatMoney(total)}`}
        </span>
        <span className={i.pasoSub}>{sub}</span>
      </span>
    </div>
  );
}

function Despues({ pasos }: { readonly pasos: readonly string[] }) {
  return (
    <div className={m.stack}>
      <span className={m.tileLabel}>Qué pasa después</span>
      {pasos.map((p, n) => (
        <span key={p} className={i.pasoSub}>{`${n + 1}. ${p}`}</span>
      ))}
    </div>
  );
}

export function PrepararForm(props: {
  readonly trimestre: string;
  readonly nombre: string;
  readonly vista: VistaPresupuesto;
  readonly campos: readonly CampoPresupuesto[];
  /** «el 4T fue de $31,000.00 al mes», when there was one. */
  readonly antes: string | null;
  readonly otro: string;
  readonly pasos: readonly string[];
}) {
  const [state, action, pending] = useActionState(prepararPresupuestoAction, null);
  const { valores, total, poner } = useMontos(props.campos);
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <input type="hidden" name="trimestre" value={props.trimestre} />
      <input type="hidden" name="vista" value={props.vista} />
      {props.campos.map((c) => (
        <Campo
          key={c.categoria}
          label={`${c.nombre} al mes`}
          name={`monto_${c.categoria}`}
          inputMode="decimal"
          autoComplete="off"
          value={valores[c.categoria] ?? ''}
          onChange={(e) => poner(c.categoria, e.target.value)}
          hint={c.hint}
        />
      ))}
      <Total total={total} antes={props.antes} />
      <Despues pasos={props.pasos} />
      <div className={m.row}>
        <button className={m.boton.primario} type="submit" disabled={pending}>
          {`Enviar a ${props.otro}`}
        </button>
      </div>
      <Aviso state={state} />
    </form>
  );
}

export function ResponderPresupuestoForm(props: {
  readonly id: string;
  readonly vista: VistaPresupuesto;
  readonly respuesta: 'aprobar' | 'rechazar';
  readonly texto: string;
}) {
  const [state, action, pending] = useActionState(responderPresupuestoAction, null);
  return (
    <form onSubmit={submitWith(action)} className={m.row}>
      <input type="hidden" name="id" value={props.id} />
      <input type="hidden" name="vista" value={props.vista} />
      <input type="hidden" name="respuesta" value={props.respuesta} />
      <button
        className={props.respuesta === 'aprobar' ? m.boton.primario : m.boton.quieto}
        type="submit"
        disabled={pending}
      >
        {props.texto}
      </button>
      <Aviso state={state} />
    </form>
  );
}
