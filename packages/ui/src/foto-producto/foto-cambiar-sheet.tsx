/**
 * «Cambiar o quitar» (M-13, board MvFotoCambiar): a product that has a photo
 * opens this from its square — the photo, when and where it was taken, and
 * the three ways on: «Tomar otra foto», «Elegir de la galería», «Quitar foto».
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { BottomSheet } from '../components/BottomSheet/index';
import { Btn } from '../components/Btn/index';
import { MText } from '../components/Mostrador/index';
import { PathIcon } from '../components/PathIcon/index';
import { borderWidths, colors } from '../theme';
import { FotoCuadro } from './foto-cuadro';
import { FOTO_GLIFOS } from './foto-glifos';
import { CuadroGrande } from './foto-partes';
import type { FotoAbierta } from './use-foto-flujo';

const LADO = 180;
const FECHA = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

/** «Tomada el 3 de noviembre de 2026 en Caja 1»; the caja only when it was this one. */
export function tomadaEl(createdAt: string, caja: string | null): string {
  const fecha = FECHA.format(new Date(createdAt));
  return caja ? `Tomada el ${fecha} en ${caja}` : `Tomada el ${fecha}`;
}

export interface FotoCambiarSheetProps {
  readonly abierta: FotoAbierta;
  /** This caja's name when the photo was taken on this device, else null. */
  readonly caja: string | null;
  readonly onCamara: () => void;
  readonly onGaleria: () => void;
  readonly onQuitar: () => void;
  readonly onCerrar: () => void;
}

function Acciones(p: FotoCambiarSheetProps): ReactElement {
  return (
    <View gap={10}>
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        onPress={p.onCamara}
        testID="foto-cambiar-camara"
        icon={<PathIcon d={FOTO_GLIFOS.camara} size={20} strokeWidth={2.4} />}
      >
        Tomar otra foto
      </Btn>
      <Btn
        variant="secondary"
        size="lg"
        fullWidth
        onPress={p.onGaleria}
        testID="foto-cambiar-galeria"
        icon={<PathIcon d={FOTO_GLIFOS.galeria} size={18} strokeWidth={2.2} />}
      >
        Elegir de la galería
      </Btn>
      <Btn
        variant="destructive"
        size="lg"
        fullWidth
        onPress={p.onQuitar}
        testID="foto-cambiar-quitar"
        icon={
          <PathIcon d={FOTO_GLIFOS.basura} size={18} strokeWidth={2.2} color={colors.redText} />
        }
      >
        Quitar foto
      </Btn>
    </View>
  );
}

export function FotoCambiarSheet(p: FotoCambiarSheetProps): ReactElement {
  const { s, actual } = p.abierta;
  return (
    <BottomSheet
      open
      onClose={p.onCerrar}
      eyebrow="Foto del producto"
      title={s.nombre}
      testID="foto-cambiar-sheet"
      footer={<Acciones {...p} />}
    >
      <View gap={14} alignItems="center">
        <CuadroGrande side={LADO} tint={s.tint} label={`Foto actual de ${s.nombre}`}>
          {actual ? <FotoCuadro uri={actual.uri} side={LADO - 2 * borderWidths.thick} /> : null}
        </CuadroGrande>
        {actual ? (
          <MText size="sm" weight="semibold" color={colors.gray600} fontVariant={['tabular-nums']}>
            {tomadaEl(actual.createdAt, p.caja)}
          </MText>
        ) : null}
      </View>
    </BottomSheet>
  );
}
