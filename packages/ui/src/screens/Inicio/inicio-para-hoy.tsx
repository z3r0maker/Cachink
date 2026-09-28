/**
 * «Para hoy» (MvInicio; the web's `ParaHoy`): what nobody on this caja has
 * done yet, the most urgent few still standing (`MAX_TAREAS`), each with its
 * action and «Hoy no». With no turno open the list waits for it.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { ICONS, OPERADOR_BASE } from '@xangarro/caja';
import { MAX_TAREAS, type Tarea, type TareaTipo } from '@xangarro/caja/inicio';
import { Btn, MText, PathIcon, QuietPanel } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { borderWidths, colors, radii } from '../../theme';
import { rutaMovil } from './inicio-rutas';
import type { HoyNo } from './use-hoy-no';

/** Each kind's glyph, tint, and the web screen its action opens when the task names none. */
const TAREA: Record<TareaTipo, { icon: string; tint: string; slug: string }> = {
  gasto: { icon: ICONS.gastos, tint: colors.redSoft, slug: 'gastos' },
  reponer: { icon: ICONS.inventario, tint: colors.yellowSoft, slug: 'inventario' },
  cobrar: { icon: ICONS.cobranza, tint: colors.warningSoft, slug: 'cobranza' },
  entrada: { icon: ICONS.inventario, tint: colors.greenSoft, slug: 'inventario' },
};

export interface ParaHoyProps {
  readonly tareas: readonly Tarea[];
  readonly cerrado: boolean;
  readonly hoyNo: HoyNo;
  readonly onNavigate: (path: string) => void;
}

function Nada(props: { titulo: string; cuerpo: string }): ReactElement {
  return (
    <View alignItems="center" gap={4} paddingHorizontal={16} paddingVertical={22}>
      <MText size="lg" weight="extraBold" textAlign="center">
        {props.titulo}
      </MText>
      <MText size="sm" weight="semibold" color={colors.textMuted} textAlign="center">
        {props.cuerpo}
      </MText>
    </View>
  );
}

interface FilaProps {
  readonly t: Tarea;
  readonly ruta: string | null;
  readonly onIr: () => void;
  readonly onHoyNo: () => void;
}

function Glifo({ tipo }: { tipo: TareaTipo }): ReactElement {
  const k = TAREA[tipo];
  return (
    <View
      width={40}
      height={40}
      alignItems="center"
      justifyContent="center"
      borderRadius={radii[2]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={k.tint}
    >
      <PathIcon d={k.icon} size={18} />
    </View>
  );
}

function Acciones(p: FilaProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View flexDirection="row" gap={8} marginTop={8}>
      {p.ruta ? (
        <Btn variant="secondary" size="md" onPress={p.onIr} testID={`inicio-tarea-ir-${p.t.id}`}>
          {t(`entrar.inicio.accion.${p.t.tipo}`)}
        </Btn>
      ) : null}
      <Btn
        variant="quiet"
        size="md"
        onPress={p.onHoyNo}
        ariaLabel={t('entrar.inicio.hoyNoAria', { titulo: p.t.titulo })}
        testID={`inicio-tarea-hoy-no-${p.t.id}`}
      >
        {t('entrar.inicio.hoyNo')}
      </Btn>
    </View>
  );
}

function Fila(p: FilaProps): ReactElement {
  return (
    <View
      testID={`inicio-tarea-${p.t.id}`}
      flexDirection="row"
      alignItems="flex-start"
      gap={12}
      paddingHorizontal={16}
      paddingVertical={12}
      borderTopWidth={1}
      borderTopColor={colors.gray100}
    >
      <Glifo tipo={p.t.tipo} />
      <View flex={1} minWidth={0} gap={2}>
        <MText size="body" weight="extraBold">
          {p.t.titulo}
        </MText>
        <MText size="sm" weight="semibold" color={colors.textMuted}>
          {p.t.detalle}
        </MText>
        <Acciones {...p} />
      </View>
    </View>
  );
}

function Filas(p: ParaHoyProps & { shown: readonly Tarea[] }): ReactElement {
  return (
    <>
      {p.shown.map((x) => {
        const ruta = rutaMovil(x.href ?? `${OPERADOR_BASE}/${TAREA[x.tipo].slug}`);
        return (
          <Fila
            key={x.id}
            t={x}
            ruta={ruta}
            onIr={() => (ruta ? p.onNavigate(ruta) : undefined)}
            onHoyNo={() => p.hoyNo.ocultar(x.id)}
          />
        );
      })}
    </>
  );
}

export function ParaHoy(p: ParaHoyProps): ReactElement {
  const { t } = useTranslation();
  if (p.cerrado) {
    return (
      <QuietPanel label={t('entrar.inicio.paraHoy')} testID="inicio-para-hoy">
        <Nada titulo={t('entrar.inicio.cerradoTitulo')} cuerpo={t('entrar.inicio.cerradoCuerpo')} />
      </QuietPanel>
    );
  }
  const shown = p.tareas.filter((x) => !p.hoyNo.ocultos.includes(x.id)).slice(0, MAX_TAREAS);
  const verTodas = p.tareas.some((x) => p.hoyNo.ocultos.includes(x.id)) ? (
    <Btn variant="quiet" size="sm" onPress={p.hoyNo.mostrarTodo} testID="inicio-ver-todas">
      {t('entrar.inicio.verTodas')}
    </Btn>
  ) : undefined;
  return (
    <QuietPanel
      label={t('entrar.inicio.paraHoy')}
      count={shown.length}
      action={verTodas}
      testID="inicio-para-hoy"
    >
      <MText
        size="sm"
        weight="semibold"
        color={colors.textMuted}
        paddingHorizontal={16}
        paddingBottom={8}
      >
        {t('entrar.inicio.paraHoyNota')}
      </MText>
      <Filas {...p} shown={shown} />
      {shown.length === 0 ? (
        <Nada titulo={t('entrar.inicio.nada')} cuerpo={t('entrar.inicio.nadaCuerpo')} />
      ) : null}
    </QuietPanel>
  );
}
