'use client';

import { formatMoney, pesosToCentavos } from '@xangarro/domain';
import { convertirAMxn } from '@xangarro/domain/corp';
import { useState } from 'react';

import type { Prefill } from '@/server/empresa/prefill';
import * as d from '@/styles/mostrador-data.css';
import * as mv from '@/styles/mostrador-movimientos.css';

import { Campo, Opciones, type Opcion } from './opciones';

/**
 * Registrar's expense fields (E-02, board CD-03): supplier, currency, amount
 * with the live peso equivalent, IVA, category, project, deductibility and
 * «Hacer recurrente cada mes». A suggested charge arrives prefilled.
 */
export type { Prefill };

export const CATEGORIAS: readonly Opcion[] = [
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

export function Montos(props: {
  readonly moneda: string;
  readonly label?: string;
  readonly inicial?: string;
}) {
  const [monto, setMonto] = useState(props.inicial ?? '');
  const [tc, setTc] = useState('');
  const usd = props.moneda === 'USD';
  return (
    <div className={d.fields}>
      <Campo
        label={usd ? 'Monto pagado (USD)' : (props.label ?? 'Monto pagado')}
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

/** «Te recordamos registrarlo cada 28»: the day comes from the payment date. */
function HacerRecurrente({ fecha }: { readonly fecha: string }) {
  const dia = Number(fecha.slice(8, 10));
  return (
    <label className={mv.casilla}>
      <input className={mv.casillaInput} type="checkbox" name="recurrente" value="si" />
      <span className={mv.casillaText}>
        <span className={mv.casillaTitle}>Hacer recurrente cada mes</span>
        <span className={d.hint}>
          {dia >= 1 && dia <= 31
            ? `Te recordamos registrarlo cada ${dia}.`
            : 'Te recordamos registrarlo cada mes.'}
        </span>
      </span>
    </label>
  );
}

/** A blank expense, or the suggested charge's fields. */
function inicialesDe(p: Prefill | null, proyectos: readonly Opcion[]) {
  if (p !== null) return p;
  return {
    contraparte: '',
    moneda: 'MXN',
    monto: '',
    categoria: '',
    proyecto: proyectos[0]?.value ?? '',
    deducible: 'si',
  };
}

export function DelGasto(props: {
  readonly proyectos: readonly Opcion[];
  readonly fecha: string;
  readonly prefill: Prefill | null;
}) {
  const v = inicialesDe(props.prefill, props.proyectos);
  const [moneda, setMoneda] = useState<string>(v.moneda);
  return (
    <>
      <Campo label="Proveedor" name="contraparte" autoComplete="off" defaultValue={v.contraparte} />
      <Opciones
        legend="Moneda"
        name="moneda"
        opciones={MONEDAS}
        value={moneda}
        onChange={setMoneda}
      />
      <Montos moneda={moneda} inicial={v.monto} />
      <Campo
        label="IVA incluido"
        name="iva"
        inputMode="decimal"
        hint="Déjalo vacío si el recibo no trae IVA."
      />
      <Opciones legend="Categoría" name="categoria" opciones={CATEGORIAS} value={v.categoria} />
      <Opciones legend="Proyecto" name="proyecto" opciones={props.proyectos} value={v.proyecto} />
      <Opciones legend="¿Deducible?" name="deducible" opciones={DEDUCIBLE} value={v.deducible} />
      {props.prefill === null ? <HacerRecurrente fecha={props.fecha} /> : null}
    </>
  );
}
