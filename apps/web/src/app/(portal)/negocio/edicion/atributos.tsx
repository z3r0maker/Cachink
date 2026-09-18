'use client';

import { parseAtributos } from '@xangarro/domain';

import { Button, Input, Switch } from '@/components';

import { FieldRow, SectionShell } from '../parts';
import { attrRow, fieldLabel } from '../negocio.css';
import type { AtributoRow, Business } from './draft';
import type { Edicion } from './use-edicion';

/**
 * Atributos de producto (P-08): the extra fields a product can carry — talla,
 * color, duración. A name and, if it is a list, its choices; the key and the
 * kind are derived by the domain.
 */
function Row(props: { readonly i: number; readonly a: AtributoRow; readonly e: Edicion }) {
  const { i, a, e } = props;
  const rows = e.draft?.atributos ?? [];
  const put = (patch: Partial<AtributoRow>) =>
    e.set({ atributos: rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  return (
    <div className={attrRow}>
      <Input
        labelText="Nombre"
        value={a.label}
        onChange={(ev) => put({ label: ev.target.value })}
        error={e.errores.atributos[i]}
        data-testid={`atributo-${i}-nombre`}
      />
      <Input
        labelText="Opciones (sepáralas con comas; vacío = texto libre)"
        value={a.opciones}
        onChange={(ev) => put({ opciones: ev.target.value })}
        data-testid={`atributo-${i}-opciones`}
      />
      <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Switch
          checked={a.obligatorio}
          label={`${a.label || 'Atributo'} obligatorio`}
          onCheckedChange={(v) => put({ obligatorio: v })}
        />
        Obligatorio
        <span style={{ marginLeft: 'auto' }}>
          <Button
            variant="secondary"
            onClick={() => e.set({ atributos: rows.filter((_, j) => j !== i) })}
          >
            Quitar
          </Button>
        </span>
      </label>
    </div>
  );
}

const describe = (tipo: string, opciones: readonly string[] | undefined) =>
  tipo === 'select' ? (opciones ?? []).join(' · ') : 'Texto libre';

export function AtributosCard({
  e,
  business,
}: {
  readonly e: Edicion;
  readonly business: Business;
}) {
  const saved = parseAtributos(business.atributosProducto);
  const rows = e.draft?.atributos ?? [];
  return (
    <SectionShell title="Atributos de producto" tone="purple">
      {e.draft === null ? (
        saved.length === 0 ? (
          <p className={fieldLabel}>
            Sin atributos. Agrégalos si vendes tallas, colores o sabores.
          </p>
        ) : (
          saved.map((a) => (
            <FieldRow key={a.clave} label={a.label} value={describe(a.tipo, a.opciones)} />
          ))
        )
      ) : (
        <>
          {rows.map((a, i) => (
            <Row key={i} i={i} a={a} e={e} />
          ))}
          <Button
            variant="secondary"
            onClick={() =>
              e.set({ atributos: [...rows, { label: '', opciones: '', obligatorio: false }] })
            }
          >
            Agregar atributo
          </Button>
        </>
      )}
    </SectionShell>
  );
}
