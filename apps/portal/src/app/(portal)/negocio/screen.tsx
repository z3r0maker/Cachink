'use client';

import { parseFeatureFlags, REGIMEN_NOMBRE } from '@xangarro/domain';
import Link from 'next/link';

import { Banner, Button, ScreenBody } from '@/components';
import { useSession } from '@/session/provider';
import type { NegocioData } from '@/server/screens';
import { isOwner, resolveScreenState } from '@/session/gating';

import { AtributosCard } from './edicion/atributos';
import type { Business } from './edicion/draft';
import { FiscalesEdit } from './edicion/fiscales';
import { GeneralesEdit } from './edicion/generales';
import { PagosCard } from './edicion/pagos';
import { SaveBar } from './edicion/save-bar';
import { useEdicion, type Edicion } from './edicion/use-edicion';
import { FuncionesCard } from './funciones';
import { CapabilitiesCard, SectionCard } from './parts';
import { pageSubtitle, pageTitle, sectionGrid } from './negocio.css';

/**
 * Negocio (P-08). Read mode shows the cards; «Editar negocio» (owner only)
 * turns them into inputs at once, with one sticky «Guardar cambios» for all of
 * it — one validated patch, one change for the phones.
 */
function Heading({ owner, e }: { readonly owner: boolean; readonly e: Edicion | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className={pageTitle}>Negocio</h1>
        <p className={pageSubtitle}>Los datos con los que armamos tus estados y tus comprobantes</p>
      </div>
      {owner && e !== null && e.draft === null ? (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Re-run the onboarding wizard (N-15): answers change, features follow. */}
          <Link href="/bienvenida/revisar">Volver a configurar mi negocio</Link>
          <Button variant="secondary" onClick={e.start}>
            Editar negocio
          </Button>
        </div>
      ) : null}
    </div>
  );
}

const regimenLabel = (code: string | null): string | null =>
  code === null ? null : `${code} · ${REGIMEN_NOMBRE[code] ?? code}`;

/**
 * The read-mode rows. A `null` value renders «Falta por completar» in amber —
 * a thing to do, not an absence — and the banner reads the same data.
 */
function buildSections(business: Business) {
  return [
    {
      title: 'Datos generales',
      tone: 'hero' as const,
      fields: [
        { label: 'Nombre del negocio', value: business.nombre },
        // «Falta» when the old «Otro» could not be mapped to a code (ADR-082).
        { label: 'Régimen fiscal', value: regimenLabel(business.regimenSat) },
        { label: 'Tasa de ISR', value: `${(business.isrTasa ?? 0) / 100}%` },
        { label: 'Tipo de negocio', value: business.tipoNegocio },
      ],
    },
    {
      title: 'Datos fiscales',
      tone: 'info' as const,
      fields: [
        { label: 'RFC', value: business.rfc },
        { label: 'Razón social', value: business.razonSocial },
        { label: 'Código postal fiscal', value: business.codigoPostal },
        // An empty uso is not missing: invoices use G03 until the owner picks.
        {
          label: 'Uso de CFDI',
          value: business.usoCfdi ?? 'G03 · Gastos en general (predeterminado)',
        },
      ],
    },
  ];
}

function Cards({ business, e }: { readonly business: Business; readonly e: Edicion }) {
  const sections = buildSections(business);
  return (
    <div className={sectionGrid}>
      {e.draft === null ? (
        sections.map((s) => <SectionCard key={s.title} section={s} />)
      ) : (
        <>
          <GeneralesEdit e={e} business={business} />
          <FiscalesEdit e={e} />
        </>
      )}
      <PagosCard e={e} business={business} />
      <AtributosCard e={e} business={business} />
    </div>
  );
}

function Loaded({ business, owner }: { readonly business: Business; readonly owner: boolean }) {
  const e = useEdicion(business);
  const incomplete = buildSections(business).some((s) => s.fields.some((f) => f.value === null));
  return (
    <>
      <Heading owner={owner} e={e} />
      {incomplete && e.draft === null ? (
        <Banner
          tone="warning"
          title="Faltan tus datos fiscales."
          body="Con tu RFC, razón social y código postal podemos facturar a tu nombre."
        />
      ) : null}
      {e.draft === null && e.note !== null ? <p role="status">{e.note}</p> : null}
      <Cards business={business} e={e} />
      <SaveBar e={e} />
      <FuncionesCard flags={parseFeatureFlags(business.featureFlags ?? '{}')} />
      <CapabilitiesCard />
    </>
  );
}

export function NegocioScreen({ business }: { readonly business: NegocioData | null }) {
  const owner = isOwner(useSession().role);
  if (business === null || business === undefined) {
    return (
      <>
        <Heading owner={false} e={null} />
        <ScreenBody
          state={resolveScreenState({ error: business === null })}
          onRetry={() => window.location.reload()}
          empty={{ title: 'Sin datos del negocio', body: 'Completa tu perfil para empezar.' }}
        >
          {null}
        </ScreenBody>
      </>
    );
  }
  return <Loaded business={business} owner={owner} />;
}
