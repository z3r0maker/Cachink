import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from '@tamagui/core';
import { InitialsAvatar } from './initials-avatar';

const meta: Meta<typeof InitialsAvatar> = {
  title: 'Phase 1A / Primitives / InitialsAvatar',
  component: InitialsAvatar,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: { control: 'select', options: ['brand', 'dark'] },
  },
  args: { value: 'Pedro Espinoza', size: 'md', variant: 'brand' },
};
export default meta;

type Story = StoryObj<typeof InitialsAvatar>;

export const Brand: Story = {};
export const Dark: Story = { args: { variant: 'dark', value: 'Director' } };

export const Tappable: Story = {
  args: { value: 'Maria Reyes', onPress: () => null },
};

export const SizesAndVariants: Story = {
  render: () => (
    <View flexDirection="row" gap={16} padding={20}>
      <View flexDirection="column" gap={12} alignItems="center">
        <InitialsAvatar value="PE" size="sm" />
        <InitialsAvatar value="Pedro Espinoza" size="md" />
        <InitialsAvatar value="Pedro Espinoza Reyes" size="lg" />
      </View>
      <View flexDirection="column" gap={12} alignItems="center">
        <InitialsAvatar value="DIR" variant="dark" size="sm" />
        <InitialsAvatar value="Director" variant="dark" size="md" />
        <InitialsAvatar value="Director" variant="dark" size="lg" />
      </View>
    </View>
  ),
};
