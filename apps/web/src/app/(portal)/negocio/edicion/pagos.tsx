'use client';

import { METODOS_CONFIGURABLES, parseMetodosPago } from '@xangarro/domain';

import { Switch } from '@/components';

import { FieldRow, SectionShell } from '../parts';
import { fieldLabel, fieldRow, fieldValue } from '../negocio.css';
import type { Business } from './draft';
import type { Edicion } from './use-edicion';

/**
 * Tipos de pago (P-08): which methods the phones offer at the caja. One must
 * stay on — its switch is disabled. Crédito lives in Funciones: it needs
 * clientes and cobranza, not just a button.
 */
function PagoSwitch({ m, e }: { readonly m: string; readonly e: Edicion }) {
  const on = e.draft?.metodosPago ?? [];
  const checked = on.includes(m);
  const last = checked && on.length === 1;
  const toggle = (v: boolean) => e.set({ metodosPago: v ? [...on, m] : on.filter((x) => x !== m) });
  return (
    <div className={fieldRow}>
      <span className={fieldValue} style={{ marginLeft: 0 }}>
        {m}
      </span>
      <span style={{ marginLeft: 'auto' }}>
        <Switch checked={checked} label={m} disabled={last} onCheckedChange={toggle} />
      </span>
    </div>
  );
}

export function PagosCard({ e, business }: { readonly e: Edicion; readonly business: Business }) {
  const saved = parseMetodosPago(business.enabledPaymentMethods);
  return (
    <SectionShell title="Tipos de pago" tone="peach">
      {e.draft === null ? (
        METODOS_CONFIGURABLES.map((m) => (
          <FieldRow key={m} label={m} value={saved.includes(m) ? 'Lo aceptas' : 'Apagado'} />
        ))
      ) : (
        <>
          {METODOS_CONFIGURABLES.map((m) => (
            <PagoSwitch key={m} m={m} e={e} />
          ))}
          <p className={fieldLabel}>
            {e.errores.campos.metodosPago ?? 'Deja al menos uno. Crédito se activa en Funciones.'}
          </p>
        </>
      )}
    </SectionShell>
  );
}
