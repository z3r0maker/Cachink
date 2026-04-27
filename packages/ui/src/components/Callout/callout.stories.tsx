/**
 * Storybook catalog for `<Callout>`. Three tones + an action-slot story
 * exercise every prop surface (CLAUDE.md §8.4 — primitives ship with
 * Storybook coverage before consumers use them).
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Btn } from '../Btn/btn';
import { Callout } from './callout';

const meta: Meta<typeof Callout> = {
  title: 'Phase 1A / Primitives / Callout',
  component: Callout,
  tags: ['autodocs'],
  argTypes: {
    tone: { control: 'select', options: ['success', 'warning', 'info'] },
  },
  args: {
    tone: 'success',
    title: '✅ Tus datos se conservan',
    body: 'Tienes 12 ventas, 4 productos y 3 clientes guardados en este dispositivo.',
  },
};
export default meta;

type Story = StoryObj<typeof Callout>;

/** Re-run-wizard data-preserved callout. */
export const Success: Story = {};

/** Cloud sub-flow offline blocker. */
export const Warning: Story = {
  args: {
    tone: 'warning',
    title: 'Necesitas internet',
    body: 'Conecta a Wi-Fi y vuelve a intentar, o elige "Guardar en este dispositivo" por ahora.',
    icon: '📡',
  },
};

/** Neutral disclosure. */
export const Info: Story = {
  args: {
    tone: 'info',
    title: 'Cambiar de modo',
    body: 'Esto desconecta la configuración actual y empieza la nueva.',
  },
};

/** Action-slot story — used by the unsynced-blocker escape-hatch. */
export const WithAction: Story = {
  args: {
    tone: 'warning',
    title: 'Tienes cambios sin sincronizar',
    body: 'Hay 3 cambios pendientes de subir.',
    action: (
      <Btn variant="dark" size="sm">
        Cambiar de todas formas
      </Btn>
    ),
  },
};
