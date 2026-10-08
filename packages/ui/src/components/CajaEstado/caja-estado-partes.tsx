/**
 * The pieces of the caja's shared states (MvEstados, the web's
 * `operador/estado.tsx`): the card they sit on, the 22 px title, the body,
 * the yellow action and the loader's pale rows.
 */
import type { ReactElement, ReactNode } from 'react';
import { View } from '@tamagui/core';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { MText } from '../Mostrador/mtext';

/** The quiet card every state sits on; the error's edge turns red. */
export function Tarjeta(p: {
  readonly tono?: 'quieto' | 'alerta';
  readonly children: ReactNode;
  readonly testID: string;
  readonly role?: 'alert' | 'status';
  readonly label?: string;
  readonly busy?: boolean;
}): ReactElement {
  return (
    <View
      testID={p.testID}
      role={p.role}
      aria-label={p.label}
      aria-live={p.role ? 'polite' : undefined}
      aria-busy={p.busy}
      alignItems="center"
      gap={10}
      paddingHorizontal={20}
      paddingTop={22}
      paddingBottom={26}
      borderRadius={radii[6]}
      borderWidth={borderWidths.quiet}
      borderColor={p.tono === 'alerta' ? colors.redText : borderColors.quiet}
      backgroundColor={colors.white}
    >
      {p.children}
    </View>
  );
}

export function Titulo({ children }: { readonly children: string }): ReactElement {
  return (
    <MText size="xl2" weight="extraBold" textAlign="center" letterSpacing={-0.5} role="heading">
      {children}
    </MText>
  );
}

export function Cuerpo({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <MText size="body" weight="semibold" color={colors.gray600} textAlign="center" lineHeight={22}>
      {children}
    </MText>
  );
}

const ANCHOS = ['52%', '38%', '46%', '30%'] as const;

/** The loader's rows: a tile, a bar, a short bar; decorative. */
export function FilasPalidas(): ReactElement {
  return (
    <View alignSelf="stretch" marginTop={14} gap={10} aria-hidden>
      {ANCHOS.map((w) => (
        <View
          key={w}
          flexDirection="row"
          alignItems="center"
          gap={12}
          height={56}
          paddingHorizontal={12}
          borderRadius={radii[3]}
          borderWidth={borderWidths.quiet}
          borderColor={colors.gray100}
        >
          <View width={32} height={32} borderRadius={radii[0]} backgroundColor={colors.gray200} />
          <View height={10} width={w} borderRadius={radii[0]} backgroundColor={colors.gray200} />
          <View
            marginLeft="auto"
            width={54}
            height={10}
            borderRadius={radii[0]}
            backgroundColor={colors.gray100}
          />
        </View>
      ))}
    </View>
  );
}
