/**
 * EditBusinessModal — inline edit for business nombre, regimenFiscal,
 * and isrTasa from the Settings screen.
 *
 * When the user changes the regime, a confirmation prompt asks whether
 * to update ISR to the DB-stored default for the new regime.
 */

import { useCallback, useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import {
  type Business,
  type IsrDefaults,
  type RegimenFiscal,
} from '@cachink/domain';
import { Btn, ConfirmDialog, Input, Modal } from '../../components/index';
import { OptionCardGroup } from '../../components/OptionCardGroup/index';
import { TextField } from '../../components/fields/index';
import { REGIMEN_CARDS } from '../BusinessForm/business-form-state';
import { useTranslation } from '../../i18n/index';
import { useEditarBusiness } from '../../hooks/use-editar-business';
import { useIsrDefaults } from '../../hooks/use-isr-defaults';

export interface EditBusinessModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly business: Business;
}

type T = ReturnType<typeof useTranslation>['t'];

function isrPctForRegimen(regimen: RegimenFiscal, defaults: IsrDefaults | undefined): number {
  if (!defaults) return 30;
  return (defaults[regimen] ?? 3000) / 100;
}

interface EditBusinessFormState {
  nombre: string;
  regimen: RegimenFiscal;
  isrPct: string;
  confirmOpen: boolean;
  pendingRegimen: RegimenFiscal | null;
}

function useSaveHandler(
  business: Business,
  nombre: string,
  regimen: RegimenFiscal,
  isrPct: string,
  editar: ReturnType<typeof useEditarBusiness>,
  onClose: () => void,
) {
  return useCallback(() => {
    const pct = Number(isrPct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return;
    editar.mutate(
      {
        id: business.id,
        patch: { nombre: nombre.trim(), regimenFiscal: regimen, isrTasa: Math.round(pct * 100) },
      },
      { onSuccess: () => onClose() },
    );
  }, [business.id, nombre, regimen, isrPct, editar, onClose]);
}

function useEditBusinessForm(business: Business, onClose: () => void) {
  const editar = useEditarBusiness();
  const { data: isrDefaults } = useIsrDefaults();
  const [nombre, setNombre] = useState(business.nombre);
  const [regimen, setRegimen] = useState<RegimenFiscal>(business.regimenFiscal as RegimenFiscal);
  const [isrPct, setIsrPct] = useState(String(business.isrTasa / 100));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRegimen, setPendingRegimen] = useState<RegimenFiscal | null>(null);

  const handleRegimenChange = useCallback((value: string) => {
    setPendingRegimen(value as RegimenFiscal);
    setConfirmOpen(true);
  }, []);

  const acceptIsrChange = useCallback(() => {
    if (!pendingRegimen) return;
    setRegimen(pendingRegimen);
    setIsrPct(String(isrPctForRegimen(pendingRegimen, isrDefaults)));
    setPendingRegimen(null);
    setConfirmOpen(false);
  }, [pendingRegimen, isrDefaults]);

  const rejectIsrChange = useCallback(() => {
    if (!pendingRegimen) return;
    setRegimen(pendingRegimen);
    setPendingRegimen(null);
    setConfirmOpen(false);
  }, [pendingRegimen]);

  const handleSave = useSaveHandler(business, nombre, regimen, isrPct, editar, onClose);
  const state: EditBusinessFormState = { nombre, regimen, isrPct, confirmOpen, pendingRegimen };
  const h1 = { setNombre, setIsrPct, handleRegimenChange };
  const h2 = { acceptIsrChange, rejectIsrChange, handleSave };
  return { state, ...h1, ...h2, saving: editar.isPending, isrDefaults };
}

interface EditBusinessFormProps {
  readonly form: ReturnType<typeof useEditBusinessForm>;
  readonly t: T;
}

function EditBusinessForm(props: EditBusinessFormProps): ReactElement {
  const { form, t } = props;
  const { state, setNombre, setIsrPct, handleRegimenChange, handleSave, saving } = form;
  return (
    <View gap={12} paddingHorizontal={4}>
      <TextField
        label={t('settings.negocioLabel')}
        value={state.nombre}
        onChange={setNombre}
        testID="edit-business-nombre"
      />
      <OptionCardGroup<RegimenFiscal>
        label={t('settings.regimenLabel') as string}
        value={state.regimen}
        onChange={handleRegimenChange}
        options={REGIMEN_CARDS}
        testID="edit-business-regimen"
      />
      <Input
        type="number"
        label={t('settings.isrLabel')}
        value={state.isrPct}
        onChange={setIsrPct}
        testID="edit-business-isr"
      />
      <Btn
        variant="primary"
        onPress={handleSave}
        disabled={saving}
        fullWidth
        testID="edit-business-save"
      >
        {t('actions.save')}
      </Btn>
    </View>
  );
}

export function EditBusinessModal(props: EditBusinessModalProps): ReactElement {
  const { t } = useTranslation();
  const form = useEditBusinessForm(props.business, props.onClose);
  const suggestedPct = form.state.pendingRegimen
    ? isrPctForRegimen(form.state.pendingRegimen, form.isrDefaults)
    : 0;
  return (
    <>
      <Modal
        open={props.open}
        onClose={props.onClose}
        title={t('settings.editBusinessLabel')}
        testID="edit-business-modal"
      >
        <EditBusinessForm form={form} t={t} />
      </Modal>
      <ConfirmDialog
        open={form.state.confirmOpen}
        onClose={form.rejectIsrChange}
        onConfirm={form.acceptIsrChange}
        title={t('settings.confirmIsrChangeTitle')}
        description={t('settings.confirmIsrChangeBody').replace('{{pct}}', String(suggestedPct))}
        confirmLabel={t('settings.confirmIsrYes')}
        cancelLabel={t('settings.confirmIsrNo')}
      />
    </>
  );
}
