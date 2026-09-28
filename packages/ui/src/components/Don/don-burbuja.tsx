/**
 * DonBurbuja — Don Cuentas beside his speech bubble, the way the phone
 * boards greet (MvVincular, MvAcceso, MvInicio): the pose at the left, a
 * white bubble with the black edge and the small hard shadow, its tail
 * pointing at him. The words are text; Don stays decorative.
 */
import type { ReactElement, ReactNode } from 'react';
import { View } from '@tamagui/core';
import { borderWidths, colors, radii, shadows } from '../../theme';
import { Don, type DonPose } from './don';

export interface DonBurbujaProps {
  readonly pose: DonPose;
  /** Don's square, in px (72 to 84 on the boards). */
  readonly size: number;
  /** `centro` when the band is short (Acceso's yellow head). */
  readonly cola?: 'abajo' | 'centro';
  readonly children: ReactNode;
  readonly testID?: string;
}

const COLA = 14;

function Cola({ centro }: { centro: boolean }): ReactElement {
  return (
    <View
      position="absolute"
      left={-9}
      width={COLA}
      height={COLA}
      backgroundColor={colors.white}
      borderLeftWidth={borderWidths.thin}
      borderBottomWidth={borderWidths.thin}
      borderColor={colors.black}
      style={{
        transform: [{ rotate: '45deg' }],
        ...(centro ? { top: '50%', marginTop: -COLA / 2 } : { bottom: 16 }),
      }}
    />
  );
}

export function DonBurbuja(props: DonBurbujaProps): ReactElement {
  const centro = props.cola === 'centro';
  return (
    <View
      testID={props.testID}
      flexDirection="row"
      alignItems={centro ? 'center' : 'flex-end'}
      gap={6}
    >
      <Don pose={props.pose} size={props.size} />
      <View
        position="relative"
        flex={1}
        minWidth={0}
        marginBottom={centro ? 0 : 10}
        paddingHorizontal={14}
        paddingVertical={10}
        borderRadius={radii[5]}
        borderWidth={borderWidths.thin}
        borderColor={colors.black}
        backgroundColor={colors.white}
        style={{ boxShadow: shadows.small }}
      >
        <Cola centro={centro} />
        {props.children}
      </View>
    </View>
  );
}
