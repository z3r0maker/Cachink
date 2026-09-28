/**
 * InicioScreen — the caja's landing (MvInicio, TbInicio; the web's
 * `InicioScreen`): not a dashboard, it answers «what do I do now». Don's
 * greeting, «Lo primero» in the situation's tone (turno cerrado, vendiendo,
 * hora de cerrar, sin conexión), the four figures, the shortcut tiles,
 * «Para hoy» and the last closes. From 760 px the card lies across, the
 * figures sit in one row and «Para hoy» and the closes share a row.
 *
 * Presentational: the route hands it `useInicio()`, «Hoy no» and navigation.
 */
import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { heroFor, kpisFor, type InicioData } from '@xangarro/caja/inicio';
import { ErrorState, Spinner } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { useCajaLayout, type CajaLayout } from '../AppShell/use-caja-layout';
import { InicioAtajos } from './inicio-atajos';
import { UltimosCortes } from './inicio-cortes';
import { InicioHero } from './inicio-hero';
import { InicioKpis } from './inicio-kpis';
import { ParaHoy } from './inicio-para-hoy';
import { rutaMovil } from './inicio-rutas';
import { InicioSaludo } from './inicio-saludo';
import type { HoyNo } from './use-hoy-no';

export interface InicioScreenProps {
  readonly state: 'loading' | 'error' | 'happy';
  readonly data: InicioData | null;
  readonly hoyNo: HoyNo;
  readonly onNavigate: (path: string) => void;
  /** «Abrir turno»: the fondo sheet (MvAbrirTurno). */
  readonly onAbrirTurno: () => void;
  readonly onRetry: () => void;
  /** Overrides the window's width (the stories). */
  readonly layout?: CajaLayout;
}

const ir = (href: string | undefined, nav: (p: string) => void): (() => void) | null => {
  const ruta = href ? rutaMovil(href) : null;
  return ruta ? () => nav(ruta) : null;
};

function Contenido(p: InicioScreenProps & { data: InicioData; ancho: boolean }): ReactElement {
  const { data } = p;
  const hero = heroFor(data);
  const cerrado = data.situacion === 'turno-cerrado' || data.turno === null;
  const cortes =
    data.cortes.length > 0 ? (
      <UltimosCortes
        cortes={data.cortes}
        onCerrar={cerrado ? null : () => p.onNavigate('/turno')}
      />
    ) : null;
  const paraHoy = (
    <ParaHoy tareas={data.tareas} cerrado={cerrado} hoyNo={p.hoyNo} onNavigate={p.onNavigate} />
  );
  return (
    <>
      <InicioSaludo data={data} />
      <InicioHero
        hero={hero}
        ancho={p.ancho}
        onAccion={hero.tono === 'cerrado' ? p.onAbrirTurno : ir(hero.href, p.onNavigate)}
        onExtra={ir(hero.extra?.href, p.onNavigate) ?? undefined}
      />
      <InicioKpis items={kpisFor(data)} enFila={p.ancho} />
      {p.ancho ? null : <InicioAtajos onNavigate={p.onNavigate} />}
      {p.ancho ? (
        <View flexDirection="row" gap={16} alignItems="flex-start">
          <View flex={1.4}>{paraHoy}</View>
          <View flex={1}>{cortes}</View>
        </View>
      ) : (
        <>
          {paraHoy}
          {cortes}
        </>
      )}
    </>
  );
}

export function InicioScreen(props: InicioScreenProps): ReactElement {
  const { t } = useTranslation();
  const ventana = useCajaLayout();
  const ancho = (props.layout ?? ventana) !== 'phone';
  const pad = ancho ? 24 : 16;
  if (props.state === 'error' || (props.state === 'happy' && props.data === null)) {
    return (
      <ErrorState
        title={t('entrar.inicio.errorTitulo')}
        body={t('entrar.inicio.errorCuerpo')}
        retryLabel={t('entrar.inicio.reintentar')}
        onRetry={props.onRetry}
        testID="inicio-error"
      />
    );
  }
  if (props.data === null) {
    return (
      <View flex={1} alignItems="center" justifyContent="center" testID="inicio-cargando">
        <Spinner />
      </View>
    );
  }
  return (
    <ScrollView
      testID="inicio"
      contentContainerStyle={{ padding: pad, paddingTop: ancho ? 24 : 12, gap: 14 }}
    >
      <Contenido {...props} data={props.data} ancho={ancho} />
    </ScrollView>
  );
}
