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

export interface NuevaRecetaModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: RecetaFormPayload) => void;
  readonly submitting?: boolean;
  /** Products where usoProducto ∈ ['materia-prima', 'ambos'] */
  readonly materiasPrimas: readonly Product[];
  /** Products where usoProducto ∈ ['venta', 'ambos'] */
  readonly productosVenta: readonly Product[];
  readonly testID?: string;
}

export interface RecetaFormPayload {
  materiaPrimaId: ProductId;
  productoResultanteId: ProductId;
  cantidadOrigen: number;
  cantidadResultante: number;
}

interface FormState {
  mpId: string;
  prodId: string;
  cantOrigen: string;
  cantResultante: string;
}

interface FormErrors {
  mp?: string;
  prod?: string;
  cantOrigen?: string;
  cantResultante?: string;
  mismo?: string;
}

function validate(state: FormState, t: ReturnType<typeof useTranslation>['t']): FormErrors {
  const e: FormErrors = {};
  if (!state.mpId) e.mp = t('conversion.validacion.mpRequired');
  if (!state.prodId) e.prod = t('conversion.validacion.productoRequired');
  if (state.mpId && state.prodId && state.mpId === state.prodId) {
    e.mismo = t('conversion.validacion.mismoProducto');
  }
  const co = Number(state.cantOrigen);
  if (!Number.isInteger(co) || co < 1) e.cantOrigen = t('conversion.validacion.cantidadOrigenMin');
  const cr = Number(state.cantResultante);
  if (!Number.isInteger(cr) || cr < 1) e.cantResultante = t('conversion.validacion.cantidadResultanteMin');
  return e;
}

function ErrorText({ msg }: { msg: string }): ReactElement {
  return <Text fontSize={12} color="$colorDanger">{msg}</Text>;
}

const INITIAL_STATE: FormState = { mpId: '', prodId: '', cantOrigen: '1', cantResultante: '1' };

function useRecetaForm(onSubmit: NuevaRecetaModalProps['onSubmit']) {
  const { t } = useTranslation();
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const setField = (k: keyof FormState, v: string) => setState((p) => ({ ...p, [k]: v }));
  const handleSubmit = (): void => {
    const v = validate(state, t);
    if (Object.keys(v).length > 0) { setErrors(v); return; }
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

export function NuevaRecetaModal(props: NuevaRecetaModalProps): ReactElement {
  const { t, state, errors, setField, handleSubmit } = useRecetaForm(props.onSubmit);
  const mpOptions = props.materiasPrimas.map((p) => ({ key: p.id, label: p.nombre }));
  const prodOptions = props.productosVenta.map((p) => ({ key: p.id, label: p.nombre }));
  return (
    <Modal open={props.open} onClose={props.onClose}
      title={t('conversion.nuevaReceta')} testID={props.testID ?? 'nueva-receta-modal'}>
      <Combobox label={t('conversion.mpLabel')} value={state.mpId}
        onChange={(v) => setField('mpId', v)} options={mpOptions} testID="receta-mp-picker" />
      {errors.mp && <ErrorText msg={errors.mp} />}
      <Combobox label={t('conversion.productoLabel')} value={state.prodId}
        onChange={(v) => setField('prodId', v)} options={prodOptions} testID="receta-prod-picker" />
      {errors.prod && <ErrorText msg={errors.prod} />}
      {errors.mismo && <ErrorText msg={errors.mismo} />}
      <IntegerField label={t('conversion.cantidadOrigenLabel')} value={state.cantOrigen}
        onChange={(v) => setField('cantOrigen', v)} min={1} error={errors.cantOrigen} testID="receta-cant-origen" />
      <IntegerField label={t('conversion.cantidadResultanteLabel')} value={state.cantResultante}
        onChange={(v) => setField('cantResultante', v)} min={1} error={errors.cantResultante}
        testID="receta-cant-resultante" returnKeyType="done" onSubmitEditing={handleSubmit} />
      <Btn variant="primary" onPress={handleSubmit} disabled={props.submitting === true}
        fullWidth testID="receta-submit">
        {t('conversion.guardarReceta')}
      </Btn>
    </Modal>
  );
}
