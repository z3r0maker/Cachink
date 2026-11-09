/**
 * «Foto del producto» — the camera (M-13, board MvFotoCamara): a dark sheet
 * over the whole screen with the product's name, the live view inside the
 * yellow square guide, the hint, and the three controls — the gallery, the
 * shutter, the torch. One shot hands its file on; closing takes no photo.
 */
import { useRef, useState, type ReactElement, type RefObject } from 'react';
import { Modal, Pressable, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from '@tamagui/core';
import { MText } from '../components/Mostrador/index';
import { Eyebrow } from '../components/Panel/index';
import { PathIcon } from '../components/PathIcon/index';
import { GLYPHS } from '../components/PathIcon/glyphs';
import { borderWidths, colors, radii, shapeRadii } from '../theme';
import { ControlesCamara } from './foto-camara-controles';
import { FotoVisor } from './foto-visor';
import type { FotoVisorHandle } from './foto-visor-tipos';

const GUIA = 300;
const ESQUINAS = [
  'M4 44V12a8 8 0 0 1 8-8h32',
  'M256 4h32a8 8 0 0 1 8 8v32',
  'M296 256v32a8 8 0 0 1-8 8h-32',
  'M44 296H12a8 8 0 0 1-8-8v-32',
];

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

export interface FotoCamaraSheetProps {
  readonly nombre: string;
  readonly onTomada: (uri: string) => void;
  readonly onGaleria: () => void;
  readonly onCerrar: () => void;
}

function Cabeza(p: { readonly nombre: string; readonly onCerrar: () => void }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={10} paddingHorizontal={16}>
      <View flex={1} minWidth={0} gap={2} paddingLeft={4}>
        <Eyebrow color={colors.gray400}>Foto del producto</Eyebrow>
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

/** The live view inside the square, the yellow corners over it. */
function Guia(p: {
  readonly visor: RefObject<FotoVisorHandle | null>;
  readonly linterna: boolean;
}): ReactElement {
  return (
    <View width={GUIA} height={GUIA} alignItems="center" justifyContent="center">
      <View
        position="absolute"
        top={10}
        left={10}
        right={10}
        bottom={10}
        borderRadius={radii[2]}
        overflow="hidden"
      >
        <FotoVisor ref={p.visor} linterna={p.linterna} />
      </View>
      <Svg width={GUIA} height={GUIA} viewBox="0 0 300 300" style={{ position: 'absolute' }}>
        {ESQUINAS.map((d) => (
          <Path
            key={d}
            d={d}
            fill="none"
            stroke={colors.yellow}
            strokeWidth={5}
            strokeLinecap="round"
          />
        ))}
      </Svg>
    </View>
  );
}

function Visor(p: {
  readonly visor: RefObject<FotoVisorHandle | null>;
  readonly linterna: boolean;
}): ReactElement {
  return (
    <View
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
      <Guia visor={p.visor} linterna={p.linterna} />
      <MText size="lg" weight="extraBold" color={colors.white} textAlign="center">
        Ponlo sobre algo liso y con luz
      </MText>
      <MText size="md" weight="semibold" color={colors.gray400} textAlign="center">
        Se recorta el fondo solo. Si no se puede, se guarda la foto completa.
      </MText>
    </View>
  );
}

/** The shutter: one still from the view, handed on when there is one. */
function useDisparo(onTomada: (uri: string) => void) {
  const visor = useRef<FotoVisorHandle | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const disparar = (): void => {
    setOcupado(true);
    void (visor.current?.tomar() ?? Promise.resolve(null))
      .then((uri) => (uri ? onTomada(uri) : undefined))
      .finally(() => setOcupado(false));
  };
  return { visor, ocupado, disparar };
}

export function FotoCamaraSheet(p: FotoCamaraSheetProps): ReactElement {
  const insets = useSafeAreaInsets();
  const [linterna, setLinterna] = useState(false);
  const { visor, ocupado, disparar } = useDisparo(p.onTomada);
  return (
    <Modal visible animationType="slide" onRequestClose={p.onCerrar} statusBarTranslucent>
      <View
        testID="foto-camara-sheet"
        flex={1}
        backgroundColor={colors.black}
        paddingTop={insets.top + 10}
        paddingBottom={insets.bottom + 26}
      >
        <View
          alignSelf="center"
          width={40}
          height={5}
          marginBottom={14}
          borderRadius={shapeRadii.pill}
          backgroundColor={colors.gray600}
        />
        <Cabeza nombre={p.nombre} onCerrar={p.onCerrar} />
        <Visor visor={visor} linterna={linterna} />
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
