/**
 * DirectorHomeScreen — the Director's home dashboard shell (P1C-M10-T01).
 *
 * Pure slot-based composition: the screen renders greeting + hero + a
 * responsive grid of Director cards, but each slot is a ReactNode
 * injected by the route. Keeps this file dumb (no hooks, no
 * repository imports) so tests mount it with trivial placeholder
 * nodes.
 *
 * Phase 1C-M10 commits progressively fill the slots:
 *   - C2 UtilidadHero     → `hero`
 *   - C3 HoyKpiStrip      → `hoy`
 *   - C4 CxC card         → `cxc`
 *   - C5 ActividadReciente → `actividad`
 *   - C6 StockBajoCard    → `stockBajo`
 *   - C7 PendientesCard   → `pendientes`
 *
 * Layout (audit M-1 PR 5.5-T03): the grid is now driven by Tamagui's
 * `useMedia()` for explicit column counts at each breakpoint:
 *
 *   - `sm`   (phone portrait, ≤ 480 px)         → 1 column
 *   - `gtSm` (phone landscape / small tablet)   → 2 columns
 *   - `gtMd` (tablet landscape / desktop)        → 2 columns
 *   - `gtLg` (wide desktop, ≥ 1281 px)           → 3 columns
 *
 * The previous `width:'48%' + minWidth:240` heuristic produced the
 * correct 1-or-2-column behaviour on the standard form factors but
 * never advanced to 3 columns at desktop widths. The explicit ladder
 * fixes that and makes the design intent visible in code.
 */

import type { ReactElement, ReactNode } from 'react';
import { Text, View, useMedia } from '@tamagui/core';
import { SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface DirectorHomeScreenProps {
  readonly greeting?: string;
  readonly hero?: ReactNode;
  /**
   * Corte de Día card — rendered above the grid, below the hero.
   * Typically a `<CorteHomeCard />` from `@cachink/ui` that auto-hides
   * outside the 18:00 gate (Slice 9.6 T09).
   */
  readonly corte?: ReactNode;
  readonly hoy?: ReactNode;
  readonly cxc?: ReactNode;
  readonly actividad?: ReactNode;
  readonly stockBajo?: ReactNode;
  readonly pendientes?: ReactNode;
  /**
   * LAN-sync conflict surface (P1D-M4 C20). Renders as a full-width grid
   * item when provided; ConflictosRecientesCard returns `null` when there
   * are zero conflicts so it's always safe to mount unconditionally.
   */
  readonly conflictos?: ReactNode;
  readonly testID?: string;
}

function GreetingHeader({ text }: { text: string }): ReactElement {
  return (
    <View gap={4}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={28}
        color={colors.black}
        letterSpacing={typography.letterSpacing.tighter}
      >
        {text}
      </Text>
    </View>
  );
}

/**
 * Audit M-1 PR 5.5-T03 — explicit 1 / 2 / 3-column ladder via
 * `useMedia()`. The previous `width: '48%' + minWidth: 240` heuristic
 * (T03 phase A) closed the "uneven 2/3/4-column wrap" finding but
 * never advanced past 2 columns at desktop widths. This ladder uses
 * the breakpoint contract documented in
 * `packages/ui/src/responsive/README.md`:
 *
 *   - `sm` (≤ 480 px)        → 1 column (100 % width)
 *   - `gtSm` / `gtMd`        → 2 columns (~48 % width)
 *   - `gtLg` (≥ 1281 px)     → 3 columns (~32 % width)
 *
 * The intermediate 8 px gutter accounts for the parent's `gap: 12`,
 * leaving a 4 px slack on the row total so wide viewports don't
 * forcibly shrink the cards below their natural minimum.
 */
function gridItemWidthForColumns(columns: 1 | 2 | 3): string {
  if (columns === 1) return '100%';
  if (columns === 2) return '48%';
  return '32%';
}

function GridItem({
  columns,
  children,
}: {
  columns: 1 | 2 | 3;
  children: ReactNode;
}): ReactElement {
  return (
    <View width={gridItemWidthForColumns(columns)} minWidth={240} flexGrow={1} gap={10}>
      {children}
    </View>
  );
}

function useGridColumns(): 1 | 2 | 3 {
  const media = useMedia();
  if (media.gtLg) return 3;
  if (media.gtSm) return 2;
  return 1;
}

export function DirectorHomeScreen(props: DirectorHomeScreenProps): ReactElement {
  const { t } = useTranslation();
  const greeting = props.greeting ?? t('directorHome.greeting');
  const columns = useGridColumns();
  return (
    <View
      testID={props.testID ?? 'director-home-screen'}
      flex={1}
      padding={20}
      gap={16}
      backgroundColor={colors.offwhite}
    >
      <GreetingHeader text={greeting} />
      {props.hero !== undefined && <View testID="director-home-hero-slot">{props.hero}</View>}
      {props.corte !== undefined && <View testID="director-home-corte-slot">{props.corte}</View>}
      <SectionTitle title={t('directorHome.resumenHoy')} />
      {/*
       * `data-columns` exposes the resolved column count (1/2/3) for
       * test + telemetry consumers. Tamagui hashes the compiled
       * width class on `<GridItem>`, so asserting on column intent
       * directly is the robust path.
       */}
      <View
        flexDirection="row"
        flexWrap="wrap"
        gap={12}
        testID="director-home-grid"
        data-columns={columns}
      >
        {props.hoy !== undefined && <GridItem columns={columns}>{props.hoy}</GridItem>}
        {props.cxc !== undefined && <GridItem columns={columns}>{props.cxc}</GridItem>}
        {props.actividad !== undefined && <GridItem columns={columns}>{props.actividad}</GridItem>}
        {props.stockBajo !== undefined && <GridItem columns={columns}>{props.stockBajo}</GridItem>}
        {props.pendientes !== undefined && (
          <GridItem columns={columns}>{props.pendientes}</GridItem>
        )}
        {props.conflictos !== undefined && (
          <GridItem columns={columns}>{props.conflictos}</GridItem>
        )}
      </View>
    </View>
  );
}
