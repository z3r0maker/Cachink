/**
 * Cobro, fiado and venta hecha (Track M, M-07) for review against the boards
 * MvCobro, MvFiado and MvVentaHecha, with example data; the live routes read
 * the ticket in progress and the phone's clients.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from '@tamagui/core';
import { initI18n } from '../../i18n/index';
import { colors } from '../../theme';
import { AppShellFrame } from '../AppShell/app-shell';
import { TICKET_EJEMPLO } from '../Ventas/cobrar-fixture';
import { CobroScreen } from './cobro-screen';
import { ComprobanteSheet } from './comprobante-sheet';
import { FiadoScreen } from './fiado-screen';
import { VentaHechaDialog } from './venta-hecha-dialog';
import type { VentaHecha } from './venta-hecha';

initI18n();

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function ConArea(Story: () => ReactElement): ReactElement {
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <Story />
    </SafeAreaProvider>
  );
}

const DATA = {
  caja: 'Caja del mostrador',
  negocio: 'Tu negocio',
  operador: { nombre: 'Operador de ejemplo', iniciales: 'OE' },
  turnoDesde: '09:00',
};

const CLIENTES = [
  { id: 'mari', nombre: 'Doña Mari de la tienda', telefono: '', saldo: 340_00n },
  { id: 'chuy', nombre: 'Taller de Chuy', telefono: '', saldo: 860_00n },
  { id: 'delgado', nombre: 'Oficina Delgado', telefono: '', saldo: 0n },
];

const VENTA: VentaHecha = {
  ticketId: 'ejemplo',
  folio: 'V-0413',
  hora: '14:58',
  lines: TICKET_EJEMPLO,
  total: 160_00n,
  metodo: 'Efectivo',
  recibido: 200_00n,
  cambio: 40_00n,
  cliente: null,
  saldoCliente: null,
};

type Vista = 'cobro' | 'fiado' | 'hecha' | 'hechaFiado' | 'comprobante';

function Pantalla({ vista }: { vista: Vista }): ReactElement {
  if (vista === 'fiado') {
    return (
      <FiadoScreen
        folio="V-0413"
        total={160_00n}
        clientes={CLIENTES}
        cargando={false}
        registrando={false}
        error={null}
        dueno="el dueño"
        onAnotar={() => undefined}
      />
    );
  }
  return (
    <CobroScreen
      folio="V-0413"
      piezas={5}
      total={160_00n}
      metodos={['Efectivo', 'Tarjeta', 'Transferencia', 'Fiado']}
      metodoInicial="Efectivo"
      registrando={false}
      error={null}
      onCobrar={() => undefined}
      onFiado={() => undefined}
    />
  );
}

function Demo({ vista }: { vista: Vista }): ReactElement {
  const [mandar, setMandar] = useState(vista === 'comprobante');
  const venta =
    vista === 'hechaFiado'
      ? {
          ...VENTA,
          metodo: 'Fiado' as const,
          recibido: null,
          cambio: null,
          cliente: 'Doña Mari de la tienda',
          saldoCliente: 500_00n,
        }
      : VENTA;
  const hecha = vista === 'hecha' || vista === 'hechaFiado' || vista === 'comprobante';
  return (
    <View width={390} height={844} borderWidth={1} borderColor={colors.gray400}>
      <AppShellFrame
        layout="phone"
        data={DATA}
        activeTabKey="/checkout"
        mode="local"
        onNavigate={() => undefined}
        onLock={() => undefined}
        onBack={() => undefined}
        title={vista === 'fiado' ? 'Cobro' : 'Ticket'}
      >
        <Pantalla vista={vista} />
      </AppShellFrame>
      {hecha ? (
        <VentaHechaDialog
          venta={mandar ? null : venta}
          dueno="el dueño"
          onMandar={() => setMandar(true)}
          onNueva={() => setMandar(false)}
        />
      ) : null}
      {hecha ? (
        <ComprobanteSheet
          open={mandar}
          venta={venta}
          business={null}
          onClose={() => setMandar(false)}
          onNueva={() => setMandar(false)}
        />
      ) : null}
    </View>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Track M / Pantallas / Cobro',
  component: Demo,
  parameters: { layout: 'centered', backgrounds: { default: 'offwhite' } },
  decorators: [ConArea],
};
export default meta;

type Story = StoryObj<typeof Demo>;

export const ComoPaga: Story = { args: { vista: 'cobro' } };
export const Fiado: Story = { args: { vista: 'fiado' } };
export const VentaHechaEfectivo: Story = { args: { vista: 'hecha' } };
export const VentaFiada: Story = { args: { vista: 'hechaFiado' } };
export const MandarComprobante: Story = { args: { vista: 'comprobante' } };
