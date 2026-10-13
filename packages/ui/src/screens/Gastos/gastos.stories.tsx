/**
 * Gastos (Track M, M-08) in its six board states, for review against the
 * phone boards: the list, the registrar sheet, the pagar-recurrente sheet,
 * sin gastos, cargando y con error. Fed the caja package's design fixtures;
 * the live screen reads `useGastos()`.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { GASTOS_FIXTURE, RECURRENTE_PAGAR_FIXTURE, type GastosData } from '@xangarro/caja/gastos';
import { initI18n } from '../../i18n/index';
import { Marco } from '../Inicio/story-marco';
import { PagarRecurrenteSheet } from './pagar-recurrente-sheet';
import { RegistrarGastoSheet } from './registrar-gasto-sheet';
import { GastosScreen } from './gastos-screen';

initI18n();

type Estado = 'lista' | 'registrar' | 'pagar' | 'sinGastos' | 'cargando' | 'error';

const DATA: GastosData = { ...GASTOS_FIXTURE, dueno: 'Pedro' };
const FIRMA = `${GASTOS_FIXTURE.operador}, ${GASTOS_FIXTURE.caja}`;

function Pantalla(p: { readonly estado: Estado }): ReactElement {
  return (
    <Marco layout="phone" shell>
      <GastosScreen
        state={p.estado === 'cargando' ? 'loading' : p.estado === 'error' ? 'error' : 'happy'}
        data={
          p.estado === 'cargando' || p.estado === 'error'
            ? null
            : p.estado === 'sinGastos'
              ? { ...DATA, gastos: [] }
              : DATA
        }
        porPagar={p.estado === 'sinGastos' ? [] : [RECURRENTE_PAGAR_FIXTURE]}
        registrar={() => Promise.resolve()}
        onRetry={() => undefined}
      />
      {p.estado === 'registrar' ? (
        <RegistrarGastoSheet
          open
          firma={FIRMA}
          onClose={() => undefined}
          onGuardar={() => Promise.resolve()}
        />
      ) : null}
      {p.estado === 'pagar' ? (
        <PagarRecurrenteSheet
          open
          x={RECURRENTE_PAGAR_FIXTURE}
          firma={FIRMA}
          onClose={() => undefined}
          onGuardar={() => Promise.resolve()}
        />
      ) : null}
    </Marco>
  );
}

const meta: Meta<typeof Pantalla> = {
  title: 'Track M / Pantallas / Gastos',
  component: Pantalla,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Pantalla>;

export const Lista: Story = { args: { estado: 'lista' } };
export const RegistrarGasto: Story = { args: { estado: 'registrar' } };
export const PagarRecurrente: Story = { args: { estado: 'pagar' } };
export const SinGastos: Story = { args: { estado: 'sinGastos' } };
export const Cargando: Story = { args: { estado: 'cargando' } };
export const ConError: Story = { args: { estado: 'error' } };
