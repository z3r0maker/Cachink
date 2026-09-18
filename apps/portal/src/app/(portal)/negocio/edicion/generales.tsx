'use client';

import { REGIMEN_NOMBRE } from '@xangarro/domain';

import { Input, OptionCards, Switch } from '@/components';

import { SectionShell } from '../parts';
import { sugerida, type Business } from './draft';
import type { Edicion } from './use-edicion';

/**
 * Datos generales in edit mode: the name, and the régimen by SAT code
 * (ADR-082). A new régimen offers its suggested ISR rate behind a switch —
 * never changed silently.
 */
const COMUNES = ['626', '612', '601', '606', '605'];

const cards = (current: string | null) =>
  [...COMUNES, ...(current !== null && !COMUNES.includes(current) ? [current] : [])].map((c) => ({
    value: c,
    title: `${c} · ${REGIMEN_NOMBRE[c] ?? c}`,
    description: c === '626' ? 'RESICO: el más común para emprendedores.' : '',
  }));

const pct = (bp: number) => `${bp / 100}%`;

export function GeneralesEdit({
  e,
  business,
}: {
  readonly e: Edicion;
  readonly business: Business;
}) {
  if (e.draft === null) return null;
  const d = e.draft;
  const s = sugerida(business, d);
  return (
    <SectionShell title="Datos generales" tone="hero">
      <Input
        labelText="Nombre del negocio"
        value={d.nombre}
        onChange={(ev) => e.set({ nombre: ev.target.value })}
        error={e.errores.campos.nombre}
        data-testid="negocio-nombre"
      />
      <OptionCards
        ariaLabel="Régimen fiscal"
        options={cards(business.regimenSat)}
        value={d.regimenSat}
        onValueChange={(v) => e.set({ regimenSat: v })}
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
    </SectionShell>
  );
}
