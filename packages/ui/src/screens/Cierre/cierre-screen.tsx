/**
 * CierreScreen — Cierre de turno (MvCierre; the web's `CierreScreen`): who,
 * the caja and the hours; the queue's warning band when records wait (never
 * a block, ADR-123); the expected cash and its parts; the count by
 * denomination; the difference and its motive; the Resumen; and the close
 * in the thumb zone. Once closed, «¡Turno cerrado!» (MvCierreHecho).
 *
 * Presentational: the route hands it `useCierreMovil()` and navigation.
 */
import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import type { CierreData } from '@xangarro/caja/cierre';
import { Btn, EmptyState, ErrorState, MText, Spinner } from '../../components/index';
import { colors } from '../../theme';
import { Banda } from './cierre-banda';
import { Conteo } from './cierre-conteo';
import { Diferencia } from './cierre-diferencia';
import { CierreHechoScreen } from './cierre-hecho';
import { PieCierre } from './cierre-pie';
import { EsperadoCierre, ResumenCierre } from './cierre-resumen';
import type { CierreHecho, CierreVista } from './cierre-tipos';

export interface CierreScreenProps {
  readonly x: CierreVista;
  /** «Ver cuáles»: Por enviar. */
  readonly onVerCuales: () => void;
  readonly onCompartir: (h: CierreHecho) => void;
  /** «Salir»: lock the caja, back to Acceso. */
  readonly onSalir: () => void;
  /** With no turno open: back to Mi turno. */
  readonly onVolver: () => void;
}

function Cuerpo({ p, data }: { p: CierreScreenProps; data: CierreData }): ReactElement {
  const { x } = p;
  return (
    <View flex={1} backgroundColor={colors.gray200}>
      <ScrollView
        testID="cierre"
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 14, gap: 14 }}
      >
        <View gap={2}>
          <MText size="xl5" weight="extraBold" letterSpacing={-1} role="heading">
            Cierre de turno
          </MText>
          <MText size="md" weight="semibold" color={colors.gray600}>
            {`${data.operador}, ${data.caja}, de ${data.desde} a ${data.hasta}`}
          </MText>
        </View>
        {x.cola.porEnviar > 0 ? <Banda cola={x.cola} onVerCuales={p.onVerCuales} /> : null}
        <EsperadoCierre data={data} esperado={x.conteo.esperado} />
        <Conteo x={x.conteo} />
        <Diferencia x={x.conteo} dueno={data.dueno} />
        <ResumenCierre data={data} />
      </ScrollView>
      <PieCierre x={x.conteo} cerrando={x.cerrando} fallo={x.fallo} onCerrar={x.cerrar} />
    </View>
  );
}

export function CierreScreen(p: CierreScreenProps): ReactElement {
  const { x } = p;
  if (x.hecho) {
    const h = x.hecho;
    return <CierreHechoScreen h={h} onCompartir={() => p.onCompartir(h)} onSalir={p.onSalir} />;
  }
  if (x.state === 'error') {
    return (
      <ErrorState
        title="No pudimos calcular tu corte"
        body="Tus ventas están guardadas en la caja. Intenta otra vez."
        retryLabel="Reintentar"
        onRetry={x.refetch}
        testID="cierre-error"
      />
    );
  }
  if (x.state === 'sin-turno') {
    return (
      <EmptyState
        title="No tienes un turno abierto"
        description="Para cerrar, primero abre tu turno desde Mi turno."
        action={
          <Btn variant="secondary" size="lg" onPress={p.onVolver} testID="cierre-ir-turno">
            Ir a Mi turno
          </Btn>
        }
        testID="cierre-sin-turno"
      />
    );
  }
  if (x.data === null) {
    return (
      <View flex={1} alignItems="center" justifyContent="center" testID="cierre-cargando">
        <Spinner />
      </View>
    );
  }
  return <Cuerpo p={p} data={x.data} />;
}
