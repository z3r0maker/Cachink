/**
 * The escáner's camera on the phone (MvEscaner): expo-camera's `CameraView`
 * with the torch, reading one code at a time. Without permission it asks for
 * it; the typed code below works either way.
 */
import { useRef, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { colors, radii } from '../../theme';
import { REPETIDO_MS, type EscanerCamaraProps } from './escaner-camara.shared';
import { EscanerVisor } from './escaner-visor';

function useUnaLectura(onCodigo: (c: string) => void): (r: { data: string }) => void {
  const ultimo = useRef<{ codigo: string; at: number } | null>(null);
  return ({ data }) => {
    const now = Date.now();
    const u = ultimo.current;
    if (u && u.codigo === data && now - u.at < REPETIDO_MS) return;
    ultimo.current = { codigo: data, at: now };
    onCodigo(data);
  };
}

function Permiso({ onPedir }: { onPedir: () => void }): ReactElement {
  return (
    <View flex={1} alignItems="center" justifyContent="center" padding={16} gap={12}>
      <MText weight="bold" color={colors.white} textAlign="center">
        Para escanear, la caja necesita usar la cámara.
      </MText>
      <Btn variant="primary" size="lg" sentence onPress={onPedir} testID="escaner-permiso">
        Dar permiso a la cámara
      </Btn>
    </View>
  );
}

export function EscanerCamara(props: EscanerCamaraProps): ReactElement {
  const [permiso, pedir] = useCameraPermissions();
  const leer = useUnaLectura(props.onCodigo);
  const concedido = permiso?.granted === true;
  return (
    <View
      testID="escaner-camara"
      position="relative"
      height={240}
      borderRadius={radii[4]}
      overflow="hidden"
      backgroundColor={colors.ink}
    >
      {concedido ? (
        <>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            enableTorch={props.luz}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
            onBarcodeScanned={props.activo ? leer : undefined}
          />
          <EscanerVisor />
        </>
      ) : (
        <Permiso onPedir={() => void pedir()} />
      )}
    </View>
  );
}
