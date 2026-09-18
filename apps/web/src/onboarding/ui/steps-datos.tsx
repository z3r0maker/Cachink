'use client';

import type { PaymentMethod, TipoNegocio, WizardAnswers } from '@xangarro/domain';

import { Input } from '@/components';

import { METODOS_COBRO, TIPO_NEGOCIO, isWhatsapp, toYesNo, yesNo } from '../choices';
import { PickMany, PickOne } from './choice-cards';
import { stack } from './onboarding.css';

/** What every step body receives: the step's draft and a way to change it. */
export interface StepProps {
  readonly draft: WizardAnswers;
  readonly set: (patch: WizardAnswers) => void;
}

/** Paso 1 — nombre + tipo de negocio. */
export function PasoNegocio({ draft, set }: StepProps) {
  return (
    <div className={stack}>
      <Input
        labelText="Nombre de tu negocio"
        value={draft.nombre ?? ''}
        maxLength={120}
        onChange={(e) => set({ nombre: e.target.value })}
        data-testid="wizard-nombre"
      />
      <PickOne
        label="Tipo de negocio"
        choices={TIPO_NEGOCIO}
        value={draft.tipoNegocio ?? null}
        onChange={(v) => set({ tipoNegocio: v as TipoNegocio })}
      />
    </div>
  );
}

/** Paso 2 — ¿cómo cobras? (varias). */
export function PasoCobro({ draft, set }: StepProps) {
  return (
    <PickMany
      label="Formas de cobro"
      choices={METODOS_COBRO}
      values={draft.metodosCobro ?? []}
      onChange={(v) => set({ metodosCobro: v as PaymentMethod[] })}
    />
  );
}

/** Paso 6 — WhatsApp + logo. */
export function PasoContacto({ draft, set }: StepProps) {
  const phone = draft.whatsapp ?? '';
  return (
    <div className={stack}>
      <Input
        labelText="WhatsApp del negocio"
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        hintText="10 dígitos. Opcional."
        error={phone !== '' && !isWhatsapp(phone) ? 'Escribe 10 dígitos.' : undefined}
        onChange={(e) => set({ whatsapp: e.target.value })}
        data-testid="wizard-whatsapp"
      />
      <PickOne
        label="¿Tienes logo?"
        choices={yesNo(
          'Sí, tengo logo',
          'Lo subes en Negocio cuando quieras.',
          'Todavía no',
          'Tus comprobantes salen con tu nombre.',
        )}
        value={toYesNo(draft.hasLogo)}
        onChange={(v) => set({ hasLogo: v === 'si' })}
      />
    </div>
  );
}
