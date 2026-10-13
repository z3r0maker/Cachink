'use client';

import { useActionState, useState } from 'react';

import {
  actualizarRegistroAction,
  agregarCertificadoAction,
  guardarAdministradorAction,
  registrarEventoAction,
} from '@/server/actions/empresa-corporativo';
import type { FormState } from '@/server/actions/form-state';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

import { Campo, Opciones, submitWith } from '../movimientos/registrar/opciones';
import { Aviso } from '../socios/formas';

/** The corporate book's forms (E-06). Certificates take a serial and a date, never a file. */
const SOCIOS = [
  { value: '1', title: 'Fundador 1' },
  { value: '2', title: 'Fundador 2' },
];

const CERTIFICADOS = [
  { value: 'csd', title: 'CSD', text: 'Para facturar.' },
  { value: 'efirma', title: 'e.firma', text: 'Para firmar y tramitar.' },
];

const EVENTOS = [
  { value: 'suscripcion', title: 'Suscripción', text: 'Acciones nuevas: constitución o aumento.' },
  { value: 'transmision', title: 'Transmisión', text: 'Acciones que pasan de un socio al otro.' },
];

const AL_DIA = [
  { value: 'si', title: 'Sí', text: 'Nada pendiente.' },
  { value: 'no', title: 'No', text: 'Falta un paso.' },
];

const ACCEPT = 'application/pdf,image/png,image/jpeg,application/xml,text/xml,.xml';

function Enviar(props: {
  readonly state: FormState;
  readonly pending: boolean;
  readonly label: string;
  readonly primario?: boolean;
}) {
  return (
    <>
      <Aviso state={props.state} />
      <div className={m.row}>
        <button
          className={props.primario === true ? m.boton.primario : m.boton.secundario}
          type="submit"
          disabled={props.pending}
        >
          {props.label}
        </button>
      </div>
    </>
  );
}

export function CertificadoForm() {
  const [state, action, pending] = useActionState(agregarCertificadoAction, null);
  const [tipo, setTipo] = useState('csd');
  const titulares = [
    { value: 'mexia', title: 'MEXIA' },
    ...(tipo === 'csd' ? [] : SOCIOS.map((s) => ({ value: `f${s.value}`, title: s.title }))),
  ];
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <Opciones
        legend="Certificado"
        name="tipo"
        value={tipo}
        onChange={setTipo}
        opciones={CERTIFICADOS}
      />
      <Opciones key={tipo} legend="¿De quién?" name="titular" opciones={titulares} value="mexia" />
      <div className={d.fields}>
        <Campo label="Número de serie" name="serie" required autoComplete="off" />
        <Campo label="Vence" name="vence" type="date" required />
      </div>
      <Enviar state={state} pending={pending} label="Guardar vigencia" />
    </form>
  );
}

export function EventoForm({ hoy }: { readonly hoy: string }) {
  const [state, action, pending] = useActionState(registrarEventoAction, null);
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <Opciones legend="¿Qué pasó?" name="tipo" value="suscripcion" opciones={EVENTOS} />
      <Opciones legend="¿Quién las recibe?" name="a" opciones={SOCIOS} value="" />
      <div className={d.fields}>
        <Campo label="Acciones" name="acciones" inputMode="numeric" required />
        <Campo label="Fecha del acta" name="fecha" type="date" required defaultValue={hoy} />
      </div>
      <Campo
        label="Nota"
        name="nota"
        autoComplete="off"
        hint="Por ejemplo, el acta o el corte que lo originó."
      />
      <Enviar state={state} pending={pending} label="Registrar acciones" primario />
    </form>
  );
}

export function AdministradorForm({ actual }: { readonly actual: string }) {
  const [state, action, pending] = useActionState(guardarAdministradorAction, null);
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <Opciones legend="Administrador" name="administrador" opciones={SOCIOS} value={actual} />
      <Enviar state={state} pending={pending} label="Guardar administrador" />
    </form>
  );
}

function ArchivoOpcional() {
  return (
    <label className={d.field}>
      <span className={d.label}>Documento</span>
      <input className={d.input} type="file" name="archivo" accept={ACCEPT} />
      <span className={d.hint}>Opcional. Si ya hay uno, este queda como su nueva versión.</span>
    </label>
  );
}

interface RegistroProps {
  readonly id: string;
  readonly estado: string;
  readonly referencia: string;
  readonly siguiente: string;
  readonly alDia: boolean;
}

function CamposRegistro(props: RegistroProps) {
  return (
    <>
      <div className={d.fields}>
        <Campo
          label="Estado"
          name="estado"
          required
          defaultValue={props.estado}
          autoComplete="off"
        />
        <Campo
          label="Número de trámite o registro"
          name="referencia"
          defaultValue={props.referencia}
          autoComplete="off"
        />
      </div>
      <Campo
        label="Siguiente paso"
        name="siguiente"
        defaultValue={props.siguiente}
        autoComplete="off"
      />
      <Opciones
        legend="¿Está al día?"
        name="alDia"
        value={props.alDia ? 'si' : 'no'}
        opciones={AL_DIA}
      />
    </>
  );
}

export function RegistroForm(props: RegistroProps) {
  const [state, action, pending] = useActionState(actualizarRegistroAction, null);
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <input type="hidden" name="id" value={props.id} />
      <CamposRegistro {...props} />
      <ArchivoOpcional />
      <Enviar state={state} pending={pending} label="Guardar" primario />
    </form>
  );
}
