'use client';

import { useEffect, useId, useRef } from 'react';

import * as m from '@/styles/mostrador.css';
import { dialog, dialogActions } from '@/styles/dialog.css';
import { body, heading } from '@/styles/ui.css';

import type { Despues } from './flujos';

/** The three dialogs of board CD-20c: the re-ask, waiting for the new key, removing one. */
export type Dialogo =
  | { readonly kind: 'confirmar'; readonly despues: Despues }
  | { readonly kind: 'esperando' }
  | { readonly kind: 'quitar'; readonly id: string; readonly nombre: string };

const COPY = {
  confirmar: (d: Extract<Dialogo, { kind: 'confirmar' }>) => ({
    titulo: 'Confirma que eres tú',
    texto: `Antes de ${d.despues === 'agregar' ? 'agregar' : 'quitar'} una llave, toca la que ya tienes. Durante 5 minutos no te lo volvemos a pedir.`,
    accion: 'Confirmar con mi llave',
  }),
  esperando: () => ({
    titulo: 'Esperando la llave nueva…',
    texto:
      'Tu navegador abre su ventana para guardar la llave nueva. Confirma con Face ID, Touch ID o el PIN del equipo. Si la llave es para otro equipo, elige «Usar un teléfono» o una llave de seguridad.',
    accion: null,
  }),
  quitar: (d: Extract<Dialogo, { kind: 'quitar' }>) => ({
    titulo: `¿Quitar «${d.nombre}»?`,
    texto:
      'Esa llave ya no abrirá la consola, y las sesiones abiertas con ella se cierran. Si pasaron más de 5 minutos desde tu último toque, te pedimos tu llave para confirmar.',
    accion: 'Quitar llave',
  }),
} as const;

function copyOf(d: Dialogo) {
  if (d.kind === 'confirmar') return COPY.confirmar(d);
  if (d.kind === 'quitar') return COPY.quitar(d);
  return COPY.esperando();
}

function Contenido(props: {
  readonly dialogo: Dialogo;
  readonly titleId: string;
  readonly onAccion: (d: Dialogo) => void;
  readonly onCerrar: () => void;
}) {
  const d = props.dialogo;
  const copy = copyOf(d);
  return (
    <>
      <h2 id={props.titleId} className={heading}>
        {copy.titulo}
      </h2>
      <p className={body}>{copy.texto}</p>
      <div className={dialogActions}>
        <button className={m.boton.secundario} type="button" onClick={props.onCerrar}>
          Cancelar
        </button>
        {copy.accion === null ? null : (
          <button
            className={d.kind === 'quitar' ? m.boton.peligro : m.boton.primario}
            type="button"
            onClick={() => props.onAccion(d)}
          >
            {copy.accion}
          </button>
        )}
      </div>
    </>
  );
}

export function DialogoLlaves(props: {
  readonly dialogo: Dialogo | null;
  readonly onAccion: (d: Dialogo) => void;
  readonly onCerrar: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    if (props.dialogo !== null && el?.open === false) el.showModal();
    if (props.dialogo === null && el?.open === true) el.close();
  }, [props.dialogo]);

  return (
    <dialog ref={ref} className={dialog} aria-labelledby={titleId} onClose={props.onCerrar}>
      {props.dialogo === null ? null : (
        <Contenido
          dialogo={props.dialogo}
          titleId={titleId}
          onAccion={props.onAccion}
          onCerrar={props.onCerrar}
        />
      )}
    </dialog>
  );
}
