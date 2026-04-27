/**
 * Storybook catalog for `<PasswordField>` + `<RhfPasswordField>`.
 *
 * Masked by default with a brand `<Btn>` ghost show/hide toggle (eye
 * / eye-off Lucide icons — never an emoji). Sign-in flows use the
 * default `autoComplete="current-password"`; sign-up flows pass
 * `autoComplete="new-password"`. Audit Round 2 G2.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from '@tamagui/core';
import { Btn } from '../Btn/index';
import { PasswordField } from './password-field';
import { RhfPasswordField } from './controlled';

const meta: Meta<typeof PasswordField> = {
  title: 'Phase 1A / Fields / PasswordField',
  component: PasswordField,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof PasswordField>;

/** Sign-in default — masked, current-password autofill. */
export const SignIn: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <View padding={16} width={360}>
        <PasswordField
          label="Contraseña"
          value={value}
          onChange={setValue}
          autoComplete="current-password"
        />
      </View>
    );
  },
};

/** Sign-up — same primitive with `autoComplete="new-password"`. */
export const SignUp: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <View padding={16} width={360}>
        <PasswordField
          label="Crea una contraseña"
          value={value}
          onChange={setValue}
          autoComplete="new-password"
        />
      </View>
    );
  },
};

interface SignInForm {
  readonly password: string;
}

/** RHF wrapper — sign-in row. */
export const RhfControlled: Story = {
  render: () => {
    const { control, handleSubmit } = useForm<SignInForm>({
      defaultValues: { password: '' },
    });
    return (
      <View padding={16} width={360} gap={12}>
        <RhfPasswordField control={control} name="password" label="Contraseña" />
        <Btn onPress={handleSubmit(() => {})}>INICIAR SESIÓN</Btn>
      </View>
    );
  },
};
