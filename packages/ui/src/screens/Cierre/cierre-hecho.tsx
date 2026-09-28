/**
 * «¡Turno cerrado!» (MvCierreHecho; the web's `hecho.tsx`): Don celebrating
 * a count that cuadró and worried by a faltante (a sobrante gets him quiet,
 * as on the web), the chip, what happened (`lineaCerrado`, which says the
 * owner sees it once records go up), the corte, and the foot: «Mandar el
 * corte a …» through the phone's share sheet and «Salir» to Acceso.
 */
import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { aDueno } from '@xangarro/caja';
import { CHIP_HECHO, DIF, lineaCerrado, tituloHecho } from '@xangarro/caja/cierre';
import type { DiferenciaCorte } from '@xangarro/domain';
import { Btn, Don, GLYPHS, MText, PathIcon, type DonPose } from '../../components/index';
import { borderColors, borderWidths, colors, shapeRadii } from '../../theme';
import { Corte } from './cierre-corte';
import type { CierreHecho as Hecho } from './cierre-tipos';

const COMPARTIR = 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13';

const POSE: Record<DiferenciaCorte['tipo'], DonPose> = {
  cuadra: 'celebrando',
  falta: 'preocupado',
  sobra: 'quieto',
};

function Chip({ tipo }: { tipo: DiferenciaCorte['tipo'] }): ReactElement {
  const t = DIF[tipo];
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={6}
      height={34}
      paddingHorizontal={12}
      marginBottom={22}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={t.color}
      backgroundColor={t.bg}
    >
      {tipo === 'cuadra' ? (
        <PathIcon d={GLYPHS.check} size={16} strokeWidth={2.8} color={t.color} />
      ) : null}
      <MText size="md" weight="extraBold" color={t.color}>
        {CHIP_HECHO[tipo]}
      </MText>
    </View>
  );
}

/** Stacked: «Mandar el corte a Pedro» beside «Salir» truncates at 390 px. */
function Pie(p: { dueno: string; onCompartir: () => void; onSalir: () => void }): ReactElement {
  return (
    <View
      gap={8}
      paddingHorizontal={16}
      paddingTop={12}
      paddingBottom={16}
      backgroundColor={colors.white}
      borderTopWidth={borderWidths.quiet}
      borderTopColor={borderColors.quiet}
    >
      <Btn
        variant="secondary"
        size="xl"
        fullWidth
        onPress={p.onCompartir}
        testID="cierre-compartir"
        icon={<PathIcon d={COMPARTIR} size={20} strokeWidth={2} />}
      >
        {`Mandar el corte ${aDueno(p.dueno)}`}
      </Btn>
      <Btn
        variant="quiet"
        size="lg"
        fullWidth
        onPress={p.onSalir}
        testID="cierre-salir"
        icon={<PathIcon d={GLYPHS.salir} size={18} strokeWidth={2} color={colors.gray600} />}
      >
        Salir
      </Btn>
    </View>
  );
}

export function CierreHechoScreen(p: {
  h: Hecho;
  onCompartir: () => void;
  onSalir: () => void;
}): ReactElement {
  const { h } = p;
  const [uno, dos] = tituloHecho(h.dif);
  const nombre = h.data.operador.split(' ')[0] ?? h.data.operador;
  const gracias = h.dif.tipo === 'cuadra' ? ` Gracias por tu turno, ${nombre}.` : '';
  return (
    <View flex={1} backgroundColor={colors.gray200} testID="cierre-hecho">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 10, gap: 14 }}
      >
        <View flexDirection="row" alignItems="flex-end" gap={6}>
          <Don pose={POSE[h.dif.tipo]} size={132} />
          <Chip tipo={h.dif.tipo} />
        </View>
        <View gap={6}>
          <MText size="xl5" weight="extraBold" letterSpacing={-1} role="heading">
            {`${uno}\n${dos}`}
          </MText>
          <MText size="body" weight="semibold" color={colors.ink} lineHeight={22}>
            {`${lineaCerrado(h.dif, h.motivo, h.data.dueno, h.porEnviar)}${gracias}`}
          </MText>
        </View>
        <Corte h={h} />
      </ScrollView>
      <Pie dueno={h.data.dueno} onCompartir={p.onCompartir} onSalir={p.onSalir} />
    </View>
  );
}
