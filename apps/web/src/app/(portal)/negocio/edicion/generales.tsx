'use client';

import { REGIMEN_NOMBRE } from '@xangarro/domain';
import Link from 'next/link';

import { Input, OptionCards, Switch } from '@/components';

import * as g from '../general.css';
import { tipoLabel } from '../lectura';
import { sugerida, type Business } from './draft';
import type { Edicion } from './use-edicion';

/**
 * Datos generales in the drawer: the name, and the régimen by SAT code
 * (ADR-082). A new régimen offers its suggested ISR rate behind a switch,
 * never changed silently. The tipo de negocio comes from the wizard.
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
      <fieldset className={g.grupo}>
        <legend className={g.legend}>Régimen fiscal</legend>
        <p className={g.pista}>
          Solo sirve para estimar el ISR en tu estado de resultados; no afecta nada más.
        </p>
        <OptionCards
          ariaLabel="Régimen fiscal"
          options={cards(business.regimenSat)}
          value={d.regimenSat ?? NINGUNO}
          onValueChange={(v) => e.set({ regimenSat: v === NINGUNO ? null : v })}
        />
        {e.errores.campos.regimen ? <p role="alert">{e.errores.campos.regimen}</p> : null}
      </fieldset>
      {s === null ? null : (
        <label className={g.interruptor}>
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
  return (
    <div className={g.campos}>
      <Input
        labelText="Nombre del negocio"
        hintText="Sale en tus comprobantes y en tus estados."
        value={e.draft.nombre}
        onChange={(ev) => e.set({ nombre: ev.target.value })}
        error={e.errores.campos.nombre}
        data-testid="negocio-nombre"
      />
      <Regimen e={e} business={business} />
      <p className={g.tipoNegocio}>
        <span style={{ flex: 1 }}>
          Tipo de negocio: <strong>{tipoLabel(business.tipoNegocio)}</strong>. Se cambia al volver a
          configurar tu negocio.
        </span>
        {/* Re-run the onboarding wizard (N-15): answers change, features follow. */}
        <Link href="/bienvenida/revisar" className={g.tipoLink}>
          Volver a configurar
        </Link>
      </p>
    </div>
  );
}
