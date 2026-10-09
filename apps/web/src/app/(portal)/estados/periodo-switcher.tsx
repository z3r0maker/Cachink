'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { esIsoDate } from '@xangarro/domain';

import { Button, FilterChip, Input } from '@/components';

import { ayudaExportar } from './estados.css';
import { dentroDelTope, ERROR_TOPE, PERIODOS, type Periodo, type TipoPeriodo } from './periodo';

/**
 * The period switcher (P-14). Each choice is a URL, so the server recomputes
 * the statements for it — nothing here does arithmetic. Personalizado asks for
 * two dates and applies them together, and only a range of at most 13 months
 * (DS-09): past it the second date says so and «Aplicar» stays disabled, as it
 * does until both days are there and in order. The link to the export is
 * always offered for a longer look. The
 * server refuses the same range whatever the URL says.
 */
function errorDe(desde: string, hasta: string): string | undefined {
  if (!esIsoDate(desde) || !esIsoDate(hasta) || desde > hasta) return undefined;
  return dentroDelTope({ desde, hasta }) ? undefined : ERROR_TOPE;
}

function Personalizado({ periodo }: { readonly periodo: Periodo }) {
  const router = useRouter();
  const [desde, setDesde] = useState<string>(periodo.rango.desde);
  const [hasta, setHasta] = useState<string>(periodo.rango.hasta);
  const error = errorDe(desde, hasta);
  // Both days, in order, within the cap: anything else is not a period yet.
  const incompleto = !esIsoDate(desde) || !esIsoDate(hasta) || desde > hasta;
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
        error={error}
        onChange={(e) => setHasta(e.target.value)}
        data-testid="periodo-hasta"
      />
      <Button variant="secondary" onClick={aplicar} disabled={error !== undefined || incompleto}>
        Aplicar
      </Button>
      {/* Always under Personalizado, as EsEstadosRango shows it: the way past the cap. */}
      <Link href="/movimientos" data-testid="periodo-exportar" className={ayudaExportar}>
        ¿Necesitas más? Exporta tus movimientos.
      </Link>
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
