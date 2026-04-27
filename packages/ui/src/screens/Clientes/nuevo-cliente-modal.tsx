/**
 * NuevoClienteModal — the mid-sale "Crear cliente" flow for the
 * Crédito guardrail (P1C-M3-T03) and the Clientes list screen
 * (P1C-M6-T02). Migrated to RHF + zodResolver as part of audit M-1
 * PR 2.5 — the first of the 15 form migrations.
 *
 * Fields:
 *   - nombre (required, 1-120 chars)
 *   - telefono (optional, matches loose Mexican phone regex)
 *   - email (optional, valid RFC 5322-ish)
 *   - nota (optional, max 500 chars)
 *
 * Pure UI: submit bubbles a CrearClienteInput payload. The caller wires
 * `useCrearCliente` + closes the modal on success.
 *
 * Each field uses the `<Rhf*Field>` wrappers from
 * `@cachink/ui/components/fields/controlled` so a Zod-validated row is
 * one line at the call site.
 */

import { useEffect, type ReactElement } from 'react';
import type { Control } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Client } from '@cachink/domain';
import { Btn, Modal } from '../../components/index';
import { RhfEmailField, RhfPhoneField, RhfTextField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import type { CrearClienteInput } from '../../hooks/use-crear-cliente';

/**
 * Form-only schema. Omits `businessId` (added by `useCrearCliente`)
 * and uses optional-empty-string semantics so the optional fields
 * round-trip through controlled `<Input>` state without forcing the
 * user to leave them as `undefined`. Phone regex matches the
 * entity-level `ClientSchema` from `@cachink/domain`.
 */
const NuevoClienteFormSchema = z.object({
  nombre: z.string().min(1).max(120),
  telefono: z
    .string()
    .regex(/^[\d\s+\-()]{7,20}$/)
    .or(z.literal(''))
    .optional(),
  email: z.string().email().or(z.literal('')).optional(),
  nota: z.string().max(500).or(z.literal('')).optional(),
});

type NuevoClienteFormValues = z.infer<typeof NuevoClienteFormSchema>;

export interface NuevoClienteModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: CrearClienteInput) => void;
  readonly submitting?: boolean;
  /** When provided, the modal opens in edit mode and pre-fills fields. */
  readonly editing?: Client;
}

function defaults(editing?: Client): NuevoClienteFormValues {
  return {
    nombre: editing?.nombre ?? '',
    telefono: editing?.telefono ?? '',
    email: editing?.email ?? '',
    nota: editing?.nota ?? '',
  };
}

function toPayload(values: NuevoClienteFormValues): CrearClienteInput {
  return {
    nombre: values.nombre.trim(),
    telefono: values.telefono?.trim() || undefined,
    email: values.email?.trim() || undefined,
    nota: values.nota?.trim() || undefined,
  };
}

interface ClienteFieldsProps {
  readonly control: Control<NuevoClienteFormValues>;
  readonly t: ReturnType<typeof useTranslation>['t'];
  readonly onSubmitEditing: () => void;
}

function ClienteFields({ control, t, onSubmitEditing }: ClienteFieldsProps): ReactElement {
  return (
    <>
      <RhfTextField
        control={control}
        name="nombre"
        label={t('clientes.nombreLabel')}
        errorMessage={t('clientes.required')}
        testID="nuevo-cliente-nombre"
        returnKeyType="next"
      />
      <RhfPhoneField
        control={control}
        name="telefono"
        label={t('clientes.telefonoLabel')}
        testID="nuevo-cliente-telefono"
        returnKeyType="next"
      />
      <RhfEmailField
        control={control}
        name="email"
        label={t('clientes.emailLabel')}
        errorMessage={t('clientes.emailInvalid')}
        testID="nuevo-cliente-email"
        returnKeyType="next"
      />
      <RhfTextField
        control={control}
        name="nota"
        label={t('clientes.notaLabel')}
        testID="nuevo-cliente-nota"
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
      />
    </>
  );
}

export function NuevoClienteModal(props: NuevoClienteModalProps): ReactElement {
  const { t } = useTranslation();
  const form = useForm<NuevoClienteFormValues>({
    resolver: zodResolver(NuevoClienteFormSchema),
    defaultValues: defaults(props.editing),
    mode: 'onSubmit',
  });
  useEffect(() => {
    form.reset(defaults(props.editing));
  }, [props.editing, form]);
  const submit = form.handleSubmit((values) => {
    props.onSubmit(toPayload(values));
    form.reset(defaults(props.editing));
  });
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={props.editing ? props.editing.nombre : t('clientes.nuevo')}
      testID="nuevo-cliente-modal"
    >
      <ClienteFields control={form.control} t={t} onSubmitEditing={submit} />
      <Btn
        variant="primary"
        onPress={submit}
        disabled={props.submitting === true}
        fullWidth
        testID="nuevo-cliente-submit"
      >
        {t('clientes.save')}
      </Btn>
    </Modal>
  );
}
