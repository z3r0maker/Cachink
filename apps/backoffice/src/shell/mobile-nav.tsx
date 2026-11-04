'use client';

import { cajaBreakpoints } from '@xangarro/tokens';
import { useEffect, useRef, useState } from 'react';

import { CLOSE_ICON, Icon, MENU_ICON } from './icons';
import * as s from './mobile-nav.css';

/** Wide enough for the rail again: an open menu has nothing left to cover. */
const WIDE = `(min-width: ${cajaBreakpoints.rail}px)`;

function useDrawer() {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const d = ref.current;
    if (d === null) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return { ref, open, setOpen };
}

function TopBar({ open, onOpen }: { readonly open: boolean; readonly onOpen: () => void }) {
  return (
    <header className={s.topbar}>
      <button
        type="button"
        className={s.menuButton}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={onOpen}
      >
        <Icon d={MENU_ICON} />
        Menú
      </button>
      <div className={s.topBrand}>
        <span className={s.topWordmark}>XANGARRO!</span>
        <span className={s.topBadge}>TORRE DE CONTROL</span>
      </div>
    </header>
  );
}

function DrawerBody(props: {
  readonly brand: React.ReactNode;
  readonly onClose: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <div className={s.drawerPanel}>
      <div className={s.drawerHead}>
        {props.brand}
        <button
          type="button"
          className={s.closeButton}
          aria-label="Cerrar menú"
          onClick={props.onClose}
        >
          <Icon d={CLOSE_ICON} />
        </button>
      </div>
      {props.children}
    </div>
  );
}

/**
 * The console under the phone edge (canvas CD-19, CD-19b): a top bar whose
 * «Menú» opens the rail in a drawer. The rail's links mount only while it is
 * open, so the page never holds two copies of the console's navigation. A
 * tap on a link, on the backdrop, «Cerrar menú» or Escape closes it.
 */
export function MobileNav({
  brand,
  children,
}: {
  readonly brand: React.ReactNode;
  readonly children: React.ReactNode;
}) {
  const { ref, open, setOpen } = useDrawer();
  const close = () => setOpen(false);
  const onClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const target = e.target as Element;
    if (target === e.currentTarget || target.closest('a') !== null) close();
  };
  return (
    <>
      <TopBar open={open} onOpen={() => setOpen(true)} />
      <dialog
        ref={ref}
        className={s.drawer}
        aria-label="Menú de la consola"
        onClose={close}
        onClick={onClick}
      >
        {open ? (
          <DrawerBody brand={brand} onClose={close}>
            {children}
          </DrawerBody>
        ) : null}
      </dialog>
    </>
  );
}
