/**
 * Inventario (Track M, M-09) for review against the board MvInventario, with
 * the design's inventory (`INVENTARIO_FIXTURE`); the live route reads the
 * phone's tracked products and this turno's movements.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { initI18n } from '../../i18n/index';
import { InventarioScreen, type InventarioScreenProps } from './inventario-screen';
import { MarcoDetalle } from './marco-detalle';
import { muestraInventario } from './inventario-muestra';

initI18n();

type Vista = 'existencias' | 'movimientos' | 'merma' | 'llego' | 'vacio' | 'cargando' | 'error';

function props(vista: Vista): InventarioScreenProps {
  const base: InventarioScreenProps = {
    state: 'happy',
    data: muestraInventario(),
    dueno: 'Pedro',
    registrando: false,
    onRegistrar: () => Promise.resolve(),
    onRetry: () => undefined,
  };
  if (vista === 'movimientos') return { ...base, tabInicial: 'movimientos' };
  if (vista === 'merma') return { ...base, abrir: { id: 'horchata', tipo: 'Merma' } };
  if (vista === 'llego') return { ...base, abrir: { id: 'pastor', tipo: 'Entrada' } };
  if (vista === 'vacio')
    return { ...base, state: 'empty', data: { existencias: [], movimientos: [] } };
  if (vista === 'cargando') return { ...base, state: 'loading' };
  if (vista === 'error') return { ...base, state: 'error' };
  return base;
}

function Demo({ vista }: { vista: Vista }): ReactElement {
  return (
    <MarcoDetalle ruta="/inventario" volver="Mi turno" avisos={2}>
      <InventarioScreen {...props(vista)} />
    </MarcoDetalle>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Track M / Pantallas / Inventario',
  component: Demo,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Demo>;

export const Existencias: Story = { args: { vista: 'existencias' } };
export const Movimientos: Story = { args: { vista: 'movimientos' } };
export const Merma: Story = { args: { vista: 'merma' } };
export const LlegoMercancia: Story = { args: { vista: 'llego' } };
export const SinProductos: Story = { args: { vista: 'vacio' } };
export const Cargando: Story = { args: { vista: 'cargando' } };
export const ErrorAlLeer: Story = { args: { vista: 'error' } };
