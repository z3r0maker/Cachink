'use client';

import { ScreenBody } from '@/components';
import type { NegocioData } from '@/server/screens';
import { useSession } from '@/session/provider';
import { isOwner, resolveScreenState } from '@/session/gating';

import { ArchivarNegocio } from './archivar';
import type { Business } from './edicion/draft';
import { EdicionDrawer } from './edicion/drawer';
import { useEdicion, type Seccion } from './edicion/use-edicion';
import { AtributosCard, AvisoFiscal, VolverCard } from './extras';
import { MiNegocioHead } from './hub';
import { faltanFiscales, FiscalesCard, GeneralesCard } from './lectura';
import * as n from './negocio.css';

/**
 * Mi negocio · General (P-08, CfgNegocio). Read mode shows the panels; each
 * «Editar» (owner only) opens its section in a drawer, saved as one validated
 * patch, one change for the phones.
 */
function Loaded({ business, owner }: { readonly business: Business; readonly owner: boolean }) {
  const e = useEdicion(business);
  const abrir = owner ? e.start : null;
  const abrirEn = (s: Seccion) => (abrir === null ? null : () => abrir(s));
  return (
    <div className={n.pila}>
      <MiNegocioHead activo="general" />
      {faltanFiscales(business) ? <AvisoFiscal onCompletar={abrirEn('fiscales')} /> : null}
      {e.draft === null && e.note !== null ? (
        <p role="status" className={n.nota}>
          {e.note}
        </p>
      ) : null}
      <div className={n.dosColumnas}>
        <GeneralesCard b={business} abrir={abrir} />
        <FiscalesCard b={business} abrir={abrir} />
      </div>
      <div className={n.dosColumnas}>
        <AtributosCard business={business} onEditar={abrirEn('atributos')} />
        <VolverCard />
      </div>
      {owner ? (
        <>
          <ArchivarNegocio nombre={business.nombre} />
          <EdicionDrawer e={e} business={business} />
        </>
      ) : null}
    </div>
  );
}

export function NegocioScreen({
  business,
  failed,
}: {
  readonly business: NegocioData | null;
  /** The read threw, as opposed to returning no row, which is `empty`. */
  readonly failed: boolean;
}) {
  const owner = isOwner(useSession().role);
  if (business === null || business === undefined) {
    return (
      <div className={n.pila}>
        <MiNegocioHead activo="general" />
        <ScreenBody
          state={resolveScreenState({ error: failed, isEmpty: !failed })}
          onRetry={() => window.location.reload()}
          empty={{ title: 'Sin datos del negocio', body: 'Completa tu perfil para empezar.' }}
        >
          {null}
        </ScreenBody>
      </div>
    );
  }
  return <Loaded business={business} owner={owner} />;
}
