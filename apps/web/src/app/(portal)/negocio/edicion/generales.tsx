'use client';

import { REGIMEN_NOMBRE } from '@xangarro/domain';

import { Input, OptionCards, Switch } from '@/components';

import { SectionShell } from '../parts';
import { hint } from '../negocio.css';
import { sugerida, type Business } from './draft';
import type { Edicion } from './use-edicion';

/**
 * Datos generales in edit mode: the name, and the régimen by SAT code
 * (ADR-082). A new régimen offers its suggested ISR rate behind a switch —
 * never changed silently.
 */
const COMUNES = ['626', '612', '601', '606', '605'];

/** «Ninguno por ahora» is a real choice (P-36.4): no régimen, the general ISR rate applies. */
const NINGUNO = 'ninguno';

const cards = (current: string | null) => [
  ...[...COMUNES, ...(current !== null && !COMUNES.includes(current) ? [current] : [])].map(
    (c) => ({
      value: c,
      title: `${c} · ${REGIMEN_NOMBRE[c] ?? c}`,
      description: c === '626' ? 'RESICO: el más común para emprendedores.' : '',
    }),
  ),
  {
    value: NINGUNO,
    title: 'Ninguno por ahora',
    description: 'Estimamos el ISR con tu tasa general; lo cambias cuando quieras.',
  },
];

const pct = (bp: number) => `${bp / 100}%`;

function Regimen({ e, business }: { readonly e: Edicion; readonly business: Business }) {
  if (e.draft === null) return null;
  const d = e.draft;
  const s = sugerida(business, d);
  return (
    <>
      <p className={hint}>
        Régimen fiscal. Solo sirve para estimar el ISR en tu estado de resultados; no afecta nada
        más.
      </p>
      <OptionCards
        ariaLabel="Régimen fiscal"
        options={cards(business.regimenSat)}
        value={d.regimenSat ?? NINGUNO}
        onValueChange={(v) => e.set({ regimenSat: v === NINGUNO ? null : v })}
      />
      {e.errores.campos.regimen ? <p role="alert">{e.errores.campos.regimen}</p> : null}
      {s === null ? null : (
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <Switch
            checked={d.usarSugerida}
            label="Usar la tasa de ISR sugerida"
            onCheckedChange={(on) => e.set({ usarSugerida: on })}
          />
          Cambiar la tasa de ISR de {pct(business.isrTasa)} a {pct(s)}, la sugerida para este
          régimen
        </label>
      )}
    </>
  );
}

export function GeneralesEdit({
  e,
  business,
}: {
  readonly e: Edicion;
  readonly business: Business;
}) {
  if (e.draft === null) return null;
  const d = e.draft;
  return (
    <SectionShell title="Datos generales" tone="hero">
      <Input
        labelText="Nombre del negocio"
        value={d.nombre}
        onChange={(ev) => e.set({ nombre: ev.target.value })}
        error={e.errores.campos.nombre}
        data-testid="negocio-nombre"
      />
      <Regimen e={e} business={business} />
    </SectionShell>
  );
}
