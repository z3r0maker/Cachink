/**
 * «Efectivo que debe haber» (MvTurno's hero): the figure the operator will
 * count at the close, and «Ver de dónde sale», the four parts
 * (`desgloseFirmado`) down to «Debe haber». Cierre shows the same parts.
 */
import { useState, type ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { desgloseFirmado, type PartesEsperado } from '@xangarro/caja/turno';
import { formatMoney, type Money } from '@xangarro/domain';
import { Eyebrow, HeroPanel, MText, PathIcon } from '../../components/index';
import { borderWidths, colors } from '../../theme';

const ABAJO = 'm6 9 6 6 6-6';
const ARRIBA = 'm18 15-6-6-6 6';
const NUM = { fontVariant: ['tabular-nums' as const] };

function Parte(p: {
  label: string;
  nota?: string;
  valor: string;
  color?: string;
  alto?: number;
}): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={6}
      minHeight={p.alto ?? 40}
      borderTopWidth={borderWidths.thin}
      borderTopColor={colors.yellowRule}
    >
      <MText size="md" weight="bold" flexShrink={1}>
        {p.label}
      </MText>
      {p.nota ? (
        <MText size="xs" weight="bold" color={colors.gray600} flexShrink={1}>
          {p.nota}
        </MText>
      ) : null}
      <View flex={1} />
      <MText size="body" weight="extraBold" color={p.color} {...NUM}>
        {p.valor}
      </MText>
    </View>
  );
}

/** The four parts and «Debe haber»; Cierre lists them without the total. */
export function Desglose(p: {
  partes: PartesEsperado;
  total?: Money;
  alto?: number;
}): ReactElement {
  return (
    <View testID="esperado-desglose">
      {desgloseFirmado(p.partes).map((x) => (
        <Parte
          key={x.label}
          label={x.label}
          nota={x.nota}
          valor={x.valor}
          alto={p.alto}
          color={x.resta ? colors.redText : undefined}
        />
      ))}
      {p.total === undefined ? null : (
        <View
          flexDirection="row"
          alignItems="center"
          minHeight={44}
          borderTopWidth={borderWidths.thin}
          borderTopColor={colors.black}
        >
          <MText size="md" weight="extraBold" flex={1}>
            Debe haber
          </MText>
          <MText size="sectionTitle" weight="extraBold" {...NUM}>
            {formatMoney(p.total)}
          </MText>
        </View>
      )}
    </View>
  );
}

export function EsperadoHero(p: { partes: PartesEsperado; esperado: Money }): ReactElement {
  const [abierto, setAbierto] = useState(false);
  return (
    <HeroPanel label="Efectivo que debe haber en la caja" testID="mi-turno-esperado">
      <Eyebrow color={colors.ink}>Efectivo que debe haber</Eyebrow>
      <MText size="display" weight="extraBold" letterSpacing={-1.6} marginTop={4} {...NUM}>
        {formatMoney(p.esperado)}
      </MText>
      <MText size="md" weight="semibold" marginTop={6}>
        Es lo que debes contar cuando cierres tu turno.
      </MText>
      <Pressable
        testID="mi-turno-desglose"
        role="button"
        aria-label={abierto ? 'Ocultar de dónde sale' : 'Ver de dónde sale'}
        aria-expanded={abierto}
        onPress={() => setAbierto(!abierto)}
        style={{
          marginTop: 10,
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          borderTopWidth: borderWidths.thin,
          borderTopColor: colors.yellowRule,
        }}
      >
        <MText size="md" weight="extraBold" flex={1}>
          {abierto ? 'Ocultar de dónde sale' : 'Ver de dónde sale'}
        </MText>
        <PathIcon d={abierto ? ARRIBA : ABAJO} size={18} strokeWidth={2.4} />
      </Pressable>
      {abierto ? <Desglose partes={p.partes} total={p.esperado} /> : null}
    </HeroPanel>
  );
}
