'use client';

import { Button } from '@/components';

import { ENVUELVE } from '../_primeros/boton';
import { dinero, fechaLarga } from '../_primeros/formato';
import { IconoCandado } from '../_primeros/iconos';
import * as p from '../_primeros/primeros.css';
import * as s from './resumen.css';

export interface Totales {
  readonly caja: bigint;
  readonly bancos: bigint;
  readonly cxc: bigint;
}

export const totalDe = (t: Totales): bigint => t.caja + t.bancos + t.cxc;

/** The aside (`CfgSaldosIniciales`): what the business starts with, and the save and lock. */
export function ResumenSaldos(props: {
  readonly totales: Totales;
  readonly fecha: string;
  readonly clientes: number;
  readonly estado: 'editable' | 'bloqueado' | 'lectura';
  readonly pending: boolean;
  readonly onGuardar: () => void;
  readonly onBloquear: () => void;
}) {
  const { totales: t } = props;
  return (
    <aside className={p.aside}>
      <section className={p.hero} aria-labelledby="sum-t">
        <h2 id="sum-t" className={p.eyebrow}>
          Tu negocio empieza con
        </h2>
        <span className={p.cifra}>{dinero(totalDe(t))}</span>
        <p className={p.texto}>
          {props.fecha === '' ? 'Elige tu fecha de apertura' : `al ${fechaLarga(props.fecha)}`}
        </p>
        <Barra t={t} />
        <dl className={s.leyenda}>
          <Renglon tramo="caja" nombre="Efectivo en caja" cifra={t.caja} />
          <Renglon tramo="bancos" nombre="En bancos" cifra={t.bancos} />
          <Renglon
            tramo="cxc"
            nombre={`Te deben (${props.clientes} ${props.clientes === 1 ? 'cliente' : 'clientes'})`}
            cifra={t.cxc}
          />
        </dl>
        <Pie {...props} />
      </section>
    </aside>
  );
}

function Barra({ t }: { readonly t: Totales }) {
  const total = totalDe(t);
  const pct = (x: bigint) => (total > 0n ? `${Number((x * 10000n) / total) / 100}%` : '0%');
  return (
    <div className={s.barra} aria-hidden="true">
      <span className={s.tramo.caja} style={{ width: pct(t.caja) }} />
      <span className={s.tramo.bancos} style={{ width: pct(t.bancos) }} />
      <span className={s.tramo.cxc} style={{ width: pct(t.cxc) }} />
    </div>
  );
}

function Renglon(props: {
  readonly tramo: keyof typeof s.tramo;
  readonly nombre: string;
  readonly cifra: bigint;
}) {
  return (
    <div className={s.leyendaFila}>
      <span className={`${s.punto} ${s.tramo[props.tramo]}`} aria-hidden="true" />
      <dt className={s.leyendaNombre}>{props.nombre}</dt>
      <dd className={s.leyendaCifra}>{dinero(props.cifra)}</dd>
    </div>
  );
}

function Pie(props: {
  readonly estado: 'editable' | 'bloqueado' | 'lectura';
  readonly pending: boolean;
  readonly onGuardar: () => void;
  readonly onBloquear: () => void;
}) {
  if (props.estado === 'bloqueado') {
    return (
      <span className={s.bloqueados}>
        <IconoCandado size={14} />
        Bloqueados
      </span>
    );
  }
  if (props.estado === 'lectura') {
    return <p className={p.nota}>Solo el dueño o un administrador puede capturarlos.</p>;
  }
  return <Acciones {...props} />;
}

function Acciones(props: {
  readonly pending: boolean;
  readonly onGuardar: () => void;
  readonly onBloquear: () => void;
}) {
  return (
    <div className={s.acciones}>
      <Button
        variant="primary"
        size="lg"
        full
        style={ENVUELVE}
        disabled={props.pending}
        onClick={props.onGuardar}
      >
        {props.pending ? 'Guardando…' : 'Guardar saldos'}
      </Button>
      <Button
        variant="secondary"
        full
        style={ENVUELVE}
        disabled={props.pending}
        onClick={props.onBloquear}
        icon={<IconoCandado />}
      >
        Bloquear saldos iniciales
      </Button>
      <p className={p.nota}>
        Guarda y corrige las veces que quieras. Cuando estés seguro, bloquéalos.
      </p>
    </div>
  );
}
