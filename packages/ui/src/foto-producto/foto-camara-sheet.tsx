/**
 * The camera (M-13, board MvFotoCamara; M-18, board CgHoja): a dark sheet
 * over the whole screen with what the photo is of, the live view inside the
 * yellow guide, the hint, and the three controls — the gallery, the shutter,
 * the torch. One shot hands its file on; closing takes no photo. The product
 * frames square and lifts; the gasto's receipt frames upright, with its own
 * eyebrow and hint. The shutter fires «Captura» (CgCaptura): a white flash
 * over the viewfinder and a light haptic.
 */
import { useRef, useState, type ReactElement, type RefObject } from 'react';
import { Animated, Modal, Pressable, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from '@tamagui/core';
import { MText } from '../components/Mostrador/index';
import { Eyebrow } from '../components/Panel/index';
import { PathIcon } from '../components/PathIcon/index';
import { GLYPHS } from '../components/PathIcon/glyphs';
import { useDestello } from '../components/motion/use-captura-motion';
import { borderWidths, colors, radii, shapeRadii } from '../theme';
import { ControlesCamara } from './foto-camara-controles';
import { FotoGuia, type FormaGuia } from './foto-guia';
import type { FotoVisorHandle } from './foto-visor-tipos';

const CERRAR: ViewStyle = {
  width: 44,
  height: 44,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[2],
  borderWidth: borderWidths.quiet,
  borderColor: colors.gray600,
  backgroundColor: colors.ink,
};

/** What the hint under the guide says. */
export interface PistaCamara {
  readonly titulo: string;
  readonly cuerpo: string;
}

const PISTA_PRODUCTO: PistaCamara = {
  titulo: 'Ponlo sobre algo liso y con luz',
  cuerpo: 'Se recorta el fondo solo. Si no se puede, se guarda la foto completa.',
};

export interface FotoCamaraSheetProps {
  readonly nombre: string;
  /** Over the name; «Foto del producto» unless told otherwise. */
  readonly eyebrow?: string;
  readonly forma?: FormaGuia;
  readonly pista?: PistaCamara;
  readonly onTomada: (uri: string) => void;
  readonly onGaleria: () => void;
  readonly onCerrar: () => void;
}

function Cabeza(p: {
  readonly nombre: string;
  readonly eyebrow: string;
  readonly onCerrar: () => void;
}): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={10} paddingHorizontal={16}>
      <View flex={1} minWidth={0} gap={2} paddingLeft={4}>
        <Eyebrow color={colors.gray400}>{p.eyebrow}</Eyebrow>
        <MText size="xl3" weight="extraBold" color={colors.white} numberOfLines={1}>
          {p.nombre}
        </MText>
      </View>
      <Pressable
        testID="foto-camara-cerrar"
        role="button"
        aria-label="Cerrar la cámara sin tomar foto"
        onPress={p.onCerrar}
        style={CERRAR}
      >
        <PathIcon d={GLYPHS.close} size={20} strokeWidth={2.4} color={colors.white} />
      </Pressable>
    </View>
  );
}

/** The shutter's white flash, laid over the whole viewfinder (CgCaptura). */
function Destello({ opacity }: { readonly opacity: Animated.Value }): ReactElement {
  return (
    <Animated.View
      testID="foto-destello"
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.white,
        opacity,
      }}
    />
  );
}

function Visor(p: {
  readonly visor: RefObject<FotoVisorHandle | null>;
  readonly linterna: boolean;
  readonly forma: FormaGuia;
  readonly pista: PistaCamara;
  /** The shutter's flash, over the whole viewfinder. */
  readonly destello: Animated.Value;
}): ReactElement {
  return (
    <View
      overflow="hidden"
      flex={1}
      marginHorizontal={12}
      marginTop={12}
      padding={16}
      gap={18}
      alignItems="center"
      justifyContent="center"
      borderRadius={radii[6]}
      backgroundColor={colors.ink}
    >
      <FotoGuia visor={p.visor} linterna={p.linterna} forma={p.forma} />
      <MText size="lg" weight="extraBold" color={colors.white} textAlign="center">
        {p.pista.titulo}
      </MText>
      <MText size="md" weight="semibold" color={colors.gray400} textAlign="center">
        {p.pista.cuerpo}
      </MText>
      <Destello opacity={p.destello} />
    </View>
  );
}

/** The sheet's grab handle. */
function Asa(): ReactElement {
  return (
    <View
      alignSelf="center"
      width={40}
      height={5}
      marginBottom={14}
      borderRadius={shapeRadii.pill}
      backgroundColor={colors.gray600}
    />
  );
}

/** The shutter: one still from the view, handed on when there is one. */
function useDisparo(onTomada: (uri: string) => void) {
  const visor = useRef<FotoVisorHandle | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const destello = useDestello();
  const disparar = (): void => {
    destello.disparar();
    setOcupado(true);
    void (visor.current?.tomar() ?? Promise.resolve(null))
      .then((uri) => (uri ? onTomada(uri) : undefined))
      .finally(() => setOcupado(false));
  };
  return { visor, ocupado, disparar, destello: destello.opacity };
}

export function FotoCamaraSheet(p: FotoCamaraSheetProps): ReactElement {
  const insets = useSafeAreaInsets();
  const [linterna, setLinterna] = useState(false);
  const { visor, ocupado, disparar, destello } = useDisparo(p.onTomada);
  return (
    <Modal visible animationType="slide" onRequestClose={p.onCerrar} statusBarTranslucent>
      <View
        testID="foto-camara-sheet"
        flex={1}
        backgroundColor={colors.black}
        paddingTop={insets.top + 10}
        paddingBottom={insets.bottom + 26}
      >
        <Asa />
        <Cabeza
          nombre={p.nombre}
          eyebrow={p.eyebrow ?? 'Foto del producto'}
          onCerrar={p.onCerrar}
        />
        <Visor
          visor={visor}
          linterna={linterna}
          forma={p.forma ?? 'cuadrada'}
          pista={p.pista ?? PISTA_PRODUCTO}
          destello={destello}
        />
        <ControlesCamara
          onGaleria={p.onGaleria}
          onDisparar={disparar}
          ocupado={ocupado}
          linterna={linterna}
          onLinterna={() => setLinterna((v) => !v)}
        />
      </View>
    </Modal>
  );
}
