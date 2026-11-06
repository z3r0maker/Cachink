/**
 * «¿Quitar la foto?» (M-13, board MvFotoQuitar): the photo, an arrow, the
 * icon it goes back to; then «Sí, quitarla» in red or «Mejor no», which
 * returns to «Cambiar o quitar».
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Btn } from '../components/Btn/index';
import { Dialog } from '../components/Dialog/index';
import { MText } from '../components/Mostrador/index';
import { PathIcon } from '../components/PathIcon/index';
import { colors } from '../theme';
import { ProductoTile } from '../screens/Inventario/mover-glifos';
import { FOTO_GLIFOS } from './foto-glifos';
import { portalDe } from './foto-partes';
import type { FotoAbierta } from './use-foto-flujo';

export interface FotoQuitarDialogProps {
  readonly abierta: FotoAbierta;
  readonly dueno: string;
  readonly guardando: boolean;
  readonly onQuitar: () => void;
  readonly onMejorNo: () => void;
}

function Botones(p: FotoQuitarDialogProps): ReactElement {
  return (
    <View gap={10}>
      <Btn
        variant="destructiveFilled"
        size="xl"
        fullWidth
        loading={p.guardando}
        onPress={p.onQuitar}
        testID="foto-quitar-si"
      >
        Sí, quitarla
      </Btn>
      <Btn
        variant="secondary"
        size="lg"
        fullWidth
        disabled={p.guardando}
        onPress={p.onMejorNo}
        testID="foto-quitar-no"
      >
        Mejor no
      </Btn>
    </View>
  );
}

export function FotoQuitarDialog(p: FotoQuitarDialogProps): ReactElement {
  const { s } = p.abierta;
  return (
    <Dialog
      open
      onClose={p.onMejorNo}
      title="¿Quitar la foto?"
      closeLabel="Mejor no"
      testID="foto-quitar-dialog"
      footer={<Botones {...p} />}
    >
      <View gap={14}>
        <View flexDirection="row" alignItems="center" gap={12} aria-hidden>
          <ProductoTile icono={s.icono} tint={s.tint} size={56} productoId={s.id} />
          <PathIcon d={FOTO_GLIFOS.flecha} size={22} strokeWidth={2.4} color={colors.textMuted} />
          <ProductoTile icono={s.icono} tint={s.tint} size={56} />
        </View>
        <MText size="body" weight="semibold" color={colors.gray600} textAlign="left">
          {`Vuelve el ícono en la caja y en ${portalDe(p.dueno)}. Puedes tomar otra cuando quieras.`}
        </MText>
      </View>
    </Dialog>
  );
}
