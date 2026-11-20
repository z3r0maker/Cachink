'use client';

import { browserSupportsWebAuthn, startRegistration } from '@simplewebauthn/browser';
import { useEffect, useState } from 'react';

import { useDonCuentas, Vale, type Mood } from '@/components/trastienda/trastienda';
import { estadoEnlace, opcionesRegistro, registrarConEnlace } from '@/server/actions/acceso';

import { Cuerpo, INTROS, type Estado } from './cuerpo';

const MOODS: Readonly<Record<Estado['kind'], Mood>> = {
  revisando: 'nuevo',
  valido: 'nuevo',
  esperando: 'registrando',
  'no-creada': 'noCreada',
  fallida: 'noCreada',
  lista: 'lista',
  vencido: 'vencido',
  usado: 'usado',
  invalido: 'vencido',
};

const TITLES: Readonly<Record<Estado['kind'], string>> = {
  revisando: 'Revisando tu enlace…',
  valido: 'Vamos a darte tu llave.',
  esperando: 'Vamos a darte tu llave.',
  'no-creada': 'Vamos a darte tu llave.',
  fallida: 'Vamos a darte tu llave.',
  lista: 'Listo, ya tienes llave.',
  vencido: 'Este enlace ya venció.',
  usado: 'Este enlace ya se usó.',
  invalido: 'Este enlace ya no sirve.',
};

/** The token from the fragment (`#<token>`), never from the path or the query. */
const tokenFromHash = (): string => window.location.hash.replace(/^#/, '');

async function crear(token: string, nombre: string, vence: string, set: (e: Estado) => void) {
  const base = { nombre, vence };
  if (!browserSupportsWebAuthn()) return set({ kind: 'fallida', ...base });
  set({ kind: 'esperando', ...base });
  const started = await opcionesRegistro(token);
  if (started.kind !== 'opciones') return set(started);
  let answer;
  try {
    answer = await startRegistration({ optionsJSON: started.options });
  } catch {
    return set({ kind: 'no-creada', ...base });
  }
  const result = await registrarConEnlace(token, answer);
  if (result.kind === 'lista') return set({ kind: 'lista', llave: result.nombre });
  if (result.kind === 'enlace') return set(await estadoEnlace(token));
  set({ kind: 'fallida', ...base });
}

export function Registrar() {
  const [estado, setEstado] = useState<Estado>({ kind: 'revisando' });
  const [token, setToken] = useState('');
  const setMood = useDonCuentas();

  // A link pasted into the same tab changes only the fragment: check it again.
  useEffect(() => {
    const check = () => {
      const t = tokenFromHash();
      setToken(t);
      setEstado({ kind: 'revisando' });
      void estadoEnlace(t).then(setEstado);
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);
  useEffect(() => setMood(MOODS[estado.kind]), [estado.kind, setMood]);

  const fresh = ['revisando', 'valido', 'esperando', 'no-creada', 'fallida', 'lista'];
  return (
    <Vale
      eyebrow={fresh.includes(estado.kind) ? 'Vale de entrada · Llave nueva' : 'Vale de entrada'}
      title={TITLES[estado.kind]}
      titleId="registrar-title"
      intro={INTROS[estado.kind]}
    >
      <Cuerpo
        estado={estado}
        onCrear={(nombre, vence) => void crear(token, nombre, vence, setEstado)}
      />
    </Vale>
  );
}
