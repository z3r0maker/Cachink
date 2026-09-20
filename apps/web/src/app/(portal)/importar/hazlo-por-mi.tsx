'use client';

import { useState, useTransition } from 'react';

import { Banner, Button } from '@/components';
import { resolverImportacionAsistida } from '@/server/actions/hazlo-por-mi';

import { Solicitud } from './solicitud';

/**
 * «Hazlo por mí» (N-18), the tenant-side card on /importar. States: none →
 * the form (paid plans; free sees the upsell); revision → waiting; sent by
 * staff → Aprobar / Rechazar (the approval is a data-layer claim — nothing
 * is written until the tenant says yes); resolved → the outcome.
 */

export interface AsistidaView {
  readonly status:
    | 'revision'
    | 'esperando_aprobacion'
    | 'aplicada'
    | 'rechazada'
    | 'expirada'
    | null;
  readonly paid: boolean;
  readonly mayWrite: boolean;
  readonly fileCount: number;
}

const ESTADO: Record<Exclude<AsistidaView['status'], null>, string> = {
  revision: 'En revisión — el equipo de Xangarro está preparando tu migración.',
  esperando_aprobacion:
    'Tu migración está lista: revisa y aprueba antes de que la escriba el equipo.',
  aplicada: 'Migración aplicada. Tus datos ya están en Xangarro.',
  rechazada: 'Solicitud cancelada.',
  expirada: 'La aprobación expiró (14 días sin respuesta). Pide una nueva si aún la necesitas.',
};

export function HazloPorMi(view: AsistidaView) {
  const [banner, setBanner] = useState<{ tone: 'success' | 'critical'; text: string } | null>(null);
  const [pending, start] = useTransition();
  // A resolved request (aplicada/rechazada/expirada) leaves the form open —
  // one in flight at a time, as many as the business needs.
  const inFlight = view.status === 'revision' || view.status === 'esperando_aprobacion';
  const muestraForma = view.paid && view.mayWrite && !inFlight;

  const resolver = (decision: 'aprobar' | 'rechazar') =>
    start(async () => {
      const r = await resolverImportacionAsistida(decision);
      setBanner(
        r.ok
          ? {
              tone: 'success',
              text: decision === 'aprobar' ? 'Migración aplicada.' : 'Solicitud cancelada.',
            }
          : { tone: 'critical', text: r.message },
      );
    });

  return (
    <section
      data-testid="hazlo-por-mi"
      style={{ marginTop: 36, borderTop: '2px solid var(--black)', paddingTop: 20, maxWidth: 640 }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>Hazlo por mí</h2>
      {banner !== null ? <Banner tone={banner.tone} title={banner.text} /> : null}

      {!view.paid && view.status === null ? (
        <p data-testid="hazlo-por-mi-upsell" style={{ color: 'var(--gray-600)', margin: 0 }}>
          Disponible en planes de pago: te migramos tus datos por ti. Sube de plan para pedirla.
        </p>
      ) : null}

      {muestraForma ? <Solicitud onBanner={(t, x) => setBanner({ tone: t, text: x })} /> : null}

      {view.status !== null ? (
        <EstadoAsistida view={view} pending={pending} onResolver={resolver} />
      ) : null}
    </section>
  );
}

function EstadoAsistida({
  view,
  pending,
  onResolver,
}: {
  readonly view: AsistidaView;
  readonly pending: boolean;
  readonly onResolver: (d: 'aprobar' | 'rechazar') => void;
}) {
  return (
    <>
      <p data-testid="hazlo-por-mi-estado" style={{ margin: 0, fontWeight: 600 }}>
        {ESTADO[view.status as Exclude<AsistidaView['status'], null>]}
      </p>
      {view.status === 'revision' ? (
        <EnRevision view={view} pending={pending} onResolver={onResolver} />
      ) : null}
      {view.status === 'esperando_aprobacion' && view.mayWrite ? (
        <EsperandoAprobacion pending={pending} onResolver={onResolver} />
      ) : null}
    </>
  );
}

function EnRevision({
  view,
  pending,
  onResolver,
}: {
  readonly view: AsistidaView;
  readonly pending: boolean;
  readonly onResolver: (d: 'aprobar' | 'rechazar') => void;
}) {
  return (
    <>
      <p style={{ color: 'var(--gray-600)', margin: '4px 0 0' }}>
        {view.fileCount} archivo(s) entregados. Te avisamos por correo cuando esté lista.
      </p>
      {view.mayWrite ? (
        <Button variant="secondary" disabled={pending} onClick={() => onResolver('rechazar')}>
          Cancelar solicitud
        </Button>
      ) : null}
    </>
  );
}

function EsperandoAprobacion({
  pending,
  onResolver,
}: {
  readonly pending: boolean;
  readonly onResolver: (d: 'aprobar' | 'rechazar') => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
      <Button variant="primary" disabled={pending} onClick={() => onResolver('aprobar')}>
        {pending ? 'Aplicando…' : 'Aprobar e importar'}
      </Button>
      <Button variant="secondary" disabled={pending} onClick={() => onResolver('rechazar')}>
        Rechazar
      </Button>
    </div>
  );
}
