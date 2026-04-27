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

import { type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { type NewBusiness } from '@cachink/domain';
import { Btn, Input, SectionTitle } from '../../components/index';
import { TextField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import {
  parseForm,
  useBusinessFormState,
  type BusinessFormSubmitInput,
  type FormErrors,
  type Regimen,
  REGIMENES,
} from './business-form-state';

type T = ReturnType<typeof useTranslation>['t'];

export interface BusinessFormProps {
  readonly defaults?: Partial<BusinessFormSubmitInput>;
  readonly onSubmit: (input: BusinessFormSubmitInput) => void;
  readonly submitting?: boolean;
  readonly testID?: string;
  /**
   * Optional back-affordance handler. When supplied, a ghost "Atrás" button
   * renders below the primary submit button. The `BusinessGate` in
   * `gated-navigation.tsx` wires this to clear AppConfig `mode`, which
   * flips GatedNavigation back to the wizard for the next paint — same
   * mechanism as Settings → "Re-ejecutar asistente". Omit to render the
   * form without a back affordance (e.g. in isolated stories or tests).
   */
  readonly onBack?: () => void;
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
  /**
   * Enter / Return-on-last-field handler — Audit M-1 PR3.5-T06 +
   * Phase H1: when the user lands on the ISR-tasa field with a
   * Bluetooth keyboard and hits Enter, submit the form. Mirrors the
   * pattern in NuevaVenta / Gasto-Egreso / Nomina.
   */
  readonly onSubmitEditing?: () => void;
}

function FormFields(props: FormFieldsProps): ReactElement {
  const { t } = props;
  return (
    <>
      <TextField
        label={t('wizard.businessForm.nombreLabel')}
        placeholder={t('wizard.businessForm.nombrePlaceholder')}
        value={props.nombre}
        onChange={props.setNombre}
        note={props.errors.nombre}
        testID="business-nombre"
        returnKeyType="next"
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
        returnKeyType="done"
        onSubmitEditing={props.onSubmitEditing}
        blurOnSubmit
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

function BackRow({
  t,
  onBack,
  disabled,
}: {
  t: T;
  onBack: () => void;
  disabled: boolean;
}): ReactElement {
  return (
    <Btn variant="ghost" onPress={onBack} disabled={disabled} fullWidth testID="business-back">
      {t('wizard.businessForm.backLabel')}
    </Btn>
  );
}

interface FormColumnProps {
  readonly s: ReturnType<typeof useBusinessFormState>;
  readonly t: T;
  readonly onSubmit: () => void;
  readonly submitting: boolean;
  readonly onBack?: () => void;
}

function FormColumn({ s, t, onSubmit, submitting, onBack }: FormColumnProps): ReactElement {
  return (
    <View testID="business-form-content" width="100%" maxWidth={480} gap={16}>
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
        onSubmitEditing={onSubmit}
      />
      <SubmitRow t={t} onSubmit={onSubmit} submitting={submitting} />
      {onBack && <BackRow t={t} onBack={onBack} disabled={submitting} />}
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
      backgroundColor={colors.offwhite}
      // Center the form column horizontally + vertically on tablets and
      // desktops, matching the sibling Wizard and RolePicker gate screens.
      // On a phone the inner width:100% + maxWidth:480 collapses gracefully
      // to the available width, so this also works at 320-px viewports.
      alignItems="center"
      justifyContent="center"
    >
      <FormColumn
        s={s}
        t={t}
        onSubmit={handleSubmit}
        submitting={props.submitting === true}
        onBack={props.onBack}
      />
    </View>
  );
}

export type { NewBusiness };
export type { BusinessFormSubmitInput };
