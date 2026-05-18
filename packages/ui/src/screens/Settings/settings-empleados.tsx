/**
 * SettingsEmpleados — employee management sub-screen (Add, Edit, Delete).
 *
 * Lists all active employees with tap-to-edit and delete confirmation.
 * Uses shared EmpleadoFields and existing TanStack hooks.
 */

import { useState, type ReactElement } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import { formatMoney, type Employee } from '@cachink/domain';
import {
  Btn,
  Card,
  ConfirmDialog,
  EmptyState,
  Icon,
  SectionTitle,
  Tag,
} from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { useEmpleadosForBusiness } from '../../hooks/use-empleados-for-business';
import { useCrearEmpleado } from '../../hooks/use-crear-empleado';
import { useEditEmpleado } from '../../hooks/use-edit-empleado';
import { useEliminarEmpleado } from '../../hooks/use-eliminar-empleado';
import { NuevoEmpleadoModal } from '../Egresos/tabs/nuevo-empleado-modal';
import { EditEmpleadoModal } from './edit-empleado-modal';

export interface SettingsEmpleadosProps {
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

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
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.semibold} fontSize={16} color={colors.black}>
        {employee.nombre}
      </Text>
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.medium} fontSize={13} color={colors.gray600} marginTop={2}>
        {employee.puesto}
      </Text>
      <View flexDirection="row" alignItems="center" gap={8} marginTop={4}>
        <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.semibold} fontSize={14} color={colors.black}>
          {formatMoney(employee.salarioCentavos)}
        </Text>
        <Tag>{periodoLabel(employee.periodo)}</Tag>
      </View>
    </View>
  );
}

function EmpleadoListItem({
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

function EmpleadosHeader({ t, onAdd }: { t: T; onAdd: () => void }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" justifyContent="space-between">
      <SectionTitle title={t('settings.empleadosCard')} />
      <Btn variant="primary" size="sm" onPress={onAdd} testID="empleados-add-btn" icon={<Icon name="plus" size={16} color={colors.white} />}>
        {t('empleados.addCta')}
      </Btn>
    </View>
  );
}

function useEmpleadosState() {
  const crear = useCrearEmpleado();
  const editar = useEditEmpleado();
  const eliminar = useEliminarEmpleado();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const mutations = { crear, editar, eliminar };
  const os = { addOpen, setAddOpen, editTarget, setEditTarget, deleteTarget, setDeleteTarget };
  return { ...mutations, ...os };
}

type EmpleadosState = ReturnType<typeof useEmpleadosState>;

interface EmpleadoModalsProps {
  readonly state: EmpleadosState;
  readonly t: T;
}

function EmpleadoModals({ state, t }: EmpleadoModalsProps): ReactElement {
  const deleteDesc = state.deleteTarget
    ? t('empleados.deleteConfirmMessage').replace('{nombre}', state.deleteTarget.nombre)
    : '';
  const onConfirmDelete = () => {
    if (!state.deleteTarget) return;
    state.eliminar.mutate(state.deleteTarget.id, { onSuccess: () => state.setDeleteTarget(null) });
  };
  return (
    <>
      <NuevoEmpleadoModal
        open={state.addOpen}
        onClose={() => state.setAddOpen(false)}
        onSubmit={(input) => state.crear.mutate(input, { onSuccess: () => state.setAddOpen(false) })}
        submitting={state.crear.isPending}
      />
      {state.editTarget && (
        <EditEmpleadoModal
          open={state.editTarget !== null}
          onClose={() => state.setEditTarget(null)}
          employee={state.editTarget}
          onSubmit={(input) =>
            state.editar.mutate(input, { onSuccess: () => state.setEditTarget(null) })
          }
          submitting={state.editar.isPending}
        />
      )}
      <ConfirmDialog
        open={state.deleteTarget !== null}
        onClose={() => state.setDeleteTarget(null)}
        onConfirm={onConfirmDelete}
        title={t('empleados.deleteConfirmTitle')}
        description={deleteDesc}
        confirmLabel={t('empleados.deleteConfirm')}
        cancelLabel={t('empleados.deleteCancel')}
        tone="danger"
      />
    </>
  );
}

export function SettingsEmpleados(props: SettingsEmpleadosProps): ReactElement {
  const { t } = useTranslation();
  const { data: employees = [] } = useEmpleadosForBusiness();
  const st = useEmpleadosState();
  return (
    <>
      <ScrollView
        testID={props.testID ?? 'settings-empleados-screen'}
        style={{ flex: 1, backgroundColor: colors.offwhite }}
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 24 }}
      >
        <EmpleadosHeader t={t} onAdd={() => st.setAddOpen(true)} />
        {employees.length === 0 ? (
          <EmptyState title={t('empleados.emptyState')} icon="users" testID="empleados-empty" />
        ) : (
          employees.map((e, i) => (
            <EmpleadoListItem
              key={e.id}
              employee={e}
              index={i}
              onEdit={() => st.setEditTarget(e)}
              onDelete={() => st.setDeleteTarget(e)}
            />
          ))
        )}
      </ScrollView>
      <EmpleadoModals state={st} t={t} />
    </>
  );
}
