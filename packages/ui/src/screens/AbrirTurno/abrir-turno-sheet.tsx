/**
 * AbrirTurnoSheet — «¿Con cuánto empiezas?» (MvAbrirTurno; the web caja's
 * `Fondo`), a bottom sheet over Inicio or Mi turno: the fondo on a keypad
 * with quick chips, the last close as a hint, «Ahorita no» and «Abrir turno
 * con $X». The fondo is what every close is measured against (O-03), so the
 * turno can't open without one; 0.00 is a fondo.
 */
import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { BottomSheet, Btn, MText, PathIcon } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { centavosDe, fondoDe, pesos, teclearFondo } from './fondo';
import { FondoCifra, FondoEtiqueta, FondoRapidos, FondoTeclas } from './fondo-pad';

const RELOJ = 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2';

export interface AbrirTurnoSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /** The operator's first name, for «¡Hola, Ana!». */
  readonly nombre: string | null;
  /** «Ayer terminaste con $800.00.», from the last close on this device. */
  readonly ultimo: string | null;
  /** Fills the figure to start with (the last close); null starts empty. */
  readonly sugerido: bigint | null;
  readonly onAbrir: (fondoCentavos: bigint) => void;
  readonly submitting: boolean;
  readonly error: string | null;
}

function Nota({ texto }: { texto: string }): ReactElement {
  return (
    <View
      testID="abrir-nota"
      flexDirection="row"
      gap={10}
      alignItems="flex-start"
      paddingHorizontal={12}
      paddingVertical={10}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.offwhite}
    >
      <PathIcon d={RELOJ} size={18} color={colors.gray600} />
      <MText flex={1} size="sm" weight="semibold" color={colors.ink}>
        {texto}
      </MText>
    </View>
  );
}

function Pie(p: {
  centavos: bigint | null;
  onClose: () => void;
  onAbrir: () => void;
  submitting: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const label =
    p.centavos === null
      ? t('entrar.abrirTurno.abrir')
      : t('entrar.abrirTurno.abrirCon', { monto: formatMoney(p.centavos) });
  return (
    <View flexDirection="row" gap={10} alignItems="center">
      <Btn variant="quiet" size="xl" onPress={p.onClose} testID="abrir-ahorita-no">
        {t('entrar.abrirTurno.ahoritaNo')}
      </Btn>
      <View flex={1}>
        <Btn
          variant="primary"
          size="xl"
          fullWidth
          disabled={p.centavos === null}
          loading={p.submitting}
          onPress={p.onAbrir}
          testID="caja-abrir-submit"
        >
          {label}
        </Btn>
      </View>
    </View>
  );
}

function Cuerpo(
  p: AbrirTurnoSheetProps & {
    raw: string;
    onRaw: (r: ReturnType<typeof fondoDe>) => void;
    estado: ReturnType<typeof fondoDe>;
  },
): ReactElement {
  const { t } = useTranslation();
  const invalido = centavosDe(p.raw) === null;
  return (
    <View gap={10}>
      <MText size="md" weight="semibold" color={colors.gray600}>
        {t('entrar.abrirTurno.cuerpo')}
      </MText>
      <FondoEtiqueta />
      <FondoCifra raw={p.raw} />
      <FondoRapidos raw={p.raw} onElegir={(c) => p.onRaw({ raw: pesos(c), nuevo: true })} />
      <Nota texto={p.ultimo ?? t('entrar.abrirTurno.notaSinUltimo')} />
      {invalido ? (
        <MText size="sm" weight="bold" color={colors.gray600}>
          {t('entrar.abrirTurno.invalido')}
        </MText>
      ) : null}
      {p.error ? (
        <MText testID="abrir-error" role="alert" size="sm" weight="bold" color={colors.redText}>
          {p.error}
        </MText>
      ) : null}
      <FondoTeclas onTecla={(k) => p.onRaw(teclearFondo(p.estado, k))} />
    </View>
  );
}

export function AbrirTurnoSheet(props: AbrirTurnoSheetProps): ReactElement {
  const { t } = useTranslation();
  const [estado, setEstado] = useState(() => fondoDe(props.sugerido));
  const centavos = centavosDe(estado.raw);
  const titulo = props.nombre
    ? t('entrar.abrirTurno.titulo', { nombre: props.nombre })
    : t('entrar.abrirTurno.tituloSinNombre');
  return (
    <BottomSheet
      open={props.open}
      onClose={props.onClose}
      eyebrow={t('entrar.abrirTurno.eyebrow')}
      title={titulo}
      testID="abrir-caja-modal"
      footer={
        <Pie
          centavos={centavos}
          onClose={props.onClose}
          onAbrir={() => (centavos === null ? undefined : props.onAbrir(centavos))}
          submitting={props.submitting}
        />
      }
    >
      <Cuerpo {...props} raw={estado.raw} estado={estado} onRaw={setEstado} />
    </BottomSheet>
  );
}
