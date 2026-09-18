'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, FilterChip, Input } from '@/components';

import { PERIODOS, type Periodo, type TipoPeriodo } from './periodo';

/**
 * The period switcher (P-14). Each choice is a URL, so the server recomputes
 * the statements for it — nothing here does arithmetic. Personalizado asks for
 * two dates and applies them together.
 */
function Personalizado({ periodo }: { readonly periodo: Periodo }) {
  const router = useRouter();
  const [desde, setDesde] = useState<string>(periodo.rango.desde);
  const [hasta, setHasta] = useState<string>(periodo.rango.hasta);
  const aplicar = () => router.push(`/estados?p=personalizado&desde=${desde}&hasta=${hasta}`);
  return (
    <>
      <Input
        labelText="Desde"
        type="date"
        value={desde}
        onChange={(e) => setDesde(e.target.value)}
        data-testid="periodo-desde"
      />
      <Input
        labelText="Hasta"
        type="date"
        value={hasta}
        onChange={(e) => setHasta(e.target.value)}
        data-testid="periodo-hasta"
      />
      <Button variant="secondary" onClick={aplicar}>
        Aplicar
      </Button>
    </>
  );
}

export function PeriodoSwitcher({ periodo }: { readonly periodo: Periodo }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoPeriodo>(periodo.tipo);
  const elegir = (t: TipoPeriodo) => {
    setTipo(t);
    if (t !== 'personalizado') router.push(`/estados?p=${t}`);
  };
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      {PERIODOS.map((p) => (
        <FilterChip
          key={p.value}
          label={p.label}
          selected={tipo === p.value}
          onSelect={() => elegir(p.value)}
        />
      ))}
      {tipo === 'personalizado' ? <Personalizado periodo={periodo} /> : null}
      <span role="status" style={{ marginLeft: 'auto', fontWeight: 700 }}>
        {periodo.etiqueta}
      </span>
    </div>
  );
}
