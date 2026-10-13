/**
 * The registrar sheet's fields (the web drawer's `Campos`): ¿Qué compraste?,
 * ¿Cuánto?, the category chips and ¿A quién le pagaste?, plus the note that
 * says who the gasto stays with and the footer both sheets save with. Shared
 * by «Registrar gasto» and «Pagar» a due recurring gasto.
 */
import type { ReactElement } from 'react';
import { TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { CATEGORIAS } from '@xangarro/caja/gastos';
import { Btn } from '../../components/Btn/index';
import { Chip } from '../../components/Chip/index';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { PathIcon } from '../../components/PathIcon/index';
import {
  borderColors,
  borderWidths,
  colors,
  portalFontSizes,
  radii,
  typography,
} from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import type { GastoForm } from './use-gasto-form';

const CAMPO = {
  height: 52,
  paddingHorizontal: 14,
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
  fontFamily: typography.fontFamily,
  fontWeight: '700',
  fontSize: portalFontSizes.lg,
  color: colors.black,
} as const;

function Campo(p: { readonly label: string; readonly children: ReactElement }): ReactElement {
  return (
    <View gap={6}>
      <Eyebrow color={colors.gray600}>{p.label}</Eyebrow>
      {p.children}
    </View>
  );
}

export function Concepto({ f }: { readonly f: GastoForm }): ReactElement {
  return (
    <Campo label="¿Qué compraste?">
      <TextInput
        testID="gasto-concepto"
        aria-label="¿Qué compraste?"
        placeholder="Cilindro de gas"
        placeholderTextColor={colors.textMuted}
        value={f.concepto}
        onChangeText={f.setConcepto}
        style={CAMPO}
      />
    </Campo>
  );
}

export function Monto({ f }: { readonly f: GastoForm }): ReactElement {
  return (
    <Campo label="¿Cuánto?">
      <View flexDirection="row" alignItems="center" gap={8}>
        <MText size="xl2" weight="extraBold" color={colors.gray600}>
          $
        </MText>
        <TextInput
          testID="gasto-monto"
          aria-label="¿Cuánto?"
          inputMode="decimal"
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
          value={f.raw}
          onChangeText={f.setRaw}
          style={{ ...CAMPO, flex: 1, fontSize: portalFontSizes.xl3, fontWeight: '800' }}
        />
      </View>
    </Campo>
  );
}

export function Categorias({ f }: { readonly f: GastoForm }): ReactElement {
  return (
    <Campo label="Categoría">
      <View role="radiogroup" aria-label="Categoría" flexDirection="row" flexWrap="wrap" gap={8}>
        {CATEGORIAS.map((c) => (
          <Chip
            key={c}
            label={c}
            selected={f.categoria === c}
            onPress={() => f.setCategoria(c)}
            testID={`gasto-categoria-${c}`}
          />
        ))}
      </View>
    </Campo>
  );
}

export function Proveedor({ f }: { readonly f: GastoForm }): ReactElement {
  return (
    <Campo label="¿A quién le pagaste? (opcional)">
      <TextInput
        testID="gasto-proveedor"
        aria-label="¿A quién le pagaste? (opcional)"
        placeholder="La tienda, el gasero, el taxista"
        placeholderTextColor={colors.textMuted}
        value={f.quien}
        onChangeText={f.setQuien}
        style={CAMPO}
      />
    </Campo>
  );
}

/** The web drawer's head sub and its firma line, as one quiet note. */
export function NotaFirma({ firma }: { readonly firma: string }): ReactElement {
  return (
    <View
      flexDirection="row"
      gap={8}
      alignItems="flex-start"
      padding={12}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.gray100}
    >
      <PathIcon d={COBRAR_GLYPHS.info} size={18} color={colors.gray600} />
      <MText flex={1} size="md" weight="semibold" color={colors.gray600}>
        {`Sale del efectivo de tu caja y baja lo esperado en tu corte. Queda a tu nombre: ${firma}.`}
      </MText>
    </View>
  );
}

export interface PieGastoProps {
  readonly f: GastoForm;
  readonly guardando: boolean;
  readonly error: boolean;
  readonly onCancelar: () => void;
  readonly onGuardar: () => void;
}

/** «Registrar gasto de $150.00»: the amount in the button, blocked until complete. */
export function PieGasto(p: PieGastoProps): ReactElement {
  const monto = p.f.monto !== null && p.f.monto > 0n ? formatMoney(p.f.monto) : '$___';
  return (
    <View gap={8}>
      {p.error ? (
        <MText role="alert" size="md" weight="bold" color={colors.redText}>
          No se pudo registrar el gasto. Revísalo y vuelve a intentarlo.
        </MText>
      ) : null}
      <View flexDirection="row" gap={10} alignItems="center">
        <Btn variant="secondary" size="xl" onPress={p.onCancelar} testID="gasto-cancelar">
          Cancelar
        </Btn>
        <Btn
          variant="primary"
          size="xl"
          sentence
          fullWidth
          disabled={!p.f.listo}
          loading={p.guardando}
          onPress={p.onGuardar}
          testID="gasto-guardar"
        >
          {`Registrar gasto de ${monto}`}
        </Btn>
      </View>
    </View>
  );
}
