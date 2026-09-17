/**
 * Test mock for react-native-wheely.
 *
 * The real `react-native-wheely` renders a FlatList-based scroll
 * drum that doesn't work in jsdom (no real scroll layout engine).
 * This mock renders a simple div with the current selected option
 * and click handlers that let tests fire onChange.
 *
 * `wheel-option-N` simulates a user drag that settles on N (onScrollBeginDrag
 * then onChange). `wheel-settle-N` simulates a momentum end with no drag — the
 * layout-shift case where the real wheel reports an index the user never chose.
 */

import React from 'react';

interface WheelPickerProps {
  selectedIndex: number;
  options: string[];
  onChange: (index: number) => void;
  itemHeight?: number;
  visibleRest?: number;
  containerStyle?: Record<string, unknown>;
  selectedIndicatorStyle?: Record<string, unknown>;
  itemTextStyle?: Record<string, unknown>;
  opacityFunction?: (x: number) => number;
  scaleFunction?: (x: number) => number;
  flatListProps?: { onScrollBeginDrag?: () => void };
}

function WheelPicker(props: WheelPickerProps): React.ReactElement {
  return (
    <div data-testid="wheel-picker-mock">
      {props.options.map((option, index) => (
        <div
          key={option}
          data-testid={`wheel-option-${index}`}
          data-selected={index === props.selectedIndex}
          onClick={() => {
            props.flatListProps?.onScrollBeginDrag?.();
            props.onChange(index);
          }}
          role="option"
          aria-selected={index === props.selectedIndex}
        >
          {option}
        </div>
      ))}
      {props.options.map((option, index) => (
        <button
          key={`settle-${option}`}
          type="button"
          data-testid={`wheel-settle-${index}`}
          onClick={() => props.onChange(index)}
        />
      ))}
    </div>
  );
}

export default WheelPicker;
