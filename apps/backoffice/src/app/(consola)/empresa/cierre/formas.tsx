'use client';

import { formatMoney, pesosToCentavos } from '@xangarro/domain';
import { useActionState, useId, useState } from 'react';

import {
  confirmarSaldoAction,
  pedirReabrirAction,
  responderReaperturaAction,
} from '@/server/actions/empresa-cierre';
import * as k from '@/styles/mostrador-cierre.css';
import * as d from '@/styles/mostrador-data.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

import { Campo, submitWith } from '../movimientos/registrar/opciones';
import { Aviso } from '../socios/formas';
import { useEnvioConArchivo } from '../subida-directa';

/** The forms of board CD-10b's panels. */
function Comparacion(props: {
  readonly banco: bigint | null;
  readonly consola: bigint;
  readonly consolaTexto: string;
}) {
  const dif = props.banco === null ? null : props.banco - props.consola;
  return (
    <div className={k.comparacion}>
      <span>
        <span className={m.tileLabel}>Del banco</span>
        <span className={i.pasoTitulo}>
          {props.banco === null ? '—' : formatMoney(props.banco)}
        </span>
      </span>
      <span>
        <span className={m.tileLabel}>En la consola</span>
        <span className={i.pasoTitulo}>{props.consolaTexto}</span>
      </span>
      <span>
        <span className={m.tileLabel}>Diferencia</span>
        <span className={i.pasoTitulo} data-testid="saldo-diferencia">
          {dif === null ? '—' : dif === 0n ? '✓ $0.00' : formatMoney(dif)}
        </span>
      </span>
    </div>
  );
}

function NoCoincide({ dif, mes }: { readonly dif: bigint; readonly mes: string }) {
  const abs = dif < 0n ? -dif : dif;
  return (
    <div className={i.aviso} role="status">
      <span>
        <span className={i.pasoTitulo}>
          {`El banco tiene ${formatMoney(abs)} ${dif < 0n ? 'menos' : 'más'} que la consola`}
        </span>
        <span className={i.pasoSub}>
          Suele ser una comisión o un cargo que no se registró. Regístralo con su fecha y vuelve: el
          saldo se compara otra vez.
        </span>
      </span>
      <span className={m.row}>
        <a className={m.boton.secundario} href="/empresa/movimientos/registrar">
          Registrar lo que falta
        </a>
        <a className={m.boton.secundario} href={`/empresa/movimientos?mes=${mes}`}>
          Ver los movimientos del mes
        </a>
      </span>
    </div>
  );
}

function useSaldo(consolaCentavos: string) {
  const [saldo, setSaldo] = useState('');
  const consola = BigInt(consolaCentavos);
  const banco = saldo.trim() === '' ? null : pesosToCentavos(saldo.trim());
  return { saldo, setSaldo, consola, banco, coincide: banco !== null && banco === consola };
}

function EstadoDeCuenta() {
  const id = useId();
  return (
    <div className={d.field}>
      <label className={d.label} htmlFor={id}>
        Estado de cuenta (opcional) · se guarda en Expediente › Comprobantes
      </label>
      <input
        id={id}
        className={i.archivo}
        type="file"
        name="archivo"
        accept="application/pdf,image/png,image/jpeg"
      />
    </div>
  );
}

export function BancoForm(props: {
  readonly mes: string;
  readonly dia: string;
  readonly consola: string;
  readonly consolaTexto: string;
}) {
  const [state, action, pending] = useActionState(confirmarSaldoAction, null);
  const { onSubmit, subiendo } = useEnvioConArchivo(action);
  const { saldo, setSaldo, consola, banco, coincide } = useSaldo(props.consola);
  return (
    <form onSubmit={onSubmit} className={d.form}>
      <input type="hidden" name="periodo" value={props.mes} />
      <Campo
        label={`Saldo del estado de cuenta al ${props.dia}`}
        name="saldo"
        inputMode="decimal"
        required
        autoComplete="off"
        value={saldo}
        onChange={(e) => setSaldo(e.target.value)}
        hint="El saldo final que dice el banco, en pesos."
      />
      <Comparacion banco={banco} consola={consola} consolaTexto={props.consolaTexto} />
      {banco !== null && !coincide ? <NoCoincide dif={banco - consola} mes={props.mes} /> : null}
      <EstadoDeCuenta />
      <Aviso state={state} />
      <div className={m.row}>
        <button
          className={coincide ? m.boton.primario : m.boton.quieto}
          type="submit"
          disabled={!coincide || pending || subiendo}
        >
          Confirmar el saldo
        </button>
        <span className={i.pasoSub}>Se confirma solo cuando los dos saldos son iguales.</span>
      </div>
    </form>
  );
}

export function ReabrirForm({ mes, otro }: { readonly mes: string; readonly otro: string }) {
  const [state, action, pending] = useActionState(pedirReabrirAction, null);
  const id = useId();
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <input type="hidden" name="periodo" value={mes} />
      <div className={d.field}>
        <label className={d.label} htmlFor={id}>
          ¿Qué hay que corregir?
        </label>
        <textarea id={id} className={d.input} name="motivo" rows={4} required />
        <span
          className={d.hint}
        >{`Lo lee ${otro} para aprobarlo, y queda en el historial del mes.`}</span>
      </div>
      <div className={i.papel}>
        <span className={i.pasoTitulo}>Qué pasa después</span>
        <span
          className={i.pasoSub}
        >{`1. Le avisamos a ${otro} por correo. Mientras, sigue cerrado.`}</span>
        <span className={i.pasoSub}>
          2. Al aprobarlo, el mes se abre y los pasos se revisan otra vez.
        </span>
        <span className={i.pasoSub}>
          3. Con la corrección hecha, cualquiera de los dos lo vuelve a cerrar.
        </span>
      </div>
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.primario} type="submit" disabled={pending}>
          {`Pedir a ${otro}`}
        </button>
      </div>
    </form>
  );
}

export function AprobarForm({ mes }: { readonly mes: string }) {
  const [state, action, pending] = useActionState(responderReaperturaAction, null);
  return (
    <form onSubmit={submitWith(action)} className={m.row}>
      <input type="hidden" name="periodo" value={mes} />
      <input type="hidden" name="respuesta" value="aprobar" />
      <button className={m.boton.primario} type="submit" disabled={pending}>
        Aprobar y reabrir
      </button>
      <Aviso state={state} />
    </form>
  );
}
