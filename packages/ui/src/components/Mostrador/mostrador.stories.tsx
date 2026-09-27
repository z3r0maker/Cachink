/**
 * El Mostrador's phone primitives (Track M, M-05) side by side, for review
 * against the boards. Example copy only; nothing here reaches a live screen.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initI18n } from '../../i18n/index';
import { colors } from '../../theme';
import { BloqueoShell } from '../Bloqueo/index';
import { BottomSheet } from '../BottomSheet/index';
import { Btn } from '../Btn/index';
import { Chip } from '../Chip/index';
import { Dialog } from '../Dialog/index';
import { OfflineBanner } from '../OfflineBanner/index';
import { HeroPanel, QuietPanel } from '../Panel/index';
import { GLYPHS } from '../PathIcon/index';
import { SegmentedTabs } from '../SegmentedTabs/index';
import { Toast } from '../Toast/index';
import { MText } from './mtext';

initI18n();

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function Gallery(): ReactElement {
  const [chip, setChip] = useState('efectivo');
  const [tab, setTab] = useState<'nuevos' | 'leidos'>('nuevos');
  return (
    <View width={390} gap={14} padding={16} backgroundColor={colors.gray200}>
      <OfflineBanner pendientes={3} />
      <View flexDirection="row" flexWrap="wrap" gap={8}>
        {['efectivo', 'tarjeta', 'transferencia', 'fiado'].map((k) => (
          <Chip
            key={k}
            label={k[0]!.toUpperCase() + k.slice(1)}
            selected={chip === k}
            onPress={() => setChip(k)}
          />
        ))}
      </View>
      <SegmentedTabs
        ariaLabel="Avisos"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'nuevos', label: 'Nuevos', count: 2 },
          { key: 'leidos', label: 'Leídos', count: 5 },
        ]}
      />
      <HeroPanel label="Hero">
        <MText size="xl2" weight="extraBold">
          Un solo hero por pantalla
        </MText>
      </HeroPanel>
      <QuietPanel label="Panel quieto" count={3} padding={16}>
        <MText weight="semibold">Todo lo demás vive aquí.</MText>
      </QuietPanel>
      <Btn size="xl" onPress={() => undefined}>
        Cobrar $0.00
      </Btn>
      <Btn variant="secondary" onPress={() => undefined}>
        Volver
      </Btn>
      <Btn variant="quiet" onPress={() => undefined}>
        Ahora no
      </Btn>
      <Btn variant="destructive" onPress={() => undefined}>
        Cancelar venta
      </Btn>
      <Btn variant="destructiveFilled" onPress={() => undefined}>
        Sí, cancelar
      </Btn>
      <Btn variant="destructiveFilled" disabled onPress={() => undefined}>
        Elige un motivo
      </Btn>
      <Toast
        title="Sin internet: se guardó"
        body="Se envía sola al volver."
        tone="warn"
        icon={GLYPHS.sinRed}
        onClose={() => undefined}
      />
    </View>
  );
}

function Overlays(props: { kind: 'sheet' | 'dialog' }): ReactElement {
  const [open, setOpen] = useState(true);
  const foot = (
    <View flexDirection="row" gap={10}>
      <View flex={1}>
        <Btn variant="secondary" size="lg" fullWidth onPress={() => setOpen(false)}>
          Volver
        </Btn>
      </View>
      <View flex={1}>
        <Btn size="lg" sentence fullWidth onPress={() => setOpen(false)}>
          Guardar
        </Btn>
      </View>
    </View>
  );
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <View width={390} height={844} backgroundColor={colors.gray200} padding={16}>
        <Btn onPress={() => setOpen(true)}>Abrir</Btn>
        {props.kind === 'sheet' ? (
          <BottomSheet
            open={open}
            onClose={() => setOpen(false)}
            eyebrow="Gasto"
            title="Registrar gasto"
            footer={foot}
          >
            <MText weight="semibold">El cuerpo se desplaza; los botones se quedan abajo.</MText>
          </BottomSheet>
        ) : (
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            title="¿Cancelar la venta?"
            footer={foot}
          >
            <MText weight="semibold">La venta queda cancelada con su motivo.</MText>
          </Dialog>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const meta: Meta = {
  title: 'Track M / El Mostrador / Primitivos',
  parameters: { layout: 'centered' },
};
export default meta;

export const Galeria: StoryObj = { render: () => <Gallery /> };
export const HojaInferior: StoryObj = { render: () => <Overlays kind="sheet" /> };
export const Dialogo: StoryObj = { render: () => <Overlays kind="dialog" /> };
export const Bloqueo: StoryObj = {
  render: () => (
    <View width={390} height={844}>
      <BloqueoShell
        contexto="Caja del mostrador · Tu negocio"
        operador={{ nombre: 'Operador', iniciales: 'OP', detalle: 'Turno abierto desde las 09:00' }}
      >
        <MText weight="extraBold">Pon tu NIP para seguir</MText>
      </BloqueoShell>
    </View>
  ),
};
