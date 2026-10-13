/**
 * Ventas del turno (Track M, M-08) in its board states — lista, detalle
 * (efectivo, fiado, cancelada), cancelar-venta, sin-ventas, sin-turno,
 * cargando, con-error — for review against the boards MvVentas and MvDetalle.
 * Fed the caja package's design fixture; the live tab reads `useVentasTurno()`.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from '@tamagui/core';
import { VENTAS_FIXTURE } from '@xangarro/caja/ventas';
import { initI18n } from '../../i18n/index';
import { colors } from '../../theme';
import { AppShellFrame } from '../AppShell/app-shell';
import { SESION } from '../Inicio/story-marco';
import { CancelarVentaDialog } from './venta-cancelar';
import { VentasMostradorScreen, type VentasEstado } from './ventas-mostrador-screen';

initI18n();

type Situacion =
  | 'lista'
  | 'detalle'
  | 'detalle-fiado'
  | 'detalle-cancelada'
  | 'cancelar-venta'
  | 'sin-ventas'
  | 'sin-turno'
  | 'cargando'
  | 'con-error';

const ABIERTA: Partial<Record<Situacion, string>> = {
  detalle: 'V-0412',
  'detalle-fiado': 'V-0409',
  'detalle-cancelada': 'V-0405',
  'cancelar-venta': 'V-0412',
};

const ESTADO: Record<Situacion, VentasEstado> = {
  lista: 'happy',
  detalle: 'happy',
  'detalle-fiado': 'happy',
  'detalle-cancelada': 'happy',
  'cancelar-venta': 'happy',
  'sin-ventas': 'empty',
  'sin-turno': 'sin-turno',
  cargando: 'loading',
  'con-error': 'error',
};

function Pantalla(props: { situacion: Situacion; telefono?: boolean }): ReactElement {
  const feliz = ESTADO[props.situacion] === 'happy';
  const [cerrar, setCerrar] = useState(false);
  const folio = ABIERTA[props.situacion];
  const venta =
    folio === undefined ? undefined : VENTAS_FIXTURE.ventas.find((v) => v.folio === folio);
  const telefono = props.telefono !== false;
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <View
        width={telefono ? 390 : 1180}
        height={telefono ? 844 : 820}
        borderWidth={1}
        borderColor={colors.gray400}
        overflow="hidden"
      >
        <AppShellFrame
          layout={telefono ? 'phone' : 'rail'}
          data={SESION}
          activeTabKey="/ventas"
          mode="local"
          onNavigate={() => undefined}
          onLock={() => undefined}
        >
          <VentasMostradorScreen
            state={ESTADO[props.situacion]}
            data={feliz ? VENTAS_FIXTURE : null}
            dueno="Pedro"
            abierta={folio}
            onRetry={() => undefined}
            onIrACobrar={() => undefined}
            onCompartir={() => undefined}
            onCancelar={async () => null}
            testID="ventas-story"
          />
          {props.situacion === 'cancelar-venta' && venta !== undefined && !cerrar ? (
            <CancelarVentaDialog
              venta={venta}
              dueno="Pedro"
              onClose={() => setCerrar(true)}
              onConfirm={async () => null}
            />
          ) : null}
        </AppShellFrame>
      </View>
    </SafeAreaProvider>
  );
}

const meta: Meta<typeof Pantalla> = {
  title: 'Track M / Pantallas / Ventas del turno',
  component: Pantalla,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Pantalla>;

export const Lista: Story = { args: { situacion: 'lista' } };
export const Detalle: Story = { args: { situacion: 'detalle' } };
export const DetalleFiado: Story = { args: { situacion: 'detalle-fiado' } };
export const DetalleCancelada: Story = { args: { situacion: 'detalle-cancelada' } };
export const CancelarVenta: Story = { args: { situacion: 'cancelar-venta' } };
export const SinVentas: Story = { args: { situacion: 'sin-ventas' } };
export const SinTurno: Story = { args: { situacion: 'sin-turno' } };
export const Cargando: Story = { args: { situacion: 'cargando' } };
export const ConError: Story = { args: { situacion: 'con-error' } };
export const Tableta: Story = { args: { situacion: 'lista', telefono: false } };
