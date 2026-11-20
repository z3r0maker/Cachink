'use client';

import { useActionState, useState } from 'react';

import {
  cotizacionAction,
  crearTarjetaAction,
  proponerValorAction,
  quitarDelPlanAction,
} from '@/server/actions/empresa-tablero';
import * as d from '@/styles/mostrador-data.css';
import * as t from '@/styles/mostrador-tablero.css';
import * as m from '@/styles/mostrador.css';

import { Campo, Opciones, submitWith } from '../movimientos/registrar/opciones';
import { Aviso } from '../socios/formas';
import { useEnvioConArchivo } from '../subida-directa';

/** Board CD-13c's card forms: a new card, a partner's value, the quote, leaving the plan. */
export interface Ids {
  readonly t: string;
  readonly tarjeta: string;
  readonly titulo: string;
}

export function Ocultos({ ids }: { readonly ids: Ids }) {
  return (
    <>
      <input type="hidden" name="t" value={ids.t} />
      <input type="hidden" name="tarjeta" value={ids.tarjeta} />
      <input type="hidden" name="titulo" value={ids.titulo} />
    </>
  );
}

const TIPOS = [
  {
    value: 'entregable',
    title: 'Entregable con valor',
    text: 'Trabajo terminado que cuenta para la bolsa',
  },
  { value: 'tarea', title: 'Tarea', text: 'Trabajo operativo, sin valor' },
];

function Criterio({ requerido }: { readonly requerido: boolean }) {
  return (
    <div className={d.field}>
      <label className={d.label} htmlFor="criterio">
        Criterio de terminado
      </label>
      <textarea
        id="criterio"
        className={t.area}
        name="criterio"
        required={requerido}
        aria-describedby="criterio-hint"
      />
      <span id="criterio-hint" className={d.hint}>
        Escríbelo para que un tercero pueda decir sí o no sin preguntarte. Un resultado, como «90
        negocios pagando», va como objetivo, no como entregable.
      </span>
    </div>
  );
}

type Nueva = {
  readonly trimestre: string;
  readonly desde: string;
  readonly hasta: string;
  readonly nombres: Readonly<Record<1 | 2, string>>;
  readonly yo: 1 | 2;
  readonly objetivos: readonly { readonly id: string; readonly titulo: string }[];
};

function ValorYFecha({ p, entregable }: { readonly p: Nueva; readonly entregable: boolean }) {
  return (
    <div className={d.fields}>
      {entregable ? (
        <Campo
          label="Tu propuesta de valor"
          name="valor"
          inputMode="decimal"
          required
          hint="El otro socio pone el suyo y se usa el promedio. Si difieren más del doble, se pide la cotización de un tercero."
        />
      ) : null}
      <Campo label="Fecha" name="vence" type="date" required min={p.desde} max={p.hasta} />
    </div>
  );
}

export function NuevaTarjetaForm(p: Nueva) {
  const [state, action, pending] = useActionState(crearTarjetaAction, null);
  const [tipo, setTipo] = useState('entregable');
  const objetivos = [
    { value: '', title: 'Ninguno' },
    ...p.objetivos.map((o) => ({ value: o.id, title: o.titulo })),
  ];
  return (
    <form onSubmit={submitWith(action)} className={d.form} data-testid="nueva-tarjeta">
      <input type="hidden" name="t" value={p.trimestre} />
      <Opciones legend="Tipo" name="tipo" value={tipo} onChange={setTipo} opciones={TIPOS} />
      <Campo label="Título" name="titulo" required autoComplete="off" />
      <Opciones
        legend="Responsable"
        name="responsable"
        value={String(p.yo)}
        opciones={[
          { value: '1', title: p.nombres[1] },
          { value: '2', title: p.nombres[2] },
        ]}
      />
      <Criterio requerido={tipo === 'entregable'} />
      <ValorYFecha p={p} entregable={tipo === 'entregable'} />
      {p.objetivos.length === 0 ? null : (
        <Opciones legend="Objetivo" name="objetivo" value="" opciones={objetivos} />
      )}
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.primario} type="submit" disabled={pending}>
          Agregar la tarjeta
        </button>
      </div>
    </form>
  );
}

export function ValorForm({ ids }: { readonly ids: Ids }) {
  const [state, action, pending] = useActionState(proponerValorAction, null);
  return (
    <form onSubmit={submitWith(action)} className={d.form} data-testid="valor-form">
      <Ocultos ids={ids} />
      <Campo label="Tu propuesta de valor" name="valor" inputMode="decimal" required />
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.secundario} type="submit" disabled={pending}>
          Guardar mi valor
        </button>
      </div>
    </form>
  );
}

export function CotizacionForm({ ids }: { readonly ids: Ids }) {
  const [state, action, pending] = useActionState(cotizacionAction, null);
  const { onSubmit, subiendo } = useEnvioConArchivo(action);
  return (
    <form onSubmit={onSubmit} className={d.form} data-testid="cotizacion-form">
      <Ocultos ids={ids} />
      <span className={d.hint}>
        Su monto será el valor, para los dos. Se guarda en el Expediente con la tarjeta.
      </span>
      <div className={d.fields}>
        <Campo label="Cotización" name="archivo" type="file" required />
        <Campo label="Monto, sin IVA" name="monto" inputMode="decimal" required />
      </div>
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.primario} type="submit" disabled={pending || subiendo}>
          Usar la cotización
        </button>
      </div>
    </form>
  );
}

export function QuitarForm({ ids }: { readonly ids: Ids }) {
  const [state, action, pending] = useActionState(quitarDelPlanAction, null);
  return (
    <form onSubmit={submitWith(action)} className={m.stack}>
      <Ocultos ids={ids} />
      <Aviso state={state} />
      <div className={m.row}>
        <button className={m.boton.peligro} type="submit" disabled={pending}>
          Quitar del plan
        </button>
      </div>
    </form>
  );
}
