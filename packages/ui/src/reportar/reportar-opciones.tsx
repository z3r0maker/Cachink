/**
 * The four things a person can tap in «¿Qué pasó?» (RpHoja, RpTableta): a
 * glyph tile, the category's words and one line saying what it covers. Two
 * columns on the phone's sheet, one row of four in the tablet's dialog. The
 * chosen card takes the yellow wash, the thick edge and the small shadow.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import {
  BUG_REPORT_CATEGORIES,
  BUG_REPORT_CATEGORY_LABELS,
  type BugReportCategory,
} from '@xangarro/domain';
import { GLYPHS, MText, PathIcon } from '../components/index';
import { useTranslation } from '../i18n/index';
import { borderWidths, colors, radii, shadows } from '../theme';

const GLYPH: Readonly<Record<BugReportCategory, string>> = {
  could_not_charge: GLYPHS.recibo,
  froze_or_closed: GLYPHS.relojDeArena,
  wrong_number: GLYPHS.calculadora,
  other: GLYPHS.mensaje,
};

function Tile({ d }: { d: string }): ReactElement {
  return (
    <View
      width={40}
      height={40}
      alignItems="center"
      justifyContent="center"
      borderRadius={radii[2]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <PathIcon d={d} size={20} strokeWidth={2.2} />
    </View>
  );
}

function Card(props: {
  readonly category: BugReportCategory;
  readonly selected: boolean;
  readonly basis: `${number}%`;
  readonly onPress: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const { category, selected } = props;
  const label = BUG_REPORT_CATEGORY_LABELS[category];
  const detalle = t(`reportar.detalle.${category}`);
  return (
    <Pressable
      testID={`reportar-opcion-${category}`}
      role="radio"
      // A radio's children are not read on their own: without a name of its
      // own a screen reader says only «botón de opción».
      aria-label={`${label}. ${detalle}`}
      aria-checked={selected}
      onPress={props.onPress}
      style={{
        flexBasis: props.basis,
        flexGrow: 1,
        minHeight: 104,
        padding: 12,
        gap: 6,
        borderRadius: radii[4],
        borderColor: colors.black,
        borderWidth: selected ? borderWidths.thick : borderWidths.thin,
        backgroundColor: selected ? colors.yellowSoft : colors.white,
        boxShadow: selected ? shadows.small : undefined,
      }}
    >
      <Tile d={GLYPH[category]} />
      <MText size="body" weight="extraBold">
        {label}
      </MText>
      <MText size="xs" weight="semibold" color={colors.ink}>
        {detalle}
      </MText>
    </Pressable>
  );
}

export function ReportarOpciones(props: {
  readonly value: BugReportCategory;
  readonly onChange: (next: BugReportCategory) => void;
  /** Four in one row (the tablet's dialog) instead of two by two. */
  readonly enFila?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      testID="reportar-opciones"
      role="radiogroup"
      aria-label={t('reportar.titulo')}
      flexDirection="row"
      flexWrap="wrap"
      gap={8}
    >
      {BUG_REPORT_CATEGORIES.map((category) => (
        <Card
          key={category}
          category={category}
          selected={category === props.value}
          basis={props.enFila ? '22%' : '46%'}
          onPress={() => props.onChange(category)}
        />
      ))}
    </View>
  );
}
