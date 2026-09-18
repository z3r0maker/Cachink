'use client';

import { PLATFORM_FLAG_MODES, type PlatformFlagKey, type PlatformFlagMode } from '@xangarro/domain';

import { ConfirmForm } from '@/components/confirm-form';
import { cambiarFlag } from '@/server/actions/flags';
import type { Candidate } from '@/server/flags/candidates';
import { CONFIRM_OFF, MODE_LABELS } from '@/server/flags/labels';
import { field, input, label, muted } from '@/styles/ui.css';

import { choice, choiceTitle, choices } from './flags.css';

interface Props {
  readonly flagKey: PlatformFlagKey;
  readonly nombre: string;
  readonly current: PlatformFlagMode;
  readonly tenantCount: number;
  readonly candidates: readonly Candidate[];
}

const MODE_HELP: Record<PlatformFlagMode, string> = {
  off: 'Nadie la tiene, sin importar plan ni ajustes del negocio.',
  on: 'Disponible para todos; el plan y el negocio deciden lo demás.',
  allowlist: 'Solo los negocios marcados abajo (beta).',
};

function reach(f: FormData, nombre: string, tenantCount: number): string {
  const listed = f.getAll('allowlist').length;
  switch (String(f.get('mode'))) {
    case 'off':
      return `${nombre} quedará apagado para todos: afecta a ${tenantCount} negocios.`;
    case 'allowlist':
      return `${nombre} solo quedará para ${listed} negocios de la lista; los otros ${Math.max(tenantCount - listed, 0)} no lo tendrán.`;
    default:
      return `${nombre} quedará encendido para los ${tenantCount} negocios.`;
  }
}

function ModeChoices({ current }: { readonly current: PlatformFlagMode }) {
  return (
    <fieldset className={choices}>
      <legend className={label}>Modo</legend>
      {PLATFORM_FLAG_MODES.map((m) => (
        <label key={m} className={choice}>
          <input type="radio" name="mode" value={m} defaultChecked={m === current} required />
          <span>
            <span className={choiceTitle}>{MODE_LABELS[m]}</span>
            {MODE_HELP[m]}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function Allowlist({ candidates }: { readonly candidates: readonly Candidate[] }) {
  if (candidates.length === 0) {
    return <p className={muted}>Busca negocios arriba para armar la lista beta.</p>;
  }
  return (
    <fieldset className={choices}>
      <legend className={label}>Lista beta (solo en modo «Lista beta»)</legend>
      {candidates.map((c) => (
        <label key={c.id} className={choice}>
          <input type="checkbox" name="allowlist" value={c.id} defaultChecked={c.listed} />
          <span>
            <span className={choiceTitle}>{c.nombre}</span>
            {c.ownerEmail ?? c.id}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

/** Mode, allowlist and a mandatory reason, behind a confirmation that states the reach. */
export function EditForm(props: Props) {
  const describe = (f: FormData) =>
    `${reach(f, props.nombre, props.tenantCount)} Motivo: «${String(f.get('reason') ?? '')}». ` +
    'Llega a cada dispositivo en su próxima sincronización y queda en la bitácora.';
  return (
    <ConfirmForm
      action={cambiarFlag}
      trigger="Guardar cambio…"
      describe={describe}
      confirmField={{ name: 'confirmacion', value: CONFIRM_OFF }}
    >
      <input type="hidden" name="key" value={props.flagKey} />
      <ModeChoices current={props.current} />
      <Allowlist candidates={props.candidates} />
      <label className={field}>
        <span className={label}>Motivo (obligatorio)</span>
        <input className={input} name="reason" minLength={3} maxLength={500} required />
      </label>
    </ConfirmForm>
  );
}
