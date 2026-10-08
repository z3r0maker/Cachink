/**
 * Fiado y abonos (Track M, M-08) for review against the boards MvCobranza and
 * MvRecordarSaldo, with the caja package's example accounts (the design's
 * day, 14 May); the live routes read the phone's own accounts.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from '@tamagui/core';
import { CUENTAS, cuentaPorId } from '@xangarro/caja/cobranza';
import { initI18n } from '../../i18n/index';
import { borderWidths, colors } from '../../theme';
import { AppShellFrame } from '../AppShell/app-shell';
import { SESION } from '../Inicio/story-marco';
import { ClienteScreen } from './cliente-screen';
import { CobranzaScreen } from './cobranza-screen';

initI18n();

const HOY = '2026-05-14';
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

type Vista = 'lista' | 'cliente' | 'abono' | 'sinSaldo' | 'recordar' | 'cargando' | 'error';

function Pantalla({ vista }: { vista: Vista }): ReactElement {
  if (vista === 'lista' || vista === 'cargando' || vista === 'error') {
    const state = vista === 'lista' ? 'happy' : vista === 'cargando' ? 'loading' : 'error';
    return (
      <CobranzaScreen
        state={state}
        cuentas={CUENTAS}
        hoy={HOY}
        onAbrir={() => undefined}
        onRetry={() => undefined}
      />
    );
  }
  return (
    <ClienteScreen
      state="happy"
      cuenta={cuentaPorId(vista === 'sinSaldo' ? 'delgado' : 'chuy')}
      hoy={HOY}
      negocio={SESION.negocio}
      abrirAbono={vista === 'abono'}
      abrirRecordar={vista === 'recordar'}
      onRecibir={() => Promise.resolve()}
      onRetry={() => undefined}
    />
  );
}

function Demo({ vista }: { vista: Vista }): ReactElement {
  const cliente = vista !== 'lista' && vista !== 'cargando' && vista !== 'error';
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <View
        width={390}
        height={844}
        borderWidth={borderWidths.quiet}
        borderColor={colors.gray400}
        overflow="hidden"
      >
        <AppShellFrame
          layout="phone"
          data={SESION}
          activeTabKey={cliente ? '/cobranza/chuy' : '/cobranza'}
          mode="local"
          onNavigate={() => undefined}
          onLock={() => undefined}
          onBack={() => undefined}
          title={cliente ? 'Fiado y abonos' : 'Mi turno'}
        >
          <Pantalla vista={vista} />
        </AppShellFrame>
      </View>
    </SafeAreaProvider>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Track M / Pantallas / Fiado y abonos',
  component: Demo,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Demo>;

export const Lista: Story = { args: { vista: 'lista' } };
export const Cliente: Story = { args: { vista: 'cliente' } };
export const RecibirAbono: Story = { args: { vista: 'abono' } };
export const SinSaldo: Story = { args: { vista: 'sinSaldo' } };
export const RecordarSaldo: Story = { args: { vista: 'recordar' } };
export const Cargando: Story = { args: { vista: 'cargando' } };
export const ErrorAlLeer: Story = { args: { vista: 'error' } };
