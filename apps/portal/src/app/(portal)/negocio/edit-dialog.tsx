'use client';

import { REGIMEN_NOMBRE, regimenPatch } from '@xangarro/domain';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { Button, ConfirmDialog, Input, OptionCards, Switch } from '@/components';
import { editarNegocio } from '@/server/actions/negocio';

/**
 * «Editar datos» (P-08): name, régimen and ISR rate. The régimen is its SAT
 * code (owner decision 2026-09-18), picked from cards; choosing one offers its
 * suggested ISR rate, which the owner confirms or declines.
 *
 * Owner-only, and the server agrees: the régimen drives the NIF statements and
 * every comprobante, so the action requires `owner`, not `admin`.
 */
export interface Current {
  readonly nombre: string;
  readonly regimenSat: string | null;
  readonly isrTasa: number;
}

const COMUNES = ['626', '612', '601', '606', '605'];

const cards = (current: string | null) =>
  [...COMUNES, ...(current !== null && !COMUNES.includes(current) ? [current] : [])].map((c) => ({
    value: c,
    title: `${c} · ${REGIMEN_NOMBRE[c] ?? c}`,
    description: c === '626' ? 'RESICO: el más común para emprendedores.' : '',
  }));

const pct = (bp: number) => `${bp / 100}%`;

function useEditNegocio(current: Current, onClose: () => void) {
  const [nombre, setNombre] = useState(current.nombre);
  const [regimen, setRegimen] = useState(current.regimenSat);
  const [usarSugerida, setUsarSugerida] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  useEffect(() => {
    setNombre(current.nombre);
    setRegimen(current.regimenSat);
  }, [current.nombre, current.regimenSat]);

  const cambio = regimen !== null && regimen !== current.regimenSat;
  const sugerida = regimen === null ? null : regimenPatch(regimen).isrSugerido;
  const save = () =>
    startTransition(async () => {
      const r = await editarNegocio({
        nombre: nombre.trim(),
        ...(regimen === null ? {} : { regimenSat: regimen }),
        ...(cambio && usarSugerida && sugerida !== null ? { isrTasa: sugerida } : {}),
      });
      if (!r.ok) return setError(r.message);
      onClose();
      router.refresh();
    });
  return {
    nombre,
    setNombre,
    regimen,
    setRegimen,
    usarSugerida,
    setUsarSugerida,
    cambio,
    sugerida,
    error,
    pending,
    save,
  };
}

function Fields({
  f,
  current,
}: {
  readonly f: ReturnType<typeof useEditNegocio>;
  readonly current: Current;
}) {
  return (
    <>
      <Input
        labelText="Nombre del negocio"
        value={f.nombre}
        onChange={(e) => f.setNombre(e.target.value)}
        error={f.error ?? undefined}
        data-testid="negocio-nombre"
      />
      <OptionCards
        ariaLabel="Régimen fiscal"
        options={cards(current.regimenSat)}
        value={f.regimen}
        onValueChange={f.setRegimen}
      />
      {f.cambio && f.sugerida !== null && f.sugerida !== current.isrTasa ? (
        <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Switch
            checked={f.usarSugerida}
            label="Usar la tasa de ISR sugerida"
            onCheckedChange={f.setUsarSugerida}
          />
          Cambiar la tasa de ISR de {pct(current.isrTasa)} a {pct(f.sugerida)}, la sugerida para
          este régimen
        </label>
      ) : null}
    </>
  );
}

export function EditNegocioDialog({ current }: { readonly current: Current }) {
  const [open, setOpen] = useState(false);
  const f = useEditNegocio(current, () => setOpen(false));
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Editar datos
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Editar datos del negocio"
        body="Así aparece tu negocio en tus reportes, tus estados y tus comprobantes."
        confirmLabel={f.pending ? 'Guardando…' : 'Guardar'}
        onConfirm={f.save}
      >
        <Fields f={f} current={current} />
      </ConfirmDialog>
    </>
  );
}
