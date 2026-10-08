/**
 * The movement sheets' foot and note (M-09): the board's gray note that
 * says who the move stays with, and the footer both sheets save with —
 * «Cancelar» beside the confirm, blocked until the form is complete, the
 * failure said above it when the write refuses.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, radii } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';

/** The board's quiet note: who the move stays with, in this turno. */
export function NotaFirma(p: { readonly firma: string }): ReactElement {
  return (
    <View
      flexDirection="row"
      gap={11}
      padding={13}
      borderRadius={radii[3]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.gray100}
    >
      <PathIcon d={COBRAR_GLYPHS.info} size={20} strokeWidth={2.4} color={colors.black} />
      <MText flex={1} size="md" weight="semibold">
        {`Queda a tu nombre y en tu turno: ${p.firma}.`}
      </MText>
    </View>
  );
}

export interface PieMoverProps {
  readonly cta: string;
  readonly listo: boolean;
  readonly guardando: boolean;
  readonly error: boolean;
  readonly onCancelar: () => void;
  readonly onGuardar: () => void;
}

/** «Registrar entrada» / «Registrar merma», blocked until complete. */
export function PieMover(p: PieMoverProps): ReactElement {
  return (
    <View gap={8}>
      {p.error ? (
        <MText role="alert" size="md" weight="bold" color={colors.redText}>
          No se pudo registrar el movimiento. Revísalo y vuelve a intentarlo.
        </MText>
      ) : null}
      <View flexDirection="row" gap={10} alignItems="center">
        <Btn variant="secondary" size="xl" onPress={p.onCancelar} testID="mover-cancelar">
          Cancelar
        </Btn>
        <Btn
          variant="primary"
          size="xl"
          sentence
          fullWidth
          disabled={!p.listo}
          loading={p.guardando}
          onPress={p.onGuardar}
          testID="mover-guardar"
        >
          {p.cta}
        </Btn>
      </View>
    </View>
  );
}
