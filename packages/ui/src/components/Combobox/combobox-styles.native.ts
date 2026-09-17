/** Bottom-sheet styles for the mobile Combobox (split out for the 200-line budget). */
import type { TextStyle, ViewStyle } from 'react-native';
import { colors, fontSizes, radii, shapeRadii, typography } from '../../theme';

const TRIGGER_RADIUS = radii[2];

export const styles = {
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
  } satisfies ViewStyle,
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderColor: colors.black,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderRightWidth: 2.5,
    maxHeight: '60%',
    paddingHorizontal: 16,
    paddingTop: 12,
  } satisfies ViewStyle,
  searchInput: {
    borderColor: colors.black,
    borderWidth: 2,
    borderRadius: TRIGGER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSizes.md,
    fontFamily: typography.fontFamily,
    color: colors.ink,
    marginBottom: 8,
  } satisfies TextStyle,
  optionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii[1],
  } satisfies ViewStyle,
  selectedRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii[1],
    backgroundColor: colors.gray100,
  } satisfies ViewStyle,
  handle: {
    width: 36,
    height: 4,
    borderRadius: shapeRadii.mark,
    backgroundColor: colors.gray400,
    alignSelf: 'center',
    marginBottom: 8,
  } as ViewStyle,
} as const;
