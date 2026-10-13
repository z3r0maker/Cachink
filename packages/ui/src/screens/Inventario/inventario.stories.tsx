/**
 * Inventario (Track M, M-09) in its seven board states, for review against
 * the phone board: the existencias with their regla, the turno's movements,
 * each movement sheet, sin productos, cargando y con error. Fed the caja
 * package's design fixture; the live screen reads `useInventario()`.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { INVENTARIO_FIXTURE } from '@xangarro/caja/inventario';
import { initI18n } from '../../i18n/index';
import { Marco } from '../Inicio/story-marco';
import { InventarioScreen } from './inventario-screen';
import { LlegoMercanciaSheet } from './llego-mercancia-sheet';
import { MermaSheet } from './merma-sheet';

initI18n();

type Estado =
  | 'existencias'
  | 'movimientos'
  | 'llego-mercancia'
  | 'merma'
  | 'sin-productos'
  | 'cargando'
  | 'error-al-leer';

const FIRMA = `${INVENTARIO_FIXTURE.operador}, ${INVENTARIO_FIXTURE.caja}`;

function Pantalla(p: { readonly estado: Estado }): ReactElement {
  const hoja = p.estado === 'llego-mercancia' || p.estado === 'merma';
  const cargando = p.estado === 'cargando';
  const error = p.estado === 'error-al-leer';
  const vacio = p.estado === 'sin-productos';
  return (
    <Marco layout="phone" shell>
      <InventarioScreen
        state={cargando ? 'loading' : error ? 'error' : 'happy'}
        tabInicial={p.estado === 'movimientos' ? 'movimientos' : 'existencias'}
        data={
          cargando || error
            ? null
            : vacio
              ? { ...INVENTARIO_FIXTURE, existencias: [], movimientos: [] }
              : INVENTARIO_FIXTURE
        }
        dueno="Pedro"
        registrar={() => Promise.resolve()}
        onRetry={() => undefined}
      />
      {hoja ? (
        p.estado === 'merma' ? (
          <MermaSheet
            open
            items={INVENTARIO_FIXTURE.existencias}
            preselect="queso"
            firma={FIRMA}
            onClose={() => undefined}
            onGuardar={() => Promise.resolve()}
          />
        ) : (
          <LlegoMercanciaSheet
            open
            items={INVENTARIO_FIXTURE.existencias}
            preselect="pastor"
            firma={FIRMA}
            onClose={() => undefined}
            onGuardar={() => Promise.resolve()}
          />
        )
      ) : null}
    </Marco>
  );
}

const meta: Meta<typeof Pantalla> = {
  title: 'Track M / Pantallas / Inventario',
  component: Pantalla,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Pantalla>;

export const Existencias: Story = { args: { estado: 'existencias' } };
export const Movimientos: Story = { args: { estado: 'movimientos' } };
export const LlegoMercancia: Story = { args: { estado: 'llego-mercancia' } };
export const Merma: Story = { args: { estado: 'merma' } };
export const SinProductos: Story = { args: { estado: 'sin-productos' } };
export const Cargando: Story = { args: { estado: 'cargando' } };
export const ErrorAlLeer: Story = { args: { estado: 'error-al-leer' } };
