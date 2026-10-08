'use client';

import { formatMoney, pesosToCentavos } from '@xangarro/domain';
import { convertirAMxn } from '@xangarro/domain/corp';
import Link from 'next/link';
import { useActionState, useState } from 'react';

import { registrarMovimiento } from '@/server/actions/empresa';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

import { DeSocios } from './de-socios';
import { Campo, Opciones, submitWith, type Opcion } from './opciones';

/**
 * Registrar (E-02, board CD-03): a paid expense or a bank fee, in MXN or USD,
 * and partner money (E-03).
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

const CATEGORIAS: readonly Opcion[] = [
  { value: 'costo_servicio', title: 'Costo del servicio', text: 'Nube, base de datos, correo.' },
  { value: 'ventas_marketing', title: 'Ventas y marketing', text: 'Anuncios y campañas.' },
  { value: 'desarrollo', title: 'Desarrollo', text: 'Herramientas para construir.' },
  { value: 'administracion', title: 'Administración', text: 'Contador, trámites, oficina.' },
];

const MONEDAS: readonly Opcion[] = [
  { value: 'MXN', title: 'Pesos (MXN)' },
  { value: 'USD', title: 'Dólares (USD)' },
];

const DEDUCIBLE: readonly Opcion[] = [
  { value: 'si', title: 'Sí', text: 'Hay factura a nombre de MEXIA.' },
  { value: 'no', title: 'No', text: 'Sin factura, o no es de la empresa.' },
];

/** «Equivale a $368.40 MXN» while the founder types; nothing until both parse. */
function equivalencia(monto: string, tipoCambio: string): string | undefined {
  const usd = pesosToCentavos(monto);
  if (usd === null || usd === 0n) return undefined;
  try {
    return `Equivale a ${formatMoney(convertirAMxn(usd, tipoCambio))} MXN.`;
  } catch {
    return undefined;
  }
}

function Montos({ moneda, label }: { readonly moneda: string; readonly label?: string }) {
  const [monto, setMonto] = useState('');
  const [tc, setTc] = useState('');
  const usd = moneda === 'USD';
  return (
    <div className={d.fields}>
      <Campo
        label={usd ? 'Monto pagado (USD)' : (label ?? 'Monto pagado')}
        name="monto"
        inputMode="decimal"
        required
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
      />
      {usd ? (
        <Campo
          label="Tipo de cambio del día"
          name="tipoCambio"
          inputMode="decimal"
          required
          value={tc}
          onChange={(e) => setTc(e.target.value)}
          hint={equivalencia(monto, tc) ?? 'Pesos por dólar en la fecha de pago.'}
        />
      ) : null}
    </div>
  );
}

function DelGasto({ proyectos }: { readonly proyectos: readonly Opcion[] }) {
  const [moneda, setMoneda] = useState('MXN');
  return (
    <>
      <Campo label="Proveedor" name="contraparte" autoComplete="off" />
      <Opciones
        legend="Moneda"
        name="moneda"
        opciones={MONEDAS}
        value={moneda}
        onChange={setMoneda}
      />
      <Montos moneda={moneda} />
      <Campo
        label="IVA incluido"
        name="iva"
        inputMode="decimal"
        hint="Déjalo vacío si el recibo no trae IVA."
      />
      <Opciones legend="Categoría" name="categoria" opciones={CATEGORIAS} value="" />
      <Opciones
        legend="Proyecto"
        name="proyecto"
        opciones={proyectos}
        value={proyectos[0]?.value ?? ''}
      />
      <Opciones legend="¿Deducible?" name="deducible" opciones={DEDUCIBLE} value="si" />
    </>
  );
}

function Detalle(props: {
  readonly tipo: string;
  readonly proyectos: readonly Opcion[];
  readonly socios: readonly Opcion[];
}) {
  if (props.tipo === 'gasto') return <DelGasto proyectos={props.proyectos} />;
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

export function CapturaForm(props: {
  readonly nonce: string;
  readonly hoy: string;
  readonly tipo: string;
  readonly proyectos: readonly Opcion[];
  readonly socios: readonly Opcion[];
}) {
  const [state, action, pending] = useActionState(registrarMovimiento, null);
  const [tipo, setTipo] = useState(props.tipo);
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <input type="hidden" name="nonce" value={props.nonce} />
      <Opciones
        legend="¿Qué vas a registrar?"
        name="tipo"
        opciones={TIPOS}
        value={tipo}
        onChange={setTipo}
      />
      <div className={d.fields}>
        <Campo label="Concepto" name="concepto" required autoComplete="off" />
        <Campo label="Fecha de pago" name="fecha" type="date" required defaultValue={props.hoy} />
      </div>
      <Detalle tipo={tipo} proyectos={props.proyectos} socios={props.socios} />
      {state !== null && !state.ok ? (
        <p className={d.messageBad} role="alert">
          {state.message}
        </p>
      ) : null}
      <Acciones tipo={tipo} inicial={props.tipo} pending={pending} />
    </form>
  );
}
