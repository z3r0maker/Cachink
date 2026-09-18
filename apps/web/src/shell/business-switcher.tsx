'use client';

import * as Menu from '@radix-ui/react-dropdown-menu';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { cambiarNegocio } from '@/server/actions/negocio-activo';
import { ROLE_LABEL, type Role } from '@/session/types';

import { initials } from './initials';
import { bizName, initialsTile, roleLabel, switcher } from './header.css';
import { item, menu } from './user-menu.css';

/**
 * The business chip in the header (P-02). With one business it is a label;
 * with more it opens the list and switching reloads the portal on the other
 * one — the server checks the membership, the list is only a menu.
 */
export interface NegocioOption {
  readonly businessId: string;
  readonly nombre: string;
  readonly role: Role;
}

function Chip({ nombre, role }: { readonly nombre: string; readonly role: Role }) {
  return (
    <>
      <span className={initialsTile}>{initials(nombre)}</span>
      <span style={{ minWidth: 0 }}>
        <span className={bizName}>{nombre}</span>
        <span className={roleLabel}>{ROLE_LABEL[role]}</span>
      </span>
    </>
  );
}

function usePick() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pick = (id: string) =>
    startTransition(async () => {
      const r = await cambiarNegocio(id);
      if (!r.ok) return setError(r.message);
      router.replace('/');
      router.refresh();
    });
  return { error, pending, pick };
}

export function BusinessSwitcher(props: {
  readonly current: NegocioOption;
  readonly negocios: readonly NegocioOption[];
}) {
  const { error, pending, pick } = usePick();
  if (props.negocios.length <= 1) {
    return (
      <div className={switcher}>
        <Chip nombre={props.current.nombre} role={props.current.role} />
      </div>
    );
  }
  return (
    <Menu.Root>
      <Menu.Trigger className={switcher} aria-label="Cambiar de negocio" disabled={pending}>
        <Chip nombre={props.current.nombre} role={props.current.role} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content className={menu} style={{ width: 320 }} align="start" sideOffset={8}>
          <Menu.RadioGroup value={props.current.businessId} onValueChange={pick}>
            {props.negocios.map((n) => (
              <Menu.RadioItem key={n.businessId} value={n.businessId} className={item}>
                {n.nombre} · {ROLE_LABEL[n.role]}
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
          {error === null ? null : <p role="alert">{error}</p>}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
