'use client';

import { COBROS_SERVICIO, type CobroServicio } from '@xangarro/domain/corp';
import { useActionState, useState } from 'react';

import { guardarServicioAction } from '@/server/actions/empresa-servicios';
import type { ValoresServicio } from '@/server/empresa/servicio-valores';
import * as d from '@/styles/mostrador-data.css';

import { CATEGORIAS } from '../movimientos/registrar/del-gasto';
import { Campo, Opciones, submitWith } from '../movimientos/registrar/opciones';
import { Aviso } from '../socios/formas';
import { CamposDelCobro, COBROS } from './campos';
import { PagaCon, Pie, PorContratar, Recurrente } from './form-partes';

/**
 * «Nuevo servicio» and «Editar» (E-24, board CD-18d): what it is, its
 * category, how it charges and the fields that way asks for, what pays it,
 * and whether it suggests its charge in Movimientos.
 */
const CON_PLANTILLA = new Set<CobroServicio>(['fijo', 'uso', 'anual']);

const esCobro = (v: string): v is CobroServicio => COBROS_SERVICIO.some((c) => c === v);

function Nombre({ v }: { readonly v: ValoresServicio }) {
  return (
    <div className={d.fields}>
      <Campo label="Nombre" name="nombre" required defaultValue={v.nombre} autoComplete="off" />
      <Campo
        label="Para qué lo usamos (opcional)"
        name="para"
        defaultValue={v.para}
        autoComplete="off"
      />
    </div>
  );
}

/** Its category and how it charges: five cards or fewer each (CLAUDE.md §6). */
function Clase(props: {
  readonly categoria: string;
  readonly cobro: CobroServicio;
  readonly onCobro: (c: CobroServicio) => void;
}) {
  return (
    <>
      <Opciones
        legend="Categoría del gasto"
        name="categoria"
        opciones={CATEGORIAS}
        value={props.categoria}
      />
      <Opciones
        legend="Cómo cobra"
        name="cobro"
        opciones={COBROS}
        value={props.cobro}
        onChange={(c) => esCobro(c) && props.onCobro(c)}
      />
    </>
  );
}

export function ServicioForm(props: {
  readonly v: ValoresServicio;
  readonly recurrente: boolean;
  readonly plantillaNuevaId: string;
  readonly mediosConocidos: readonly string[];
  readonly cerrar: string;
}) {
  const [state, action, pending] = useActionState(guardarServicioAction, null);
  const [cobro, setCobro] = useState<CobroServicio>(props.v.cobro);
  const [porContratar, setPorContratar] = useState(props.v.porContratar);
  const lleva = CON_PLANTILLA.has(cobro) && !porContratar;
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <input type="hidden" name="id" value={props.v.id} />
      <input type="hidden" name="plantillaNuevaId" value={props.plantillaNuevaId} />
      <Nombre v={props.v} />
      <Clase categoria={props.v.categoria} cobro={cobro} onCobro={setCobro} />
      <CamposDelCobro key={cobro} cobro={cobro} v={props.v} />
      {cobro === 'gratis' || cobro === 'comision' ? null : (
        <PagaCon valor={props.v.pagaCon} conocidos={props.mediosConocidos} />
      )}
      <PorContratar marcada={porContratar} onChange={setPorContratar} />
      <Recurrente
        key={`${cobro}-${String(lleva)}`}
        cobro={cobro}
        lleva={lleva}
        porContratar={porContratar}
        marcada={props.recurrente}
      />
      <Aviso state={state} />
      <Pie cobro={cobro} cerrar={props.cerrar} pending={pending} />
    </form>
  );
}
