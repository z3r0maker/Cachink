/**
 * ColaPanel — «La cola» (M-09; the web's `ListaCola`): every record this
 * caja captured and the server has not accepted, in the order they will go,
 * each with its kind tile, its state, its time and its money. Empty says
 * todo-enviado and opens the cierre.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import type { Fase, RegistroEnCola } from '@xangarro/caja/pendientes';
import { estadoFila } from '@xangarro/caja/pendientes';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { GLYPHS } from '../../components/PathIcon/glyphs';
import { PathIcon } from '../../components/PathIcon/index';
import { QuietPanel } from '../../components/Panel/index';
import { borderWidths, colors, radii, shapeRadii } from '../../theme';

const RECIBO =
  'M4 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1-2-1-2 1zM12 17V7M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8';
const SALIDA = 'M12 3v12M7 10l5 5 5-5M4 21h16';
const ENTRADA = 'M12 21V9M7 14l5-5 5 5M4 3h16';
const MOVER = 'M7 7h13l-4-4M17 17H4l4 4';

const TIPO: Record<
  RegistroEnCola['tipo'],
  { tint: string; icon: string; color: string; signo: string }
> = {
  venta: { tint: colors.greenSoft, icon: RECIBO, color: colors.greenText, signo: '' },
  gasto: { tint: colors.redSoft, icon: SALIDA, color: colors.redText, signo: '−' },
  abono: { tint: colors.greenSoft, icon: ENTRADA, color: colors.greenText, signo: '' },
  movimiento: { tint: colors.blueSoft, icon: MOVER, color: colors.blueText, signo: '' },
};

function Tile({ icon, tint }: { readonly icon: string; readonly tint: string }): ReactElement {
  return (
    <View
      width={40}
      height={40}
      alignItems="center"
      justifyContent="center"
      borderRadius={radii[2]}
      borderWidth={borderWidths.quiet}
      backgroundColor={tint}
    >
      <PathIcon d={icon} size={18} strokeWidth={2.3} />
    </View>
  );
}

function EstadoChip({ estado }: { readonly estado: string }): ReactElement {
  const enviando = estado === 'Enviando';
  return (
    <View
      testID="cola-fila-estado"
      flexDirection="row"
      alignItems="center"
      gap={5}
      paddingHorizontal={9}
      paddingVertical={5}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.quiet}
      backgroundColor={enviando ? colors.blueSoft : colors.warningSoft}
    >
      {enviando ? (
        <PathIcon d={GLYPHS.nube} size={11} strokeWidth={2.6} color={colors.blueText} />
      ) : (
        <View
          width={8}
          height={8}
          borderRadius={shapeRadii.pill}
          backgroundColor={colors.warning}
        />
      )}
      <MText size="xs" weight="extraBold" color={enviando ? colors.blueText : colors.warningText}>
        {estado}
      </MText>
    </View>
  );
}

function FilaTextos({
  r,
  estado,
}: {
  readonly r: RegistroEnCola;
  readonly estado: string;
}): ReactElement {
  return (
    <View flex={1} minWidth={0} gap={2}>
      <MText size="md" weight="extraBold" numberOfLines={1}>
        {r.titulo}
      </MText>
      <MText size="xs" weight="semibold" color={colors.gray600} numberOfLines={1}>
        {r.detalle}
      </MText>
      <EstadoChip estado={estado} />
    </View>
  );
}

function Fila({
  r,
  estado,
}: {
  readonly r: RegistroEnCola;
  readonly estado: string;
}): ReactElement {
  const t = TIPO[r.tipo];
  return (
    <View
      testID={`cola-fila-${r.id}`}
      flexDirection="row"
      alignItems="center"
      gap={10}
      paddingHorizontal={16}
      paddingVertical={10}
      borderBottomWidth={borderWidths.quiet}
    >
      <Tile icon={t.icon} tint={t.tint} />
      <FilaTextos r={r} estado={estado} />
      <View alignItems="flex-end" gap={2}>
        <MText size="xs" weight="semibold" color={colors.gray600}>
          {r.hora}
        </MText>
        {r.monto === null ? null : (
          <MText size="md" weight="extraBold" color={t.color}>
            {`${t.signo}${formatMoney(r.monto)}`}
          </MText>
        )}
      </View>
    </View>
  );
}

function NadaPendiente(p: {
  readonly portal: string;
  readonly onIrACierre: () => void;
}): ReactElement {
  return (
    <View testID="cola-vacia" padding={16} gap={10} alignItems="center">
      <MText size="lg" weight="extraBold">
        Nada pendiente
      </MText>
      <MText size="sm" weight="semibold" color={colors.gray600} textAlign="center" lineHeight={19}>
        {`Todo lo que capturaste ya está en ${p.portal}. Puedes cerrar el turno cuando quieras.`}
      </MText>
      <Btn variant="primary" sentence onPress={p.onIrACierre} testID="cola-ir-cierre">
        Ir al cierre de turno
      </Btn>
    </View>
  );
}

export function ColaPanel(p: {
  readonly cola: readonly RegistroEnCola[];
  readonly fase: Fase;
  readonly offline: boolean;
  readonly portal: string;
  readonly onIrACierre: () => void;
}): ReactElement {
  const estado = estadoFila(p.fase, p.offline);
  const note = p.cola.length > 0 ? 'Se envían en este orden' : undefined;
  return (
    <QuietPanel label="La cola" count={p.cola.length} note={note} testID="cola-panel">
      {p.cola.map((r) => (
        <Fila key={r.id} r={r} estado={estado} />
      ))}
      {p.cola.length === 0 ? <NadaPendiente portal={p.portal} onIrACierre={p.onIrACierre} /> : null}
    </QuietPanel>
  );
}
