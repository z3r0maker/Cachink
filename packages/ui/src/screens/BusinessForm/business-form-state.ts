/**
 * BusinessForm state + validation — extracted from `business-form.tsx`
 * to keep the UI file under the 200-line CLAUDE.md §4.4 budget.
 *
 * Pure: no React imports, no Tamagui, no IO. Only the form-state hook
 * uses React's `useState`. `parseForm` is fully testable in isolation
 * (and is exercised end-to-end by the existing BusinessForm tests).
 */

import { useCallback, useState } from 'react';
import {
  ISR_DEFAULTS_SEED,
  NewBusinessSchema,
  REGIMENES_FISCALES,
  type BusinessId,
  type DeviceId,
  type IsrDefaults,
  type RegimenFiscal,
} from '@cachink/domain';
import type { OptionCardItem } from '../../components/OptionCardGroup/index';

/** Backward-compat re-export — existing consumers import REGIMENES/Regimen. */
export const REGIMENES = REGIMENES_FISCALES;
export type Regimen = RegimenFiscal;

/** Card-compatible data for OptionCardGroup selector (≤5 options → cards per CLAUDE.md §6). */
export const REGIMEN_CARDS: readonly OptionCardItem<RegimenFiscal>[] = [
  {
    key: 'RIF',
    icon: 'receipt',
    label: 'RIF',
    description: 'Régimen de Incorporación Fiscal.',
  },
  {
    key: 'RESICO',
    icon: 'banknote',
    label: 'RESICO',
    description: 'Régimen Simplificado de Confianza.',
  },
  {
    key: 'Asalariados',
    icon: 'user',
    label: 'Asalariados',
    description: 'Personas físicas con ingresos por salarios.',
  },
  {
    key: 'Otro',
    icon: 'file-text',
    label: 'Otro',
    description: 'Otro régimen o persona moral.',
  },
];

export interface BusinessFormSubmitInput {
  readonly nombre: string;
  readonly regimenFiscal: Regimen;
  readonly isrTasa: number;
  /** Feature flags seeded from wizard business type selection. */
  readonly initialFeatureFlags?: Partial<Record<string, boolean>>;
}

export interface FormErrors {
  nombre?: string;
  regimenFiscal?: string;
  isrTasa?: string;
}

export type ParseResult =
  | { ok: true; payload: BusinessFormSubmitInput }
  | { ok: false; errors: FormErrors };

export function parseForm(
  nombre: string,
  regimenFiscal: string,
  isrTasaPct: string,
  requiredLabel: string,
): ParseResult {
  const errors: FormErrors = {};
  if (!nombre.trim()) errors.nombre = requiredLabel;
  if (!REGIMENES.includes(regimenFiscal as Regimen)) errors.regimenFiscal = requiredLabel;
  const pct = Number(isrTasaPct);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
    errors.isrTasa = requiredLabel;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const payload: BusinessFormSubmitInput = {
    nombre: nombre.trim(),
    regimenFiscal: regimenFiscal as Regimen,
    isrTasa: Math.round(pct * 100),
  };
  // Placeholder ids satisfying Crockford base-32 (no I, L, O, U) — 26 chars.
  const check = NewBusinessSchema.safeParse({
    ...payload,
    logoUrl: null,
    businessId: '01JPHK00000000000000000000' as BusinessId,
    deviceId: '01JPHK00000000000000000001' as DeviceId,
  });
  if (!check.success) {
    return { ok: false, errors: { nombre: requiredLabel } };
  }
  return { ok: true, payload };
}

/**
 * Resolve the ISR default for a given regime from DB-stored defaults.
 * Falls back to the domain-level seed values — never to a hardcoded number.
 */
function resolveIsrPct(regimen: Regimen, isrDefaults: IsrDefaults | undefined): string {
  const defaults = isrDefaults ?? ISR_DEFAULTS_SEED;
  const rate = defaults[regimen] ?? ISR_DEFAULTS_SEED[regimen] ?? 0;
  return String(rate / 100);
}

export interface BusinessFormStateOptions {
  /** Pre-filled values (edit mode or from a previous session). */
  readonly defaults?: Partial<BusinessFormSubmitInput>;
  /** DB-stored ISR defaults keyed by regime. */
  readonly isrDefaults?: IsrDefaults;
}

function parseOpts(
  optsOrDefaults?: Partial<BusinessFormSubmitInput> | BusinessFormStateOptions,
): BusinessFormStateOptions {
  if (optsOrDefaults && 'isrDefaults' in optsOrDefaults)
    return optsOrDefaults as BusinessFormStateOptions;
  return { defaults: optsOrDefaults as Partial<BusinessFormSubmitInput> | undefined };
}

export function useBusinessFormState(
  optsOrDefaults?: Partial<BusinessFormSubmitInput> | BusinessFormStateOptions,
) {
  const opts = parseOpts(optsOrDefaults);
  const defaults = opts.defaults;
  const isrDefaults = opts.isrDefaults;

  const initialRegimen: Regimen = (defaults?.regimenFiscal as Regimen) ?? 'RIF';

  const [nombre, setNombre] = useState(defaults?.nombre ?? '');
  const [regimen, setRegimen] = useState<Regimen>(initialRegimen);
  const [isrTasaPct, setIsrTasaPct] = useState(
    defaults?.isrTasa !== undefined
      ? String(defaults.isrTasa / 100)
      : resolveIsrPct(initialRegimen, isrDefaults),
  );
  const [isrManuallyEdited, setIsrManuallyEdited] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * When regime changes, update ISR if the user hasn't manually edited it.
   * Always auto-fills — `resolveIsrPct` falls back to `ISR_DEFAULTS_SEED`
   * when `isrDefaults` is `undefined` (e.g. query still loading or no prop
   * provided), so the user always sees a regime-appropriate rate.
   */
  const handleRegimenChange = useCallback(
    (newRegimen: Regimen) => {
      setRegimen(newRegimen);
      if (!isrManuallyEdited) {
        setIsrTasaPct(resolveIsrPct(newRegimen, isrDefaults));
      }
    },
    [isrManuallyEdited, isrDefaults],
  );

  /** Mark ISR as manually edited so regime changes don't override it. */
  const handleIsrChange = useCallback((value: string) => {
    setIsrManuallyEdited(true);
    setIsrTasaPct(value);
  }, []);

  return {
    nombre,
    setNombre,
    regimen,
    setRegimen: handleRegimenChange,
    isrTasaPct,
    setIsrTasaPct: handleIsrChange,
    errors,
    setErrors,
  };
}
