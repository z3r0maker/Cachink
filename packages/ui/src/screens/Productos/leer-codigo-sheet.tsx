/**
 * The quick add's «Escanear código» (A-09, M-20): the escáner's camera in a
 * bottom sheet, reading one code into the field and closing. The same camera
 * Cobrar and Inventario use (`EscanerCamara`), so a held barcode counts once.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { BottomSheet } from '../../components/BottomSheet/index';
import { MText } from '../../components/Mostrador/index';
import { EscanerCamara } from '../Ventas/escaner-camara';

export function LeerCodigoSheet(p: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onCodigo: (codigo: string) => void;
}): ReactElement {
  return (
    <BottomSheet
      open={p.open}
      onClose={p.onClose}
      eyebrow="Código de barras"
      title="Escanea el producto"
      closeLabel="Cerrar el escáner"
      testID="producto-scan-sheet"
    >
      <View gap={12}>
        <EscanerCamara
          luz={false}
          activo={p.open}
          onCodigo={(codigo) => {
            p.onCodigo(codigo);
            p.onClose();
          }}
        />
        <MText weight="bold" textAlign="center">
          Apunta al código de barras
        </MText>
      </View>
    </BottomSheet>
  );
}
