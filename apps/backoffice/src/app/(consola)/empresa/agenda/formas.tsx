'use client';

import { useActionState, useState } from 'react';

import {
  agregarVencimientoAction,
  guardarInscripcionAction,
} from '@/server/actions/empresa-agenda';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

import { Campo, Opciones, submitWith } from '../movimientos/registrar/opciones';
import { Aviso } from '../socios/formas';

/** The Agenda's two small forms (E-04): the SAT registration, a dated one-off. */
export function InscripcionForm({ hoy }: { readonly hoy: string }) {
  const [state, action, pending] = useActionState(guardarInscripcionAction, null);
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <Campo
        label="Fecha de inscripción al RFC"
        name="fecha"
        type="date"
        required
        max={hoy}
        hint="La que dice la constancia de situación fiscal."
      />
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.primario} type="submit" disabled={pending}>
          Calcular la agenda
        </button>
      </div>
    </form>
  );
}

const TIPOS = [
  { value: 'csd', title: 'CSD', text: 'Su fecha de vencimiento.' },
  { value: 'efirma', title: 'e.firma', text: 'Su fecha de vencimiento.' },
  {
    value: 'beneficiario_controlador',
    title: 'Cambio de acciones',
    text: 'Avisar al SAT en 15 días hábiles.',
  },
  { value: 'tramite', title: 'Otro trámite', text: 'Con su propia fecha.' },
];

export function AgregarFechaForm() {
  const [state, action, pending] = useActionState(agregarVencimientoAction, null);
  const [tipo, setTipo] = useState('csd');
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <Opciones
        legend="¿Qué fecha?"
        name="plantilla"
        opciones={TIPOS}
        value={tipo}
        onChange={setTipo}
      />
      {tipo === 'tramite' ? (
        <Campo label="Trámite" name="titulo" required autoComplete="off" />
      ) : null}
      <Campo
        label={tipo === 'beneficiario_controlador' ? 'Fecha del cambio' : 'Fecha'}
        name="fecha"
        type="date"
        required
      />
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.secundario} type="submit" disabled={pending}>
          Agregar a la agenda
        </button>
      </div>
    </form>
  );
}
