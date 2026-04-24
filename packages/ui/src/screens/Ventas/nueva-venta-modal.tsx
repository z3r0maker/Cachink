/**
 * NuevaVentaModal — the form behind the Ventas "+ Nueva Venta" CTA
 * (P1C-M3-T02, T03).
 *
 * Pure UI: submit bubbles a NewSale payload through `onSubmit`. The
 * caller wires `useRegistrarVenta` + closes the modal on success.
 * Validation + form state live in `./nueva-venta-form` so this file
 * stays within the 200-line file budget (CLAUDE.md §4.4).
 */

import type { ReactElement } from 'react';
import type { BusinessId, Client, NewSale } from '@cachink/domain';
import { Btn, Modal } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import {
  buildPayload,
  useNuevaVentaForm,
  validate,
  type NuevaVentaFormApi,
} from './nueva-venta-form';
import { ClienteField, CoreFields } from './nueva-venta-fields';

export interface NuevaVentaModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: NewSale) => void;
  readonly fecha: string;
  readonly businessId: BusinessId;
  readonly clientes: readonly Client[];
  readonly onCrearCliente?: () => void;
  readonly submitting?: boolean;
}

interface BodyProps {
  readonly form: NuevaVentaFormApi;
  readonly clientes: readonly Client[];
  readonly onCrearCliente?: () => void;
  readonly submitting: boolean;
  readonly onSubmit: () => void;
  readonly t: ReturnType<typeof useTranslation>['t'];
}

function ModalBody(props: BodyProps): ReactElement {
  return (
    <>
      <CoreFields
        state={props.form.state}
        update={props.form.update}
        errors={props.form.errors}
        clientes={props.clientes}
        t={props.t}
      />
      <ClienteField
        state={props.form.state}
        update={props.form.update}
        errors={props.form.errors}
        clientes={props.clientes}
        onCrearCliente={props.onCrearCliente}
        t={props.t}
      />
      <Btn
        variant="primary"
        onPress={props.onSubmit}
        disabled={props.submitting}
        fullWidth
        testID="nueva-venta-submit"
      >
        {props.t('nuevaVenta.save')}
      </Btn>
    </>
  );
}

function useHandleSubmit(
  form: NuevaVentaFormApi,
  props: NuevaVentaModalProps,
  t: ReturnType<typeof useTranslation>['t'],
): () => void {
  return () => {
    const validation = validate(form.state, t('clientes.required'));
    if (Object.keys(validation).length > 0) {
      form.setErrors(validation);
      return;
    }
    try {
      const payload = buildPayload(form.state, props.fecha, props.businessId);
      props.onSubmit(payload);
      form.reset();
    } catch {
      form.setErrors({ concepto: t('clientes.required') });
    }
  };
}

export function NuevaVentaModal(props: NuevaVentaModalProps): ReactElement {
  const { t } = useTranslation();
  const form = useNuevaVentaForm();
  const handleSubmit = useHandleSubmit(form, props, t);

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('nuevaVenta.title')}
      testID="nueva-venta-modal"
    >
      <ModalBody
        form={form}
        clientes={props.clientes}
        onCrearCliente={props.onCrearCliente}
        submitting={props.submitting === true}
        onSubmit={handleSubmit}
        t={t}
      />
    </Modal>
  );
}
