/**
 * The states family (Track M, M-09; MvEstados / the web's `OperadorEstado`)
 * on its own, for review: cargando, sin-nada, falla, sin-internet. Every
 * M-09 screen shows one of these instead of its data; after M-09 the other
 * screens adopt it too.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { initI18n } from '../../i18n/index';
import { Marco } from '../Inicio/story-marco';
import { EstadosCaja, type EstadoCaja } from './estados';

initI18n();

function Pantalla(p: { readonly id: EstadoCaja }): ReactElement {
  return (
    <Marco layout="phone">
      <View flex={1} backgroundColor="white">
        <EstadosCaja
          id={p.id}
          titulo={p.id === 'sin-nada' ? 'Sin avisos' : undefined}
          cuerpo={p.id === 'sin-nada' ? 'Ni mensajes de Pedro ni avisos de tu caja.' : undefined}
          onRetry={() => undefined}
          testID="estados-story"
        />
      </View>
    </Marco>
  );
}

const meta: Meta<typeof Pantalla> = {
  title: 'Track M / Pantallas / Estados',
  component: Pantalla,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Pantalla>;

export const Cargando: Story = { args: { id: 'cargando' } };
export const SinNada: Story = { args: { id: 'sin-nada' } };
export const Falla: Story = { args: { id: 'falla' } };
export const SinInternet: Story = { args: { id: 'sin-internet' } };
