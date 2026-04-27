import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from '@tamagui/core';
import { Btn } from './btn';

const meta: Meta<typeof Btn> = {
  title: 'Phase 1A / Primitives / Btn',
  component: Btn,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'dark', 'ghost', 'green', 'danger', 'soft', 'outline'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
  args: { children: 'GUARDAR', variant: 'primary', size: 'md' },
};
export default meta;

type Story = StoryObj<typeof Btn>;

export const Primary: Story = {};
export const Dark: Story = { args: { variant: 'dark' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Green: Story = { args: { variant: 'green' } };
export const Danger: Story = { args: { variant: 'danger', children: 'CANCELAR' } };
export const Soft: Story = { args: { variant: 'soft' } };
export const Outline: Story = { args: { variant: 'outline', children: 'CANCELAR' } };

/** All 7 variants in a vertical stack — designer visual-review surface. */
export const AllVariants: Story = {
  render: () => (
    <View flexDirection="column" gap={12} padding={12}>
      <Btn variant="primary">PRIMARY</Btn>
      <Btn variant="dark">DARK</Btn>
      <Btn variant="ghost">GHOST</Btn>
      <Btn variant="green">GREEN</Btn>
      <Btn variant="danger">DANGER</Btn>
      <Btn variant="soft">SOFT</Btn>
      <Btn variant="outline">OUTLINE</Btn>
    </View>
  ),
};

/** Side-by-side outline + primary — the canonical Cancelar / Guardar pair (mock 3). */
export const CancelGuardar: Story = {
  render: () => (
    <View flexDirection="row" gap={12} padding={12}>
      <Btn variant="outline" fullWidth>
        CANCELAR
      </Btn>
      <Btn variant="primary" fullWidth>
        GUARDAR
      </Btn>
    </View>
  ),
};

/** Pressed state — shown with the `:active` CSS pseudo forced on. */
export const Pressed: Story = {
  parameters: { pseudo: { active: true } },
};

export const Disabled: Story = { args: { disabled: true } };
