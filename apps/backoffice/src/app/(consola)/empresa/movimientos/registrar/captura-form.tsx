'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';

import { registrarMovimiento } from '@/server/actions/empresa';
import * as d from '@/styles/mostrador-data.css';
import * as mv from '@/styles/mostrador-movimientos.css';
import * as m from '@/styles/mostrador.css';

import { AdjuntarXml } from './adjuntar-xml';
import { DeSocios } from './de-socios';
import { DelGasto, Montos, type Prefill } from './del-gasto';
import { Campo, Opciones, submitWith, type Opcion } from './opciones';

/**
 * Registrar (E-02, board CD-03): a paid expense or a bank fee, in MXN or USD,
 * and partner money (E-03). A recurring charge arrives prefilled from its
 * template; only the real amount and, for USD, the day's rate are left.
 */
const TIPOS: readonly Opcion[] = [
  { value: 'gasto', title: 'Gasto', text: 'Un pago a un proveedor o servicio.' },
  { value: 'comision', title: 'Comisión bancaria', text: 'Lo que el banco te cobró.' },
  { value: 'socios', title: 'Dinero de socios', text: 'Capital, aportaciones y préstamos.' },
];

const BOTON: Record<string, string> = {
  gasto: 'Registrar gasto',
  comision: 'Registrar comisión',
  socios: 'Registrar dinero de socio',
};

function Detalle(props: {
  readonly tipo: string;
  readonly fecha: string;
  readonly prefill: Prefill | null;
  readonly proyectos: readonly Opcion[];
  readonly socios: readonly Opcion[];
}) {
  if (props.tipo === 'gasto') {
    return <DelGasto proyectos={props.proyectos} fecha={props.fecha} prefill={props.prefill} />;
  }
  if (props.tipo === 'comision') return <Montos moneda="MXN" />;
  return (
    <>
      <DeSocios socios={props.socios} />
      <Montos moneda="MXN" label="Monto" />
    </>
  );
}

function Acciones(props: {
  readonly tipo: string;
  readonly inicial: string;
  readonly pending: boolean;
}) {
  const { tipo, inicial, pending } = props;
  return (
    <div className={m.row}>
      <Link
        className={m.boton.quieto}
        href={inicial === 'socios' ? '/empresa/socios' : '/empresa/movimientos'}
      >
        Cancelar
      </Link>
      <button className={m.boton.primario} type="submit" disabled={pending}>
        {BOTON[tipo] ?? 'Registrar'}
      </button>
    </div>
  );
}

/** The suggestion being registered: which template, which month. */
function DeLaPlantilla({ prefill }: { readonly prefill: Prefill }) {
  return (
    <>
      <input type="hidden" name="plantilla" value={prefill.plantillaId} />
      <input type="hidden" name="mesPlantilla" value={prefill.mes} />
      <p className={mv.aviso}>
        Registra el cargo de {prefill.concepto} de {prefill.nombreMes}. Revisa el monto contra tu
        estado de cuenta.
      </p>
    </>
  );
}

/** What is being registered: the type cards, or the suggestion's note. */
function QueSeRegistra(props: {
  readonly prefill: Prefill | null;
  readonly tipo: string;
  readonly onTipo: (tipo: string) => void;
}) {
  if (props.prefill !== null) {
    return (
      <>
        <input type="hidden" name="tipo" value="gasto" />
        <DeLaPlantilla prefill={props.prefill} />
      </>
    );
  }
  return (
    <Opciones
      legend="¿Qué vas a registrar?"
      name="tipo"
      opciones={TIPOS}
      value={props.tipo}
      onChange={props.onTipo}
    />
  );
}

function ConceptoYFecha(props: {
  readonly concepto: string | undefined;
  readonly fecha: string;
  readonly onFecha: (fecha: string) => void;
}) {
  return (
    <div className={d.fields}>
      <Campo
        label="Concepto"
        name="concepto"
        required
        autoComplete="off"
        defaultValue={props.concepto}
      />
      <Campo
        label="Fecha de pago"
        name="fecha"
        type="date"
        required
        value={props.fecha}
        onChange={(e) => props.onFecha(e.target.value)}
      />
    </div>
  );
}

export function CapturaForm(props: {
  readonly nonce: string;
  readonly hoy: string;
  readonly tipo: string;
  readonly prefill: Prefill | null;
  readonly proyectos: readonly Opcion[];
  readonly socios: readonly Opcion[];
}) {
  const [state, action, pending] = useActionState(registrarMovimiento, null);
  const { prefill } = props;
  const [tipo, setTipo] = useState(prefill === null ? props.tipo : 'gasto');
  const [fecha, setFecha] = useState(prefill?.fecha ?? props.hoy);
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <input type="hidden" name="nonce" value={props.nonce} />
      <QueSeRegistra prefill={prefill} tipo={tipo} onTipo={setTipo} />
      {tipo === 'gasto' && prefill === null ? <AdjuntarXml /> : null}
      <ConceptoYFecha concepto={prefill?.concepto} fecha={fecha} onFecha={setFecha} />
      <Detalle
        tipo={tipo}
        fecha={fecha}
        prefill={prefill}
        proyectos={props.proyectos}
        socios={props.socios}
      />
      {state !== null && !state.ok ? (
        <p className={d.messageBad} role="alert">
          {state.message}
        </p>
      ) : null}
      <Acciones tipo={tipo} inicial={props.tipo} pending={pending} />
    </form>
  );
}
