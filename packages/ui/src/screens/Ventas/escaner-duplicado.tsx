/**
 * A code two or more products share (EcDuplicado, ADR-150): nothing goes on
 * the ticket until the operator taps the product they are selling. A product
 * given at the counter says so, since it is the one still waiting for review.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { borderWidths, colors, radii } from '../../theme';
import type { ProductoCobrar } from './cobrar-catalogo';
import { ProductoIcono } from './cobrar-tile';
import type { EstadoDuplicado } from './escaner-estado';

const OPCION = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  minHeight: 64,
  paddingVertical: 8,
  paddingLeft: 8,
  paddingRight: 12,
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
} as const;

function Opcion(p: { o: ProductoCobrar; onElegir: (o: ProductoCobrar) => void }): ReactElement {
  const precio = formatMoney(p.o.precio);
  const origen = p.o.pendiente ? 'Lo dieron de alta en caja' : 'En el catálogo';
  return (
    <Pressable
      testID={`escaner-opcion-${p.o.id}`}
      role="button"
      aria-label={`Vender ${p.o.nombre}, ${precio}`}
      onPress={() => p.onElegir(p.o)}
      style={OPCION}
    >
      <ProductoIcono icono={p.o.icono} tint={p.o.tint} size={44} productoId={p.o.id} />
      <View flex={1} minWidth={0}>
        <MText size="md" weight="extraBold">
          {p.o.nombre}
        </MText>
        <MText size="sm" weight="semibold" color={colors.gray600}>
          {origen}
        </MText>
      </View>
      <MText size="body" weight="extraBold">
        {precio}
      </MText>
    </Pressable>
  );
}

export function EscanerDuplicado(p: {
  readonly e: EstadoDuplicado;
  readonly onElegir: (o: ProductoCobrar) => void;
  readonly onOtro: () => void;
}): ReactElement {
  return (
    <View
      testID="escaner-duplicado"
      padding={12}
      gap={10}
      borderRadius={radii[4]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <View>
        <MText size="md" weight="extraBold">
          {`Este código lo tienen ${p.e.opciones.length} productos`}
        </MText>
        <MText size="md" weight="bold" color={colors.gray600}>
          {p.e.codigo}
        </MText>
      </View>
      <MText size="md" weight="bold">
        Toca el que vas a vender.
      </MText>
      {p.e.opciones.map((o) => (
        <Opcion key={o.id} o={o} onElegir={p.onElegir} />
      ))}
      <View flexDirection="row">
        <Btn variant="secondary" size="md" onPress={p.onOtro} testID="escaner-otro">
          Escanear otro
        </Btn>
      </View>
    </View>
  );
}
