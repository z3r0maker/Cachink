/**
 * The phone frame the M-09 detail stories draw a screen in (Inventario,
 * Avisos, Registros por enviar, Estados): M-05's `AppShellFrame` at 390 × 844
 * with the way back, the example session and, when given, the bell and the
 * strips under the header. Review only: never a live screen.
 */
import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from '@tamagui/core';
import { borderWidths, colors } from '../../theme';
import { AppShellFrame } from '../AppShell/app-shell';
import type { HeaderStatus } from '../AppShell/caja-header';
import { SESION } from '../Inicio/story-marco';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export function MarcoDetalle(p: {
  readonly ruta: string;
  /** The back button's label; none on a tab screen. */
  readonly volver?: string;
  readonly headerStatus?: HeaderStatus;
  readonly avisos?: number;
  readonly banners?: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
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
          activeTabKey={p.ruta}
          mode="local"
          onNavigate={() => undefined}
          onLock={() => undefined}
          onBack={p.volver ? () => undefined : undefined}
          title={p.volver}
          headerStatus={p.headerStatus}
          avisos={
            p.avisos === undefined ? undefined : { count: p.avisos, onPress: () => undefined }
          }
          banners={p.banners}
        >
          {p.children}
        </AppShellFrame>
      </View>
    </SafeAreaProvider>
  );
}
