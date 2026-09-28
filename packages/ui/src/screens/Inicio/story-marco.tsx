/**
 * The frame the «Track M / Pantallas» stories draw a screen in: the phone at
 * 390 × 844 or a tablet at 1180 × 820, with safe-area metrics of zero and,
 * for the tab screens, M-05's `AppShellFrame` around them. Review only:
 * example data, never a live screen.
 */
import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from '@tamagui/core';
import { borderWidths, colors } from '../../theme';
import { AppShellFrame } from '../AppShell/app-shell';
import type { CajaLayout } from '../AppShell/use-caja-layout';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const SIZES: Record<CajaLayout, { width: number; height: number }> = {
  phone: { width: 390, height: 844 },
  rail: { width: 1180, height: 820 },
  sidebar: { width: 1366, height: 900 },
};

/** Example names for review only; a live screen reads the session. */
export const SESION = {
  caja: 'Caja 1',
  negocio: 'Taquería Don Pedro',
  operador: { nombre: 'Ana Robledo', iniciales: 'AR' },
  turnoDesde: '08:15',
};

export function Marco(props: {
  readonly layout?: CajaLayout;
  /** Inside the caja's frame (header and tabs, or the rail). */
  readonly shell?: boolean;
  readonly children: ReactNode;
}): ReactElement {
  const layout = props.layout ?? 'phone';
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <View
        {...SIZES[layout]}
        borderWidth={borderWidths.quiet}
        borderColor={colors.gray400}
        overflow="hidden"
      >
        {props.shell ? (
          <AppShellFrame
            layout={layout}
            data={SESION}
            activeTabKey="/inicio"
            mode="local"
            onNavigate={() => undefined}
            onLock={() => undefined}
          >
            {props.children}
          </AppShellFrame>
        ) : (
          props.children
        )}
      </View>
    </SafeAreaProvider>
  );
}
