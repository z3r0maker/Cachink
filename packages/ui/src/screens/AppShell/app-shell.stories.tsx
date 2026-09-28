/**
 * The caja's frame (Track M, M-05) at its three widths, for review against
 * the boards «Teléfono y tableta» (MvTurno, TbCobrar). `AppShellFrame` is fed
 * example data here; the live `AppShell` reads the session.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { ICONS } from '@xangarro/caja';
import { Btn, Eyebrow, HeroPanel, MText, PathIcon, QuietPanel } from '../../components/index';
import { initI18n } from '../../i18n/index';
import { colors } from '../../theme';
import { AppShellFrame } from './app-shell';
import type { CajaLayout } from './use-caja-layout';
import { TurnoRows } from './turno-nav';

initI18n();

/** Example names for review only; a live screen reads the session. */
const DATA = {
  caja: 'Caja del mostrador',
  negocio: 'Tu negocio',
  operador: { nombre: 'Operador de ejemplo', iniciales: 'OE' },
  turnoDesde: '09:00',
};

const SIZES: Record<CajaLayout, { width: number; height: number }> = {
  phone: { width: 390, height: 844 },
  rail: { width: 1180, height: 820 },
  sidebar: { width: 1366, height: 900 },
};

function Body(): ReactElement {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      <MText size="xl4" weight="extraBold">
        Mi turno
      </MText>
      <HeroPanel label="Efectivo que debe haber">
        <Eyebrow color={colors.ink}>Efectivo que debe haber</Eyebrow>
        <MText size="display" weight="extraBold">
          $0.00
        </MText>
      </HeroPanel>
      <QuietPanel label="Resumen" padding={16}>
        <MText weight="semibold" color={colors.gray600}>
          Un panel quieto: blanco, borde gris, sin sombra.
        </MText>
      </QuietPanel>
      <TurnoRows onNavigate={() => undefined} />
      <Btn
        variant="secondary"
        size="xl"
        onPress={() => undefined}
        icon={<PathIcon d={ICONS.lock} size={18} />}
      >
        Bloquear la caja
      </Btn>
    </ScrollView>
  );
}

function Frame(props: { layout: CajaLayout; back?: boolean }): ReactElement {
  return (
    <View {...SIZES[props.layout]} borderWidth={1} borderColor={colors.gray400}>
      <AppShellFrame
        layout={props.layout}
        data={DATA}
        activeTabKey="/turno"
        mode="local"
        onNavigate={() => undefined}
        onLock={() => undefined}
        onBack={props.back ? () => undefined : undefined}
        title={props.back ? 'Mi turno' : undefined}
      >
        <Body />
      </AppShellFrame>
    </View>
  );
}

const meta: Meta<typeof Frame> = {
  title: 'Track M / El Mostrador / Frame',
  component: Frame,
  parameters: { layout: 'centered', backgrounds: { default: 'offwhite' } },
};
export default meta;

type Story = StoryObj<typeof Frame>;

export const Telefono: Story = { args: { layout: 'phone' } };
export const TelefonoDetalle: Story = { args: { layout: 'phone', back: true } };
export const TabletaRiel: Story = { args: { layout: 'rail' } };
export const TabletaBarraCompleta: Story = { args: { layout: 'sidebar' } };
