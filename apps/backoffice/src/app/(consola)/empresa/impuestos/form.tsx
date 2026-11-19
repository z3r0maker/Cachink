'use client';

import { formatMoney, pesosToCentavos } from '@xangarro/domain';
import { useActionState, useState } from 'react';

import { guardarDeclaracionAction } from '@/server/actions/empresa-impuestos';
import type { ValoresDeclaracion } from '@/server/empresa/impuestos-form';
import * as d from '@/styles/mostrador-data.css';
import * as c from '@/styles/mostrador-impuestos-tarjetas.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

import { Campo, submitWith } from '../movimientos/registrar/opciones';
import { Aviso } from '../socios/formas';

/**
 * «Lo que declaró el contador» (E-13, board CD-09b): the four figures of his
 * declaration, each beside what the ledger estimates and how far it is, the
 * total, and the línea de captura's amount and expiry. It saves even when a
 * figure differs; the month then says «Revisa con el contador».
 */
type Nombre = ValoresDeclaracion['campos'][number]['name'];

const UMBRAL = 100n;
const centavos = (v: string) => (v.trim() === '' ? null : pesosToCentavos(v.trim()));

function comparado(valor: string, estimado: bigint): string {
  const c = centavos(valor);
  const base = `Estimado: ${formatMoney(estimado)}`;
  if (c === null) return base;
  const dif = c - estimado;
  if (dif === 0n) return `${base} · coincide`;
  const abs = dif < 0n ? -dif : dif;
  if (abs <= UMBRAL) return `${base} · casi igual`;
  return `${base} · ${formatMoney(abs)} ${dif > 0n ? 'más' : 'menos'}. Revisa con el contador.`;
}

function useCifras(v: ValoresDeclaracion) {
  const [cifras, setCifras] = useState<Record<Nombre, string>>(
    Object.fromEntries(v.campos.map((c) => [c.name, c.valor])) as Record<Nombre, string>,
  );
  const total = v.campos.reduce((acc, c) => acc + (centavos(cifras[c.name]) ?? 0n), 0n);
  return { cifras, setCifras, total };
}

function Linea({ v, total }: { readonly v: ValoresDeclaracion; readonly total: bigint }) {
  const [importe, setImporte] = useState(v.lineaImporte);
  const c = centavos(importe);
  const hint =
    c === null
      ? 'Opcional hasta que la tengas.'
      : c === total
        ? 'Coincide con la suma declarada.'
        : `No es la suma declarada (${formatMoney(total)}). Revisa cuál de los dos está mal.`;
  return (
    <fieldset className={d.fieldset}>
      <legend className={d.legend}>Línea de captura (cuando la tengas)</legend>
      <div className={d.fields}>
        <Campo
          label="Importe a pagar"
          name="lineaImporte"
          inputMode="decimal"
          value={importe}
          onChange={(e) => setImporte(e.target.value)}
          hint={hint}
        />
        <Campo
          label="Vigente hasta"
          name="lineaVigencia"
          type="date"
          defaultValue={v.lineaVigencia}
          hint="Después de esa fecha hay que pedir otra."
        />
      </div>
    </fieldset>
  );
}

function Cifras({ v }: { readonly v: ValoresDeclaracion }) {
  const { cifras, setCifras, total } = useCifras(v);
  return (
    <>
      <div className={d.fields}>
        {v.campos.map((campo) => (
          <Campo
            key={campo.name}
            label={campo.label}
            name={campo.name}
            inputMode="decimal"
            required
            value={cifras[campo.name]}
            onChange={(e) => setCifras({ ...cifras, [campo.name]: e.target.value })}
            hint={comparado(cifras[campo.name], BigInt(campo.estimado))}
          />
        ))}
      </div>
      <div className={c.resultado}>
        <span>Total declarado</span>
        <span className={c.resultadoMonto} data-testid="total-declarado">
          {formatMoney(total)}
        </span>
      </div>
      <Linea v={v} total={total} />
    </>
  );
}

export function DeclaracionForm(props: {
  readonly v: ValoresDeclaracion;
  readonly cerrar: string;
}) {
  const [state, action, pending] = useActionState(guardarDeclaracionAction, null);
  return (
    <form onSubmit={submitWith(action)} className={d.form}>
      <input type="hidden" name="periodo" value={props.v.periodo} />
      <Cifras v={props.v} />
      <Aviso state={state} />
      <div className={m.row}>
        <a className={m.boton.quieto} href={props.cerrar}>
          Cancelar
        </a>
        <button className={m.boton.primario} type="submit" disabled={pending}>
          Guardar la declaración
        </button>
      </div>
      <span className={i.muted}>
        Se guarda aunque algo no coincida. Los papeles se suben en el mes, y la Agenda avanza con
        ellos.
      </span>
    </form>
  );
}
