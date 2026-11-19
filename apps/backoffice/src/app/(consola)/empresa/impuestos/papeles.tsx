'use client';

import { useActionState, useId } from 'react';

import { pagarDeclaracionAction, subirPapelAction } from '@/server/actions/empresa-impuestos';
import type { Pago, Papel } from '@/server/empresa/impuestos-papeles';
import * as d from '@/styles/mostrador-data.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

import { submitWith } from '../movimientos/registrar/opciones';
import { Aviso } from '../socios/formas';
import { useEnvioConArchivo } from '../subida-directa';

/**
 * The month's papers and «Marcar como pagado» (E-13, board CD-09). Each
 * paper uploads on its own, through the same inbox as the Agenda's evidence
 * (E-26); the button stays disabled, with its reason, until it may be used.
 */
function Subir({ mes, papel }: { readonly mes: string; readonly papel: Papel }) {
  const [state, action, pending] = useActionState(subirPapelAction, null);
  const { onSubmit, subiendo } = useEnvioConArchivo(action);
  const id = useId();
  return (
    <form onSubmit={onSubmit} className={m.row}>
      <input type="hidden" name="periodo" value={mes} />
      <input type="hidden" name="tipo" value={papel.tipo} />
      <label className={d.label} htmlFor={id}>
        {papel.documentoId === null ? 'Archivo' : 'Otra versión'}
      </label>
      <input
        id={id}
        className={i.archivo}
        type="file"
        name="archivo"
        required
        accept="application/pdf,image/png,image/jpeg,application/xml,text/xml,.xml"
      />
      <button className={m.boton.quieto} type="submit" disabled={pending || subiendo}>
        Subir
      </button>
      <Aviso state={state} />
    </form>
  );
}

function UnPapel({ mes, papel }: { readonly mes: string; readonly papel: Papel }) {
  const listo = papel.documentoId !== null;
  return (
    <div className={i.papel} data-testid="papel" data-listo={listo ? 'si' : 'no'}>
      <div className={i.papelCabeza}>
        <span className={`${i.circuloBase} ${i.circulo[listo ? 'hecho' : 'pendiente']}`}>
          {listo ? '✓' : ''}
        </span>
        <span>
          <span className={i.pasoTitulo}>{papel.nombre}</span>
          <span className={i.pasoSub}>{papel.detalle}</span>
          {papel.aviso === null ? null : <span className={d.messageBad}>{papel.aviso}</span>}
        </span>
        {papel.documentoId === null ? null : (
          <a className={m.boton.quieto} href={`/empresa/documentos/${papel.documentoId}`}>
            Ver
          </a>
        )}
      </div>
      {papel.puedeSubir ? <Subir mes={mes} papel={papel} /> : null}
    </div>
  );
}

function Pagar({ mes, pago }: { readonly mes: string; readonly pago: Pago }) {
  const [state, action, pending] = useActionState(pagarDeclaracionAction, null);
  return (
    <form onSubmit={submitWith(action)} className={m.row}>
      <input type="hidden" name="periodo" value={mes} />
      {pago.pagado ? (
        <a className={m.boton.quieto} href={`/empresa/movimientos?mes=${mes}&ver=impuestos`}>
          Ver el pago en Movimientos
        </a>
      ) : pago.cerrado ? null : (
        <button className={m.boton.primario} type="submit" disabled={pending || !pago.puede}>
          Marcar como pagado
        </button>
      )}
      <span className={i.muted}>{pago.texto}</span>
      <Aviso state={state} />
    </form>
  );
}

export function Papeles(props: {
  readonly mes: string;
  readonly papeles: readonly Papel[];
  readonly pago: Pago;
  readonly agenda: { readonly href: string; readonly texto: string };
}) {
  return (
    <div className={m.stack}>
      <div className={i.cabeza}>
        <h3 className={i.pasoTitulo}>Papeles de la declaración</h3>
        <a className={m.boton.quieto} href={props.agenda.href}>
          {props.agenda.texto}
        </a>
      </div>
      <div className={i.papeles}>
        {props.papeles.map((p) => (
          <UnPapel key={p.tipo} mes={props.mes} papel={p} />
        ))}
      </div>
      <Pagar mes={props.mes} pago={props.pago} />
    </div>
  );
}
