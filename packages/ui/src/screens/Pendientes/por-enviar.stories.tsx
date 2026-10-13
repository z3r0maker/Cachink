/**
 * Registros por enviar (Track M, M-09) in its board states — en-espera,
 * sin-internet, enviando, todo-enviado, con-rechazados, cargando — for
 * review against the board `Operador Pendientes`. Fed the caja package's
 * design fixture; the live screen reads `usePorEnviar()` (it replaces the
 * old «No enviados», which showed only rejections).
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { COLA_FIXTURE, type RechazoVisto } from '@xangarro/caja/pendientes';
import { initI18n } from '../../i18n/index';
import { Marco } from '../Inicio/story-marco';
import { PorEnviarScreen } from './por-enviar-screen';

initI18n();

type Situacion =
  | 'en-espera'
  | 'sin-internet'
  | 'enviando'
  | 'todo-enviado'
  | 'con-rechazados'
  | 'cargando'
  | 'error';

/** What the server refused, with its sentence (the old «No enviados»). */
const RECHAZADOS: readonly RechazoVisto[] = [
  {
    key: 'sales:r-1',
    tabla: 'sales',
    fila: 'r-1',
    titulo: 'Venta',
    detalle: '$120.00 · Tacos',
    razon: 'El producto de este registro ya no existe en el portal.',
    pista: 'El producto fue eliminado — regístrala con otro producto.',
    reintentando: false,
  },
  {
    key: 'client_payments:r-2',
    tabla: 'client_payments',
    fila: 'r-2',
    titulo: 'Pago de cliente',
    detalle: 'Chuy',
    razon: 'El cliente de este registro ya no existe en el portal.',
    pista: 'El cliente fue eliminado — regístrala sin cliente o con otro.',
    reintentando: false,
  },
];

function Pantalla(p: { readonly situacion: Situacion }): ReactElement {
  const s = p.situacion;
  const conRechazados = s === 'con-rechazados';
  return (
    <Marco layout="phone">
      <View flex={1}>
        <PorEnviarScreen
          state={
            s === 'cargando'
              ? 'cargando'
              : s === 'error'
                ? 'error'
                : s === 'sin-internet'
                  ? 'sin-internet'
                  : 'happy'
          }
          fase={
            s === 'todo-enviado'
              ? 'enviado'
              : s === 'enviando'
                ? 'enviando'
                : conRechazados
                  ? 'con-rechazados'
                  : 'espera'
          }
          cola={s === 'todo-enviado' || conRechazados ? [] : COLA_FIXTURE}
          rechazados={conRechazados ? RECHAZADOS : []}
          dueno="Pedro"
          ultima="14:55"
          onReintentar={() => undefined}
          onReintentarRechazado={() => undefined}
          onIrACierre={() => undefined}
          onRetry={() => undefined}
        />
      </View>
    </Marco>
  );
}

const meta: Meta<typeof Pantalla> = {
  title: 'Track M / Pantallas / Registros por enviar',
  component: Pantalla,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Pantalla>;

export const EnEspera: Story = { args: { situacion: 'en-espera' } };
export const SinInternet: Story = { args: { situacion: 'sin-internet' } };
export const Enviando: Story = { args: { situacion: 'enviando' } };
export const TodoEnviado: Story = { args: { situacion: 'todo-enviado' } };
export const ConRechazados: Story = { args: { situacion: 'con-rechazados' } };
export const Cargando: Story = { args: { situacion: 'cargando' } };
export const Error: Story = { args: { situacion: 'error' } };
