/**
 * The animated splash (MarcaSplashAnimado). The phone's own splash can only
 * be a still image, so this is the app's first frame drawn exactly like it:
 * the same background, with the coin and the «!» as their own layers. The
 * coin flips with a small hop and the «!» jumps while the app opens its
 * database; once the first real screen is up (`useArranque`), it fades out
 * at the end of a flip (`momentoDeSalida`). Reduce Motion: no flip, a short
 * crossfade. E2E runs skip it, as they skip the floating coins.
 */
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Animated, Easing, Image, StyleSheet, useWindowDimensions } from 'react-native';
import exclamacionPng from '../../assets/splash/exclamacion.png';
import fondoPng from '../../assets/splash/fondo.png';
import monedaPng from '../../assets/splash/moneda.png';
import { colors } from '../../theme';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { useArranque } from './arranque';
import { EXCLAMACION, LIENZO, MONEDA, aPantalla } from './splash-capas';
import {
  CICLO_MS,
  SALIDA_MS,
  SALIDA_REDUCIDA_MS,
  TOPE_MS,
  momentoDeSalida,
} from './splash-tiempos';

const IS_E2E = process.env.EXPO_PUBLIC_E2E === '1';

/** One 1.1 s cycle: the flip and hop fill its first 58 %, then the coin rests. */
function useCiclo(reducido: boolean): Animated.Value {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducido) {
      t.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: CICLO_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t, reducido]);
  return t;
}

/** Counts from mount; leaves at `momentoDeSalida`, or at the cap regardless. */
function useSalida(reducido: boolean): { salida: Animated.Value; visible: boolean } {
  const listo = useArranque((s) => s.listo);
  const inicio = useRef(Date.now()).current;
  const salida = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(true);
  const yendo = useRef(false);
  useEffect(() => {
    const transcurrido = Date.now() - inicio;
    const cuando = listo ? momentoDeSalida(transcurrido, reducido) : TOPE_MS;
    const id = setTimeout(
      () => {
        if (yendo.current) return;
        yendo.current = true;
        Animated.timing(salida, {
          toValue: 1,
          duration: reducido ? SALIDA_REDUCIDA_MS : SALIDA_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start(() => setVisible(false));
      },
      Math.max(0, cuando - transcurrido),
    );
    return () => clearTimeout(id);
  }, [listo, reducido, inicio, salida]);
  return { salida, visible };
}

function moverMoneda(t: Animated.Value, escala: number) {
  return [
    { perspective: 700 * escala },
    {
      translateY: t.interpolate({
        inputRange: [0, 0.26, 0.58, 1],
        outputRange: [0, -22 * escala, 0, 0],
      }),
    },
    {
      rotateY: t.interpolate({
        inputRange: [0, 0.1, 0.26, 0.45, 0.58, 1],
        outputRange: ['0deg', '110deg', '200deg', '320deg', '360deg', '360deg'],
      }),
    },
  ];
}

function moverExclamacion(t: Animated.Value, escala: number) {
  const pasos = [0, 0.4, 0.52, 0.63, 0.72, 1];
  return [
    {
      translateY: t.interpolate({ inputRange: pasos, outputRange: [0, 0, -10 * escala, 0, 0, 0] }),
    },
    {
      rotate: t.interpolate({
        inputRange: pasos,
        outputRange: ['0deg', '0deg', '8deg', '-4deg', '0deg', '0deg'],
      }),
    },
  ];
}

export function SplashAnimado(): ReactElement | null {
  const reducido = useReducedMotion();
  const pantalla = useWindowDimensions();
  const t = useCiclo(reducido);
  const { salida, visible } = useSalida(reducido);
  if (IS_E2E || !visible) return null;
  const escala = Math.max(pantalla.width / LIENZO.w, pantalla.height / LIENZO.h);
  const fondo = aPantalla({ x: 0, y: 0, ...LIENZO }, pantalla);
  const opacity = salida.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const scale = salida.interpolate({ inputRange: [0, 1], outputRange: [1, reducido ? 1 : 1.06] });
  return (
    <Animated.View
      testID="splash-animado"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.capa, { opacity, transform: [{ scale }] }]}
    >
      <Image source={fondoPng} style={[styles.abs, fondo]} />
      <Animated.Image
        source={monedaPng}
        style={[styles.abs, aPantalla(MONEDA, pantalla), { transform: moverMoneda(t, escala) }]}
      />
      <Animated.Image
        source={exclamacionPng}
        style={[
          styles.abs,
          aPantalla(EXCLAMACION, pantalla),
          { transformOrigin: '50% 90%', transform: moverExclamacion(t, escala) },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  capa: { backgroundColor: colors.yellow, overflow: 'hidden', zIndex: 1000, elevation: 1000 },
  abs: { position: 'absolute' },
});
