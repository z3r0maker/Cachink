/**
 * BusinessForm — wizard step 2: create the business (P1C-M2-T05).
 *
 * Fields (minimal per CLAUDE.md §2 principle 1):
 *   - nombre (required, 1-120 chars)
 *   - regimenFiscal (select: RIF, RESICO, Asalariados, Otro)
 *   - isrTasa (number input, % suffix, default 30)
 *
 * Pure UI — validation is sync Zod parse against `NewBusinessSchema` so
 * the form stays consistent with every other entity boundary in the
 * app. The caller (app-shell route) handles the submit side-effect:
 * BusinessesRepository.create → AppConfig.set(currentBusinessId) →
 * navigate to /role-picker.
 *
 * No RHF dependency: three controlled inputs + a submit handler is less
 * code and zero new deps. Form error surfaces per-field via `Input.note`.
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import {
  NewBusinessSchema,
  type NewBusiness,
  type BusinessId,
  type DeviceId,
} from '@cachink/domain';
import { Btn, Input, SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

type T = ReturnType<typeof useTranslation>['t'];

const REGIMENES = ['RIF', 'RESICO', 'Asalariados', 'Otro'] as const;
type Regimen = (typeof REGIMENES)[number];

export interface BusinessFormSubmitInput {
  readonly nombre: string;
  readonly regimenFiscal: Regimen;
  readonly isrTasa: number;
}

export interface BusinessFormProps {
  readonly defaults?: Partial<BusinessFormSubmitInput>;
  readonly onSubmit: (input: BusinessFormSubmitInput) => void;
  readonly submitting?: boolean;
  readonly testID?: string;
}

interface FormErrors {
  nombre?: string;
  regimenFiscal?: string;
  isrTasa?: string;
}

function parseForm(
  nombre: string,
  regimenFiscal: string,
  isrTasaPct: string,
  requiredLabel: string,
): { ok: true; payload: BusinessFormSubmitInput } | { ok: false; errors: FormErrors } {
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

interface FormFieldsProps {
  readonly nombre: string;
  readonly setNombre: (v: string) => void;
  readonly regimen: Regimen;
  readonly setRegimen: (v: Regimen) => void;
  readonly isrTasaPct: string;
  readonly setIsrTasaPct: (v: string) => void;
  readonly errors: FormErrors;
  readonly t: T;
}

function FormFields(props: FormFieldsProps): ReactElement {
  const { t } = props;
  return (
    <>
      <Input
        label={t('wizard.businessForm.nombreLabel')}
        placeholder={t('wizard.businessForm.nombrePlaceholder')}
        value={props.nombre}
        onChange={props.setNombre}
        note={props.errors.nombre}
        testID="business-nombre"
      />
      <Input
        type="select"
        label={t('wizard.businessForm.regimenLabel')}
        value={props.regimen}
        onChange={(value) => props.setRegimen(value as Regimen)}
        options={REGIMENES}
        note={props.errors.regimenFiscal}
        testID="business-regimen"
      />
      <Input
        type="number"
        label={t('wizard.businessForm.isrLabel')}
        value={props.isrTasaPct}
        onChange={props.setIsrTasaPct}
        note={props.errors.isrTasa ?? t('wizard.businessForm.isrHint')}
        testID="business-isr"
      />
    </>
  );
}

function FormHeader({ t }: { t: T }): ReactElement {
  return (
    <>
      <SectionTitle title={t('wizard.businessForm.title')} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={14}
        color={colors.gray600}
      >
        {t('wizard.businessForm.subtitle')}
      </Text>
    </>
  );
}

function useBusinessFormState(defaults: BusinessFormProps['defaults']) {
  const [nombre, setNombre] = useState(defaults?.nombre ?? '');
  const [regimen, setRegimen] = useState<Regimen>((defaults?.regimenFiscal as Regimen) ?? 'RIF');
  const [isrTasaPct, setIsrTasaPct] = useState(
    defaults?.isrTasa !== undefined ? String(Math.round(defaults.isrTasa * 100)) : '30',
  );
  const [errors, setErrors] = useState<FormErrors>({});
  return { nombre, setNombre, regimen, setRegimen, isrTasaPct, setIsrTasaPct, errors, setErrors };
}

function SubmitRow({
  t,
  onSubmit,
  submitting,
}: {
  t: T;
  onSubmit: () => void;
  submitting: boolean;
}): ReactElement {
  return (
    <View marginTop={16}>
      <Btn
        variant="primary"
        onPress={onSubmit}
        disabled={submitting}
        fullWidth
        testID="business-submit"
      >
        {t('wizard.businessForm.saveLabel')}
      </Btn>
    </View>
  );
}

export function BusinessForm(props: BusinessFormProps): ReactElement {
  const { t } = useTranslation();
  const s = useBusinessFormState(props.defaults);

  function handleSubmit(): void {
    const result = parseForm(s.nombre, s.regimen, s.isrTasaPct, t('wizard.businessForm.required'));
    if (!result.ok) {
      s.setErrors(result.errors);
      return;
    }
    s.setErrors({});
    props.onSubmit(result.payload);
  }

  return (
    <View
      testID={props.testID ?? 'business-form'}
      flex={1}
      padding={24}
      gap={16}
      backgroundColor={colors.offwhite}
    >
      <FormHeader t={t} />
      <FormFields
        nombre={s.nombre}
        setNombre={s.setNombre}
        regimen={s.regimen}
        setRegimen={s.setRegimen}
        isrTasaPct={s.isrTasaPct}
        setIsrTasaPct={s.setIsrTasaPct}
        errors={s.errors}
        t={t}
      />
      <SubmitRow t={t} onSubmit={handleSubmit} submitting={props.submitting === true} />
    </View>
  );
}

export type { NewBusiness };
