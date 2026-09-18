'use client';

import { Banner, ScreenBody } from '@/components';
import { useSession } from '@/session/provider';
import type { NegocioData } from '@/server/screens';
import { isOwner, resolveScreenState } from '@/session/gating';

import { CapabilitiesCard, FuncionesCard, SectionCard } from './parts';
import { EditNegocioDialog } from './edit-dialog';
import { pageSubtitle, pageTitle, sectionGrid } from './negocio.css';

function Heading({
  owner,
  current,
}: {
  readonly owner: boolean;
  readonly current: { nombre: string; regimenFiscal: string };
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className={pageTitle}>Negocio</h1>
        <p className={pageSubtitle}>Los datos con los que armamos tus estados y tus comprobantes</p>
      </div>
      {/* Editing the business is owner-only (design handoff, "Roles"). */}
      {owner ? (
        <div style={{ marginLeft: 'auto' }}>
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
        { label: 'RFC', value: null },
        { label: 'Domicilio fiscal', value: null },
      ],
    },
  ];
}

export function NegocioScreen({ business }: { readonly business: NegocioData | null }) {
  const session = useSession();
  const owner = isOwner(session.role);
  // A missing fiscal address is a thing to do, not an absence — the banner and
  // the amber "Falta por completar" field come from the same row.
  const sections = buildSections(business);
  const incomplete = sections.some((x) => x.fields.some((f) => f.value === null));

  return (
    <>
      <Heading
        owner={owner}
        current={{ nombre: business?.nombre ?? '', regimenFiscal: business?.regimenFiscal ?? '' }}
      />

      {incomplete ? (
        <Banner
          tone="warning"
          title="Falta tu domicilio fiscal."
          body="Sin él no podemos poner tus datos completos en los comprobantes."
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
        <FuncionesCard />
        <CapabilitiesCard />
      </ScreenBody>
    </>
  );
}
