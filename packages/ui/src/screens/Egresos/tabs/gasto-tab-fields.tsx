/**
 * Field sub-components for GastoTab. Split out of the tab file to
 * respect the 200-line budget (CLAUDE.md §4.4).
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { ExpenseCategory } from '@cachink/domain';
import { Input } from '../../../components/index';
import type { useTranslation } from '../../../i18n/index';
import { colors, typography } from '../../../theme';
import { GASTO_CATEGORIAS, type GastoFormErrors, type GastoFormState } from './gasto-tab-form';

type T = ReturnType<typeof useTranslation>['t'];

export interface GastoFieldsProps {
  readonly state: GastoFormState;
  readonly update: (partial: Partial<GastoFormState>) => void;
  readonly errors: GastoFormErrors;
  readonly t: T;
}

export function GastoFields(props: GastoFieldsProps): ReactElement {
  const { state, update, errors, t } = props;
  return (
    <>
      <Input
        label={t('nuevoEgreso.conceptoLabel')}
        placeholder={t('nuevoEgreso.conceptoPlaceholder')}
        value={state.concepto}
        onChange={(v) => update({ concepto: v })}
        note={errors.concepto}
        testID="gasto-concepto"
      />
      <Input
        type="select"
        label={t('nuevoEgreso.categoriaLabel')}
        value={state.categoria}
        onChange={(v) => update({ categoria: v as ExpenseCategory })}
        options={GASTO_CATEGORIAS}
        testID="gasto-categoria"
      />
      <Input
        type="number"
        label={t('nuevoEgreso.montoLabel')}
        value={state.montoPesos}
        onChange={(v) => update({ montoPesos: v })}
        note={errors.monto}
        testID="gasto-monto"
      />
      <Input
        label={t('nuevoEgreso.proveedorLabel')}
        value={state.proveedor}
        onChange={(v) => update({ proveedor: v })}
        note={t('nuevoEgreso.proveedorOpcional')}
        testID="gasto-proveedor"
      />
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
      paddingVertical={8}
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
