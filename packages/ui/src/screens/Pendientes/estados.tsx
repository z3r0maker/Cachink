/**
 * EstadosCaja — the shared data-state family the M-09 screens (and the ones
 * after them) show besides their data (MvEstados, `Operador Estado` on the
 * web): cargando, sin nada, falla, sin internet. It generalizes M-08's
 * `VentasEstados` (`Ventas/venta-estados.tsx`): each state says what to do
 * next, nothing is fixture-fed, and the words come in as props so every
 * screen keeps its own voice.
 */
import type { ReactElement, ReactNode } from 'react';
import { View } from '@tamagui/core';
import { Btn, ErrorState, Spinner } from '../../components/index';
import { EmptyState } from '../../components/EmptyState/index';
import { MText } from '../../components/Mostrador/index';
import { GLYPHS } from '../../components/PathIcon/glyphs';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, radii, shapeRadii } from '../../theme';

/** The family: a screen is its data, or one of these (El Mostrador §8). */
export type EstadoCaja = 'cargando' | 'sin-nada' | 'falla' | 'sin-internet';

export interface EstadosCajaProps {
  readonly id: EstadoCaja;
  /** The screen's own title for the state; each has a sensible default. */
  readonly titulo?: string;
  /** The screen's own body; each has a sensible default. */
  readonly cuerpo?: string;
  /** falla's retry and sin-internet's way forward. */
  readonly onRetry?: () => void;
  readonly reintentarLabel?: string;
  /** sin-nada's action (a Btn, a row of them); shown when given. */
  readonly accion?: ReactNode;
  readonly testID?: string;
}

const DEFECTO: Record<EstadoCaja, { readonly titulo: string; readonly cuerpo: string }> = {
  cargando: { titulo: 'Cargando…', cuerpo: '' },
  'sin-nada': {
    titulo: 'Nada por aquí todavía',
    cuerpo: 'En cuanto captures algo, aparece en esta lista.',
  },
  falla: {
    titulo: 'No pudimos cargar esto',
    cuerpo: 'Lo que capturaste sigue guardado en esta caja. Vuelve a intentar en un momento.',
  },
  'sin-internet': {
    titulo: 'Sin internet',
    cuerpo: 'Puedes seguir cobrando. Lo que captures se guarda aquí y se envía solo.',
  },
};

function Cargando(p: EstadosCajaProps): ReactElement {
  return (
    <View
      flex={1}
      alignItems="center"
      justifyContent="center"
      padding={24}
      testID={`${p.testID ?? 'estados'}-cargando`}
      role="status"
      aria-busy
      accessibilityLabel={p.titulo ?? DEFECTO.cargando.titulo}
    >
      <Spinner />
    </View>
  );
}

function SinNada(p: EstadosCajaProps): ReactElement {
  return (
    <View flex={1} justifyContent="center" testID={`${p.testID ?? 'estados'}-sin-nada`}>
      <EmptyState
        icon="inbox"
        title={p.titulo ?? DEFECTO['sin-nada'].titulo}
        description={p.cuerpo ?? DEFECTO['sin-nada'].cuerpo}
        action={p.accion}
        testID={`${p.testID ?? 'estados'}-vacio`}
      />
    </View>
  );
}

function Falla(p: EstadosCajaProps): ReactElement {
  return (
    <View flex={1} justifyContent="center" padding={16} testID={`${p.testID ?? 'estados'}-falla`}>
      <ErrorState
        title={p.titulo ?? DEFECTO.falla.titulo}
        body={p.cuerpo ?? DEFECTO.falla.cuerpo}
        retryLabel={p.reintentarLabel ?? 'Intentar otra vez'}
        onRetry={p.onRetry}
        testID={`${p.testID ?? 'estados'}-error`}
      />
    </View>
  );
}

/** The crossed-out Wi-Fi in its white circle, as the offline strip draws it. */
function SinRedGlyph(): ReactElement {
  return (
    <View
      width={44}
      height={44}
      alignItems="center"
      justifyContent="center"
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
      marginBottom={16}
    >
      <PathIcon d={GLYPHS.sinRed} size={20} strokeWidth={2.4} color={colors.warningText} />
    </View>
  );
}

function SinInternetTarjeta(p: EstadosCajaProps): ReactElement {
  return (
    <View
      alignItems="center"
      padding={20}
      borderWidth={borderWidths.quiet}
      borderRadius={radii[4]}
      backgroundColor={colors.white}
    >
      <SinRedGlyph />
      <MText size="lg" weight="extraBold" textAlign="center">
        {p.titulo ?? DEFECTO['sin-internet'].titulo}
      </MText>
      <MText
        size="sm"
        weight="semibold"
        color={colors.gray600}
        textAlign="center"
        marginTop={6}
        maxWidth={280}
        lineHeight={19}
      >
        {p.cuerpo ?? DEFECTO['sin-internet'].cuerpo}
      </MText>
      {p.onRetry ? (
        <View marginTop={16}>
          <Btn
            variant="primary"
            sentence
            onPress={p.onRetry}
            testID={`${p.testID ?? 'estados'}-reintentar`}
          >
            {p.reintentarLabel ?? 'Reintentar'}
          </Btn>
        </View>
      ) : null}
    </View>
  );
}

function SinInternet(p: EstadosCajaProps): ReactElement {
  return (
    <View
      flex={1}
      alignItems="center"
      justifyContent="center"
      padding={24}
      testID={`${p.testID ?? 'estados'}-sin-internet`}
      role="status"
    >
      <SinInternetTarjeta {...p} />
    </View>
  );
}

/** The state block: the screen's data, or one of the four. */
export function EstadosCaja(p: EstadosCajaProps): ReactElement {
  if (p.id === 'cargando') return <Cargando {...p} />;
  if (p.id === 'sin-nada') return <SinNada {...p} />;
  if (p.id === 'falla') return <Falla {...p} />;
  return <SinInternet {...p} />;
}
