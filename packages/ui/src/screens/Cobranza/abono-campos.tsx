/**
 * The abono sheet's fields: the amount (typed or one of the quick amounts),
 * the method chips, where the amount would land and the sheet's two actions.
 * Pure presentation over `AbonoForma`; the sheet composes them.
 */
import type { ReactElement } from 'react';
import { Pressable, TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney, toPesosString, type Money } from '@xangarro/domain';
import { METODOS_ABONO, rapidos, type MetodoAbono } from '@xangarro/caja/cobranza';
import { Btn } from '../../components/Btn/index';
import { Chip } from '../../components/Chip/index';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import {
  borderColors,
  borderWidths,
  colors,
  portalFontSizes,
  radii,
  typography,
} from '../../theme';
import type { AbonoForma } from './abono-forma';

const CAMPO = {
  height: 56,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 6,
  paddingHorizontal: 14,
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
};

const ENTRADA = {
  flex: 1,
  height: 52,
  fontFamily: typography.fontFamily,
  fontWeight: '700',
  fontSize: portalFontSizes.xl2,
  color: colors.black,
} as const;

function Rapidos(p: { readonly x: AbonoForma }): ReactElement {
  return (
    <View flexDirection="row" gap={8} flexWrap="wrap">
      {rapidos(p.x.saldo).map((m: Money) => (
        <Pressable
          key={String(m)}
          testID={`abono-rapido-${m}`}
          role="button"
          aria-label={m === p.x.saldo ? `Todo, ${formatMoney(m)}` : formatMoney(m)}
          onPress={() => p.x.setRaw(toPesosString(m).replace(/\.00$/, ''))}
          style={{
            minHeight: 44,
            paddingHorizontal: 14,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radii[2],
            borderWidth: borderWidths.thin,
            borderColor: colors.black,
            backgroundColor: p.x.monto === m ? colors.black : colors.white,
          }}
        >
          <MText
            size="sm"
            weight="extraBold"
            color={p.x.monto === m ? colors.yellow : colors.black}
          >
            {m === p.x.saldo ? `Todo · ${formatMoney(m)}` : formatMoney(m)}
          </MText>
        </Pressable>
      ))}
    </View>
  );
}

/** «Cuánto abona»: the field, then the quick amounts. */
export function CuantoAbona(p: { readonly x: AbonoForma }): ReactElement {
  return (
    <View gap={8}>
      <Eyebrow>Cuánto abona</Eyebrow>
      <View style={CAMPO}>
        <MText size="xl2" weight="extraBold" aria-hidden>
          $
        </MText>
        <TextInput
          testID="abono-monto"
          aria-label="Cuánto abona"
          inputMode="decimal"
          autoComplete="off"
          value={p.x.raw}
          onChangeText={(t) => p.x.setRaw(t.replace(/[^0-9.]/g, ''))}
          style={ENTRADA}
        />
      </View>
      <Rapidos x={p.x} />
    </View>
  );
}

/** «Cómo paga»: Efectivo, Transferencia or Tarjeta (fiado is not a payment). */
export function Metodos(p: {
  readonly value: MetodoAbono;
  readonly onChange: (m: MetodoAbono) => void;
}): ReactElement {
  return (
    <View role="radiogroup" aria-label="Cómo paga" flexDirection="row" gap={8}>
      {METODOS_ABONO.map((m) => (
        <Chip
          key={m}
          label={m}
          selected={p.value === m}
          onPress={() => p.onChange(m)}
          testID={`abono-metodo-${m}`}
        />
      ))}
    </View>
  );
}

/** Where the amount would land, and what would still be owed. */
export function SeAplica(p: { readonly x: AbonoForma }): ReactElement {
  return (
    <View
      gap={6}
      padding={14}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.offwhite}
    >
      <MText size="sm" weight="bold">
        {`Se aplica a: ${p.x.vista?.texto ?? 'Elige un monto'}`}
      </MText>
      <View flexDirection="row" justifyContent="space-between">
        <MText size="sm" weight="semibold" color={colors.gray600}>
          Saldo restante
        </MText>
        <MText size="sm" weight="extraBold" fontVariant={['tabular-nums']}>
          {formatMoney(p.x.vista?.restante ?? p.x.saldo)}
        </MText>
      </View>
    </View>
  );
}

/** The main action: «Registrar abono», or what is missing. */
export function PieAbono(p: {
  readonly monto: Money | null;
  readonly onClose: () => void;
  readonly guardar: () => void;
}): ReactElement {
  return (
    <View flexDirection="row" gap={10}>
      <View flex={1}>
        <Btn variant="secondary" size="xl" fullWidth onPress={p.onClose} testID="abono-cancelar">
          Cancelar
        </Btn>
      </View>
      <View flex={1.6}>
        <Btn
          variant="primary"
          size="xl"
          sentence
          fullWidth
          disabled={p.monto === null}
          onPress={p.guardar}
          testID="abono-registrar"
        >
          {p.monto === null ? 'Escribe cuánto abona' : 'Registrar abono'}
        </Btn>
      </View>
    </View>
  );
}
