/**
 * Cobrar (Track M, M-07) for review against the boards MvCobrar, MvTicket,
 * MvEscaner, MvProductoNuevo, TbCobrar and TbCobrarVertical, with example
 * data; the live route reads the phone's products.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from '@tamagui/core';
import type { LineaTicket } from '@xangarro/caja/caja';
import { bump } from '@xangarro/caja/caja';
import { initI18n } from '../../i18n/index';
import { colors } from '../../theme';
import { AppShellFrame } from '../AppShell/app-shell';
import type { MetodoCobro } from '../Checkout/cobro-logic';
import { CobrarScreen, type Disposicion } from './cobrar-screen';
import { CATALOGO_EJEMPLO, TICKET_EJEMPLO } from './cobrar-fixture';
import { EscanerSheet } from './escaner-sheet';
import { ProductoNuevoSheet } from './producto-nuevo-sheet';
import { agregar } from './ticket-en-curso';
import { TicketSheet } from './ticket-sheet';

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

const SIZES: Record<Disposicion, { width: number; height: number }> = {
  telefono: { width: 390, height: 844 },
  lado: { width: 1180, height: 820 },
  dock: { width: 820, height: 1180 },
};

type Hoja = 'ticket' | 'escaner' | 'nuevo' | 'nuevoCodigo' | null;

function Demo(props: {
  disposicion: Disposicion;
  hoja: Hoja;
  vacio?: boolean;
  sinProductos?: boolean;
}): ReactElement {
  const [lines, setLines] = useState<readonly LineaTicket[]>(props.vacio ? [] : TICKET_EJEMPLO);
  const [hoja, setHoja] = useState<Hoja>(props.hoja);
  const [metodo, setMetodo] = useState<MetodoCobro>('Efectivo');
  const productos = props.sinProductos ? [] : CATALOGO_EJEMPLO;
  const info = new Map(CATALOGO_EJEMPLO.map((p) => [p.id, p]));
  const onBump = (id: string, d: number) => setLines((l) => bump(l, id, d));
  const layout = props.disposicion === 'telefono' ? 'phone' : 'rail';
  return (
    <View {...SIZES[props.disposicion]} borderWidth={1} borderColor={colors.gray400}>
      <AppShellFrame
        layout={layout}
        data={DATA}
        activeTabKey="/cobrar"
        mode="local"
        onNavigate={() => undefined}
        onLock={() => undefined}
      >
        <CobrarScreen
          disposicion={props.disposicion}
          estado="listo"
          productos={productos}
          lines={lines}
          folio="V-0413"
          metodos={['Efectivo', 'Tarjeta', 'Transferencia', 'Fiado']}
          metodo={metodo}
          onMetodo={setMetodo}
          onAdd={(p) => setLines((l) => agregar(l, p))}
          onBump={onBump}
          onQuitar={(id) => setLines((l) => l.filter((x) => x.productoId !== id))}
          onVaciar={() => setLines([])}
          onAbrirTicket={() => setHoja('ticket')}
          onCobrar={() => undefined}
          onFiado={() => undefined}
          onEscanear={() => setHoja('escaner')}
          onProductoNuevo={() => setHoja('nuevo')}
        />
      </AppShellFrame>
      <TicketSheet
        open={hoja === 'ticket'}
        onClose={() => setHoja(null)}
        lines={lines}
        info={info}
        folio="V-0413"
        onBump={onBump}
        onQuitar={(id) => onBump(id, -99)}
        onVaciar={() => setLines([])}
        onCobrar={() => setHoja(null)}
      />
      <EscanerSheet
        open={hoja === 'escaner'}
        onClose={() => setHoja(null)}
        folio="V-0413"
        productos={productos}
        lines={lines}
        onAgregar={(p) => setLines((l) => agregar(l, p))}
        onQuitarUno={(p) => onBump(p.id, -1)}
        onAlta={() => setHoja('nuevoCodigo')}
        onCobrar={() => setHoja('ticket')}
      />
      <ProductoNuevoSheet
        open={hoja === 'nuevo' || hoja === 'nuevoCodigo'}
        onClose={() => setHoja(null)}
        codigo={hoja === 'nuevoCodigo' ? '7501234567897' : null}
        tipos={['Producto Terminado', 'Otro']}
        dueno="el dueño"
        onGuardar={() => Promise.reject(new Error('solo historia'))}
        onListo={() => setHoja(null)}
      />
    </View>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Track M / Pantallas / Cobrar',
  component: Demo,
  parameters: { layout: 'centered', backgrounds: { default: 'offwhite' } },
  decorators: [ConArea],
};
export default meta;

type Story = StoryObj<typeof Demo>;

export const Catalogo: Story = { args: { disposicion: 'telefono', hoja: null } };
export const CatalogoVacio: Story = { args: { disposicion: 'telefono', hoja: null, vacio: true } };
export const SinProductos: Story = {
  args: { disposicion: 'telefono', hoja: null, vacio: true, sinProductos: true },
};
export const Ticket: Story = { args: { disposicion: 'telefono', hoja: 'ticket' } };
export const Escaner: Story = { args: { disposicion: 'telefono', hoja: 'escaner' } };
export const ProductoNuevo: Story = { args: { disposicion: 'telefono', hoja: 'nuevoCodigo' } };
export const TabletaHorizontal: Story = { args: { disposicion: 'lado', hoja: null } };
export const TabletaVertical: Story = { args: { disposicion: 'dock', hoja: null } };
