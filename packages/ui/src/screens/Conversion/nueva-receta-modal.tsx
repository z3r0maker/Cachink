/**
 * NuevaRecetaModal — form: MP picker + Product picker + quantities.
 * Phase 18.
 */

import { useState, type ReactElement } from 'react';
import { Text } from '@tamagui/core';
import type { Product, ProductId } from '@cachink/domain';
import { Btn, Combobox, Modal } from '../../components/index';
import { IntegerField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import { type FormErrors, type FormState, INITIAL_STATE, validate } from './receta-form-helpers';
import { colors, fontSizes } from '../../theme';

export interface NuevaRecetaModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: RecetaFormPayload) => void;
  readonly submitting?: boolean;
  /** Products where usoProducto in ['materia-prima', 'ambos'] */
  readonly materiasPrimas: readonly Product[];
  /** Products where usoProducto in ['venta', 'ambos'] */
  readonly productosVenta: readonly Product[];
  readonly testID?: string;
}

export interface RecetaFormPayload {
  materiaPrimaId: ProductId;
  productoResultanteId: ProductId;
  cantidadOrigen: number;
  cantidadResultante: number;
}

function ErrorText({ msg }: { msg: string }): ReactElement {
  return (
    <Text fontSize={fontSizes.xs} color={colors.redText}>
      {msg}
    </Text>
  );
}

function useRecetaForm(onSubmit: NuevaRecetaModalProps['onSubmit']) {
  const { t } = useTranslation();
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const setField = (k: keyof FormState, v: string) => setState((p) => ({ ...p, [k]: v }));
  const handleSubmit = (): void => {
    const v = validate(state, t);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    setErrors({});
    onSubmit({
      materiaPrimaId: state.mpId as ProductId,
      productoResultanteId: state.prodId as ProductId,
      cantidadOrigen: Number(state.cantOrigen),
      cantidadResultante: Number(state.cantResultante),
    });
    setState(INITIAL_STATE);
  };
  return { t, state, errors, setField, handleSubmit };
}

type ComboOption = { key: string; label: string };

function PickerFields({
  state,
  errors,
  setField,
  mpOptions,
  prodOptions,
  t,
}: {
  state: FormState;
  errors: FormErrors;
  setField: (k: keyof FormState, v: string) => void;
  mpOptions: ComboOption[];
  prodOptions: ComboOption[];
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <>
      <Combobox
        label={t('conversion.mpLabel')}
        value={state.mpId}
        onChange={(v) => setField('mpId', v)}
        options={mpOptions}
        testID="receta-mp-picker"
      />
      {errors.mp && <ErrorText msg={errors.mp} />}
      <Combobox
        label={t('conversion.productoLabel')}
        value={state.prodId}
        onChange={(v) => setField('prodId', v)}
        options={prodOptions}
        testID="receta-prod-picker"
      />
      {errors.prod && <ErrorText msg={errors.prod} />}
      {errors.mismo && <ErrorText msg={errors.mismo} />}
    </>
  );
}

function QuantityFields({
  state,
  errors,
  setField,
  handleSubmit,
  t,
}: {
  state: FormState;
  errors: FormErrors;
  setField: (k: keyof FormState, v: string) => void;
  handleSubmit: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <>
      <IntegerField
        label={t('conversion.cantidadOrigenLabel')}
        value={state.cantOrigen}
        onChange={(v) => setField('cantOrigen', v)}
        min={1}
        error={errors.cantOrigen}
        testID="receta-cant-origen"
      />
      <IntegerField
        label={t('conversion.cantidadResultanteLabel')}
        value={state.cantResultante}
        onChange={(v) => setField('cantResultante', v)}
        min={1}
        error={errors.cantResultante}
        testID="receta-cant-resultante"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />
    </>
  );
}

export function NuevaRecetaModal(props: NuevaRecetaModalProps): ReactElement {
  const { t, state, errors, setField, handleSubmit } = useRecetaForm(props.onSubmit);
  const mpOptions = props.materiasPrimas.map((p) => ({ key: p.id, label: p.nombre }));
  const prodOptions = props.productosVenta.map((p) => ({ key: p.id, label: p.nombre }));
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('conversion.nuevaReceta')}
      testID={props.testID ?? 'nueva-receta-modal'}
    >
      <PickerFields
        state={state}
        errors={errors}
        setField={setField}
        mpOptions={mpOptions}
        prodOptions={prodOptions}
        t={t}
      />
      <QuantityFields
        state={state}
        errors={errors}
        setField={setField}
        handleSubmit={handleSubmit}
        t={t}
      />
      <Btn
        variant="primary"
        onPress={handleSubmit}
        disabled={props.submitting === true}
        fullWidth
        testID="receta-submit"
      >
        {t('conversion.guardarReceta')}
      </Btn>
    </Modal>
  );
}
