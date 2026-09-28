/**
 * The count and its explanation as screen state (MvCierre): pieces per
 * denomination, the motive and the note, and everything derived from them
 * (`derivar`). No repositories, so the stories drive the same state.
 */
import { useState } from 'react';
import type { CierreData, MotivoDiferencia } from '@xangarro/caja/cierre';
import type { ClaveDenominacion, ConteoDenominaciones } from '@xangarro/domain';
import { derivar, poner, type Derivados } from './cierre-logica';

export interface ConteoCierre extends Derivados {
  readonly conteo: ConteoDenominaciones;
  readonly poner: (clave: ClaveDenominacion, n: number) => void;
  readonly limpiar: () => void;
  readonly motivo: MotivoDiferencia | null;
  readonly setMotivo: (m: MotivoDiferencia) => void;
  readonly nota: string;
  readonly setNota: (n: string) => void;
}

export function useConteoCierre(data: CierreData | null): ConteoCierre {
  const [conteo, setConteo] = useState<ConteoDenominaciones>(data?.conteo ?? {});
  const [motivo, setMotivo] = useState<MotivoDiferencia | null>(null);
  const [nota, setNota] = useState('');
  const partes = data?.partes ?? {
    fondo: 0n,
    ventasEfectivo: 0n,
    abonosEfectivo: 0n,
    gastosEfectivo: 0n,
  };
  return {
    ...derivar(conteo, partes, motivo, nota),
    conteo,
    poner: (clave, n) => setConteo((c) => poner(c, clave, n)),
    limpiar: () => {
      setConteo({});
      setMotivo(null);
      setNota('');
    },
    motivo,
    setMotivo,
    nota,
    setNota,
  };
}
