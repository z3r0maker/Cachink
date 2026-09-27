'use client';

import {
  FEATURE_FLAG_DEPENDENCIES,
  resolveDisableCascade,
  type FeatureFlagKey,
  type FeatureFlags,
  type PlanId,
} from '@xangarro/domain';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Banner, ConfirmDialog, ScreenBody } from '@/components';
import { flagRows } from '@/data/negocio';
import { cambiarFuncion } from '@/server/actions/funciones';
import { useSession } from '@/session/provider';

import { MiNegocioHead } from '../hub';
import { FUNCION, ORDEN } from './copy';
import { FuncionFila } from './fila';
import * as f from './funciones.css';
import { FuncionesCabeza } from './cabeza';

/**
 * Mi negocio · Funciones (P-15, CfgFunciones). Turning a parent off asks
 * first when it would take dependents with it (the domain's cascade, not
 * restated here); the server refuses what the plan or the role doesn't allow.
 */
function dependentsLost(flags: FeatureFlags, key: FeatureFlagKey): FeatureFlagKey[] {
  const after = resolveDisableCascade(flags, key);
  return (Object.keys(flags) as FeatureFlagKey[]).filter((k) => k !== key && flags[k] && !after[k]);
}

function useToggle(flags: FeatureFlags) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ key: FeatureFlagKey; lost: FeatureFlagKey[] } | null>(
    null,
  );
  const save = (key: FeatureFlagKey, on: boolean) =>
    startTransition(async () => {
      const result = await cambiarFuncion(key, on);
      setError(result.ok ? null : result.message);
      setConfirm(null);
      router.refresh();
    });
  const request = (key: FeatureFlagKey, on: boolean) => {
    const lost = on ? [] : dependentsLost(flags, key);
    if (lost.length > 0) setConfirm({ key, lost });
    else save(key, on);
  };
  return { pending, error, confirm, setConfirm, save, request };
}

type Toggle = ReturnType<typeof useToggle>;

/** Turning a parent off names what goes with it, and asks first. */
function ConfirmarApagar({ t }: { readonly t: Toggle }) {
  const c = t.confirm;
  const lost = c?.lost.map((k) => FUNCION[k].nombre).join(', ') ?? '';
  const etiqueta = (c?.lost.length ?? 0) > 1 ? 'Apagar todas' : 'Apagar las dos';
  return (
    <ConfirmDialog
      open={c !== null}
      onOpenChange={(o) => (o ? null : t.setConfirm(null))}
      title={`¿Apagar ${c ? FUNCION[c.key].nombre : ''}?`}
      body={`También se apaga ${lost}, porque depende de ella. Tus datos se guardan; solo dejan de verse en la caja.`}
      cancelLabel="Mejor no"
      confirmLabel={t.pending ? 'Guardando…' : etiqueta}
      destructive
      onConfirm={() => (c === null ? undefined : t.save(c.key, false))}
    />
  );
}

export interface FuncionesProps {
  readonly flags: FeatureFlags;
  readonly planId: PlanId;
  readonly platform: Readonly<Record<FeatureFlagKey, boolean>>;
  readonly owner: boolean;
}

/** The screen with the session resolved; the harness renders this one directly. */
export function FuncionesVista(props: FuncionesProps) {
  const t = useToggle(props.flags);
  const rows = flagRows(props.flags, props.planId, props.platform);
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const padreOn = (k: FeatureFlagKey) => {
    const p = FEATURE_FLAG_DEPENDENCIES[k];
    return p ? (byKey.get(p)?.activada ?? false) : null;
  };
  return (
    <div className={f.pila}>
      <MiNegocioHead activo="funciones" />
      {t.error === null ? null : <Banner tone="critical" title={t.error} />}
      <section className={f.panel} aria-labelledby="funciones-titulo">
        <FuncionesCabeza prendidas={rows.filter((r) => r.activada).length} total={rows.length} />
        {ORDEN.map((k) => byKey.get(k)).map((r) =>
          r ? (
            <FuncionFila
              key={r.key}
              r={r}
              padreOn={padreOn(r.key)}
              mayWrite={props.owner}
              onToggle={t.request}
            />
          ) : null,
        )}
      </section>
      <ConfirmarApagar t={t} />
    </div>
  );
}

/** `null` flags: the read threw. */
export function FuncionesScreen({ flags }: { readonly flags: FeatureFlags | null }) {
  const s = useSession();
  if (flags === null) {
    return (
      <div className={f.pila}>
        <MiNegocioHead activo="funciones" />
        <ScreenBody state="error" onRetry={() => window.location.reload()}>
          {null}
        </ScreenBody>
      </div>
    );
  }
  return (
    <FuncionesVista
      flags={flags}
      planId={s.planId}
      platform={s.platform}
      owner={s.role === 'owner'}
    />
  );
}
