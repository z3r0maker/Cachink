/**
 * BusinessForm state + validation — extracted from `business-form.tsx`
 * to keep the UI file under the 200-line CLAUDE.md §4.4 budget.
 *
 * Pure: no React imports, no Tamagui, no IO. Only the form-state hook
 * uses React's `useState`. `parseForm` is fully testable in isolation
 * (and is exercised end-to-end by the existing BusinessForm tests).
 */

import { useState } from 'react';
import { NewBusinessSchema, type BusinessId, type DeviceId } from '@cachink/domain';

export const REGIMENES = ['RIF', 'RESICO', 'Asalariados', 'Otro'] as const;
export type Regimen = (typeof REGIMENES)[number];

export interface BusinessFormSubmitInput {
  readonly nombre: string;
  readonly regimenFiscal: Regimen;
  readonly isrTasa: number;
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
    isrTasa: pct / 100,
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

export function useBusinessFormState(defaults: Partial<BusinessFormSubmitInput> | undefined) {
  const [nombre, setNombre] = useState(defaults?.nombre ?? '');
  const [regimen, setRegimen] = useState<Regimen>((defaults?.regimenFiscal as Regimen) ?? 'RIF');
  const [isrTasaPct, setIsrTasaPct] = useState(
    defaults?.isrTasa !== undefined ? String(Math.round(defaults.isrTasa * 100)) : '30',
  );
  const [errors, setErrors] = useState<FormErrors>({});
  return { nombre, setNombre, regimen, setRegimen, isrTasaPct, setIsrTasaPct, errors, setErrors };
}
