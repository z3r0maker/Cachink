/**
 * The viewfinder's frame on MvVincular: a dark rounded box with «● Cámara»
 * across the top, four yellow corners, the scan line and the hint pill at
 * the bottom. The camera (or the permission ask) sits inside it. The line
 * stays still under Reduce Motion.
 */
import { useEffect, useRef, type ReactElement, type ReactNode } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import { View } from '@tamagui/core';
import { MText } from '../../components/index';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { borderWidths, colors, radii, shadows, shapeRadii } from '../../theme';

export const VISOR_ALTO = 300;
const MIRA = 204;
const ESQUINA = 40;
const TRAZO = 5;

function useBarrido(): Animated.Value {
  const reduced = useReducedMotion();
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return undefined;
    const ida = { toValue: 176, duration: 1100, easing: Easing.inOut(Easing.ease) };
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { ...ida, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(y, { ...ida, toValue: 0, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, y]);
  return y;
}

const LADOS = [
  { top: 0, left: 0, borderTopWidth: TRAZO, borderLeftWidth: TRAZO, borderTopLeftRadius: radii[3] },
  {
    top: 0,
    right: 0,
    borderTopWidth: TRAZO,
    borderRightWidth: TRAZO,
    borderTopRightRadius: radii[3],
  },
  {
    bottom: 0,
    left: 0,
    borderBottomWidth: TRAZO,
    borderLeftWidth: TRAZO,
    borderBottomLeftRadius: radii[3],
  },
  {
    bottom: 0,
    right: 0,
    borderBottomWidth: TRAZO,
    borderRightWidth: TRAZO,
    borderBottomRightRadius: radii[3],
  },
] as const;

function Mira(): ReactElement {
  const y = useBarrido();
  return (
    <View
      position="absolute"
      top="50%"
      left="50%"
      width={MIRA}
      height={MIRA}
      marginTop={-MIRA / 2}
      marginLeft={-MIRA / 2}
      pointerEvents="none"
    >
      {LADOS.map((l, i) => (
        <View
          key={i}
          position="absolute"
          width={ESQUINA}
          height={ESQUINA}
          borderColor={colors.yellow}
          style={l}
        />
      ))}
      <Animated.View
        style={{
          position: 'absolute',
          left: 14,
          right: 14,
          top: 12,
          height: 3,
          borderRadius: shapeRadii.pill,
          backgroundColor: colors.yellow,
          transform: [{ translateY: y }],
        }}
      />
    </View>
  );
}

function Barra(props: { etiqueta: string }): ReactElement {
  return (
    <View
      position="absolute"
      top={0}
      left={0}
      right={0}
      height={38}
      flexDirection="row"
      alignItems="center"
      gap={6}
      paddingHorizontal={14}
      pointerEvents="none"
    >
      <View width={8} height={8} borderRadius={shapeRadii.pill} backgroundColor={colors.yellow} />
      <MText size="xs" weight="extraBold" color={colors.white}>
        {props.etiqueta}
      </MText>
    </View>
  );
}

function Pista({ texto }: { texto: string }): ReactElement {
  return (
    <View
      position="absolute"
      bottom={12}
      left={16}
      right={16}
      alignItems="center"
      pointerEvents="none"
    >
      <View
        minHeight={32}
        justifyContent="center"
        paddingHorizontal={14}
        borderRadius={shapeRadii.pill}
        backgroundColor={colors.black}
      >
        <MText size="sm" weight="extraBold" color={colors.white} textAlign="center">
          {texto}
        </MText>
      </View>
    </View>
  );
}

export function VisorMarco(props: {
  readonly etiqueta: string;
  readonly pista: string;
  /** False while asking for the camera: no crosshair over the ask. */
  readonly mira: boolean;
  readonly children: ReactNode;
  readonly testID?: string;
}): ReactElement {
  return (
    <View
      testID={props.testID ?? 'vincular-visor'}
      position="relative"
      height={VISOR_ALTO}
      borderRadius={radii[7]}
      borderWidth={borderWidths.thick}
      borderColor={colors.black}
      backgroundColor={colors.ink}
      overflow="hidden"
      style={{ boxShadow: shadows.card }}
    >
      {props.children}
      <Barra etiqueta={props.etiqueta} />
      {props.mira ? <Mira /> : null}
      {props.mira ? <Pista texto={props.pista} /> : null}
    </View>
  );
}
