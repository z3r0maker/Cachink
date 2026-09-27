'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { Don } from '@/components';
import { resolverImportacionAsistida } from '@/server/actions/hazlo-por-mi';

import { Aviso } from '../_primeros/aviso';
import * as p from '../_primeros/primeros.css';
import { EstadoAsistida } from './estado-asistida';
import { Solicitud } from './solicitud';
import * as s from './hazlo.css';

/**
 * «Hazlo por mí» (N-18), the tenant-side card in /importar's aside. States:
 * none → the form (paid plans; free sees the upsell); revision → waiting;
 * sent by staff → Aprobar / Rechazar (the approval is a data-layer claim:
 * nothing is written until the tenant says yes); resolved → the outcome.
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

type Banner = { tone: 'success' | 'critical'; text: string } | null;

export function HazloPorMi(view: AsistidaView) {
  const [banner, setBanner] = useState<Banner>(null);
  const [pending, start] = useTransition();
  // A resolved request (aplicada/rechazada/expirada) leaves the form open:
  // one in flight at a time, as many as the business needs.
  const inFlight = view.status === 'revision' || view.status === 'esperando_aprobacion';
  const muestraForma = view.paid && view.mayWrite && !inFlight;

  const resolver = (decision: 'aprobar' | 'rechazar') =>
    start(async () => {
      const r = await resolverImportacionAsistida(decision);
      const ok = decision === 'aprobar' ? 'Migración aplicada.' : 'Solicitud cancelada.';
      setBanner(r.ok ? { tone: 'success', text: ok } : { tone: 'critical', text: r.message });
    });

  return (
    <aside className={p.aside}>
      <section data-testid="hazlo-por-mi" className={s.tarjeta} aria-labelledby="hpm-t">
        <Cabeza paid={view.paid} />
        <p className={p.texto}>
          Nos mandas tus archivos, el equipo los prepara y tú apruebas antes de que se guarde nada.
        </p>
        {banner !== null ? <Aviso tono={banner.tone}>{banner.text}</Aviso> : null}
        {!view.paid && view.status === null ? <Upsell /> : null}
        {muestraForma ? <Solicitud onBanner={(tone, text) => setBanner({ tone, text })} /> : null}
        {view.status !== null ? (
          <EstadoAsistida view={view} pending={pending} onResolver={resolver} />
        ) : null}
      </section>
    </aside>
  );
}

function Cabeza({ paid }: { readonly paid: boolean }) {
  return (
    <div className={s.cabeza}>
      <Don pose="ayuda" size={72} />
      <div className={s.cabezaTexto}>
        <span className={paid ? s.etiquetaTono.incluido : s.etiquetaTono.pago}>
          {paid ? 'Incluido en tu plan' : 'En planes de pago'}
        </span>
        <h2 id="hpm-t" className={s.titulo}>
          ¿Prefieres que lo hagamos nosotros?
        </h2>
      </div>
    </div>
  );
}

function Upsell() {
  return (
    <>
      <p data-testid="hazlo-por-mi-upsell" className={p.nota}>
        Disponible en planes de pago: te migramos tus datos por ti. Sube de plan para pedirla.
      </p>
      <Link href="/suscripcion" className={s.fuerte}>
        Ver planes
      </Link>
    </>
  );
}
