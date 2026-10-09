/**
 * «Entrega del efectivo» (Track M, M-09; the web's Entrega dialog on the
 * phone): counting it in front of the owner, handing the whole counted cash
 * over, and him confirming on his portal. Local until the owner's side
 * exists: confirming marks the step done on this screen.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { aDueno, mayuscula } from '@xangarro/caja';
import { Btn } from '../../components/Btn/index';
import { Dialog } from '../../components/Dialog/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { colors, borderWidths, radii } from '../../theme';

const BILLETE = 'M2 6h20v12H2V6Zm10 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4M6 12h.01M18 12h.01';
const CHECK = 'M20 6 9 17l-5-5';

/** The dialog's choice: «Todavía no» beside the yellow «Sí, ya se lo di». */
function Eleccion(p: {
  readonly onClose: () => void;
  readonly onEntregar: () => void;
}): ReactElement {
  return (
    <View flexDirection="row" gap={10}>
      <View flex={1}>
        <Btn variant="secondary" size="xl" fullWidth onPress={p.onClose} testID="cierre-entrega-no">
          Todavía no
        </Btn>
      </View>
      <View flex={1}>
        <Btn
          variant="primary"
          size="xl"
          sentence
          fullWidth
          onPress={p.onEntregar}
          testID="cierre-entrega-si"
        >
          Sí, ya se lo di
        </Btn>
      </View>
    </View>
  );
}

/** «¿Ya le diste $2,710.00 a Pedro?» — count it in front of him and hand it over. */
export function CierreEntregaDialog(p: {
  readonly open: boolean;
  readonly monto: string;
  readonly dueno: string;
  readonly onClose: () => void;
  readonly onEntregar: () => void;
}): ReactElement {
  return (
    <Dialog
      open={p.open}
      onClose={p.onClose}
      eyebrow="Entrega del efectivo"
      title={`¿Ya le diste ${p.monto} ${aDueno(p.dueno)}?`}
      closeLabel="Cerrar sin confirmar"
      testID="cierre-entrega-dialog"
      footer={<Eleccion onClose={p.onClose} onEntregar={p.onEntregar} />}
    >
      <MText size="sm" weight="semibold" color={colors.gray600}>
        {`Cuéntalo frente a él y dáselo completo. ${mayuscula(p.dueno)} confirma en su portal que lo recibió y así queda cerrado el día.`}
      </MText>
    </Dialog>
  );
}

/** The step before: «Entregar el efectivo a Pedro», tapped to confirm. */
export function PorEntregar(p: {
  readonly monto: string;
  readonly dueno: string;
  readonly onConfirmar: () => void;
}): ReactElement {
  return (
    <Btn
      variant="secondary"
      size="xl"
      sentence
      fullWidth
      onPress={p.onConfirmar}
      testID="cierre-entregar-efectivo"
      icon={
        <View
          width={36}
          height={36}
          alignItems="center"
          justifyContent="center"
          borderRadius={radii[2]}
          backgroundColor={colors.yellow}
          aria-hidden
        >
          <PathIcon d={BILLETE} size={20} strokeWidth={2} />
        </View>
      }
    >
      {`Entregar el efectivo ${aDueno(p.dueno)}`}
    </Btn>
  );
}

/** The step after: handed over, waiting on the owner's confirmation. */
export function Entregado(p: { readonly dueno: string }): ReactElement {
  return (
    <View
      testID="cierre-entregado"
      role="status"
      flexDirection="row"
      alignItems="center"
      gap={12}
      padding={14}
      borderRadius={radii[3]}
      borderWidth={borderWidths.thin}
      borderColor={colors.greenText}
      backgroundColor={colors.greenSoft}
    >
      <PathIcon d={CHECK} size={22} strokeWidth={2.8} color={colors.greenText} />
      <View flex={1} minWidth={0} gap={2} alignItems="flex-start">
        <MText size="sm" weight="extraBold" textAlign="left">
          {`Le entregaste el efectivo ${aDueno(p.dueno)}`}
        </MText>
        <MText size="xs" weight="semibold" color={colors.gray600} textAlign="left">
          Cuando lo confirme, lo verás en tus cortes.
        </MText>
      </View>
    </View>
  );
}
