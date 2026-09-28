/**
 * One denomination of the count (MvCierre): its chip (a bill square, a coin
 * round, each bill its own tint), what those pieces add up to, and the
 * stepper, 44 px − and +, with the pieces typed in between.
 */
import type { ReactElement } from 'react';
import { Pressable, TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney, type ClaveDenominacion, type Denominacion } from '@xangarro/domain';
import { MText, PathIcon } from '../../components/index';
import { impactLight } from '../../haptics/index';
import { borderWidths, colors, portalFontSizes, radii, shapeRadii, typography } from '../../theme';
import { piezasDe } from './cierre-logica';

const MENOS = 'M5 12h14';
const MAS = 'M12 5v14M5 12h14';

/** Each bill its own tint; peso coins share gray, centavos amber (the web's `conteo.tsx`). */
const TINTE: Partial<Record<ClaveDenominacion, string>> = {
  'billete-1000': colors.purpleSoft,
  'billete-500': colors.peachSoft,
  'billete-200': colors.greenSoft,
  'billete-100': colors.redSoft,
  'billete-50': colors.blueSoft,
  'billete-20': colors.blueSoft,
};
export const tinteDe = (d: Denominacion): string =>
  TINTE[d.clave] ?? (d.valor < 1_00n ? colors.warningSoft : colors.gray100);

/** «billetes de $20» / «monedas de $20»: the two $20 never share a name. */
export const nombreDe = (d: Denominacion): string =>
  `${d.tipo === 'billete' ? 'billetes' : 'monedas'} de ${d.etiqueta}`;

function Boton(p: {
  d: string;
  label: string;
  mas?: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      testID={p.testID}
      role="button"
      aria-label={p.label}
      onPress={() => {
        impactLight();
        p.onPress();
      }}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radii[2],
        borderWidth: borderWidths.thin,
        borderColor: colors.black,
        backgroundColor: p.mas ? colors.yellow : colors.white,
        transform: pressed ? [{ translateX: 1 }, { translateY: 1 }] : [],
      })}
    >
      <PathIcon d={p.d} size={18} strokeWidth={2.6} />
    </Pressable>
  );
}

const PIEZAS = {
  width: 52,
  height: 44,
  borderRadius: radii[2],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
  textAlign: 'center',
  fontFamily: typography.fontFamily,
  fontWeight: '800',
  fontSize: portalFontSizes.lgx,
  color: colors.black,
} as const;

function Etiqueta({ d, n }: { d: Denominacion; n: number }): ReactElement {
  return (
    <>
      <View
        width={62}
        height={36}
        alignItems="center"
        justifyContent="center"
        borderRadius={d.tipo === 'billete' ? radii[0] : shapeRadii.pill}
        borderWidth={borderWidths.thin}
        borderColor={colors.black}
        backgroundColor={tinteDe(d)}
      >
        <MText size="body" weight="extraBold">
          {d.etiqueta}
        </MText>
      </View>
      <MText
        flex={1}
        minWidth={0}
        size="sm"
        weight="bold"
        color={colors.textMuted}
        numberOfLines={1}
      >
        {n > 0 ? formatMoney(d.valor * BigInt(n)) : ''}
      </MText>
    </>
  );
}

export function Paso(p: {
  d: Denominacion;
  n: number;
  poner: (clave: ClaveDenominacion, n: number) => void;
}): ReactElement {
  const { d, n } = p;
  const nombre = nombreDe(d);
  const id = `conteo-${d.clave}`;
  return (
    <View flexDirection="row" alignItems="center" gap={8} minHeight={56}>
      <Etiqueta d={d} n={n} />
      <Boton
        d={MENOS}
        label={`Uno menos: ${nombre}`}
        onPress={() => p.poner(d.clave, n - 1)}
        testID={`${id}-menos`}
      />
      <TextInput
        testID={id}
        aria-label={`${d.tipo === 'billete' ? 'Cuántos' : 'Cuántas'} ${nombre}`}
        inputMode="numeric"
        keyboardType="number-pad"
        value={String(n)}
        onChangeText={(t) => p.poner(d.clave, piezasDe(t))}
        selectTextOnFocus
        style={PIEZAS}
      />
      <Boton
        d={MAS}
        mas
        label={`Uno más: ${nombre}`}
        onPress={() => p.poner(d.clave, n + 1)}
        testID={`${id}-mas`}
      />
    </View>
  );
}
