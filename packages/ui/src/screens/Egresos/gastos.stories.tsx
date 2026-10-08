/**
 * Gastos del turno (Track M, M-08) for review against MvGastos, fed the
 * caja package's design fixture; the live route reads the turno's egresos
 * through `useGastosTurno`.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from '@tamagui/core';
import type { RecurringExpense } from '@xangarro/domain';
import { GASTOS_FIXTURE } from '@xangarro/caja/gastos';
import { initI18n } from '../../i18n/index';
import { colors } from '../../theme';
import { AppShellFrame } from '../AppShell/app-shell';
import { prefillDe } from './gastos-lectura';
import { GastosScreen } from './gastos-screen';
import { PendientesCard } from './pendientes-card';
import { RegistrarGastoSheet } from './registrar-gasto-sheet';
import type { EstadoGastos } from './use-gastos-turno';

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

/** An example due template, for review only. */
const AGUA = {
  id: 'recurrente-ejemplo',
  concepto: 'Garrafones de agua',
  categoria: 'Servicios',
  montoCentavos: 90_00n,
  proveedor: 'Aguas de ejemplo',
  frecuencia: 'semanal',
  diaDelMes: null,
  proximoDisparo: '2026-09-28',
} as unknown as RecurringExpense;

type Vista = EstadoGastos | 'registrar' | 'recurrente';

function Demo({ vista }: { vista: Vista }): ReactElement {
  const [hoja, setHoja] = useState(vista === 'registrar' || vista === 'recurrente');
  const estado: EstadoGastos =
    vista === 'loading' || vista === 'error' || vista === 'empty' ? vista : 'happy';
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <View width={390} height={844} borderWidth={1} borderColor={colors.gray400}>
        <AppShellFrame
          layout="phone"
          data={DATA}
          activeTabKey="/turno"
          mode="local"
          onNavigate={() => undefined}
          onLock={() => undefined}
          onBack={() => undefined}
          title="Mi turno"
        >
          <GastosScreen
            state={estado}
            gastos={GASTOS_FIXTURE.gastos}
            conTurno
            pendientes={
              <PendientesCard
                pendientes={[AGUA]}
                hoy="2026-09-28"
                onRegistrar={() => setHoja(true)}
                onDescartar={() => undefined}
              />
            }
            onRegistrar={() => setHoja(true)}
            onCompra={() => undefined}
            onRetry={() => undefined}
          />
        </AppShellFrame>
        {hoja ? (
          <RegistrarGastoSheet
            open
            prefill={vista === 'recurrente' ? prefillDe(AGUA) : null}
            quien="Operador de ejemplo, Caja del mostrador"
            onGuardar={async () => {
              setHoja(false);
              return null;
            }}
            onClose={() => setHoja(false)}
          />
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Track M / Pantallas / Gastos',
  component: Demo,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Demo>;

export const Lista: Story = { args: { vista: 'happy' } };
export const RegistrarGasto: Story = { args: { vista: 'registrar' } };
export const PagarRecurrente: Story = { args: { vista: 'recurrente' } };
export const SinGastos: Story = { args: { vista: 'empty' } };
export const Cargando: Story = { args: { vista: 'loading' } };
export const ConError: Story = { args: { vista: 'error' } };
