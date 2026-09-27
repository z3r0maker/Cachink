'use client';

import { Button, Input, Switch } from '@/components';

import * as g from '../general.css';
import type { AtributoRow } from './draft';
import type { Edicion } from './use-edicion';

/**
 * Atributos de producto in the drawer (P-08): the extra fields a product can
 * carry, like talla, color, sabor. A name and, if it is a list, its choices;
 * the key and the kind are derived by the domain.
 */
function Pie(props: {
  readonly i: number;
  readonly a: AtributoRow;
  readonly e: Edicion;
  readonly put: (patch: Partial<AtributoRow>) => void;
}) {
  const { i, a, e, put } = props;
  const rows = e.draft?.atributos ?? [];
  return (
    <div className={g.attrPie}>
      <label className={g.interruptorQuieto}>
        <Switch
          checked={a.obligatorio}
          label={`${a.label || 'Atributo'} obligatorio`}
          onCheckedChange={(v) => put({ obligatorio: v })}
        />
        Obligatorio
      </label>
      <span style={{ marginLeft: 'auto' }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => e.set({ atributos: rows.filter((_, j) => j !== i) })}
        >
          Quitar
        </Button>
      </span>
    </div>
  );
}

function Row(props: { readonly i: number; readonly a: AtributoRow; readonly e: Edicion }) {
  const { i, a, e } = props;
  const rows = e.draft?.atributos ?? [];
  const put = (patch: Partial<AtributoRow>) =>
    e.set({ atributos: rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  return (
    <div className={g.attrFila}>
      <Input
        labelText="Nombre"
        value={a.label}
        onChange={(ev) => put({ label: ev.target.value })}
        error={e.errores.atributos[i]}
        data-testid={`atributo-${i}-nombre`}
      />
      <Input
        labelText="Opciones"
        hintText="Sepáralas con comas. Vacío es texto libre."
        value={a.opciones}
        onChange={(ev) => put({ opciones: ev.target.value })}
        data-testid={`atributo-${i}-opciones`}
      />
      <Pie i={i} a={a} e={e} put={put} />
    </div>
  );
}

export function AtributosEdit({ e }: { readonly e: Edicion }) {
  if (e.draft === null) return null;
  const rows = e.draft.atributos;
  return (
    <div className={g.campos}>
      <p className={g.pista}>
        Campos extra para tus productos, como talla, color o sabor. La caja los pide al vender.
      </p>
      <div>
        {rows.map((a, i) => (
          <Row key={i} i={i} a={a} e={e} />
        ))}
      </div>
      <Button
        variant="secondary"
        onClick={() =>
          e.set({ atributos: [...rows, { label: '', opciones: '', obligatorio: false }] })
        }
      >
        Agregar atributo
      </Button>
    </div>
  );
}
