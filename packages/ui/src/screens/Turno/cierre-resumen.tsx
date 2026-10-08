/**
 * «Resumen del turno» on Cierre (Track M, M-09; the board's white block):
 * the turno's ventas, cobrado, canceladas, fiado and inventory movements as
 * rows, then whether everything reached the cloud — «N sin enviar» while
 * records wait (the count says so twice: here and in the band above) or
 * «Todo enviado».
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import type { CierreData } from '@xangarro/caja/cierre';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { QuietPanel } from '../../components/Panel/index';
import { borderColors, borderWidths, colors, shapeRadii } from '../../theme';

const CHECK = 'M20 6 9 17l-5-5';

function Fila(p: {
  readonly label: string;
  readonly value: string;
  readonly color?: string;
  readonly testID: string;
}): ReactElement {
  return (
    <View
      testID={p.testID}
      flexDirection="row"
      alignItems="baseline"
      gap={10}
      paddingHorizontal={16}
      paddingVertical={10}
      borderBottomWidth={borderWidths.quiet}
      borderBottomColor={borderColors.quiet}
    >
      <MText size="sm" weight="bold" flex={1}>
        {p.label}
      </MText>
      <MText size="body" weight="extraBold" fontVariant={['tabular-nums']} color={p.color}>
        {p.value}
      </MText>
    </View>
  );
}

/** The amber dot while records wait. */
function Punto(): ReactElement {
  return (
    <View
      width={11}
      height={11}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.warning}
      aria-hidden
    />
  );
}

/** Whether everything was sent, said under the resumen. */
function Sync(p: { readonly porEnviar: number }): ReactElement {
  const cuerpo =
    p.porEnviar > 0 ? (
      <>
        <Punto />
        <MText size="sm" weight="bold">
          {`${p.porEnviar} sin enviar`}
        </MText>
      </>
    ) : (
      <>
        <PathIcon d={CHECK} size={16} strokeWidth={2.6} color={colors.greenText} />
        <MText size="sm" weight="bold">
          Todo enviado
        </MText>
      </>
    );
  return (
    <View
      testID="cierre-resumen-sync"
      flexDirection="row"
      alignItems="center"
      gap={8}
      paddingHorizontal={16}
      paddingVertical={10}
    >
      {cuerpo}
    </View>
  );
}

/** The turno in five rows, then the sync note. */
export function CierreResumen(p: {
  readonly data: CierreData;
  readonly porEnviar: number;
}): ReactElement {
  const t = p.data.resumen;
  return (
    <QuietPanel label="Resumen del turno" testID="cierre-resumen">
      <Fila label="Ventas del turno" value={String(t.ventas)} testID="cierre-resumen-ventas" />
      <Fila
        label="Cobrado (todos los métodos)"
        value={formatMoney(t.cobrado)}
        testID="cierre-resumen-cobrado"
      />
      <Fila
        label={t.canceladas === 1 ? 'Venta cancelada' : 'Ventas canceladas'}
        value={`${t.canceladas} · ${formatMoney(t.cancelado)}`}
        color={colors.redText}
        testID="cierre-resumen-canceladas"
      />
      <Fila
        label="Ventas fiadas"
        value={formatMoney(t.fiado)}
        color={colors.warningText}
        testID="cierre-resumen-fiado"
      />
      <Fila
        label="Movimientos de inventario"
        value={`${t.entradas} entradas · ${t.mermas} mermas`}
        testID="cierre-resumen-inventario"
      />
      <Sync porEnviar={p.porEnviar} />
    </QuietPanel>
  );
}
