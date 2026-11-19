/**
 * «Comprobante (opcional)» in Registrar gasto (M-18, board CgHoja): with no
 * photo, a dashed row that opens the camera («Tómale foto al ticket»; a long
 * press goes to the gallery); with one, its thumbnail, «Foto lista» and the
 * draft's two actions, «Cambiar» and the cross that removes it. The gasto
 * saves either way. The thumbnail lands with «Captura» (CgCaptura): it
 * shrinks into the row from where the camera was.
 */
import type { ReactElement } from 'react';
import { Animated, Image, Pressable, type ImageStyle, type ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import { MText } from '../components/Mostrador/index';
import { Eyebrow } from '../components/Panel/index';
import { PathIcon } from '../components/PathIcon/index';
import { GLYPHS } from '../components/PathIcon/glyphs';
import { useLlegada } from '../components/motion/use-captura-motion';
import { FOTO_GLIFOS } from '../foto-producto/foto-glifos';
import { borderWidths, colors, radii } from '../theme';

export interface CampoComprobanteProps {
  /** The draft's photo as a `data:` URI, or null before one is taken. */
  readonly foto: string | null;
  readonly procesando: boolean;
  /** Why the last photo was refused, in the operator's words. */
  readonly error: string | null;
  readonly onTomar: () => void;
  readonly onGaleria: () => void;
  readonly onQuitar: () => void;
}

const VACIO: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  padding: 12,
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderStyle: 'dashed',
  borderColor: colors.gray600,
  backgroundColor: colors.gray100,
};

const BOTON: ViewStyle = {
  height: 44,
  minWidth: 44,
  paddingHorizontal: 12,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[2],
  backgroundColor: colors.white,
};

const MINIATURA: ImageStyle = {
  width: 46,
  height: 60,
  borderRadius: radii[0],
  borderWidth: borderWidths.quiet,
  borderColor: colors.black,
};

function Camarita(): ReactElement {
  return (
    <View
      width={44}
      height={44}
      alignItems="center"
      justifyContent="center"
      borderRadius={radii[2]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.yellow}
    >
      <PathIcon d={FOTO_GLIFOS.camara} size={22} strokeWidth={2.2} color={colors.black} />
    </View>
  );
}

/** Title over a quiet line, as both states say what the row holds. */
function Textos(p: { readonly titulo: string; readonly linea: string; readonly tenue: boolean }) {
  return (
    <View flex={1} gap={2}>
      <MText size="lg" weight="extraBold">
        {p.titulo}
      </MText>
      <MText size="md" weight="semibold" color={p.tenue ? colors.gray600 : colors.black}>
        {p.linea}
      </MText>
    </View>
  );
}

function Vacio(p: CampoComprobanteProps): ReactElement {
  return (
    <Pressable
      testID="gasto-comprobante-tomar"
      role="button"
      aria-label="Tómale foto al ticket"
      aria-busy={p.procesando}
      onPress={p.procesando ? undefined : p.onTomar}
      onLongPress={p.procesando ? undefined : p.onGaleria}
      style={VACIO}
    >
      <Camarita />
      <Textos
        titulo={p.procesando ? 'Guardando la foto…' : 'Tómale foto al ticket'}
        linea="Así el dueño no te lo pregunta."
        tenue
      />
    </Pressable>
  );
}

function Acciones(p: { readonly onCambiar: () => void; readonly onQuitar: () => void }) {
  return (
    <>
      <Pressable
        testID="gasto-comprobante-cambiar"
        role="button"
        onPress={p.onCambiar}
        style={{ ...BOTON, borderWidth: borderWidths.thin, borderColor: colors.black }}
      >
        <MText size="md" weight="extraBold">
          Cambiar
        </MText>
      </Pressable>
      <Pressable
        testID="gasto-comprobante-quitar"
        role="button"
        aria-label="Quitar la foto"
        onPress={p.onQuitar}
        style={{ ...BOTON, borderWidth: borderWidths.quiet, borderColor: colors.gray200 }}
      >
        <PathIcon d={GLYPHS.close} size={18} strokeWidth={2.4} color={colors.black} />
      </Pressable>
    </>
  );
}

/** The draft's photo, landing in the row (CgCaptura «Se va a su lugar»). */
function Miniatura({ uri }: { readonly uri: string }): ReactElement {
  const llegada = useLlegada();
  return (
    <Animated.View style={{ zIndex: 1, ...llegada }}>
      <Image source={{ uri }} accessibilityIgnoresInvertColors style={MINIATURA} />
    </Animated.View>
  );
}

function Lista(p: CampoComprobanteProps & { readonly foto: string }): ReactElement {
  return (
    <View
      testID="gasto-comprobante-lista"
      flexDirection="row"
      alignItems="center"
      gap={12}
      padding={8}
      borderRadius={radii[3]}
      borderWidth={borderWidths.thin}
      borderColor={colors.greenText}
      backgroundColor={colors.greenSoft}
    >
      <Miniatura uri={p.foto} />
      <Textos titulo="Foto lista" linea="Se manda al dueño con el gasto." tenue={false} />
      <Acciones onCambiar={p.onTomar} onQuitar={p.onQuitar} />
    </View>
  );
}

export function CampoComprobante(p: CampoComprobanteProps): ReactElement {
  return (
    <View gap={6}>
      <Eyebrow color={colors.gray600}>Comprobante (opcional)</Eyebrow>
      {p.foto === null ? <Vacio {...p} /> : <Lista {...p} foto={p.foto} />}
      {p.error === null ? null : (
        <MText role="alert" size="md" weight="bold" color={colors.redText}>
          {p.error}
        </MText>
      )}
    </View>
  );
}
