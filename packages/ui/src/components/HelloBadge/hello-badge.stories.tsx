/**
 * Phase 0 sanity-check story — proves the Storybook ↔ Tamagui pipeline
 * against a component we already know renders correctly in both apps and
 * in Vitest. If HelloBadge renders here, every Phase 1A primitive will too.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { HelloBadge } from './hello-badge';

const meta: Meta<typeof HelloBadge> = {
  title: 'Phase 0 / HelloBadge',
  component: HelloBadge,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof HelloBadge>;

export const Default: Story = {};

export const CustomText: Story = {
  args: { label: 'CACHINK!', greeting: '¡Bienvenido, emprendedor!' },
};
