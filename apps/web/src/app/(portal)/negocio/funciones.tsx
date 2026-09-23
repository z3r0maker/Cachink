'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { resolveDisableCascade, type FeatureFlagKey, type FeatureFlags } from '@xangarro/domain';

import { Card, ConfirmDialog, Switch, Tag } from '@/components';
import { FLAG_DESC, FLAG_LABEL, flagRows, type FlagRow } from '@/data/negocio';
import { cambiarFuncion } from '@/server/actions/funciones';
import { useSession } from '@/session/provider';
import { eyebrow } from '@/styles/text.css';

import { cell, colLabel, fieldLabel, flagHead, flagRow, sectionTitle } from './negocio.css';

/**
 * Funciones (P-15): three columns — «Disponible · En tu plan · Activada». The
 * switch exists only where the first two are true, only for the owner, and the
 * server refuses the rest regardless. Turning a parent off asks first when it
 * would take dependents with it (the domain's cascade, not restated here).
 */
function dependentsLost(flags: FeatureFlags, key: FeatureFlagKey): FeatureFlagKey[] {
  const after = resolveDisableCascade(flags, key);
  return (Object.keys(flags) as FeatureFlagKey[]).filter((k) => k !== key && flags[k] && !after[k]);
}

function FlagLine(props: {
  readonly r: FlagRow;
  readonly mayWrite: boolean;
  readonly onToggle: (key: FeatureFlagKey, on: boolean) => void;
}) {
  const { r } = props;
  const editable = r.disponible && r.enTuPlan && props.mayWrite;
  return (
    <div className={flagRow}>
      <span>
        <span style={{ fontWeight: 800, display: 'block' }}>{FLAG_LABEL[r.key]}</span>
        <span className={fieldLabel}>{FLAG_DESC[r.key]}</span>
      </span>
      <span className={cell}>
        {r.disponible ? <Tag tone="success">Sí</Tag> : <Tag tone="neutral">Próximamente</Tag>}
      </span>
      <span className={cell}>
        {r.enTuPlan ? <Tag tone="success">Sí</Tag> : <Tag tone="neutral">No</Tag>}
      </span>
      <span className={cell}>
        {editable ? (
          <Switch
            checked={r.activada}
            label={FLAG_LABEL[r.key]}
            onCheckedChange={(on) => props.onToggle(r.key, on)}
          />
        ) : (
          <Tag tone="neutral">{r.activada ? 'Activada' : '—'}</Tag>
        )}
      </span>
    </div>
  );
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

export function FuncionesCard({ flags }: { readonly flags: FeatureFlags }) {
  const session = useSession();
  const t = useToggle(flags);
  const lostNames = t.confirm?.lost.map((k) => FLAG_LABEL[k]).join(', ') ?? '';
  return (
    <Card>
      <div className={sectionTitle} style={{ marginBottom: 6 }}>
        Funciones del negocio
      </div>
      <p className={fieldLabel} style={{ marginBottom: 14 }}>
        Activa o desactiva las funciones que necesita tu negocio.
      </p>
      {t.error === null ? null : (
        <p role="alert" data-testid="funciones-error">
          {t.error}
        </p>
      )}
      <div className={flagHead}>
        <span className={eyebrow}>Función</span>
        <span className={colLabel}>Disponible</span>
        <span className={colLabel}>En tu plan</span>
        <span className={colLabel}>Activada</span>
      </div>
      {flagRows(flags, session.planId, session.platform).map((r) => (
        <FlagLine key={r.key} r={r} mayWrite={session.role === 'owner'} onToggle={t.request} />
      ))}
      <ConfirmDialog
        open={t.confirm !== null}
        onOpenChange={(o) => (o ? null : t.setConfirm(null))}
        title={`También se apagará: ${lostNames}`}
        body="Los datos se conservarán pero no serán visibles. ¿Continuar?"
        confirmLabel={t.pending ? 'Guardando…' : 'Apagar'}
        destructive
        onConfirm={() => (t.confirm === null ? undefined : t.save(t.confirm.key, false))}
      />
    </Card>
  );
}
