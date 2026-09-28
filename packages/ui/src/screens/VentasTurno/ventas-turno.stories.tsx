/**
 * Ventas del turno (Track M, M-08) for review against MvVentas and
 * MvCancelarVenta, fed the caja package's design fixture; the live tab reads
 * the turno's tickets through `useVentasTurno`.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from '@tamagui/core';
import { DETALLE_VENTAS, VENTAS_FIXTURE, type VentaDetalle } from '@xangarro/caja/ventas';
import { initI18n } from '../../i18n/index';
import { colors } from '../../theme';
import { AppShellFrame } from '../AppShell/app-shell';
import { CancelarVentaDialog } from './cancelar-venta-dialog';
import type { EstadoVentas } from './use-ventas-turno';
import { VentaSheet } from './venta-sheet';
import { VentasTurnoScreen } from './ventas-turno-screen';

initI18n();

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
const DATA = {
  caja: 'Caja del mostrador',
  negocio: 'Tu negocio',
  operador: { nombre: 'Operador de ejemplo', iniciales: 'OE' },
  turnoDesde: '08:15',
};
const CTX = { operador: 'Operador de ejemplo', caja: 'Caja del mostrador', desde: '08:15' };

type Vista = EstadoVentas | 'detalle' | 'fiado' | 'cancelada' | 'cancelar';

function hoja(vista: Vista): VentaDetalle | null {
  if (vista === 'detalle') return DETALLE_VENTAS.efectivo;
  if (vista === 'fiado') return DETALLE_VENTAS.fiado;
  if (vista === 'cancelada')
    return { ...DETALLE_VENTAS.efectivo, cancelada: { motivo: 'Me equivoqué al cobrar' } };
  return null;
}

function Demo({ vista }: { vista: Vista }): ReactElement {
  const [cerrada, setCerrada] = useState(false);
  const estado: EstadoVentas =
    vista === 'loading' || vista === 'error' || vista === 'empty' || vista === 'sin-turno'
      ? vista
      : 'happy';
  const venta = cerrada ? null : hoja(vista);
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <View width={390} height={844} borderWidth={1} borderColor={colors.gray400}>
        <AppShellFrame
          layout="phone"
          data={DATA}
          activeTabKey="/ventas"
          mode="local"
          onNavigate={() => undefined}
          onLock={() => undefined}
        >
          <VentasTurnoScreen
            state={estado}
            ventas={VENTAS_FIXTURE.ventas}
            desde="08:15"
            abierta={venta?.folio ?? null}
            onAbrir={() => setCerrada(false)}
            onRetry={() => undefined}
            onIrAInicio={() => undefined}
          />
        </AppShellFrame>
        <VentaSheet
          venta={venta}
          contexto={CTX}
          iconos={new Map()}
          aviso={null}
          onClose={() => setCerrada(true)}
          onComprobante={() => undefined}
          onCancelar={() => undefined}
        />
        {vista === 'cancelar' && !cerrada ? (
          <CancelarVentaDialog
            venta={VENTAS_FIXTURE.ventas[0]!}
            dueno="el dueño"
            onClose={() => setCerrada(true)}
            onConfirm={async () => 'No se pudo cancelar: PIN incorrecto'}
          />
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Track M / Pantallas / Ventas',
  component: Demo,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Demo>;

export const Lista: Story = { args: { vista: 'happy' } };
export const Detalle: Story = { args: { vista: 'detalle' } };
export const DetalleFiado: Story = { args: { vista: 'fiado' } };
export const DetalleCancelada: Story = { args: { vista: 'cancelada' } };
export const CancelarVenta: Story = { args: { vista: 'cancelar' } };
export const SinVentas: Story = { args: { vista: 'empty' } };
export const SinTurno: Story = { args: { vista: 'sin-turno' } };
export const Cargando: Story = { args: { vista: 'loading' } };
export const ConError: Story = { args: { vista: 'error' } };
