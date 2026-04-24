/**
 * Field sub-components for MovimientoModal. Extracted to respect
 * the 200-line file budget + the 40-line function budget.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { MovementType } from '@cachink/domain';
import { Input } from '../../components/index';
import type { useTranslation } from '../../i18n/index';
import { colors, radii, typography } from '../../theme';
import { ENTRADA_MOTIVOS, SALIDA_MOTIVOS, type MovimientoFormState } from './movimiento-form';

type T = ReturnType<typeof useTranslation>['t'];

function TipoChip({
  tipo,
  active,
  label,
  onChange,
}: {
  tipo: MovementType;
  active: boolean;
  label: string;
  onChange: () => void;
}): ReactElement {
  return (
    <View
      testID={`movimiento-tipo-${tipo}`}
      onPress={onChange}
      backgroundColor={active ? colors.yellow : colors.white}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={radii[1]}
      paddingHorizontal={14}
      paddingVertical={8}
      cursor="pointer"
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={12}
        color={colors.black}
        letterSpacing={typography.letterSpacing.wide}
        style={{ textTransform: 'uppercase', userSelect: 'none' }}
      >
        {label}
      </Text>
    </View>
  );
}

export function TipoToggle({
  value,
  onChange,
  t,
}: {
  value: MovementType;
  onChange: (next: MovementType) => void;
  t: T;
}): ReactElement {
  return (
    <View flexDirection="row" gap={8} testID="movimiento-tipo-toggle">
      <TipoChip
        tipo="entrada"
        active={value === 'entrada'}
        label={t('inventario.entrada')}
        onChange={() => onChange('entrada')}
      />
      <TipoChip
        tipo="salida"
        active={value === 'salida'}
        label={t('inventario.salida')}
        onChange={() => onChange('salida')}
      />
    </View>
  );
}

interface FieldProps {
  state: MovimientoFormState;
  update: (p: Partial<MovimientoFormState>) => void;
  t: T;
  error: string | undefined;
}

function PrimaryMovFields({ state, update, t, error }: FieldProps): ReactElement {
  return (
    <>
      <Input
        type="number"
        label={t('movimiento.cantidadLabel')}
        value={state.cantidad}
        onChange={(v) => update({ cantidad: v })}
        note={error}
        testID="movimiento-cantidad"
      />
      {state.tipo === 'entrada' && (
        <Input
          type="number"
          label={t('movimiento.costoUnitLabel')}
          value={state.costoPesos}
          onChange={(v) => update({ costoPesos: v })}
          testID="movimiento-costo"
        />
      )}
    </>
  );
}

function MotivoAndNota({ state, update, t }: Omit<FieldProps, 'error'>): ReactElement {
  const motivos = state.tipo === 'entrada' ? ENTRADA_MOTIVOS : SALIDA_MOTIVOS;
  return (
    <>
      <Input
        type="select"
        label={t('movimiento.motivoLabel')}
        value={state.motivo}
        onChange={(v) => update({ motivo: v })}
        options={motivos}
        testID="movimiento-motivo"
      />
      <Input
        label={t('movimiento.notaLabel')}
        value={state.nota}
        onChange={(v) => update({ nota: v })}
        note={t('movimiento.notaOpcional')}
        testID="movimiento-nota"
      />
    </>
  );
}

export function MovimientoFields(props: FieldProps): ReactElement {
  return (
    <>
      <PrimaryMovFields {...props} />
      <MotivoAndNota state={props.state} update={props.update} t={props.t} />
    </>
  );
}
