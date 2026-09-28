/**
 * Cierre's foot in the thumb zone (MvCierre): «Contaste $X» with the
 * difference chip, the close button (the difference in its label, gray
 * until a motive — and for «Otra razón» a note — explains it) and the line
 * that says what closing does or what is still missing.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { ICONS } from '@xangarro/caja';
import { cerrarHint, cerrarLabel, conSigno, DIF } from '@xangarro/caja/cierre';
import { formatMoney } from '@xangarro/domain';
import { Btn, MText, PathIcon } from '../../components/index';
import { borderColors, borderWidths, colors, shapeRadii } from '../../theme';
import type { ConteoCierre } from './use-conteo-cierre';

const NUM = { fontVariant: ['tabular-nums' as const] };

function ChipDif({ x }: { x: ConteoCierre }): ReactElement {
  const t = DIF[x.dif.tipo];
  return (
    <View
      height={26}
      paddingHorizontal={10}
      justifyContent="center"
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={t.color}
      backgroundColor={t.bg}
    >
      <MText size="sm" weight="extraBold" color={t.color} {...NUM}>
        {`${t.label} ${conSigno(x.dif)}`}
      </MText>
    </View>
  );
}

function Contaste({ x }: { x: ConteoCierre }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={8}>
      <MText size="sm" weight="bold" color={colors.gray600} flex={1}>
        Contaste{' '}
        <MText size="sm" weight="extraBold" {...NUM}>
          {formatMoney(x.contado)}
        </MText>
      </MText>
      <ChipDif x={x} />
    </View>
  );
}

function Hint({ x, fallo }: { x: ConteoCierre; fallo: boolean }): ReactElement {
  const hint = fallo
    ? 'No se pudo cerrar. Tu conteo sigue aquí; intenta otra vez.'
    : cerrarHint(x.faltaMotivo, x.faltaNota);
  return (
    <MText
      size="xs"
      weight="bold"
      textAlign="center"
      color={fallo ? colors.redText : colors.gray600}
      testID="cierre-hint"
    >
      {hint}
    </MText>
  );
}

export function PieCierre(p: {
  x: ConteoCierre;
  cerrando: boolean;
  fallo: boolean;
  onCerrar: () => void;
}): ReactElement {
  const { x } = p;
  return (
    <View
      aria-live="polite"
      gap={8}
      paddingHorizontal={16}
      paddingTop={10}
      paddingBottom={12}
      backgroundColor={colors.white}
      borderTopWidth={borderWidths.quiet}
      borderTopColor={borderColors.quiet}
    >
      <Contaste x={x} />
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        disabled={!x.puede}
        loading={p.cerrando}
        onPress={p.onCerrar}
        testID="cierre-cerrar"
        icon={<PathIcon d={ICONS.lock} size={18} strokeWidth={2.4} />}
      >
        {cerrarLabel(x.dif)}
      </Btn>
      <Hint x={x} fallo={p.fallo} />
    </View>
  );
}
