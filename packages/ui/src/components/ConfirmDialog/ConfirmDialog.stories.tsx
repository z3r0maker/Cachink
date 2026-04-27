import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from '@tamagui/core';
import { Btn } from '../Btn';
import { ConfirmDialog, type ConfirmDialogProps } from './confirm-dialog';

interface ControlledConfirmDialogProps extends Omit<
  ConfirmDialogProps,
  'open' | 'onClose' | 'onConfirm'
> {
  readonly defaultOpen?: boolean;
}

function ControlledConfirmDialog(
  props: ControlledConfirmDialogProps,
): ReturnType<typeof ConfirmDialog> {
  const [open, setOpen] = useState(props.defaultOpen ?? true);

  return (
    <View padding={16}>
      <Btn onPress={() => setOpen(true)}>Abrir</Btn>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
        }}
        title={props.title}
        description={props.description}
        confirmLabel={props.confirmLabel}
        cancelLabel={props.cancelLabel}
        tone={props.tone}
      />
    </View>
  );
}

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Phase 1A / Primitives / ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ConfirmDialog>;

export const Default: Story = {
  render: () => (
    <ControlledConfirmDialog
      title="Confirmar acción"
      description="Revisa la información antes de continuar."
      confirmLabel="Continuar"
    />
  ),
};

export const Danger: Story = {
  render: () => (
    <ControlledConfirmDialog
      title="Eliminar producto"
      description="Hay unidades en stock. Esta acción eliminará el producto de todas formas."
      confirmLabel="Eliminar"
      tone="danger"
    />
  ),
};
