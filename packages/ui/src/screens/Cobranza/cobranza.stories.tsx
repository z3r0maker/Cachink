/**
 * Fiado y abonos (Track M, M-08; RvFiado) in its board states — the list,
 * a client's page, its abono and its reminder, sin-saldo, cargando and
 * error-al-leer — for review against the boards. Fed the caja package's
 * design fixture; the live routes read `useCobranza()`.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { HOY } from '@xangarro/caja';
import { CUENTAS, cuentaPorId } from '@xangarro/caja/cobranza';
import { initI18n } from '../../i18n/index';
import { Marco } from '../Inicio/story-marco';
import { ClienteScreen } from './cliente-screen';
import { CobranzaScreen } from './cobranza-screen';
import type { DatosCobranza } from './use-cobranza';

initI18n();

const DATOS: DatosCobranza = {
  cuentas: CUENTAS,
  hoy: HOY,
  negocio: 'Taquería Don Pedro',
  dueno: 'Pedro',
};

const SIN_SALDO: DatosCobranza = {
  ...DATOS,
  cuentas: CUENTAS.filter((c) => c.id === 'delgado'),
};

function Demo(p: {
  readonly cliente?: string;
  readonly abono?: boolean;
  readonly datos?: DatosCobranza;
  readonly estado?: 'happy' | 'cargando' | 'error';
}): ReactElement {
  const datos = p.datos ?? DATOS;
  const estado = p.estado ?? 'happy';
  const cuenta = p.cliente === undefined ? null : cuentaPorId(p.cliente);
  return (
    <Marco layout="phone" shell={estado === 'happy'}>
      <View flex={1}>
        {p.cliente === undefined ? (
          <CobranzaScreen
            state={estado}
            data={estado === 'happy' ? datos : null}
            onRetry={() => undefined}
            onBack={() => undefined}
            onAbrirCliente={() => undefined}
          />
        ) : (
          <ClienteScreen
            state={estado}
            cuenta={cuenta}
            data={datos}
            {...(p.abono ? { abrirAbono: true } : {})}
            onRegistrar={async () => null}
            onRetry={() => undefined}
          />
        )}
      </View>
    </Marco>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Track M / Pantallas / Fiado y abonos',
  component: Demo,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Demo>;

export const Lista: Story = { args: {} };
export const Cliente: Story = { args: { cliente: 'mari' } };
export const ClienteConLimitePasado: Story = { args: { cliente: 'chuy' } };
export const RecibirAbono: Story = { args: { cliente: 'mari', abono: true } };
export const SinSaldo: Story = { args: { datos: SIN_SALDO } };
export const Cargando: Story = { args: { estado: 'cargando' } };
export const ErrorAlLeer: Story = { args: { estado: 'error' } };
