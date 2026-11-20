'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { KeyIcon } from '@/components/trastienda/icons';
import * as a from '@/styles/mostrador-acceso.css';
import * as m from '@/styles/mostrador.css';

import { DialogoLlaves, type Dialogo } from './dialogo';
import { agregar, confirmar, quitar, type Siguiente } from './flujos';

export interface LlaveFila {
  readonly id: string;
  readonly nombre: string;
  readonly sincroniza: boolean;
  readonly fechas: string;
  readonly actual: boolean;
}

type Aviso = Extract<Siguiente, { kind: 'aviso' }>;

function Banner({ aviso }: { readonly aviso: Aviso }) {
  return (
    <div role={aviso.tono === 'ok' ? 'status' : 'alert'} className={a[aviso.tono]}>
      <span className={a.bannerTitle}>{aviso.titulo}</span>
      {aviso.texto === undefined ? null : <span>{aviso.texto}</span>}
    </div>
  );
}

function Fila(props: {
  readonly llave: LlaveFila;
  readonly unica: boolean;
  readonly onQuitar: () => void;
}) {
  const { llave } = props;
  return (
    <div className={a.llave}>
      <span className={a.icono}>
        <KeyIcon />
      </span>
      <span className={a.llaveTexto}>
        <span className={m.row}>
          <span className={a.llaveNombre}>{llave.nombre}</span>
          {llave.actual ? (
            <span className={`${m.tagBase} ${m.tag.info}`}>Con esta entraste</span>
          ) : null}
        </span>
        <span className={a.llaveNota}>
          {llave.sincroniza ? 'Se sincroniza entre tus equipos' : 'Vive solo en este equipo'}
        </span>
        <span className={a.llaveNota}>{llave.fechas}</span>
      </span>
      <button
        className={m.boton.secundario}
        type="button"
        disabled={props.unica}
        aria-describedby={props.unica ? 'ultima' : undefined}
        onClick={props.onQuitar}
      >
        Quitar
      </button>
    </div>
  );
}

const UNA_SOLA: Aviso = {
  kind: 'aviso',
  tono: 'aviso',
  titulo: 'Solo tienes una llave.',
  texto:
    'Si pierdes ese equipo, tu socio tendrá que generarte un enlace para entrar de nuevo. Agrega otra en un equipo distinto.',
};

function Encabezado({ onAgregar }: { readonly onAgregar: () => void }) {
  return (
    <header className={m.head}>
      <div className={m.headText}>
        <span className={m.eyebrow}>Consola · Tu cuenta</span>
        <h1 className={m.title}>Mi acceso</h1>
      </div>
      <button className={m.boton.primario} type="button" onClick={onAgregar}>
        Agregar llave
      </button>
    </header>
  );
}

function TusLlaves(props: {
  readonly llaves: readonly LlaveFila[];
  readonly onQuitar: (l: LlaveFila) => void;
}) {
  const unica = props.llaves.length <= 1;
  return (
    <section aria-labelledby="llaves" className={m.panelPad}>
      <h2 id="llaves" className={a.panelTitle}>
        Tus llaves
      </h2>
      {props.llaves.map((l) => (
        <Fila key={l.id} llave={l} unica={unica} onQuitar={() => props.onQuitar(l)} />
      ))}
      {unica ? (
        <p id="ultima" className={a.llaveNota}>
          Es tu única llave: agrega otra antes de quitar esta.
        </p>
      ) : null}
    </section>
  );
}

/** The flows' state: which dialog is open and which banner shows. */
function useFlujos() {
  const router = useRouter();
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const seguir = (next: Siguiente) => {
    setDialogo(next.kind === 'confirmar' ? next : null);
    setAviso(next.kind === 'aviso' ? next : null);
    router.refresh();
  };
  const esperando = () => setDialogo({ kind: 'esperando' });
  return {
    dialogo,
    aviso,
    abrir: setDialogo,
    cerrar: () => setDialogo(null),
    agregar: () => void agregar(esperando).then(seguir),
    accion: (d: Dialogo) => {
      if (d.kind === 'confirmar') void confirmar(d.despues, esperando).then(seguir);
      if (d.kind === 'quitar') void quitar(d.id, d.nombre).then(seguir);
    },
  };
}

/** Board CD-20c: the header's «Agregar llave», the list, the banners and the dialogs. */
export function Llaves(props: {
  readonly llaves: readonly LlaveFila[];
  readonly children: React.ReactNode;
}) {
  const f = useFlujos();
  return (
    <>
      <Encabezado onAgregar={f.agregar} />
      {f.aviso === null ? null : <Banner aviso={f.aviso} />}
      {props.llaves.length <= 1 ? <Banner aviso={UNA_SOLA} /> : null}
      <div className={a.columns}>
        <TusLlaves
          llaves={props.llaves}
          onQuitar={(l) => f.abrir({ kind: 'quitar', id: l.id, nombre: l.nombre })}
        />
        {props.children}
      </div>
      <DialogoLlaves dialogo={f.dialogo} onAccion={f.accion} onCerrar={f.cerrar} />
    </>
  );
}
