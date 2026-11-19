/**
 * The camera's live view (M-13, MvFotoCamara): `expo-camera`'s back camera,
 * the torch when asked, one still per shutter press. Until the camera is
 * allowed it asks, in the board's words for the photo.
 */
import { useImperativeHandle, useRef, type ReactElement } from 'react';
import { CameraView } from 'expo-camera';
import { View } from '@tamagui/core';
import { Btn } from '../components/Btn/index';
import { MText } from '../components/Mostrador/index';
import { usePermisoCamara } from '../hooks/use-permiso-camara';
import { colors } from '../theme';
import type { FotoVisorProps } from './foto-visor-tipos';

function Permiso(p: { readonly onPedir: () => void }): ReactElement {
  return (
    <View flex={1} alignItems="center" justifyContent="center" gap={12} padding={16}>
      <MText size="md" weight="semibold" color={colors.white} textAlign="center">
        Para la foto del producto, Xangarro necesita la cámara.
      </MText>
      <Btn variant="primary" size="lg" sentence onPress={p.onPedir} testID="foto-permiso">
        Permitir la cámara
      </Btn>
    </View>
  );
}

export function FotoVisor(p: FotoVisorProps): ReactElement {
  const { permiso, solicitar } = usePermisoCamara();
  const camara = useRef<CameraView>(null);
  useImperativeHandle(
    p.ref,
    () => ({
      tomar: async () => {
        const foto = await camara.current?.takePictureAsync({ quality: 0.9 });
        return foto?.uri ?? null;
      },
    }),
    [],
  );
  if (permiso === null) return <View testID="foto-visor" flex={1} />;
  if (!permiso.granted) return <Permiso onPedir={solicitar} />;
  return (
    <CameraView
      ref={camara}
      testID="foto-visor"
      style={{ flex: 1 }}
      facing="back"
      enableTorch={p.linterna}
    />
  );
}
