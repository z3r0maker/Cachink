/**
 * DS-10 on the phone's activation (EsMvDescarga): «Descargando los datos de
 * tu negocio…» with «3 de 7» and a bar that advances per page, or where it
 * stopped: «Se interrumpió la descarga. Lo que ya bajó se queda; toca
 * Reintentar.» The web caja says the same (`acceso/descarga.tsx`).
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import {
  DESCARGA_ARIA,
  DESCARGA_INTERRUMPIDA,
  DESCARGANDO,
  fraccionDescarga,
  textoPaginas,
} from '@xangarro/caja';
import type { DescargaInicial } from '../../activation/use-descarga';
import { Btn, MText, PathIcon } from '../../components/index';
import { borderColors, borderWidths, colors, radii, shapeRadii } from '../../theme';

const AVISO = 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 8v4M12 16h.01';

function Barra(p: { readonly d: DescargaInicial; readonly texto: string }): ReactElement {
  const f = fraccionDescarga(p.d.progreso);
  const pr = p.d.progreso;
  return (
    <View
      role="progressbar"
      aria-label={DESCARGA_ARIA}
      aria-valuemin={0}
      aria-valuemax={pr?.paginas ?? undefined}
      aria-valuenow={pr !== null && pr.paginas !== null ? pr.pagina : undefined}
      aria-valuetext={p.texto || undefined}
      height={14}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
      overflow="hidden"
    >
      <View
        height="100%"
        width={`${Math.round((f ?? 0) * 100)}%`}
        backgroundColor={colors.yellow}
        borderRightWidth={f ? borderWidths.thin : 0}
        borderRightColor={colors.black}
      />
    </View>
  );
}

export function VincularDescarga({ d }: { readonly d: DescargaInicial }): ReactElement {
  const interrumpida = d.fase === 'interrumpida';
  const texto = textoPaginas(d.progreso);
  return (
    <View
      aria-live="polite"
      testID={interrumpida ? 'vincular-descarga-interrumpida' : 'vincular-descarga'}
      gap={10}
      paddingHorizontal={14}
      paddingVertical={12}
      borderRadius={radii[4]}
      borderWidth={borderWidths.thin}
      borderColor={interrumpida ? colors.warningText : borderColors.quiet}
      backgroundColor={interrumpida ? colors.warningSoft : colors.offwhite}
    >
      <View flexDirection="row" alignItems="flex-start" gap={8}>
        {interrumpida ? <PathIcon d={AVISO} size={18} color={colors.warningText} /> : null}
        <MText flex={1} size="md" weight="extraBold" color={colors.black}>
          {interrumpida ? DESCARGA_INTERRUMPIDA : DESCARGANDO}
        </MText>
        <MText
          size="sm"
          weight="extraBold"
          color={interrumpida ? colors.warningText : colors.gray600}
          fontVariant={['tabular-nums']}
          testID="vincular-descarga-paginas"
        >
          {texto}
        </MText>
      </View>
      <Barra d={d} texto={texto} />
    </View>
  );
}

/** The connect button across the download: busy while pages come, «Reintentar» when it stopped. */
export function BotonConectar(p: {
  readonly label: string;
  readonly submitting: boolean;
  readonly disabled?: boolean;
  readonly descarga: DescargaInicial | null;
  readonly onConectar: () => void;
  readonly onReintentar: () => void;
  readonly testID: string;
}): ReactElement {
  if (p.descarga?.fase === 'interrumpida') {
    return (
      <Btn
        variant="primary"
        size="xl"
        fullWidth
        onPress={p.onReintentar}
        testID="vincular-reintentar"
      >
        Reintentar
      </Btn>
    );
  }
  const bajando = p.descarga?.fase === 'descargando';
  return (
    <Btn
      variant="primary"
      size="xl"
      fullWidth
      sentence
      disabled={p.disabled}
      loading={p.submitting || bajando}
      onPress={p.onConectar}
      testID={p.testID}
    >
      {bajando ? 'Conectando…' : p.label}
    </Btn>
  );
}
