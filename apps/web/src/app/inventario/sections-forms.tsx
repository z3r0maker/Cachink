'use client';

import { useState } from 'react';

import {
  Button,
  Celebration,
  ConfirmDialog,
  OptionCards,
  Seal,
  UsageBar,
  type OptionDef,
} from '@/components';

import { eyebrow, row, section } from './page.css';

const TIPOS: readonly OptionDef[] = [
  {
    value: 'inventario',
    title: 'Productos físicos con inventario',
    description: 'Vendes cosas que compras, produces o almacenas. Xangarro! lleva tu stock.',
  },
  {
    value: 'sin-inventario',
    title: 'Productos sin inventario',
    description: 'Vendes café, comida u otro producto que no necesita conteo de piezas.',
  },
  {
    value: 'servicios',
    title: 'Servicios',
    description: 'Ofreces cortes, consultas, clases u otro servicio sin producto físico.',
  },
  {
    value: 'mezcla',
    title: 'Mezcla de productos y servicios',
    description: 'Vendes un poco de todo. Puedes configurar qué sigue stock y qué no.',
  },
];

function Sellos() {
  const [celebrating, setCelebrating] = useState(false);
  return (
    <>
      <span className={eyebrow}>Sellos y celebración</span>
      <div className={row}>
        <Seal level="oro" label="Meta lograda" size={96} />
        <Seal level="plata" label="Meta lograda" size={96} />
        <Seal level="bronce" label="Meta lograda" size={96} />
        <Button onClick={() => setCelebrating(true)}>Ver celebración</Button>
      </div>
      <Celebration
        open={celebrating}
        onClose={() => setCelebrating(false)}
        title="¡Lograste tu meta!"
        body="Vendiste $56,400.00 en mayo. Te propusiste un reto y lo cumpliste."
        level="oro"
        streak={3}
      />
    </>
  );
}

export function Forms() {
  const [tipo, setTipo] = useState<string | null>('mezcla');
  const [confirming, setConfirming] = useState(false);

  return (
    <div className={section}>
      <span className={eyebrow}>Tarjetas de opción · ≤5 opciones, nunca un desplegable</span>
      <div style={{ maxWidth: 560 }}>
        <OptionCards
          options={TIPOS}
          value={tipo}
          onValueChange={setTipo}
          ariaLabel="¿Qué tipo de negocio tienes?"
        />
      </div>

      <span className={eyebrow}>Consumo · solo los límites con tope llevan barra</span>
      <div style={{ maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span>Usuarios · 2 de 2</span>
        <UsageBar used={2} limit={2} label="Usuarios usados" />
        <span>Registros del mes · 340 · sin límite</span>
        <UsageBar used={340} limit={null} label="Registros del mes" />
      </div>

      <span className={eyebrow}>Diálogo destructivo</span>
      <div className={row}>
        <Button variant="danger" onClick={() => setConfirming(true)}>
          Revocar dispositivo
        </Button>
      </div>
      <Sellos />

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="¿Revocar Android de la barra?"
        body="Revocar borra el acceso, no los datos ya sincronizados."
        confirmLabel="Revocar"
        destructive
        onConfirm={() => setConfirming(false)}
      />
    </div>
  );
}
