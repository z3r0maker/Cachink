/**
 * Fiado y abonos (Track M, M-08) in its board states — lista, cliente,
 * recibir-abono, sin-saldo, recordar-saldo, cargando, error-al-leer — for
 * review against the boards. Fed the caja package's design fixture; the live
 * screen reads `useCobranza()`.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { HOY } from '@xangarro/caja';
import { CUENTAS, cuentaPorId, estadoCuenta, recordatorio } from '@xangarro/caja/cobranza';
import { initI18n } from '../../i18n/index';
import { Marco } from '../Inicio/story-marco';
import { ClienteCuentaSheet } from './cliente-cuenta';
import { CobranzaScreen } from './cobranza-screen';
import { RecibirAbonoSheet } from './recibir-abono-sheet';
import { RecordarSaldoSheet } from './recordar-saldo-sheet';
import type { DatosCobranza } from './use-cobranza';

initI18n();

type Capa = 'ninguna' | 'cliente' | 'abono' | 'recordar';

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

function pantalla(state: 'happy' | 'cargando' | 'error', data: DatosCobranza | null): ReactElement {
  return (
    <CobranzaScreen
      state={state}
      data={state === 'happy' ? data : null}
      onRegistrar={async () => null}
      onRetry={() => undefined}
      onBack={() => undefined}
    />
  );
}

function Demo(p: {
  readonly capa?: Capa;
  readonly datos?: DatosCobranza;
  readonly estado?: 'happy' | 'cargando' | 'error';
}): ReactElement {
  const [capa, setCapa] = useState<Capa>(p.capa ?? 'ninguna');
  const datos = p.datos ?? DATOS;
  const estado = p.estado ?? 'happy';
  const chuy = cuentaPorId('chuy');
  const mari = cuentaPorId('mari');
  return (
    <Marco layout="phone" shell={estado === 'happy'}>
      <View flex={1}>{pantalla(estado, datos)}</View>
      {chuy === null || mari === null ? null : (
        <>
          <ClienteCuentaSheet
            open={capa === 'cliente'}
            cuenta={chuy}
            hoy={datos.hoy}
            dueno={datos.dueno}
            onClose={() => setCapa('ninguna')}
            onAbonar={() => setCapa('abono')}
            onRecordar={() => setCapa('recordar')}
          />
          <RecibirAbonoSheet
            open={capa === 'abono'}
            cuenta={mari}
            onClose={() => setCapa('ninguna')}
            onGuardar={async () => {
              setCapa('ninguna');
              return null;
            }}
          />
          <RecordarSaldoSheet
            open={capa === 'recordar'}
            nombre={chuy.nombre}
            telefono={chuy.telefono}
            mensaje={recordatorio(chuy, estadoCuenta(chuy), datos.negocio)}
            onClose={() => setCapa('ninguna')}
          />
        </>
      )}
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
export const Cliente: Story = { args: { capa: 'cliente' } };
export const RecibirAbono: Story = { args: { capa: 'abono' } };
export const RecordarSaldo: Story = { args: { capa: 'recordar' } };
export const SinSaldo: Story = { args: { datos: SIN_SALDO } };
export const Cargando: Story = { args: { estado: 'cargando' } };
export const ErrorAlLeer: Story = { args: { estado: 'error' } };
