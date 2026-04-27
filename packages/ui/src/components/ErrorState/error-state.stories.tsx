/**
 * Storybook catalog for the `<ErrorState>` primitive.
 *
 * Mirrors the EmptyState catalog: real es-MX Cachink copy so the
 * stories double as a UX reference. Audit Round 2 G2 — closes the
 * Storybook coverage gap for ErrorState.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from '@tamagui/core';
import { ErrorState } from './error-state';

const meta: Meta<typeof ErrorState> = {
  title: 'Phase 1A / Primitives / Error State',
  component: ErrorState,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    body: { control: 'text' },
    retryLabel: { control: 'text' },
  },
  args: {
    title: 'No se pudieron cargar las ventas',
    body: 'Revisa tu conexión y vuelve a intentarlo.',
    retryLabel: 'Reintentar',
    onRetry: () => {},
  },
};
export default meta;

type Story = StoryObj<typeof ErrorState>;

/** Canonical happy-path — title + body + retry CTA. */
export const VentasFetchFailed: Story = {
  render: (args) => (
    <View padding={16} width={360}>
      <ErrorState {...args} />
    </View>
  ),
};

/** Egresos screen — different copy, same shape. */
export const EgresosFetchFailed: Story = {
  args: {
    title: 'No se pudieron cargar los egresos',
    body: 'Vuelve a intentarlo. Si el problema continúa, revisa la conexión a la nube.',
    retryLabel: 'Reintentar',
  },
  render: (args) => (
    <View padding={16} width={360}>
      <ErrorState {...args} />
    </View>
  ),
};

/** Non-actionable — unrecoverable error, no retry. */
export const Unrecoverable: Story = {
  args: {
    title: 'Versión no compatible',
    body: 'Esta versión de Cachink no es compatible con tu base de datos. Actualiza la app desde la tienda.',
    retryLabel: undefined,
    onRetry: undefined,
  },
  render: (args) => (
    <View padding={16} width={360}>
      <ErrorState {...args} />
    </View>
  ),
};
