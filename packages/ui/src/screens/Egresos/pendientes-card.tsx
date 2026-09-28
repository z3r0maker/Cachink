/**
 * «Pendientes de registrar» on Gastos (the phone kept it here; the web moved
 * it to Mi turno): recurring gastos already due. «Registrar» opens the
 * sheet filled from the template, as the web's link does; saving it pays it
 * and advances the schedule. «Descartar» skips this time through
 * `DescartarGastoRecurrenteUseCase`, as the phone always did.
 */
import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney, type RecurringExpense } from '@xangarro/domain';
import { ICONS } from '@xangarro/caja';
import { comoPendiente } from '@xangarro/caja/turno';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { QuietPanel } from '../../components/Panel/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, radii } from '../../theme';
import { Etiqueta } from '../VentasTurno/ventas-partes';
import { recurrenteParaDe, venceTexto } from './gastos-lectura';

export interface PendientesCardProps {
  readonly pendientes: readonly RecurringExpense[];
  readonly hoy: string;
  readonly onRegistrar: (p: RecurringExpense) => void;
  readonly onDescartar: (p: RecurringExpense) => void;
  readonly testID?: string;
}

type Pendiente = ReturnType<typeof comoPendiente>;

function Info({ x }: { readonly x: Pendiente }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={12}>
      <View
        width={40}
        height={40}
        alignItems="center"
        justifyContent="center"
        borderRadius={radii[2]}
        borderWidth={borderWidths.thin}
        borderColor={colors.black}
        backgroundColor={colors.redSoft}
        aria-hidden
      >
        <PathIcon d={ICONS.gastos} size={18} />
      </View>
      <View flex={1} minWidth={0} gap={3}>
        <View flexDirection="row" alignItems="center" gap={8} flexWrap="wrap">
          <MText size="body" weight="extraBold">
            {x.nombre}
          </MText>
          <Etiqueta
            label={venceTexto(x.vence)}
            bg={colors.redSoft}
            fg={colors.redText}
            borde={colors.redText}
          />
        </View>
        <MText size="sm" weight="semibold" color={colors.textMuted} numberOfLines={1}>
          {x.detalle}
        </MText>
      </View>
      <MText size="body" weight="extraBold" fontVariant={['tabular-nums']}>
        {formatMoney(x.monto)}
      </MText>
    </View>
  );
}

function Fila(p: {
  readonly r: RecurringExpense;
  readonly hoy: string;
  readonly onRegistrar: () => void;
  readonly onDescartar: () => void;
}): ReactElement {
  const x = comoPendiente(recurrenteParaDe(p.r, p.hoy));
  return (
    <View
      testID={`pendiente-${x.id}`}
      gap={10}
      paddingVertical={12}
      paddingHorizontal={16}
      borderTopWidth={borderWidths.quiet}
      borderTopColor={colors.gray100}
    >
      <Info x={x} />
      <View flexDirection="row" gap={8} justifyContent="flex-end">
        <Btn variant="quiet" onPress={p.onDescartar} testID={`pendiente-descartar-${x.id}`}>
          Descartar
        </Btn>
        <Btn
          variant="primary"
          sentence
          onPress={p.onRegistrar}
          ariaLabel={`Registrar ${x.nombre}`}
          testID={`pendiente-registrar-${x.id}`}
        >
          Registrar
        </Btn>
      </View>
    </View>
  );
}

export function PendientesCard(props: PendientesCardProps): ReactElement | null {
  // A discarded row leaves at once, before the query comes back.
  const [fuera, setFuera] = useState<ReadonlySet<string>>(new Set());
  const visibles = props.pendientes.filter((p) => !fuera.has(p.id));
  if (visibles.length === 0) return null;
  return (
    <QuietPanel
      label="Pendientes de registrar"
      count={visibles.length}
      note="Gastos que se repiten y ya tocan"
      testID={props.testID ?? 'pendientes-card'}
    >
      {visibles.map((r) => (
        <Fila
          key={r.id}
          r={r}
          hoy={props.hoy}
          onRegistrar={() => props.onRegistrar(r)}
          onDescartar={() => {
            setFuera((prev) => new Set([...prev, r.id]));
            props.onDescartar(r);
          }}
        />
      ))}
    </QuietPanel>
  );
}
