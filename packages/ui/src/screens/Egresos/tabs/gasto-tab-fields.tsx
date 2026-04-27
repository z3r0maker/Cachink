/**
 * Field sub-components for GastoTab. Split out of the tab file to
 * respect the 200-line budget (CLAUDE.md §4.4).
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { ExpenseCategory } from '@cachink/domain';
import { Input } from '../../../components/index';
import { MoneyField, TextField } from '../../../components/fields/index';
import type { useTranslation } from '../../../i18n/index';
import { colors, typography } from '../../../theme';
import { GASTO_CATEGORIAS, type GastoFormErrors, type GastoFormState } from './gasto-tab-form';

type T = ReturnType<typeof useTranslation>['t'];

export interface GastoFieldsProps {
  readonly state: GastoFormState;
  readonly update: (partial: Partial<GastoFormState>) => void;
  readonly errors: GastoFormErrors;
  /**
   * Audit 5.4 — Bluetooth-keyboard Enter-to-submit. Wired on the last
   * keyboard-typed field (`proveedor`) so cashiers using iPad keyboard
   * cases can finish a Gasto Egreso without reaching for the screen.
   */
  readonly onSubmitEditing?: () => void;
  readonly t: T;
}

function ProveedorField(props: GastoFieldsProps): ReactElement {
  const { state, update, onSubmitEditing, t } = props;
  return (
    <TextField
      label={t('nuevoEgreso.proveedorLabel')}
      value={state.proveedor}
      onChange={(v) => update({ proveedor: v })}
      note={t('nuevoEgreso.proveedorOpcional')}
      testID="gasto-proveedor"
      returnKeyType="done"
      onSubmitEditing={onSubmitEditing}
    />
  );
}

export function GastoFields(props: GastoFieldsProps): ReactElement {
  const { state, update, errors, t } = props;
  return (
    <>
      <TextField
        label={t('nuevoEgreso.conceptoLabel')}
        placeholder={t('nuevoEgreso.conceptoPlaceholder')}
        value={state.concepto}
        onChange={(v) => update({ concepto: v })}
        note={errors.concepto}
        testID="gasto-concepto"
        returnKeyType="next"
      />
      <Input
        type="select"
        label={t('nuevoEgreso.categoriaLabel')}
        value={state.categoria}
        onChange={(v) => update({ categoria: v as ExpenseCategory })}
        options={GASTO_CATEGORIAS}
        testID="gasto-categoria"
      />
      <MoneyField
        label={t('nuevoEgreso.montoLabel')}
        value={state.montoPesos}
        onChange={(v) => update({ montoPesos: v })}
        note={errors.monto}
        testID="gasto-monto"
        returnKeyType="next"
      />
      <ProveedorField {...props} />
    </>
  );
}

export interface RecurrenteToggleProps {
  readonly value: boolean;
  readonly onChange: (next: boolean) => void;
  readonly t: T;
}

function ToggleTrack({ on }: { on: boolean }): ReactElement {
  return (
    <View
      width={40}
      height={24}
      borderRadius={12}
      borderWidth={2}
      borderColor={colors.black}
      backgroundColor={on ? colors.yellow : colors.white}
      alignItems={on ? 'flex-end' : 'flex-start'}
      padding={2}
    >
      <View
        width={16}
        height={16}
        borderRadius={8}
        backgroundColor={colors.black}
        testID="gasto-recurrente-toggle-thumb"
      />
    </View>
  );
}

export function RecurrenteToggle(props: RecurrenteToggleProps): ReactElement {
  const { value, onChange, t } = props;
  return (
    <View
      testID="gasto-recurrente-toggle"
      onPress={() => onChange(!value)}
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      // Audit 3.8 — bumped 8 → 14. With the 16-pt toggle track height
      // and 12-pt label, the effective tap target reaches 44 pt
      // (14 + max(16,12) + 14 = 44).
      paddingVertical={14}
      hitSlop={{ top: 4, bottom: 4 }}
      cursor="pointer"
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={12}
        color={colors.gray600}
        letterSpacing={typography.letterSpacing.wide}
        style={{ textTransform: 'uppercase', userSelect: 'none' }}
      >
        {t('nuevoEgreso.recurrenteToggle')}
      </Text>
      <ToggleTrack on={value} />
    </View>
  );
}
