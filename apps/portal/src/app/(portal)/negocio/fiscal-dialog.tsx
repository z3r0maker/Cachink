'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button, ConfirmDialog, Input, OptionCards } from '@/components';
import { editarDatosFiscales, type DatosFiscalesResult } from '@/server/actions/datos-fiscales';

/**
 * «Datos fiscales» (P-08): RFC, razón social, código postal and uso de CFDI.
 * Any may stay blank; what is filled in is validated with the same rules the
 * CFDI router uses (the RFC's check digit included). Owner only.
 */
export interface FiscalActual {
  readonly rfc: string | null;
  readonly razonSocial: string | null;
  readonly codigoPostal: string | null;
  readonly usoCfdi: string | null;
}

const USOS = [
  { value: 'G03', title: 'G03 · Gastos en general', description: 'Lo habitual para un negocio.' },
  {
    value: 'G01',
    title: 'G01 · Adquisición de mercancías',
    description: 'Si revendes lo que compras.',
  },
  { value: 'S01', title: 'S01 · Sin efectos fiscales', description: 'Si no deduces la factura.' },
];

type Errors = Extract<DatosFiscalesResult, { ok: false }>['errors'];

function useFiscal(actual: FiscalActual, onDone: () => void) {
  const [form, setForm] = useState({
    rfc: actual.rfc ?? '',
    razonSocial: actual.razonSocial ?? '',
    codigoPostal: actual.codigoPostal ?? '',
    usoCfdi: actual.usoCfdi ?? 'G03',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const save = () =>
    startTransition(async () => {
      const r = await editarDatosFiscales(form);
      if (!r.ok) {
        setErrors(r.errors);
        setNote(r.message ?? null);
        return;
      }
      setErrors({});
      setNote(r.warnings[0] ?? null);
      if (r.warnings.length === 0) onDone();
      router.refresh();
    });
  return { form, set, errors, note, pending, save };
}

function Fields({ f }: { readonly f: ReturnType<typeof useFiscal> }) {
  return (
    <>
      <Input
        labelText="RFC"
        value={f.form.rfc}
        onChange={(e) => f.set({ rfc: e.target.value.toUpperCase() })}
        error={f.errors.rfc}
        data-testid="fiscal-rfc"
      />
      <Input
        labelText="Razón social"
        value={f.form.razonSocial}
        onChange={(e) => f.set({ razonSocial: e.target.value })}
        error={f.errors.razonSocial}
        data-testid="fiscal-razon"
      />
      <Input
        labelText="Código postal fiscal"
        numeric
        value={f.form.codigoPostal}
        onChange={(e) => f.set({ codigoPostal: e.target.value })}
        error={f.errors.codigoPostal}
        data-testid="fiscal-cp"
      />
      <OptionCards
        ariaLabel="Uso de CFDI"
        options={USOS}
        value={f.form.usoCfdi}
        onValueChange={(v) => f.set({ usoCfdi: v })}
      />
      {f.note === null ? null : <p role="status">{f.note}</p>}
    </>
  );
}

export function FiscalDialog({ actual }: { readonly actual: FiscalActual }) {
  const [open, setOpen] = useState(false);
  const f = useFiscal(actual, () => setOpen(false));
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Editar datos fiscales
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Datos fiscales"
        body="Para facturar a tu nombre. Puedes dejar en blanco lo que aún no tengas."
        confirmLabel={f.pending ? 'Guardando…' : 'Guardar'}
        onConfirm={f.save}
      >
        <Fields f={f} />
      </ConfirmDialog>
    </>
  );
}
