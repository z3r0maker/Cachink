/**
 * NuevoClienteModal — quick-create a client from a sale (A-09): nombre and
 * teléfono only. Clients are create-only on the device; email, nota and
 * edits live in the portal.
 */

import { useRef, type ReactElement } from 'react';
import type { TextInput } from 'react-native';
import { useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Btn, Modal } from '../../components/index';
import { focusRef, RhfPhoneField, RhfTextField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import type { CrearClienteInput } from '../../hooks/use-crear-cliente';

/** Phone regex matches the entity-level `ClientSchema`. */
const NuevoClienteFormSchema = z.object({
  nombre: z.string().min(1).max(120),
  telefono: z
    .string()
    .regex(/^[\d\s+\-()]{7,20}$/)
    .or(z.literal(''))
    .optional(),
});

type NuevoClienteFormValues = z.infer<typeof NuevoClienteFormSchema>;

const EMPTY: NuevoClienteFormValues = { nombre: '', telefono: '' };

export interface NuevoClienteModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: CrearClienteInput) => void;
  readonly submitting?: boolean;
}

function ClienteFields(props: {
  control: Control<NuevoClienteFormValues>;
  onSubmitEditing: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const telefonoRef = useRef<TextInput>(null);
  return (
    <>
      <RhfTextField
        control={props.control}
        name="nombre"
        label={t('clientes.nombreLabel')}
        errorMessage={t('clientes.required')}
        testID="nuevo-cliente-nombre"
        returnKeyType="next"
        onSubmitEditing={() => focusRef(telefonoRef)}
        blurOnSubmit={false}
      />
      <RhfPhoneField
        control={props.control}
        name="telefono"
        label={t('clientes.telefonoLabel')}
        testID="nuevo-cliente-telefono"
        returnKeyType="done"
        inputRef={telefonoRef}
        onSubmitEditing={props.onSubmitEditing}
      />
    </>
  );
}

export function NuevoClienteModal(props: NuevoClienteModalProps): ReactElement {
  const { t } = useTranslation();
  const form = useForm<NuevoClienteFormValues>({
    resolver: zodResolver(NuevoClienteFormSchema),
    defaultValues: EMPTY,
    mode: 'onSubmit',
  });
  const submit = form.handleSubmit((values) => {
    props.onSubmit({
      nombre: values.nombre.trim(),
      telefono: values.telefono?.trim() || undefined,
    });
    form.reset(EMPTY);
  });
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('clientes.nuevo')}
      testID="nuevo-cliente-modal"
    >
      <ClienteFields control={form.control} onSubmitEditing={submit} />
      <Btn
        variant="primary"
        onPress={submit}
        loading={props.submitting === true}
        fullWidth
        testID="nuevo-cliente-submit"
      >
        {t('clientes.save')}
      </Btn>
    </Modal>
  );
}
