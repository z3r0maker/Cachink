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
import { AVISOS_COPY, sinLeer } from '@xangarro/caja/avisos';
import { EstadoVacio } from '../../components/CajaEstado/index';
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
  /** No network: what is stored still shows; a reply says it waits (R6). */
  readonly sinInternet?: boolean;
  /** A cta's href (a web `/operador/...` path), mapped to a phone route. */
  readonly onAbrir: (href: string) => void;
  readonly onRetry: () => void;
  readonly testID?: string;
}

type AvisosLista = ReturnType<typeof useAvisosVista>['visibles'];

function Lista(p: {
  readonly visibles: AvisosLista;
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
  return <Nada cuerpo={AVISOS_COPY.vacio} />;
}

/** «Nada por leer» with Don (RvPrimerUso), in whatever words the moment needs. */
function Nada({ cuerpo }: { readonly cuerpo: string }): ReactElement {
  return (
    <View testID="avisos-sin-nada">
      <EstadoVacio id="avisos-vacio" title="Nada por leer" body={cuerpo} />
    </View>
  );
}

/** The empty open tab: who has not written. */
function NadaPorLeer(p: { readonly tab: AvisoGrupo }): ReactElement {
  return (
    <Nada
      cuerpo={p.tab === 'dueno' ? AVISOS_COPY.nadaNuevo : 'Tu caja no tiene avisos del sistema.'}
    />
  );
}

/** The sheet and the toast, above the list. */
function Capas(p: { readonly v: ReturnType<typeof useAvisosVista> }): ReactElement | null {
  const respondiendo = p.v.avisos.find((a) => a.id === p.v.respondiendo) ?? null;
  return (
    <>
      {respondiendo?.responder !== undefined ? (
        <ResponderSheet
          open
          aviso={respondiendo}
          onClose={p.v.cerrarRespuesta}
          onEnviar={(texto) => p.v.responder(respondiendo.id, texto)}
        />
      ) : null}
      {p.v.toast ? (
        <Toast
          title={
            !p.v.toast.ok
              ? 'No se pudo enviar'
              : p.v.toast.guardada === true
                ? 'Respuesta guardada'
                : 'Respuesta enviada'
          }
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
  const v = useAvisosVista(p.data, p.tab, p.vivo, p.sinInternet === true);
  return (
    <View flex={1} testID={p.testID ?? 'avisos'}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <AvisosCabeza haySinLeer={sinLeer(v.avisos) > 0} onMarcarTodo={v.marcarTodo} />
        <AvisosTabs value={v.tab} sinLeer={v.sinLeer} onChange={v.setTab} />
        {v.visibles.length === 0 ? (
          <NadaPorLeer tab={v.tab} />
        ) : (
          <Lista
            visibles={v.visibles}
            abrir={v.abrirRespuesta}
            marcar={v.marcarLeido}
            onAbrir={p.onAbrir}
          />
        )}
      </ScrollView>
      <Capas v={v} />
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
        <AvisosCabeza haySinLeer={false} onMarcarTodo={() => undefined} />
        <Estado {...p} />
      </ScrollView>
    </View>
  );
}
