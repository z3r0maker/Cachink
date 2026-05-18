/** EmpleadoListItem — row component for the employee list. */

import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import { formatMoney, type Employee } from '@cachink/domain';
import { Btn, Card, Icon, Tag } from '../../components/index';
import { colors, typography } from '../../theme';

function periodoLabel(periodo: string): string {
  switch (periodo) {
    case 'semanal':
      return 'Semanal';
    case 'quincenal':
      return 'Quincenal';
    case 'mensual':
      return 'Mensual';
    default:
      return periodo;
  }
}

function EmpleadoInfo({ employee }: { employee: Employee }): ReactElement {
  return (
    <View flex={1}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={16}
        color={colors.black}
      >
        {employee.nombre}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.gray600}
        marginTop={2}
      >
        {employee.puesto}
      </Text>
      <View flexDirection="row" alignItems="center" gap={8} marginTop={4}>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.semibold}
          fontSize={14}
          color={colors.black}
        >
          {formatMoney(employee.salarioCentavos)}
        </Text>
        <Tag>{periodoLabel(employee.periodo)}</Tag>
      </View>
    </View>
  );
}

export function EmpleadoListItem({
  employee,
  index,
  onEdit,
  onDelete,
}: {
  employee: Employee;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}): ReactElement {
  return (
    <Card padding="md" fullWidth testID={`empleado-row-${index}`}>
      <Pressable onPress={onEdit} testID={`empleado-edit-${index}`}>
        <View flexDirection="row" alignItems="center" gap={12}>
          <EmpleadoInfo employee={employee} />
          <Btn
            variant="ghost"
            size="sm"
            onPress={onDelete}
            testID={`empleado-delete-${index}`}
            icon={<Icon name="trash-2" size={16} color={colors.red} />}
          />
        </View>
      </Pressable>
    </Card>
  );
}
