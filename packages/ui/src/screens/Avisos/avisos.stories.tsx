/**
 * Avisos (Track M, M-09) in its board states — de-los-patrones, de-tu-caja,
 * respondido, responder (the sheet), sin-avisos, cargando, error-al-leer —
 * for review against the board `Operador Avisos`. Fed the caja package's
 * design fixture; the live screen reads `useAvisos()`.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { Aviso, AvisosData } from '@xangarro/caja/avisos';
import { AVISOS_FIXTURE } from '@xangarro/caja/avisos';
import { initI18n } from '../../i18n/index';
import { Marco } from '../Inicio/story-marco';
import { AvisosScreen, type AvisosEstado } from './avisos-screen';
import { ResponderSheet } from './responder-sheet';

initI18n();

type Situacion =
  | 'de-los-patrones'
  | 'de-tu-caja'
  | 'respondido'
  | 'responder'
  | 'sin-avisos'
  | 'cargando'
  | 'error-al-leer';

/** The corte message, answered: «Les mandaste tu respuesta a los patrones». */
const RESPONDIDO: readonly Aviso[] = AVISOS_FIXTURE.avisos.map((a) =>
  a.id === 'corte'
    ? { ...a, respuesta: 'Creo que di cambio de más a un cliente.', leido: true }
    : a,
);

const DATA: Record<Situacion, AvisosData | null> = {
  'de-los-patrones': AVISOS_FIXTURE,
  'de-tu-caja': AVISOS_FIXTURE,
  respondido: { ...AVISOS_FIXTURE, avisos: RESPONDIDO },
  responder: { ...AVISOS_FIXTURE, avisos: RESPONDIDO },
  'sin-avisos': { avisos: [] },
  cargando: null,
  'error-al-leer': null,
};

const ESTADO: Record<Situacion, AvisosEstado> = {
  'de-los-patrones': 'happy',
  'de-tu-caja': 'happy',
  respondido: 'happy',
  responder: 'happy',
  'sin-avisos': 'sin-avisos',
  cargando: 'cargando',
  'error-al-leer': 'error',
};

function Pantalla(p: { readonly situacion: Situacion }): ReactElement {
  const abrirRespuesta = p.situacion === 'responder';
  const data = DATA[p.situacion];
  const corte = AVISOS_FIXTURE.avisos.find((a) => a.id === 'corte') ?? null;
  return (
    <Marco layout="phone">
      <View flex={1}>
        <AvisosScreen
          state={ESTADO[p.situacion]}
          data={data}
          tab={p.situacion === 'de-tu-caja' ? 'caja' : 'dueno'}
          onAbrir={() => undefined}
          onRetry={() => undefined}
        />
        {abrirRespuesta && corte ? (
          <ResponderSheet
            open
            aviso={corte}
            onClose={() => undefined}
            onEnviar={async () => null}
          />
        ) : null}
      </View>
    </Marco>
  );
}

const meta: Meta<typeof Pantalla> = {
  title: 'Track M / Pantallas / Avisos',
  component: Pantalla,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Pantalla>;

export const DeLosPatrones: Story = { args: { situacion: 'de-los-patrones' } };
export const DeTuCaja: Story = { args: { situacion: 'de-tu-caja' } };
export const Respondido: Story = { args: { situacion: 'respondido' } };
export const Responder: Story = { args: { situacion: 'responder' } };
export const SinAvisos: Story = { args: { situacion: 'sin-avisos' } };
export const Cargando: Story = { args: { situacion: 'cargando' } };
export const ErrorAlLeer: Story = { args: { situacion: 'error-al-leer' } };
