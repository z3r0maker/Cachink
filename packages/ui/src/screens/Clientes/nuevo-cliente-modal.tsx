/**
 * NuevoClienteModal — the mid-sale "Crear cliente" flow for the
 * Crédito guardrail (P1C-M3-T03) and the Clientes list screen
 * (P1C-M6-T02, later commit).
 *
 * Fields:
 *   - nombre (required, 1-120 chars)
 *   - telefono (optional, matches loose Mexican phone regex)
 *   - email (optional, valid RFC 5322-ish)
 *   - nota (optional, max 500 chars)
 *
 * Pure UI: submit bubbles a CrearClienteInput payload. The caller wires
 * `useCrearCliente` + closes the modal on success.
 */

import { useState, type ReactElement } from 'react';
import type { Client } from '@cachink/domain';
import { Btn, Input, Modal } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import type { CrearClienteInput } from '../../hooks/use-crear-cliente';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface NuevoClienteModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: CrearClienteInput) => void;
  readonly submitting?: boolean;
  /** When provided, the modal opens in edit mode and pre-fills fields. */
  readonly editing?: Client;
}

interface FormState {
  nombre: string;
  telefono: string;
  email: string;
  nota: string;
}

interface FormErrors {
  nombre?: string;
  email?: string;
}

function initialState(editing?: Client): FormState {
  return {
    nombre: editing?.nombre ?? '',
    telefono: editing?.telefono ?? '',
    email: editing?.email ?? '',
    nota: editing?.nota ?? '',
  };
}

function validate(state: FormState, requiredLabel: string, emailInvalid: string): FormErrors {
  const errors: FormErrors = {};
  if (!state.nombre.trim()) errors.nombre = requiredLabel;
  if (state.email && !EMAIL_REGEX.test(state.email.trim())) errors.email = emailInvalid;
  return errors;
}

interface ClienteFieldsProps {
  readonly state: FormState;
  readonly update: (partial: Partial<FormState>) => void;
  readonly errors: FormErrors;
  readonly t: ReturnType<typeof useTranslation>['t'];
}

function ClienteFields(props: ClienteFieldsProps): ReactElement {
  const { state, update, errors, t } = props;
  return (
    <>
      <Input
        label={t('clientes.nombreLabel')}
        value={state.nombre}
        onChange={(v) => update({ nombre: v })}
        note={errors.nombre}
        testID="nuevo-cliente-nombre"
      />
      <Input
        label={t('clientes.telefonoLabel')}
        value={state.telefono}
        onChange={(v) => update({ telefono: v })}
        testID="nuevo-cliente-telefono"
      />
      <Input
        label={t('clientes.emailLabel')}
        value={state.email}
        onChange={(v) => update({ email: v })}
        note={errors.email}
        testID="nuevo-cliente-email"
      />
      <Input
        label={t('clientes.notaLabel')}
        value={state.nota}
        onChange={(v) => update({ nota: v })}
        testID="nuevo-cliente-nota"
      />
    </>
  );
}

function makeSubmit(
  state: FormState,
  t: ReturnType<typeof useTranslation>['t'],
  setErrors: (e: FormErrors) => void,
  onSubmit: NuevoClienteModalProps['onSubmit'],
  reset: () => void,
): () => void {
  return () => {
    const validation = validate(state, t('clientes.required'), t('clientes.emailInvalid'));
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});
    onSubmit({
      nombre: state.nombre.trim(),
      telefono: state.telefono.trim() || undefined,
      email: state.email.trim() || undefined,
      nota: state.nota.trim() || undefined,
    });
    reset();
  };
}

export function NuevoClienteModal(props: NuevoClienteModalProps): ReactElement {
  const { t } = useTranslation();
  const [state, setState] = useState<FormState>(() => initialState(props.editing));
  const [errors, setErrors] = useState<FormErrors>({});
  const update = (partial: Partial<FormState>): void =>
    setState((prev) => ({ ...prev, ...partial }));
  const handleSubmit = makeSubmit(state, t, setErrors, props.onSubmit, () =>
    setState(initialState(props.editing)),
  );
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={props.editing ? props.editing.nombre : t('clientes.nuevo')}
      testID="nuevo-cliente-modal"
    >
      <ClienteFields state={state} update={update} errors={errors} t={t} />
      <Btn
        variant="primary"
        onPress={handleSubmit}
        disabled={props.submitting === true}
        fullWidth
        testID="nuevo-cliente-submit"
      >
        {t('clientes.save')}
      </Btn>
    </Modal>
  );
}
