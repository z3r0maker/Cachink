/**
 * AvisosScreen — «Avisos» (Track M, M-09; the board `Operador Avisos` said
 * on the phone): what the owner sends and what the caja itself notices, in
 * two tabs with their unread counts. An aclaración is answered in place,
 * from a bottom sheet with the quick answers. Presentational: the route
 * hands it `useAvisos()` and maps each cta href to a route.
 */
import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import type { AvisoGrupo, AvisosData, AvisosVivo } from '@xangarro/caja/avisos';
import { deDueno, mayuscula, sinLeer } from '@xangarro/caja/avisos';
import { Toast } from '../../components/Toast/index';
import { EstadosCaja } from '../Pendientes/estados';
import { AvisosCabeza, AvisosTabs } from './avisos-cabeza';
import { AvisoCajaTarjeta } from './aviso-caja-tarjeta';
import { AvisoDuenoTarjeta } from './aviso-tarjeta';
import { ResponderSheet } from './responder-sheet';
import { useAvisosVista } from './use-avisos-vista';

export type AvisosEstado = 'happy' | 'cargando' | 'sin-avisos' | 'error' | 'sin-internet';

export interface AvisosScreenProps {
  readonly state: AvisosEstado;
  readonly data: AvisosData | null;
  /** The tab the screen opens on; the unread counts keep themselves fresh. */
  readonly tab: AvisoGrupo;
  /** A linked caja: persists read marks and writes each reply. */
  readonly vivo?: AvisosVivo;
  /** A cta's href (a web `/operador/...` path), mapped to a phone route. */
  readonly onAbrir: (href: string) => void;
  readonly onRetry: () => void;
  readonly testID?: string;
}

type AvisosLista = ReturnType<typeof useAvisosVista>['visibles'];

function Lista(p: {
  readonly visibles: AvisosLista;
  readonly dueno: string;
  readonly abrir: (id: string) => void;
  readonly marcar: (id: string) => void;
  readonly onAbrir: (href: string) => void;
}): ReactElement {
  return (
    <View gap={12}>
      {p.visibles.map((a) =>
        a.grupo === 'dueno' ? (
          <AvisoDuenoTarjeta
            key={a.id}
            aviso={a}
            dueno={p.dueno}
            onResponder={() => p.abrir(a.id)}
            onMarcarLeido={() => p.marcar(a.id)}
            onAbrir={p.onAbrir}
          />
        ) : (
          <AvisoCajaTarjeta key={a.id} aviso={a} onAbrir={p.onAbrir} />
        ),
      )}
    </View>
  );
}

/** One of the non-happy states, in the screen's words. */
function Estado(p: AvisosScreenProps): ReactElement {
  if (p.state === 'cargando') return <EstadosCaja id="cargando" testID="avisos" />;
  if (p.state === 'sin-internet')
    return <EstadosCaja id="sin-internet" onRetry={p.onRetry} testID="avisos" />;
  if (p.state === 'error')
    return (
      <EstadosCaja
        id="falla"
        titulo="No pudimos leer tus avisos"
        onRetry={p.onRetry}
        testID="avisos"
      />
    );
  const dueno = p.data?.dueno ?? 'el dueño';
  return (
    <EstadosCaja
      id="sin-nada"
      titulo="Nada por leer"
      cuerpo={`Ni mensajes ${deDueno(dueno)} ni avisos de tu caja.`}
      testID="avisos"
    />
  );
}

/** The empty open tab: who has not written. */
function NadaPorLeer(p: { readonly tab: AvisoGrupo; readonly dueno: string }): ReactElement {
  return (
    <EstadosCaja
      id="sin-nada"
      titulo="Nada por leer"
      cuerpo={
        p.tab === 'dueno'
          ? `${mayuscula(p.dueno)} no te ha escrito nada nuevo.`
          : 'Tu caja no tiene avisos del sistema.'
      }
      testID="avisos"
    />
  );
}

/** The sheet and the toast, above the list. */
function Capas(p: {
  readonly data: AvisosData;
  readonly v: ReturnType<typeof useAvisosVista>;
}): ReactElement | null {
  const respondiendo = p.v.avisos.find((a) => a.id === p.v.respondiendo) ?? null;
  return (
    <>
      {respondiendo?.responder !== undefined ? (
        <ResponderSheet
          open
          aviso={respondiendo}
          dueno={p.data.dueno}
          onClose={p.v.cerrarRespuesta}
          onEnviar={(texto) => p.v.responder(respondiendo.id, texto)}
        />
      ) : null}
      {p.v.toast ? (
        <Toast
          title={p.v.toast.ok ? 'Respuesta enviada' : 'No se pudo enviar'}
          body={p.v.toast.texto}
          tone={p.v.toast.ok ? 'ok' : 'warn'}
          floating
          onClose={p.v.cerrarToast}
          testID="avisos-toast"
        />
      ) : null}
    </>
  );
}

function Feliz(p: AvisosScreenProps & { readonly data: AvisosData }): ReactElement {
  const v = useAvisosVista(p.data, p.tab, p.vivo);
  return (
    <View flex={1} testID={p.testID ?? 'avisos'}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <AvisosCabeza
          dueno={p.data.dueno}
          haySinLeer={sinLeer(v.avisos) > 0}
          onMarcarTodo={v.marcarTodo}
        />
        <AvisosTabs dueno={p.data.dueno} value={v.tab} sinLeer={v.sinLeer} onChange={v.setTab} />
        {v.visibles.length === 0 ? (
          <NadaPorLeer tab={v.tab} dueno={p.data.dueno} />
        ) : (
          <Lista
            visibles={v.visibles}
            dueno={p.data.dueno}
            abrir={v.abrirRespuesta}
            marcar={v.marcarLeido}
            onAbrir={p.onAbrir}
          />
        )}
      </ScrollView>
      <Capas data={p.data} v={v} />
    </View>
  );
}

export function AvisosScreen(p: AvisosScreenProps): ReactElement {
  if (p.state === 'happy' && p.data !== null && p.data.avisos.length > 0) {
    return <Feliz {...p} data={p.data} />;
  }
  return (
    <View flex={1} testID={p.testID ?? 'avisos'}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <AvisosCabeza
          dueno={p.data?.dueno ?? 'el dueño'}
          haySinLeer={false}
          onMarcarTodo={() => undefined}
        />
        <Estado {...p} />
      </ScrollView>
    </View>
  );
}
