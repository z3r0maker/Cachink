/**
 * The rest of Mi turno (MvTurno): who and since when, the two figures
 * (Ventas, Cobrado) and the foot in the thumb zone, «Bloquear la caja»
 * beside the yellow «Cerrar turno».
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { hintCanceladas, ICONS } from '@xangarro/caja';
import type { TurnoData } from '@xangarro/caja/turno';
import { formatMoney } from '@xangarro/domain';
import { Btn, Eyebrow, InicialesBadge, MText, PathIcon } from '../../components/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';

const NUM = { fontVariant: ['tabular-nums' as const] };

export function Cabeza(p: { turno: TurnoData; iniciales: string; dia: string }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={12}>
      <InicialesBadge iniciales={p.iniciales} size={48} label={p.turno.operador} />
      <View flex={1} minWidth={0}>
        <MText size="xl5" weight="extraBold" letterSpacing={-1} role="heading">
          Mi turno
        </MText>
        <MText size="md" weight="semibold" color={colors.gray600} testID="mi-turno-desde">
          {`${p.turno.operador}, desde las ${p.turno.desde} · ${p.dia}`}
        </MText>
      </View>
    </View>
  );
}

function Cifra(p: { label: string; valor: string; hint: string; color?: string }): ReactElement {
  return (
    <View
      flex={1}
      minWidth={0}
      paddingHorizontal={14}
      paddingVertical={12}
      gap={2}
      backgroundColor={colors.white}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      borderRadius={radii[5]}
    >
      <Eyebrow>{p.label}</Eyebrow>
      <MText size="xl3" weight="extraBold" color={p.color} letterSpacing={-0.7} {...NUM}>
        {p.valor}
      </MText>
      <MText size="xs" weight="semibold" color={colors.gray600} numberOfLines={2}>
        {p.hint}
      </MText>
    </View>
  );
}

/** «Ventas» and «Cobrado» (the phone's two of the web's four). */
export function Cifras({ turno }: { turno: TurnoData }): ReactElement {
  return (
    <View flexDirection="row" gap={10} role="region" aria-label="Resumen del turno">
      <Cifra
        label="Ventas"
        valor={String(turno.ventas)}
        hint={hintCanceladas(turno.canceladas, turno.ultimaCancelada)}
      />
      <Cifra
        label="Cobrado"
        valor={formatMoney(turno.cobrado)}
        hint="Todos los métodos"
        color={colors.greenText}
      />
    </View>
  );
}

function Cerrar({ onPress }: { onPress: () => void }): ReactElement {
  return (
    <View flex={1}>
      <Btn variant="primary" size="lg" sentence fullWidth onPress={onPress} testID="turno-cerrar">
        Cerrar turno
      </Btn>
    </View>
  );
}

/**
 * The foot: the lock only on the phone (a tablet's rail carries it), the close
 * when a turno is open. Both 52 px (the board's 56 truncates «Cerrar turno»
 * beside «Bloquear la caja» at 390 px with the buttons' padding).
 */
export function Pie(p: {
  onBloquear: (() => void) | null;
  onCerrar: (() => void) | null;
}): ReactElement | null {
  if (p.onBloquear === null && p.onCerrar === null) return null;
  return (
    <View
      flexDirection="row"
      gap={10}
      paddingHorizontal={16}
      paddingVertical={12}
      backgroundColor={colors.gray200}
      borderTopWidth={borderWidths.quiet}
      borderTopColor={borderColors.quiet}
    >
      {p.onBloquear ? (
        <Btn
          variant="secondary"
          size="lg"
          onPress={p.onBloquear}
          testID="turno-bloquear"
          icon={<PathIcon d={ICONS.lock} size={18} strokeWidth={2.2} />}
          fullWidth={p.onCerrar === null}
        >
          Bloquear la caja
        </Btn>
      ) : null}
      {p.onCerrar ? <Cerrar onPress={p.onCerrar} /> : null}
    </View>
  );
}
