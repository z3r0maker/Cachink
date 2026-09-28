/**
 * «Tus últimos cortes» (MvInicio): the last closes on this caja with how
 * each one came out (`corteChip`: Cuadró, Sobraron, Faltaron), and «Cerrar
 * turno» while one is open. Hidden until there is a close to list.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { corteChip, type CorteReciente } from '@xangarro/caja/inicio';
import { Btn, MText, QuietPanel } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { borderWidths, colors, shapeRadii } from '../../theme';

function Fila({ c }: { c: CorteReciente }): ReactElement {
  const chip = corteChip(c);
  return (
    <View
      flexDirection="row"
      alignItems="center"
      minHeight={44}
      paddingHorizontal={16}
      borderTopWidth={1}
      borderTopColor={colors.gray100}
    >
      <MText flex={1} size="md" weight="bold" color={colors.ink}>
        {c.etiqueta}
      </MText>
      <View
        height={26}
        justifyContent="center"
        paddingHorizontal={10}
        borderRadius={shapeRadii.pill}
        borderWidth={borderWidths.thin}
        borderColor={chip.color}
        backgroundColor={chip.bg}
      >
        <MText size="xs" weight="extraBold" color={chip.color} fontVariant={['tabular-nums']}>
          {chip.label}
        </MText>
      </View>
    </View>
  );
}

export function UltimosCortes(p: {
  cortes: readonly CorteReciente[];
  /** «Cerrar turno» while a turno is open. */
  onCerrar: (() => void) | null;
}): ReactElement {
  const { t } = useTranslation();
  const accion = p.onCerrar ? (
    <Btn variant="quiet" size="sm" onPress={p.onCerrar} testID="inicio-cerrar-turno">
      {t('entrar.inicio.cerrarTurno')}
    </Btn>
  ) : undefined;
  return (
    <QuietPanel label={t('entrar.inicio.cortes')} action={accion} testID="inicio-cortes">
      {p.cortes.map((c) => (
        <Fila key={c.etiqueta} c={c} />
      ))}
    </QuietPanel>
  );
}
