/**
 * Avisos (Track M, M-09) for review against the board MvAvisos, with the
 * design's notices (`AVISOS_FIXTURE`); the live route reads the owner's
 * messages pulled to the phone and the caja's own state.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { AVISOS_FIXTURE, type AvisosData } from '@xangarro/caja/avisos';
import { initI18n } from '../../i18n/index';
import { rutaMovil } from '../Inicio/inicio-rutas';
import { MarcoDetalle } from '../Inventario/marco-detalle';
import { AvisosScreen } from './avisos-screen';

initI18n();

type Vista = 'pedro' | 'caja' | 'respondido' | 'vacio' | 'cargando' | 'error';

function respondido(): AvisosData {
  return {
    ...AVISOS_FIXTURE,
    avisos: AVISOS_FIXTURE.avisos.map((a) =>
      a.id === 'corte'
        ? { ...a, leido: true, respuesta: 'Creo que di cambio de más a un cliente.' }
        : a,
    ),
  };
}

function Demo({ vista }: { vista: Vista }): ReactElement {
  const state = vista === 'cargando' ? 'loading' : vista === 'error' ? 'error' : 'happy';
  const data =
    vista === 'respondido'
      ? respondido()
      : vista === 'vacio'
        ? { ...AVISOS_FIXTURE, avisos: [] }
        : AVISOS_FIXTURE;
  return (
    <MarcoDetalle ruta="/avisos" volver="Inicio" avisos={vista === 'respondido' ? 1 : 2}>
      <AvisosScreen
        state={state}
        data={data}
        tabInicial={vista === 'caja' ? 'caja' : 'dueno'}
        onMarcar={() => undefined}
        onResponder={() => Promise.resolve()}
        rutaDe={rutaMovil}
        onIr={() => undefined}
        onRetry={() => undefined}
      />
    </MarcoDetalle>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Track M / Pantallas / Avisos',
  component: Demo,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Demo>;

export const DePedro: Story = { args: { vista: 'pedro' } };
export const DeTuCaja: Story = { args: { vista: 'caja' } };
export const Respondido: Story = { args: { vista: 'respondido' } };
export const SinAvisos: Story = { args: { vista: 'vacio' } };
export const Cargando: Story = { args: { vista: 'cargando' } };
export const ErrorAlLeer: Story = { args: { vista: 'error' } };
