/**
 * Tecla — one key of El Mostrador's keypads (MvAcceso and MvBloqueo's NIP,
 * MvAbrirTurno's fondo): white with the black edge and the small hard
 * shadow, the figure in 800 tabular numerals, the press stamp (2/2, the
 * shadow to `pressed`). `tono="suave"` is the gray «Borrar»; `tono="accion"`
 * the yellow key that sends, which turns to the disabled confirm until the
 * entry is complete.
 *
 * The stamp is a style swap, not an animation, so Reduce Motion has nothing
 * to stop.
 */
import type { ReactElement, ReactNode } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { Text, View } from '@tamagui/core';
import { impactLight } from '../../haptics/index';
import {
  borderColors,
  borderWidths,
  colors,
  portalFontSizes,
  radii,
  shadows,
  typography,
} from '../../theme';

export type TeclaTono = 'normal' | 'suave' | 'accion';

export interface TeclaProps {
  readonly label: string;
  /** Overrides `label` for screen readers («Borrar el último número»). */
  readonly ariaLabel?: string;
  readonly onPress: () => void;
  readonly tono?: TeclaTono;
  readonly disabled?: boolean;
  /** 50 (fondo), 58 (Acceso) or 66 (Bloqueo). */
  readonly height: number;
  /** Before the label: the backspace or the arrow. */
  readonly icon?: ReactNode;
  readonly iconAfter?: boolean;
  /** The figure's size; the words on «Borrar» and «Entrar» are smaller. */
  readonly figura?: boolean;
  readonly testID?: string;
}

const FONDO: Record<TeclaTono, string> = {
  normal: colors.white,
  suave: colors.gray100,
  accion: colors.yellow,
};

/** 14 on the fondo's 50 px keys, 16 on Acceso's 58, 18 on Bloqueo's 66 (the boards). */
function radioDe(height: number): number {
  if (height > 60) return radii[5];
  return height >= 56 ? radii[4] : radii[3];
}

/** 22 / 26 / 30 px figures; the words are 14 px, 16 on the key that sends. */
function tamanoDe(p: TeclaProps): number {
  if (p.figura === false) return p.tono === 'accion' ? portalFontSizes.lg : portalFontSizes.md;
  if (p.height > 60) return portalFontSizes.xl5;
  return p.height >= 56 ? portalFontSizes.xl4 : portalFontSizes.xl2;
}

function estilo(p: TeclaProps, pressed: boolean): ViewStyle {
  const off = p.disabled === true;
  const accion = p.tono === 'accion';
  return {
    flex: 1,
    height: p.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radioDe(p.height),
    borderWidth: off ? borderWidths.quiet : accion ? borderWidths.thick : borderWidths.thin,
    borderColor: off ? borderColors.quiet : colors.black,
    backgroundColor: off ? colors.gray100 : FONDO[p.tono ?? 'normal'],
    boxShadow: off ? 'none' : pressed ? shadows.pressed : shadows.small,
    transform: pressed && !off ? [{ translateX: 2 }, { translateY: 2 }] : [],
  };
}

export function Tecla(props: TeclaProps): ReactElement {
  const off = props.disabled === true;
  const label = (
    <Text
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.extraBold}
      fontSize={tamanoDe(props)}
      fontVariant={['tabular-nums']}
      color={off ? colors.textMuted : colors.black}
    >
      {props.label}
    </Text>
  );
  return (
    <Pressable
      testID={props.testID}
      role="button"
      aria-label={props.ariaLabel ?? props.label}
      aria-disabled={off}
      disabled={off}
      onPress={() => {
        impactLight();
        props.onPress();
      }}
      style={({ pressed }) => estilo(props, pressed)}
    >
      {props.iconAfter ? null : props.icon}
      {props.label === '' ? null : label}
      {props.iconAfter ? <View>{props.icon}</View> : null}
    </Pressable>
  );
}
