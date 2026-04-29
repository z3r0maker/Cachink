/**
 * Field sub-components for MovimientoModal. Extracted to respect
 * the 200-line file budget + the 40-line function budget.
 */

import type { ReactElement } from 'react';
import type { MovementType } from '@cachink/domain';
import { Input, SegmentedToggle } from '../../components/index';
import { IntegerField, MoneyField, TextField } from '../../components/fields/index';
import type { useTranslation } from '../../i18n/index';
import { ENTRADA_MOTIVOS, SALIDA_MOTIVOS, type MovimientoFormState } from './movimiento-form';

type T = ReturnType<typeof useTranslation>['t'];

/**
 * Audit M-1 PR 5.5 (audit 3.1) — migrated from inline `<TipoChip>`
 * (paddingY:8, no §8.3 press transform) to `<SegmentedToggle>`. E2E
 * selectors `movimiento-tipo-{entrada,salida}` and
 * `movimiento-tipo-toggle` preserved via testID + testIDPrefix.
 */
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
    <SegmentedToggle<MovementType>
      testID="movimiento-tipo-toggle"
      testIDPrefix="movimiento-tipo"
      value={value}
      onChange={onChange}
      options={[
        { key: 'entrada', label: t('inventario.entrada') },
        { key: 'salida', label: t('inventario.salida') },
      ]}
    />
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
      <IntegerField
        label={t('movimiento.cantidadLabel')}
        value={state.cantidad}
        onChange={(v) => update({ cantidad: v })}
        note={error}
        min={1}
        testID="movimiento-cantidad"
        returnKeyType="next"
      />
      {state.tipo === 'entrada' && (
        <MoneyField
          label={t('movimiento.costoUnitLabel')}
          value={state.costoPesos}
          onChange={(v) => update({ costoPesos: v })}
          testID="movimiento-costo"
          returnKeyType="next"
        />
      )}
    </>
  );
}

function MotivoAndNota({
  state,
  update,
  t,
  onSubmitEditing,
}: Omit<FieldProps, 'error'> & { onSubmitEditing?: () => void }): ReactElement {
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
      <TextField
        label={t('movimiento.notaLabel')}
        value={state.nota}
        onChange={(v) => update({ nota: v })}
        note={t('movimiento.notaOpcional')}
        testID="movimiento-nota"
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
      />
    </>
  );
}

export function MovimientoFields(
  props: FieldProps & {
    /** Audit 5.4 — Bluetooth-keyboard Enter-to-submit. */
    onSubmitEditing?: () => void;
  },
): ReactElement {
  return (
    <>
      <PrimaryMovFields {...props} />
      <MotivoAndNota
        state={props.state}
        update={props.update}
        t={props.t}
        onSubmitEditing={props.onSubmitEditing}
      />
    </>
  );
}
