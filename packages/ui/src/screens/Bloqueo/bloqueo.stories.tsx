/**
 * Bloqueo (MvBloqueo): the locked caja asks the same person for their NIP.
 * Example data for review only.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import type { UserId } from '@xangarro/domain';
import { initI18n } from '../../i18n/index';
import { Marco } from '../Inicio/story-marco';
import { BloqueoScreen } from './bloqueo-screen';

initI18n();

function Pantalla(): ReactElement {
  return (
    <Marco>
      <BloqueoScreen
        contexto="Caja 1 · Taquería Don Pedro"
        userId={'ana' as UserId}
        operador={{
          nombre: 'Ana Robledo',
          iniciales: 'AR',
          detalle: 'Turno abierto desde las 08:15',
        }}
        onUnlock={() => undefined}
        onCambiar={() => undefined}
        error={null}
        submitting={false}
      />
    </Marco>
  );
}

const meta: Meta<typeof Pantalla> = {
  title: 'Track M / Pantallas / Bloqueo',
  component: Pantalla,
  parameters: { layout: 'centered' },
};
export default meta;

export const Bloqueo: StoryObj<typeof Pantalla> = {};
