/**
 * CreateUserModal — Director creates an Operativo or Director.
 *
 * Fields: nombre, role (select), temporary PIN, recovery password.
 * ADR-049: PIN for login, Password for recovery.
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { UserRole } from '@cachink/domain';
import { Btn, PasswordField, TextField } from '../../components/index';
import { OptionCardGroup, type OptionCardItem } from '../../components/OptionCardGroup/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

const ROLE_CARDS: readonly OptionCardItem<UserRole>[] = [
  {
    key: 'operativo',
    icon: 'user',
    label: 'Operativo',
    description: 'Captura ventas, egresos e inventario.',
  },
  {
    key: 'director',
    icon: 'layout-dashboard',
    label: 'Director',
    description: 'Ve estados financieros, indicadores y reportes.',
  },
];

export interface CreateUserModalProps {
  readonly onSubmit: (input: {
    nombre: string;
    role: UserRole;
    pin: string;
    recoveryPassword: string;
  }) => void;
  readonly onCancel: () => void;
  readonly submitting: boolean;
  readonly testID?: string;
}

function useCreateUserForm() {
  const [nombre, setNombre] = useState('');
  const [role, setRole] = useState<UserRole>('operativo');
  const [pin, setPin] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const valid = nombre.length > 0 && /^\d{6}$/.test(pin) && recoveryPassword.length >= 6;
  return { nombre, setNombre, role, setRole, pin, setPin, recoveryPassword, setRecoveryPassword, valid };
}

type CreateUserForm = ReturnType<typeof useCreateUserForm>;
type T = ReturnType<typeof useTranslation>['t'];

interface CreateUserFormFieldsProps {
  readonly form: CreateUserForm;
  readonly t: T;
}

function CreateUserFormFields({ form, t }: CreateUserFormFieldsProps): ReactElement {
  return (
    <>
      <TextField
        value={form.nombre}
        onChange={form.setNombre}
        label={t('directorSetup.nombre')}
        testID="new-user-nombre"
        required
      />
      <OptionCardGroup
        label="Rol"
        value={form.role}
        onChange={(v) => form.setRole(v)}
        options={ROLE_CARDS}
        testID="new-user-role"
      />
      <PasswordField
        value={form.pin}
        onChange={(v) => form.setPin(v.replace(/\D/g, '').slice(0, 6))}
        label={t('userManagement.tempPin')}
        testID="new-user-pin"
        placeholder="000000"
      />
      <PasswordField
        value={form.recoveryPassword}
        onChange={form.setRecoveryPassword}
        label={t('directorSetup.recoveryPassword')}
        testID="new-user-recovery-password"
      />
    </>
  );
}

interface CreateUserActionsProps {
  readonly onCancel: () => void;
  readonly onSubmit: () => void;
  readonly submitting: boolean;
  readonly valid: boolean;
}

function CreateUserActions(props: CreateUserActionsProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View flexDirection="row" gap={12}>
      <View flex={1}>
        <Btn variant="ghost" onPress={props.onCancel} fullWidth testID="create-user-cancel">
          {t('merma.cancelar')}
        </Btn>
      </View>
      <View flex={1}>
        <Btn
          variant="dark"
          onPress={props.onSubmit}
          fullWidth
          disabled={!props.valid}
          loading={props.submitting}
          testID="create-user-submit"
        >
          {t('directorSetup.submit')}
        </Btn>
      </View>
    </View>
  );
}

export function CreateUserModal(props: CreateUserModalProps): ReactElement {
  const { t } = useTranslation();
  const form = useCreateUserForm();
  const handleSubmit = () =>
    props.onSubmit({
      nombre: form.nombre,
      role: form.role,
      pin: form.pin,
      recoveryPassword: form.recoveryPassword,
    });
  return (
    <View testID={props.testID ?? 'create-user-modal'} padding={16} gap={12}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={22}
        color={colors.black}
      >
        {t('userManagement.create')}
      </Text>
      <CreateUserFormFields form={form} t={t} />
      <CreateUserActions
        onCancel={props.onCancel}
        onSubmit={handleSubmit}
        submitting={props.submitting}
        valid={form.valid}
      />
    </View>
  );
}
