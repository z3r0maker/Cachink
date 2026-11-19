'use client';

import type { CobroServicio } from '@xangarro/domain/corp';

import type { ValoresServicio } from '@/server/empresa/servicio-valores';
import * as d from '@/styles/mostrador-data.css';

import { Campo, Opciones, type Opcion } from '../movimientos/registrar/opciones';

/**
 * The fields each way of charging asks for (E-24, board CD-18d): an amount
 * and its day, an alert and the month so far, a commission's rate, a free
 * plan's limit and use, or a renewal. Nothing else is asked.
 */
export const COBROS: readonly Opcion[] = [
  { value: 'fijo', title: 'Fijo', text: 'El mismo monto cada mes' },
  { value: 'uso', title: 'Por uso', text: 'Cambia cada mes' },
  { value: 'comision', title: 'Comisión', text: 'Un % de cada cobro' },
  { value: 'gratis', title: 'Gratis', text: 'Sin costo, con límite' },
  { value: 'anual', title: 'Anual', text: 'Un cargo al año' },
];

const MONEDAS: readonly Opcion[] = [
  { value: 'MXN', title: 'Pesos (MXN)' },
  { value: 'USD', title: 'Dólares (USD)' },
];

function Dia({ v }: { readonly v: ValoresServicio }) {
  return (
    <Campo
      label="Día del cargo"
      name="dia"
      inputMode="numeric"
      required
      defaultValue={v.dia}
      hint="Del 1 al 31. Un mes más corto cobra su último día."
    />
  );
}

function Precio({ v, anual }: { readonly v: ValoresServicio; readonly anual: boolean }) {
  return (
    <>
      <Opciones legend="Moneda" name="moneda" opciones={MONEDAS} value={v.moneda} />
      <div className={d.fields}>
        <Campo
          label={anual ? 'Cuánto al año' : 'Cuánto'}
          name="monto"
          inputMode="decimal"
          required
          defaultValue={v.monto}
          hint="Con IVA. En dólares se registra al tipo de cambio del cargo."
        />
        {anual ? (
          <Campo
            label="Renueva el"
            name="renueva"
            type="date"
            required
            defaultValue={v.renueva}
            hint="Avisa 30 días antes en Señales."
          />
        ) : (
          <Dia v={v} />
        )}
      </div>
    </>
  );
}

function PorUso({ v }: { readonly v: ValoresServicio }) {
  return (
    <div className={d.fields}>
      <Campo
        label="Avisar si el mes pasa de (opcional)"
        name="aviso"
        inputMode="decimal"
        defaultValue={v.aviso}
        hint="Con la proyección del mes, desde el día 3."
      />
      <Dia v={v} />
      <Campo
        label="Lo que va del mes (opcional)"
        name="gastoMes"
        inputMode="decimal"
        defaultValue={v.gastoMes}
        hint="Lo que marca hoy el panel del proveedor. De aquí sale la proyección."
      />
      <input type="hidden" name="gastoMesPrevio" value={v.gastoMes} />
      <input type="hidden" name="gastoAlPrevio" value={v.gastoAl} />
    </div>
  );
}

function Gratis({ v }: { readonly v: ValoresServicio }) {
  return (
    <div className={d.fields}>
      <Campo
        label="Límite del plan gratis"
        name="limite"
        inputMode="numeric"
        required
        defaultValue={v.limite}
        hint="Lo que el plan permite, como 500."
      />
      <Campo
        label="En qué se mide"
        name="unidad"
        defaultValue={v.unidad}
        hint="MB, correos, usuarios…"
      />
      <Campo
        label="Uso de hoy (opcional)"
        name="usoPlan"
        inputMode="numeric"
        defaultValue={v.usoPlan}
        hint="Avisa al pasar de 60 % del límite."
      />
    </div>
  );
}

export function CamposDelCobro({
  cobro,
  v,
}: {
  readonly cobro: CobroServicio;
  readonly v: ValoresServicio;
}) {
  switch (cobro) {
    case 'fijo':
      return <Precio v={v} anual={false} />;
    case 'anual':
      return <Precio v={v} anual />;
    case 'uso':
      return <PorUso v={v} />;
    case 'gratis':
      return <Gratis v={v} />;
    case 'comision':
      return (
        <Campo
          label="Cuánto cobra por pago"
          name="tarifa"
          required
          defaultValue={v.tarifa}
          hint="Como lo dice el proveedor: 3.6 % + $3 por pago."
        />
      );
  }
}
