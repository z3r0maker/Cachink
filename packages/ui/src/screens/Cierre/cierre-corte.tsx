/**
 * «Corte de caja» (MvCierreHecho, the web's `corte.tsx`): the business, the
 * caja, who and when; counted against expected with the difference in its
 * colour; the sales and what was collected; and that it was saved with the
 * operator's name.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { conSigno, DIF } from '@xangarro/caja/cierre';
import { formatMoney } from '@xangarro/domain';
import { Eyebrow, MText } from '../../components/index';
import { borderColors, borderWidths, colors, radii, shadows, shapeRadii } from '../../theme';
import type { CierreHecho } from './cierre-tipos';

const NUM = { fontVariant: ['tabular-nums' as const] };

function Fila(p: { label: string; value: string; color?: string; testID?: string }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" minHeight={30}>
      <MText size="md" weight="semibold" color={colors.gray600} flex={1}>
        {p.label}
      </MText>
      <MText size="md" weight="extraBold" color={p.color} testID={p.testID} {...NUM}>
        {p.value}
      </MText>
    </View>
  );
}

const Raya = (): ReactElement => (
  <View
    marginHorizontal={18}
    borderTopWidth={borderWidths.quiet}
    borderTopColor={borderColors.quiet}
  />
);

function Cabeza({ h }: { h: CierreHecho }): ReactElement {
  const d = h.data;
  return (
    <View paddingHorizontal={18} paddingTop={14} paddingBottom={8} gap={2}>
      <View flexDirection="row" alignItems="center">
        <View flex={1}>
          <Eyebrow>Corte de caja</Eyebrow>
        </View>
        <View
          backgroundColor={colors.gray100}
          borderRadius={shapeRadii.pill}
          paddingHorizontal={9}
          paddingVertical={2}
        >
          <MText size="xs" weight="extraBold" color={colors.ink} {...NUM}>
            {`${h.fecha} · ${d.hasta}`}
          </MText>
        </View>
      </View>
      {d.negocio ? (
        <MText size="sectionTitle" weight="extraBold" letterSpacing={-0.4}>
          {d.negocio}
        </MText>
      ) : null}
    </View>
  );
}

function Cuadre({ h }: { h: CierreHecho }): ReactElement {
  const t = DIF[h.dif.tipo];
  return (
    <View paddingHorizontal={18} paddingVertical={10}>
      <Fila label="Contado" value={formatMoney(h.contado)} testID="corte-contado" />
      <Fila label="Esperado" value={formatMoney(h.esperado)} testID="corte-esperado" />
      <View
        flexDirection="row"
        alignItems="center"
        minHeight={46}
        marginTop={6}
        paddingHorizontal={12}
        borderRadius={radii[3]}
        borderWidth={borderWidths.thin}
        borderColor={t.color}
        backgroundColor={t.bg}
      >
        <MText size="body" weight="extraBold" color={t.color} flex={1}>
          Diferencia
        </MText>
        <MText
          size="cardTitle"
          weight="extraBold"
          color={t.color}
          testID="corte-diferencia"
          {...NUM}
        >
          {conSigno(h.dif)}
        </MText>
      </View>
    </View>
  );
}

function Guardado(): ReactElement {
  return (
    <View
      paddingHorizontal={18}
      paddingVertical={10}
      backgroundColor={colors.gray100}
      borderTopWidth={borderWidths.quiet}
      borderTopColor={borderColors.quiet}
      borderBottomLeftRadius={radii[6]}
      borderBottomRightRadius={radii[6]}
    >
      <MText size="xs" weight="semibold" color={colors.textMuted}>
        Guardado con tu nombre. Ya no puedes capturar en esta caja hasta abrir otro turno.
      </MText>
    </View>
  );
}

export function Corte({ h }: { h: CierreHecho }): ReactElement {
  const d = h.data;
  return (
    <View
      role="region"
      aria-label="Corte de caja"
      testID="cierre-corte"
      backgroundColor={colors.white}
      borderWidth={borderWidths.thick}
      borderColor={colors.black}
      borderRadius={radii[7]}
      style={{ boxShadow: shadows.hero }}
    >
      <Cabeza h={h} />
      <View paddingHorizontal={18} paddingBottom={10}>
        <Fila label="Caja" value={d.caja} />
        <Fila label="Operadora" value={d.operador} />
        <Fila label="Turno" value={`${d.desde} a ${d.hasta}`} />
      </View>
      <Raya />
      <Cuadre h={h} />
      <Raya />
      <View paddingHorizontal={18} paddingTop={8} paddingBottom={10}>
        <Fila label="Ventas" value={String(d.resumen.ventas)} />
        <Fila label="Cobrado" value={formatMoney(d.resumen.cobrado)} color={colors.greenText} />
      </View>
      <Guardado />
    </View>
  );
}
