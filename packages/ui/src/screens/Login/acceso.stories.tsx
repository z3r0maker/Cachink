/**
 * Acceso (MvAcceso): «¿Quién va a cobrar?» with the NIP pad. Example
 * operators for review only; the gate feeds the portal's operators.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { initI18n } from '../../i18n/index';
import { Marco } from '../Inicio/story-marco';
import { AccesoScreen } from './acceso-screen';

initI18n();

const OPERADORES = [
  { id: 'ana', nombre: 'Ana Robledo', iniciales: 'AR', detalle: 'Turno abierto desde las 08:15' },
  { id: 'luis', nombre: 'Luis Ortega', iniciales: 'LO' },
  { id: 'pedro', nombre: 'Pedro Salas', iniciales: 'PS' },
];

function Pantalla(props: { error: boolean }): ReactElement {
  return (
    <Marco>
      <AccesoScreen
        operadores={OPERADORES}
        contexto="Caja 1 · Taquería Don Pedro"
        fecha="Jueves 14 de mayo"
        dueno="Pedro"
        onAuthenticate={() => undefined}
        error={props.error ? 'Ese NIP no es. Revísalo e intenta otra vez.' : null}
        submitting={false}
      />
    </Marco>
  );
}

const meta: Meta<typeof Pantalla> = {
  title: 'Track M / Pantallas / Acceso',
  component: Pantalla,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Pantalla>;

export const Acceso: Story = { args: { error: false } };
export const NipEquivocado: Story = { args: { error: true } };
