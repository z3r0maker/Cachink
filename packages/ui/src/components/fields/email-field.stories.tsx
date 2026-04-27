/**
 * Storybook catalog for `<EmailField>` + `<RhfEmailField>`.
 *
 * Drives the email keyboard (`@` close at hand, no spacebar) and
 * `autoComplete="email"` so OS / browser autofill can land. Audit
 * Round 2 G2.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from '@tamagui/core';
import { Btn } from '../Btn/index';
import { EmailField } from './email-field';
import { RhfEmailField } from './controlled';

const meta: Meta<typeof EmailField> = {
  title: 'Phase 1A / Fields / EmailField',
  component: EmailField,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof EmailField>;

/** Plain controlled — empty state. */
export const Empty: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <View padding={16} width={360}>
        <EmailField label="Correo" value={value} onChange={setValue} />
      </View>
    );
  },
};

/** Pre-filled. */
export const PreFilled: Story = {
  render: () => {
    const [value, setValue] = useState('maria@ejemplo.com');
    return (
      <View padding={16} width={360}>
        <EmailField label="Correo" value={value} onChange={setValue} />
      </View>
    );
  },
};

interface SignInForm {
  readonly email: string;
}

/** RHF wrapper — Cloud sign-in form row. */
export const RhfControlled: Story = {
  render: () => {
    const { control, handleSubmit } = useForm<SignInForm>({
      defaultValues: { email: '' },
    });
    return (
      <View padding={16} width={360} gap={12}>
        <RhfEmailField control={control} name="email" label="Correo" placeholder="tu@correo.com" />
        <Btn onPress={handleSubmit(() => {})}>INICIAR SESIÓN</Btn>
      </View>
    );
  },
};
