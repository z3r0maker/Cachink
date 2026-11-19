/**
 * «¡Turno cerrado!» (M-16, MvCierreFlujo; ADR-147): Don celebrates only a
 * count that cuadró and worries on a shortfall, the chip and the line say
 * what happened and when los patrones see it, the corte reads as a ticket,
 * and the fixed foot sends it, opens another turno or leaves. A closed turno
 * never reopens: to keep selling the operator opens another.
 */
import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import {
  CHIP_CIERRE,
  DIF,
  fechaCorta,
  lineaHecho,
  mensajeCorte,
  segundaLinea,
  tituloHecho,
  type CierreData,
  type EstadoConteo,
  type MotivoDiferencia,
} from '@xangarro/caja/cierre';
import { Don, type DonPose } from '../../components/Don/index';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, shapeRadii } from '../../theme';
import { CierreCorte } from './cierre-corte';
import { CierreMandar } from './cierre-mandar';
import { CierreMarco } from './cierre-marco';

const CHECK = 'M20 6 9 17l-5-5';
const ENVIAR = 'M22 2 11 13M22 2 15 22l-4-9-9-4Z';
const MAS = 'M12 5v14M5 12h14';
const SALIR = 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9';

/** Don celebrates only a count that cuadró and worries on a shortfall. */
const POSE: Record<EstadoConteo['dif']['tipo'], DonPose> = {
  cuadra: 'celebrando',
  falta: 'preocupado',
  sobra: 'quieto',
};

function Cabeza(p: { readonly e: EstadoConteo }): ReactElement {
  const tipo = p.e.dif.tipo;
  const t = DIF[tipo];
  return (
    <View flexDirection="row" alignItems="center" gap={10}>
      <Don pose={POSE[tipo]} size={96} />
      <View flex={1} minWidth={0} gap={6} alignItems="flex-start">
        <View
          flexDirection="row"
          alignItems="center"
          gap={6}
          borderRadius={shapeRadii.pill}
          borderWidth={borderWidths.thin}
          borderColor={t.color}
          backgroundColor={t.bg}
          paddingHorizontal={10}
          paddingVertical={3}
        >
          {tipo === 'cuadra' ? (
            <PathIcon d={CHECK} size={14} strokeWidth={2.8} color={t.color} />
          ) : null}
          <MText size="sm" weight="extraBold" color={t.color}>
            {CHIP_CIERRE[tipo]}
          </MText>
        </View>
        <MText size="xl4" weight="extraBold" letterSpacing={-0.8} textAlign="left" role="heading">
          {tituloHecho(p.e.dif)}
        </MText>
        <MText size="body" weight="bold" color={colors.ink} textAlign="left">
          {segundaLinea(p.e.dif)}
        </MText>
      </View>
    </View>
  );
}

/** «Abrir otro turno» beside «Salir». */
function Secundarias(p: {
  readonly onOtroTurno: () => void;
  readonly onSalir: () => void;
}): ReactElement {
  return (
    <View flexDirection="row" gap={10}>
      <View flex={1}>
        <Btn
          variant="secondary"
          size="lg"
          sentence
          fullWidth
          icon={<PathIcon d={MAS} size={18} strokeWidth={2.4} />}
          onPress={p.onOtroTurno}
          testID="cierre-otro-turno"
        >
          Abrir otro turno
        </Btn>
      </View>
      <Btn
        variant="secondary"
        size="lg"
        sentence
        icon={<PathIcon d={SALIR} size={18} strokeWidth={2} />}
        onPress={p.onSalir}
        testID="cierre-salir"
      >
        Salir
      </Btn>
    </View>
  );
}

function Pie(p: {
  readonly onMandar: () => void;
  readonly onOtroTurno: () => void;
  readonly onSalir: () => void;
}): ReactElement {
  return (
    <>
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        icon={<PathIcon d={ENVIAR} size={20} strokeWidth={2.2} />}
        onPress={p.onMandar}
        testID="cierre-mandar"
      >
        Mandar el corte a los patrones
      </Btn>
      <Secundarias onOtroTurno={p.onOtroTurno} onSalir={p.onSalir} />
    </>
  );
}

export interface CierreHechoProps {
  readonly data: CierreData;
  readonly e: EstadoConteo;
  readonly motivo: MotivoDiferencia | null;
  /** A sync run confirmed the close reached the cloud (review M7). */
  readonly enviado: boolean;
  /** Opens the fondo sheet for another turno, over this screen. */
  readonly onOtroTurno: () => void;
  /** Leaves the caja; the route decides where. */
  readonly onSalir: () => void;
}

/** The done screen: cuadró, faltante or sobrante said by its difference. */
export function CierreHecho(p: CierreHechoProps): ReactElement {
  const [mandar, setMandar] = useState(false);
  const [fecha] = useState(() => fechaCorta());
  const texto = mensajeCorte({
    ...(p.data.negocio === undefined ? {} : { negocio: p.data.negocio }),
    caja: p.data.caja,
    operador: p.data.operador,
    fecha,
    desde: p.data.desde,
    hasta: p.data.hasta,
    contado: p.e.contado,
    esperado: p.e.esperado,
    dif: p.e.dif,
    motivo: p.motivo,
    ventas: p.data.resumen.ventas,
    cobrado: p.data.resumen.cobrado,
  });
  const pie = (
    <Pie onMandar={() => setMandar(true)} onOtroTurno={p.onOtroTurno} onSalir={p.onSalir} />
  );
  return (
    <>
      <CierreMarco testID="cierre-hecho" pie={pie}>
        <Cabeza e={p.e} />
        <MText size="body" weight="semibold" color={colors.ink} textAlign="left">
          {lineaHecho(p.e.dif, p.motivo, p.enviado, p.data.operador)}
        </MText>
        <CierreCorte data={p.data} e={p.e} fecha={fecha} />
      </CierreMarco>
      <CierreMandar open={mandar} texto={texto} onClose={() => setMandar(false)} />
    </>
  );
}
