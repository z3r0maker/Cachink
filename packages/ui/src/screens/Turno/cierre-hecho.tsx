/**
 * «¡Turno cerrado!» (Track M, M-09; the web's Hecho on the phone): Don
 * celebrates only a count that cuadró and worries on a shortfall, the chip
 * and the lines say what happened and what the owner will see, the four
 * figures repeat the corte, and the way on is handing the cash over, sharing
 * the corte by WhatsApp and leaving the caja.
 */
import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';
import {
  CHIP_CIERRE,
  conSigno,
  DIF,
  lineaCerrado,
  lineaPorEnviar,
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
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import { CierreEntregaDialog, Entregado, PorEntregar } from './cierre-entrega';
import { Cifras, TINTA } from './cierre-hecho-cifras';
import { borderWidths, shapeRadii } from '../../theme';

const CHECK = 'M20 6 9 17l-5-5';
const SALIR = 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9';

/** Don celebrates only a count that cuadró and worries on a shortfall. */
const POSE: Record<EstadoConteo['dif']['tipo'], DonPose> = {
  cuadra: 'celebrando',
  falta: 'preocupado',
  sobra: 'quieto',
};

/** «6 oct», the day the turno closed. */
export function fechaCorta(d: Date = new Date()): string {
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
}

/** The corte the WhatsApp share carries; the route owns the share itself. */
export function textoCorte(e: EstadoConteo, data: CierreData): string {
  const dif = e.dif.tipo === 'cuadra' ? 'cuadró' : `diferencia ${conSigno(e.dif)}`;
  return `Corte ${data.caja}, ${data.operador}, ${fechaCorta()}: contado ${formatMoney(e.contado)}, esperado ${formatMoney(e.esperado)}, ${dif}.`;
}

function Cabeza(p: { readonly e: EstadoConteo }): ReactElement {
  const tipo = p.e.dif.tipo;
  const t = DIF[tipo];
  return (
    <View flexDirection="row" alignItems="center" gap={12}>
      <Don pose={POSE[tipo]} size={140} />
      <View flex={1} minWidth={0} gap={8} alignItems="flex-start">
        <View
          flexDirection="row"
          alignItems="center"
          gap={6}
          borderRadius={shapeRadii.pill}
          borderWidth={borderWidths.thin}
          borderColor={t.color}
          backgroundColor={t.bg}
          paddingHorizontal={12}
          paddingVertical={4}
        >
          {tipo === 'cuadra' ? (
            <PathIcon d={CHECK} size={14} strokeWidth={2.8} color={t.color} />
          ) : null}
          <MText size="xs" weight="extraBold" color={t.color}>
            {CHIP_CIERRE[tipo]}
          </MText>
        </View>
        <MText size="xl4" weight="extraBold" letterSpacing={-0.8} textAlign="left">
          {tituloHecho(p.e.dif)}
        </MText>
        <MText size="md" weight="bold" color={TINTA[tipo]} textAlign="left">
          {segundaLinea(p.e.dif)}
        </MText>
      </View>
    </View>
  );
}

function Acciones(p: {
  readonly e: EstadoConteo;
  readonly data: CierreData;
  readonly onCompartir: (texto: string) => void;
  readonly onSalir: () => void;
}): ReactElement {
  return (
    <View flexDirection="row" gap={10}>
      <View flex={1.4}>
        <Btn
          variant="primary"
          size="lg"
          sentence
          fullWidth
          icon={<PathIcon d={COBRAR_GLYPHS.whatsapp} size={18} strokeWidth={2} />}
          onPress={() => p.onCompartir(textoCorte(p.e, p.data))}
          testID="cierre-compartir"
        >
          Mandar el corte
        </Btn>
      </View>
      <View flex={1}>
        <Btn
          variant="secondary"
          size="lg"
          sentence
          fullWidth
          icon={<PathIcon d={SALIR} size={17} strokeWidth={2.2} />}
          onPress={p.onSalir}
          testID="cierre-salir"
        >
          Salir
        </Btn>
      </View>
    </View>
  );
}

export interface CierreHechoProps {
  readonly data: CierreData;
  readonly e: EstadoConteo;
  readonly motivo: MotivoDiferencia | null;
  /** Records still to send: the owner sees the close once they go up. */
  readonly porEnviar: number;
  /** The route's share (WhatsApp on the phone); the text is built here. */
  readonly onCompartir: (texto: string) => void;
  /** «Salir de la caja», or open another turno: the route decides where. */
  readonly onSalir: () => void;
}

/** The done screen: cuadró, faltante or sobrante said by its difference. */
export function CierreHecho(p: CierreHechoProps): ReactElement {
  const [confirmar, setConfirmar] = useState(false);
  const [entregado, setEntregado] = useState(false);
  const nombre = p.data.operador.split(' ')[0] ?? p.data.operador;
  const gracias = p.e.dif.tipo === 'cuadra' ? ` Gracias por tu turno, ${nombre}.` : '';
  return (
    <View gap={16} testID="cierre-hecho" padding={16}>
      <Cabeza e={p.e} />
      <MText size="sm" weight="semibold" color={colors.gray600} textAlign="left">
        {`${lineaCerrado(p.e.dif, p.motivo, p.data.dueno, p.porEnviar)}${gracias}`}
      </MText>
      {p.porEnviar > 0 ? (
        <MText size="sm" weight="semibold" color={colors.gray600} textAlign="left">
          {lineaPorEnviar(p.data.dueno)}
        </MText>
      ) : null}
      <Cifras e={p.e} ventas={p.data.resumen.ventas} />
      {entregado ? (
        <Entregado dueno={p.data.dueno} />
      ) : (
        <PorEntregar
          monto={formatMoney(p.e.contado)}
          dueno={p.data.dueno}
          onConfirmar={() => setConfirmar(true)}
        />
      )}
      <Acciones e={p.e} data={p.data} onCompartir={p.onCompartir} onSalir={p.onSalir} />
      <CierreEntregaDialog
        open={confirmar}
        monto={formatMoney(p.e.contado)}
        dueno={p.data.dueno}
        onClose={() => setConfirmar(false)}
        onEntregar={() => {
          setConfirmar(false);
          setEntregado(true);
        }}
      />
    </View>
  );
}
