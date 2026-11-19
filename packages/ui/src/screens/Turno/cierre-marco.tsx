/**
 * The frame every Cierre step shares (M-17, MvCierreFlujo): the content
 * scrolls, the step's action stays fixed at the bottom; and the step's head,
 * the two-part progress bar with «Paso N de 2», the title and one line.
 */
import type { ReactElement, ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { borderColors, borderWidths, colors, shapeRadii } from '../../theme';

/** Scrolling content over a fixed foot. */
export function CierreMarco(p: {
  readonly children: ReactNode;
  readonly pie: ReactNode;
  readonly testID: string;
}): ReactElement {
  return (
    <View flex={1} backgroundColor={colors.offwhite}>
      <ScrollView
        testID={p.testID}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        {p.children}
      </ScrollView>
      <View
        testID={`${p.testID}-pie`}
        gap={8}
        paddingHorizontal={16}
        paddingTop={12}
        paddingBottom={16}
        backgroundColor={colors.white}
        borderTopWidth={borderWidths.quiet}
        borderTopColor={borderColors.quiet}
      >
        {p.pie}
      </View>
    </View>
  );
}

function Barra(p: { readonly paso: 1 | 2 }): ReactElement {
  const tramo = (lleno: boolean): ReactElement => (
    <View
      flex={1}
      height={6}
      borderRadius={shapeRadii.pill}
      backgroundColor={lleno ? colors.black : colors.gray200}
    />
  );
  return (
    <View flexDirection="row" gap={6} aria-hidden>
      {tramo(true)}
      {tramo(p.paso === 2)}
    </View>
  );
}

/** «Paso 1 de 2», the title and its line. */
export function PasoCabeza(p: {
  readonly paso: 1 | 2;
  readonly titulo: string;
  readonly linea: string;
  readonly testID: string;
}): ReactElement {
  return (
    <View gap={8} testID={p.testID}>
      <Barra paso={p.paso} />
      <Eyebrow>{`Paso ${p.paso} de 2`}</Eyebrow>
      <MText size="xl4" weight="extraBold" letterSpacing={-0.8} role="heading">
        {p.titulo}
      </MText>
      <MText size="md" weight="semibold" color={colors.gray600}>
        {p.linea}
      </MText>
    </View>
  );
}
