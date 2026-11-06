/**
 * «Se levanta» (M-13, El Mostrador §6; board MvFotoListo): the photo as it
 * was shot fades to the product's tint while the cutout rises 10 px and
 * grows 4 %, 500 ms after a beat; then the green check pops in. Under
 * Reduce Motion it is a direct cut to the end (the board's sixth rule).
 */
import { useEffect, useRef, type ReactElement } from 'react';
import { Animated, Easing, Image, type ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import { PathIcon } from '../components/PathIcon/index';
import { GLYPHS } from '../components/PathIcon/glyphs';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { borderWidths, colors, shapeRadii } from '../theme';

const PAUSA = 550;
const LEVANTA = 500;
const CHECK = 220;
const EASE = Easing.bezier(0.2, 0.8, 0.3, 1);

const LLENO: ViewStyle = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };
const ESQUINA: ViewStyle = { position: 'absolute', right: 12, bottom: 12 };

/** A value eased from 0 to 1. */
const subir = (v: Animated.Value, duration: number) =>
  Animated.timing(v, { toValue: 1, duration, easing: EASE, useNativeDriver: true });

function useLevanta(): { fondo: Animated.Value; sube: Animated.Value; check: Animated.Value } {
  const reduced = useReducedMotion();
  const fondo = useRef(new Animated.Value(1)).current;
  const sube = useRef(new Animated.Value(0)).current;
  const check = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) {
      fondo.setValue(0);
      sube.setValue(1);
      check.setValue(1);
      return;
    }
    const anim = Animated.sequence([
      Animated.delay(PAUSA),
      Animated.parallel([
        Animated.timing(fondo, { toValue: 0, duration: LEVANTA, useNativeDriver: true }),
        subir(sube, LEVANTA),
      ]),
      subir(check, CHECK),
    ]);
    anim.start();
    return () => anim.stop();
  }, [check, fondo, reduced, sube]);
  return { fondo, sube, check };
}

const entre = (v: Animated.Value, desde: number, hasta: number) =>
  v.interpolate({ inputRange: [0, 1], outputRange: [desde, hasta] });

function Check({ v }: { readonly v: Animated.Value }): ReactElement {
  return (
    <Animated.View style={[ESQUINA, { opacity: v, transform: [{ scale: entre(v, 0.6, 1) }] }]}>
      <View
        width={36}
        height={36}
        alignItems="center"
        justifyContent="center"
        borderRadius={shapeRadii.pill}
        borderWidth={borderWidths.thick}
        borderColor={colors.black}
        backgroundColor={colors.green}
      >
        <PathIcon d={GLYPHS.check} size={20} strokeWidth={3} />
      </View>
    </Animated.View>
  );
}

export function FotoLevanta(p: {
  readonly original: string;
  readonly recorte: string;
  readonly side: number;
}): ReactElement {
  const { fondo, sube, check } = useLevanta();
  const lift = {
    transform: [{ translateY: entre(sube, 0, -10) }, { scale: entre(sube, 1, 1.04) }],
  };
  return (
    <>
      <Animated.View style={[LLENO, { opacity: fondo }]}>
        <Image source={{ uri: p.original }} style={{ width: '100%', height: '100%' }} aria-hidden />
      </Animated.View>
      <Animated.View style={lift}>
        <Image source={{ uri: p.recorte }} style={{ width: p.side, height: p.side }} aria-hidden />
      </Animated.View>
      <Check v={check} />
    </>
  );
}
