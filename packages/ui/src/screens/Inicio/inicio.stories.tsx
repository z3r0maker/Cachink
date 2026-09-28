/**
 * Inicio (MvInicio, TbInicio) in its situations, for review against the
 * boards. Fed the caja package's design fixture; the live screen reads
 * `useInicio()`.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement } from 'react';
import { INICIO_FIXTURE, type InicioData } from '@xangarro/caja/inicio';
import { initI18n } from '../../i18n/index';
import type { CajaLayout } from '../AppShell/use-caja-layout';
import { InicioScreen } from './inicio-screen';
import { Marco } from './story-marco';

initI18n();

type Situacion = 'normal' | 'cerrado' | 'cerrar' | 'offline' | 'sinTareas';

function datos(s: Situacion): InicioData {
  if (s === 'cerrado') return { ...INICIO_FIXTURE, situacion: 'turno-cerrado' };
  if (s === 'cerrar') return { ...INICIO_FIXTURE, situacion: 'hora-de-cerrar' };
  if (s === 'offline') return { ...INICIO_FIXTURE, offline: true };
  if (s === 'sinTareas') return { ...INICIO_FIXTURE, tareas: [] };
  return INICIO_FIXTURE;
}

function Pantalla(props: { situacion: Situacion; layout: CajaLayout }): ReactElement {
  const [ocultos, setOcultos] = useState<readonly string[]>([]);
  const hoyNo = {
    ocultos,
    ocultar: (id: string) => setOcultos([...ocultos, id]),
    mostrarTodo: () => setOcultos([]),
  };
  return (
    <Marco layout={props.layout} shell>
      <InicioScreen
        state="happy"
        data={datos(props.situacion)}
        hoyNo={hoyNo}
        layout={props.layout}
        onNavigate={() => undefined}
        onAbrirTurno={() => undefined}
        onRetry={() => undefined}
      />
    </Marco>
  );
}

const meta: Meta<typeof Pantalla> = {
  title: 'Track M / Pantallas / Inicio',
  component: Pantalla,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Pantalla>;

export const Normal: Story = { args: { situacion: 'normal', layout: 'phone' } };
export const TurnoCerrado: Story = { args: { situacion: 'cerrado', layout: 'phone' } };
export const HoraDeCerrar: Story = { args: { situacion: 'cerrar', layout: 'phone' } };
export const SinConexion: Story = { args: { situacion: 'offline', layout: 'phone' } };
export const NadaParaHoy: Story = { args: { situacion: 'sinTareas', layout: 'phone' } };
export const Tableta: Story = { args: { situacion: 'normal', layout: 'rail' } };
export const TabletaCerrado: Story = { args: { situacion: 'cerrado', layout: 'sidebar' } };
