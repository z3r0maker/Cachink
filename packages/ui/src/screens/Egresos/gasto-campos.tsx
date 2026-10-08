/**
 * The questions of «Registrar gasto» (MvGastos' sheet): «¿Cuánto?» on the
 * keypad, «¿Qué compraste?», the category chips and «¿A quién le pagaste?».
 * The receipt photo is left out until the storage bucket lands (ADR-083 D3).
 */
import type { ReactElement } from 'react';
import { TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { CATEGORIAS, type CategoriaGasto } from '@xangarro/caja/gastos';
import { Chip } from '../../components/Chip/index';
import { MText } from '../../components/Mostrador/index';
import { borderWidths, colors, portalFontSizes, radii, typography } from '../../theme';
import { fondoVisible } from '../AbrirTurno/fondo';
import { FondoTeclas } from '../AbrirTurno/fondo-pad';
import type { TeclaFondo } from '../AbrirTurno/fondo';

const CAMPO = {
  height: 52,
  paddingHorizontal: 14,
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
  fontFamily: typography.fontFamily,
  fontWeight: '600',
  fontSize: portalFontSizes.body,
  color: colors.black,
} as const;

function Pregunta(p: { readonly texto: string; readonly opcional?: boolean }): ReactElement {
  return (
    <MText size="md" weight="extraBold">
      {p.texto}
      {p.opcional ? (
        <MText size="md" weight="semibold" color={colors.textMuted}>
          {' (opcional)'}
        </MText>
      ) : null}
    </MText>
  );
}

export function Cuanto(p: { readonly raw: string; readonly onTecla: (t: TeclaFondo) => void }) {
  const vacio = p.raw === '';
  const texto = vacio ? '0.00' : fondoVisible(p.raw);
  return (
    <View gap={8}>
      <Pregunta texto="¿Cuánto?" />
      <View
        testID="gasto-monto"
        role="status"
        aria-label={`¿Cuánto?: $${texto}`}
        flexDirection="row"
        alignItems="center"
        gap={6}
        height={64}
        paddingHorizontal={16}
        borderRadius={radii[4]}
        borderWidth={borderWidths.thick}
        borderColor={colors.black}
        backgroundColor={colors.white}
      >
        <MText size="xl5" weight="extraBold" color={colors.textMuted}>
          $
        </MText>
        <MText
          flex={1}
          size="xl6"
          weight="extraBold"
          numberOfLines={1}
          fontVariant={['tabular-nums']}
          color={vacio ? colors.textMuted : colors.black}
        >
          {texto}
        </MText>
      </View>
      <FondoTeclas onTecla={p.onTecla} />
    </View>
  );
}

export function Campo(p: {
  readonly pregunta: string;
  readonly opcional?: boolean;
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly placeholder: string;
  readonly maxLength: number;
  readonly testID: string;
}): ReactElement {
  return (
    <View gap={6}>
      <Pregunta texto={p.pregunta} opcional={p.opcional} />
      <TextInput
        testID={p.testID}
        aria-label={p.opcional ? `${p.pregunta}, opcional` : p.pregunta}
        placeholder={p.placeholder}
        placeholderTextColor={colors.textMuted}
        value={p.value}
        onChangeText={p.onChange}
        maxLength={p.maxLength}
        style={CAMPO}
      />
    </View>
  );
}

export function Categorias(p: {
  readonly value: CategoriaGasto | null;
  readonly onChange: (c: CategoriaGasto) => void;
}): ReactElement {
  return (
    <View gap={8}>
      <Pregunta texto="Categoría" />
      <View role="radiogroup" aria-label="Categoría" flexDirection="row" flexWrap="wrap" gap={8}>
        {CATEGORIAS.map((c) => (
          <Chip
            key={c}
            label={c}
            selected={p.value === c}
            onPress={() => p.onChange(c)}
            testID={`gasto-categoria-${c}`}
          />
        ))}
      </View>
    </View>
  );
}
