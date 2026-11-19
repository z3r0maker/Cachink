'use client';

import { formatMoney, pesosToCentavos } from '@xangarro/domain';
import { useActionState, useState } from 'react';

import { pedirGastoAction, responderSolicitudAction } from '@/server/actions/empresa-presupuesto';
import { efectoEnElMes, type VistaPresupuesto } from '@/server/empresa/presupuesto-view';
import * as d from '@/styles/mostrador-data.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

import { CATEGORIAS } from '../movimientos/registrar/del-gasto';
import { Campo, Opciones, submitWith } from '../movimientos/registrar/opciones';
import { Aviso } from '../socios/formas';

/**
 * Board CD-15e's spending forms: asking for a spend outside the budget, with
 * whether it fits in the Límite said live; and the other founder's answer,
 * whole, for another amount, or rejected.
 */
export interface Mes {
  readonly mes: string;
  /** The month's projection and budget, centavos as text; budget '' without one. */
  readonly proyeccion: string;
  readonly presupuesto: string;
}

const efecto = (mes: Mes, monto: bigint, inicio?: string) =>
  efectoEnElMes({
    mes: mes.mes,
    proyeccion: BigInt(mes.proyeccion),
    presupuesto: mes.presupuesto === '' ? null : BigInt(mes.presupuesto),
    monto,
    inicio,
  });

export function ResponderSolicitudForm(props: {
  readonly id: string;
  readonly vista: VistaPresupuesto;
  readonly respuesta: 'aprobar' | 'rechazar';
}) {
  const [state, action, pending] = useActionState(responderSolicitudAction, null);
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
        {props.respuesta === 'aprobar' ? 'Aprobar' : 'Rechazar'}
      </button>
      <Aviso state={state} />
    </form>
  );
}

function AvisoLimite(props: {
  readonly cabe: boolean;
  readonly titulo: string;
  readonly texto: string;
}) {
  return (
    <div className={props.cabe ? d.messageOk : i.aviso} role="status" data-testid="pedir-aviso">
      <span>
        <span className={i.pasoTitulo}>{props.titulo}</span>
        <span className={i.pasoSub}>{props.texto}</span>
      </span>
    </div>
  );
}

interface Limite {
  /** Centavos as text: the Límite and what this founder used of it. */
  readonly limite: string;
  readonly usado: string;
  readonly otro: string;
  readonly mes: Mes;
}

const cabeEn = (l: Limite, monto: bigint) =>
  monto > 0n && monto <= BigInt(l.limite) - BigInt(l.usado);

/** Whether it fits in what is left of the Límite, said as the amount is typed. */
function AvisoPedido({ l, monto }: { readonly l: Limite; readonly monto: bigint }) {
  if (monto <= 0n) return null;
  const limite = BigInt(l.limite);
  const queda = limite - BigInt(l.usado);
  if (cabeEn(l, monto)) {
    return (
      <AvisoLimite
        cabe
        titulo="Cabe en tu Límite: se aprueba solo"
        texto={`Te quedan ${formatMoney(queda)} este mes; después de este, ${formatMoney(queda - monto)}. Queda en Fuera del presupuesto sin pedir aprobación.`}
      />
    );
  }
  return (
    <AvisoLimite
      cabe={false}
      titulo={`Rebasa tu Límite de ${formatMoney(limite)}: lo aprueba ${l.otro}`}
      texto={`${efecto(l.mes, monto)} Le avisamos por correo.`}
    />
  );
}

function useMonto() {
  const [texto, setTexto] = useState('');
  return { texto, setTexto, monto: pesosToCentavos(texto) ?? 0n };
}

export function PedirForm(props: Limite & { readonly vista: VistaPresupuesto }) {
  const [state, action, pending] = useActionState(pedirGastoAction, null);
  const { texto, setTexto, monto } = useMonto();
  const pide = monto > 0n && !cabeEn(props, monto);
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <input type="hidden" name="vista" value={props.vista} />
      <Campo label="Para qué es" name="concepto" required autoComplete="off" />
      <Campo
        label="Monto, con IVA"
        name="monto"
        inputMode="decimal"
        required
        autoComplete="off"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <Opciones legend="Categoría" name="categoria" opciones={CATEGORIAS} value="" />
      <AvisoPedido l={props} monto={monto} />
      <div className={m.row}>
        <button className={m.boton.primario} type="submit" disabled={pending}>
          {pide ? `Pedir a ${props.otro}` : 'Registrar la solicitud'}
        </button>
      </div>
      <p className={i.muted}>
        La solicitud no registra el gasto: cuando lo pagues, regístralo en Registrar como siempre.
      </p>
      <Aviso state={state} />
    </form>
  );
}

function EfectoOtro(props: { readonly mes: Mes; readonly monto: bigint; readonly pidio: bigint }) {
  return (
    <div className={i.aviso} role="status">
      <span>
        <span className={i.pasoTitulo}>
          {efecto(props.mes, props.monto, `Con ${formatMoney(props.monto)}`)}
        </span>
        <span className={i.pasoSub}>{efecto(props.mes, props.pidio, 'Con lo que pidió')}</span>
      </span>
    </div>
  );
}

export function OtroMontoForm(props: {
  readonly id: string;
  readonly vista: VistaPresupuesto;
  readonly pidio: string;
  readonly quien: string;
  readonly mes: Mes;
}) {
  const [state, action, pending] = useActionState(responderSolicitudAction, null);
  const { texto, setTexto, monto } = useMonto();
  const pidio = BigInt(props.pidio);
  const valido = monto > 0n && monto < pidio;
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <input type="hidden" name="id" value={props.id} />
      <input type="hidden" name="vista" value={props.vista} />
      <input type="hidden" name="respuesta" value="aprobar" />
      <Campo
        label="Monto que apruebas"
        name="monto"
        inputMode="decimal"
        required
        autoComplete="off"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        hint={`Menos de lo que pidió. ${props.quien} lo verá con tu monto.`}
      />
      {valido ? <EfectoOtro mes={props.mes} monto={monto} pidio={pidio} /> : null}
      <div className={m.row}>
        <button className={m.boton.primario} type="submit" disabled={pending || !valido}>
          {valido ? `Aprobar ${formatMoney(monto)}` : 'Aprobar'}
        </button>
      </div>
      <Aviso state={state} />
    </form>
  );
}
