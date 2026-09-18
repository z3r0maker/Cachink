'use client';

import { parseFeatureFlags } from '@xangarro/domain';
import Link from 'next/link';

import { Banner, ScreenBody } from '@/components';
import { useSession } from '@/session/provider';
import type { NegocioData } from '@/server/screens';
import { isOwner, resolveScreenState } from '@/session/gating';

import { FuncionesCard } from './funciones';
import { CapabilitiesCard, SectionCard } from './parts';
import { EditNegocioDialog } from './edit-dialog';
import { FiscalDialog, type FiscalActual } from './fiscal-dialog';
import { pageSubtitle, pageTitle, sectionGrid } from './negocio.css';

function Heading({
  owner,
  current,
  fiscal,
}: {
  readonly owner: boolean;
  readonly current: { nombre: string; regimenFiscal: string };
  readonly fiscal: FiscalActual;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className={pageTitle}>Negocio</h1>
        <p className={pageSubtitle}>Los datos con los que armamos tus estados y tus comprobantes</p>
      </div>
      {/* Editing the business is owner-only (design handoff, "Roles"). */}
      {owner ? (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Re-run the onboarding wizard (N-15): answers change, features follow. */}
          <Link href="/bienvenida/revisar">Volver a configurar mi negocio</Link>
          <FiscalDialog actual={fiscal} />
          <EditNegocioDialog current={current} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * The four section cards, built from the business row.
 *
 * A `null` value renders "Falta por completar" in amber: an unfilled field is
 * a thing to do, not an absence, and the incomplete banner reads the same data
 * so the two cannot disagree.
 */
function buildSections(business: NegocioData | null | undefined) {
  if (business === null || business === undefined) return [];
  return [
    {
      title: 'Datos generales',
      tone: 'hero' as const,
      fields: [
        { label: 'Nombre del negocio', value: business.nombre },
        { label: 'Régimen fiscal', value: business.regimenFiscal },
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

const currentOf = (b: NegocioData | null) => ({
  nombre: b?.nombre ?? '',
  regimenFiscal: b?.regimenFiscal ?? '',
});

const fiscalOf = (b: NegocioData | null): FiscalActual => ({
  rfc: b?.rfc ?? null,
  razonSocial: b?.razonSocial ?? null,
  codigoPostal: b?.codigoPostal ?? null,
  usoCfdi: b?.usoCfdi ?? null,
});

export function NegocioScreen({ business }: { readonly business: NegocioData | null }) {
  const session = useSession();
  const owner = isOwner(session.role);
  // A missing fiscal address is a thing to do, not an absence — the banner and
  // the amber "Falta por completar" field come from the same row.
  const sections = buildSections(business);
  const incomplete = sections.some((x) => x.fields.some((f) => f.value === null));

  return (
    <>
      <Heading owner={owner} current={currentOf(business)} fiscal={fiscalOf(business)} />

      {incomplete ? (
        <Banner
          tone="warning"
          title="Faltan tus datos fiscales."
          body="Con tu RFC, razón social y código postal podemos facturar a tu nombre."
        />
      ) : null}

      <ScreenBody
        state={resolveScreenState({ error: business === null })}
        onRetry={() => window.location.reload()}
        empty={{ title: 'Sin datos del negocio', body: 'Completa tu perfil para empezar.' }}
      >
        <div className={sectionGrid}>
          {sections.map((s) => (
            <SectionCard key={s.title} section={s} />
          ))}
        </div>
        <FuncionesCard flags={parseFeatureFlags(business?.featureFlags ?? '{}')} />
        <CapabilitiesCard />
      </ScreenBody>
    </>
  );
}
