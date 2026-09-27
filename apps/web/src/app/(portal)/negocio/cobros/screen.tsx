'use client';

import {
  METODOS_CONFIGURABLES,
  parseFeatureFlags,
  type MetodoConfigurable,
} from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Banner, ScreenBody } from '@/components';
import type { NegocioData } from '@/server/screens';
import { useSession } from '@/session/provider';
import { isOwner, resolveScreenState } from '@/session/gating';
import { Icon } from '@/shell/icon';
import { eyebrow } from '@/styles/text.css';

import type { Business } from '../edicion/draft';
import { MiNegocioHead } from '../hub';
import { ICONO } from '../parts';
import * as c from './cobros.css';
import { FiadoCard, type Acceso } from './fiado';
import { GLIFO, MetodoCard } from './metodos';
import { useCobros, type Cobros } from './use-cobros';

/** Mi negocio · Cobros (P-08, CfgCobros): what the caja lets you pick when you cobras. */
const METODO: Readonly<Record<MetodoConfigurable, { desc: string; fondo: string }>> = {
  Efectivo: { desc: 'Billetes y monedas; la caja calcula el cambio.', fondo: colors.greenSoft },
  Transferencia: { desc: 'Te pagan desde la app de su banco.', fondo: colors.blueSoft },
  Tarjeta: { desc: 'Cobras en tu terminal y la caja lo anota.', fondo: colors.purpleSoft },
};

function Metodo({
  m,
  k,
  owner,
}: {
  readonly m: MetodoConfigurable;
  readonly k: Cobros;
  readonly owner: boolean;
}) {
  return (
    <MetodoCard
      id={`cobro-${m.toLowerCase()}`}
      nombre={m}
      desc={METODO[m].desc}
      glifo={GLIFO[m]}
      fondo={METODO[m].fondo}
      on={k.metodos.includes(m)}
      error={k.ultimo === m}
      puede={owner && !k.pending}
      onToggle={(on) => k.toggle(m, on)}
    />
  );
}

function Cabeza({ n }: { readonly n: number }) {
  return (
    <div className={c.cabeza}>
      <div className={c.cabezaTexto}>
        <span className={eyebrow}>Formas de cobro</span>
        <h2 className={c.titulo}>Cómo te pagan</h2>
        <p className={c.sub}>
          Lo que la caja te deja elegir al cobrar. Deja al menos una prendida.
        </p>
      </div>
      <div className={c.cuenta} aria-live="polite">
        <Icon
          path="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm5 16h.01"
          size={16}
          strokeWidth={2.3}
        />
        La caja ofrece <strong className={c.cuentaNum}>{n} de 4</strong>
      </div>
    </div>
  );
}

/** The screen with its data resolved; the harness renders this one directly. */
export function CobrosVista({
  business,
  acceso,
}: {
  readonly business: Business;
  readonly acceso: Acceso;
}) {
  const flags = parseFeatureFlags(business.featureFlags ?? '{}');
  const k = useCobros(business, flags.ventasCredito);
  const [izq, der] = [METODOS_CONFIGURABLES.filter((m) => m !== 'Tarjeta'), ['Tarjeta'] as const];
  const n = k.metodos.length + (k.fiado && acceso.disponible ? 1 : 0);
  return (
    <div className={c.pila}>
      <MiNegocioHead activo="cobros" />
      <Cabeza n={n} />
      {k.error === null ? null : <Banner tone="critical" title={k.error} />}
      <div className={c.columnas}>
        <div className={c.columna}>
          {izq.map((m) => (
            <Metodo key={m} m={m} k={k} owner={acceso.owner} />
          ))}
        </div>
        <div className={c.columna}>
          {der.map((m) => (
            <Metodo key={m} m={m} k={k} owner={acceso.owner} />
          ))}
          <FiadoCard k={k} acceso={acceso} />
        </div>
      </div>
      <p className={c.pie}>
        <Icon path={ICONO.repetir} size={16} strokeWidth={2.3} />
        Tus cajas reciben los cambios la próxima vez que se sincronicen.
      </p>
    </div>
  );
}

export function CobrosScreen({
  business,
  failed,
}: {
  readonly business: NegocioData | null;
  readonly failed: boolean;
}) {
  const session = useSession();
  if (business === null || business === undefined) {
    return (
      <div className={c.pila}>
        <MiNegocioHead activo="cobros" />
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
  const acceso: Acceso = {
    owner: isOwner(session.role),
    planId: session.planId,
    disponible: session.platform.ventasCredito,
  };
  return <CobrosVista business={business} acceso={acceso} />;
}
