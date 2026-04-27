/**
 * CorteDeDiaModal — the cash-reconciliation form behind the yellow
 * CorteDeDiaCard CTA (P1C-M7-T02, T03, Slice 3 C3).
 *
 * Layout:
 *   - Efectivo esperado (read-only from the parent's useEfectivoEsperado).
 *   - Efectivo contado (text input, required, non-negative).
 *   - Diferencia (auto-computed live from contado − esperado, color-coded).
 *   - Explicación (text input; required only when diferencia !== 0).
 *   - Guardar Btn.
 *
 * Pure presentation: the caller wires `useCerrarCorteDeDia` on submit
 * and toggles `open`. Form state + validation live in `./corte-form`;
 * display-only cards live in `./corte-parts`. Both splits respect the
 * 200-line file budget (CLAUDE.md §4.4).
 */

import type { ReactElement } from 'react';
import type { Money } from '@cachink/domain';
import { Btn, Modal } from '../../components/index';
import { MoneyField, TextField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import {
  buildPayload,
  computeDiferencia,
  useCorteForm,
  validate,
  type CorteFormApi,
  type CorteFormPayload,
} from './corte-form';
import { DiferenciaCard, EsperadoCard } from './corte-parts';

export interface CorteDeDiaModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (payload: CorteFormPayload) => void;
  readonly esperado: Money;
  readonly submitting?: boolean;
}

interface BodyProps {
  readonly form: CorteFormApi;
  readonly esperado: Money;
  readonly submitting: boolean;
  readonly onSubmit: () => void;
  readonly t: ReturnType<typeof useTranslation>['t'];
}

function ModalBody(props: BodyProps): ReactElement {
  const { form, esperado, t } = props;
  const diferencia = computeDiferencia(form.state.contadoPesos, esperado);
  return (
    <>
      <EsperadoCard esperado={esperado} t={t} />
      <MoneyField
        label={t('corteDeDia.contadoLabel')}
        value={form.state.contadoPesos}
        onChange={(v) => form.update({ contadoPesos: v })}
        note={form.errors.contado}
        testID="corte-contado-input"
        returnKeyType="next"
      />
      <DiferenciaCard diferencia={diferencia} t={t} />
      <TextField
        label={t('corteDeDia.explicacionLabel')}
        placeholder={t('corteDeDia.explicacionOpcional')}
        value={form.state.explicacion}
        onChange={(v) => form.update({ explicacion: v })}
        note={form.errors.explicacion}
        testID="corte-explicacion-input"
        returnKeyType="done"
        onSubmitEditing={props.onSubmit}
        blurOnSubmit
      />
      <Btn
        variant="primary"
        onPress={props.onSubmit}
        disabled={props.submitting}
        fullWidth
        testID="corte-submit"
      >
        {t('corteDeDia.save')}
      </Btn>
    </>
  );
}

function useHandleSubmit(
  form: CorteFormApi,
  props: CorteDeDiaModalProps,
  t: ReturnType<typeof useTranslation>['t'],
): () => void {
  return () => {
    const errors = validate(
      form.state,
      props.esperado,
      t('corteDeDia.contadoRequired'),
      t('corteDeDia.explicacionRequired'),
    );
    if (Object.keys(errors).length > 0) {
      form.setErrors(errors);
      return;
    }
    props.onSubmit(buildPayload(form.state));
    form.reset();
  };
}

export function CorteDeDiaModal(props: CorteDeDiaModalProps): ReactElement {
  const { t } = useTranslation();
  const form = useCorteForm();
  const handleSubmit = useHandleSubmit(form, props, t);

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('corteDeDia.modalTitle')}
      testID="corte-de-dia-modal"
    >
      <ModalBody
        form={form}
        esperado={props.esperado}
        submitting={props.submitting === true}
        onSubmit={handleSubmit}
        t={t}
      />
    </Modal>
  );
}
