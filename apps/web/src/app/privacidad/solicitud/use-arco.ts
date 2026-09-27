'use client';

import { useState, useTransition } from 'react';

import { enviarSolicitudArco, type ArcoResult } from '@/server/actions/arco';

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** «Falta tu nombre, un correo válido y …»: a hint; the server is the one that refuses. */
function loQueFalta(nombre: string, correo: string, derecho: string | null, desc: string) {
  const faltan: string[] = [];
  if (nombre.trim() === '') faltan.push('tu nombre');
  if (!CORREO.test(correo.trim())) faltan.push('un correo válido');
  if (derecho === null) faltan.push('el derecho');
  if (desc.trim().length < 10) faltan.push('qué necesitas');
  if (faltan.length === 0) return null;
  const ultimo = faltan.pop() as string;
  return `Falta ${faltan.length === 0 ? ultimo : `${faltan.join(', ')} y ${ultimo}`}.`;
}

/** Form state and the send action, apart so the components stay presentational. */
export function useArcoForm() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [derecho, setDerecho] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [result, setResult] = useState<ArcoResult | null>(null);
  const [pending, start] = useTransition();
  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      setResult(await enviarSolicitudArco({ nombre, correo, derecho, descripcion }));
    });
  };
  const otra = () => {
    setNombre('');
    setCorreo('');
    setDerecho(null);
    setDescripcion('');
    setResult(null);
  };
  const falta = loQueFalta(nombre, correo, derecho, descripcion);
  return {
    ...{ nombre, setNombre, correo, setCorreo, derecho, setDerecho },
    ...{ descripcion, setDescripcion, result, pending, enviar, otra, falta },
  };
}

export type ArcoForm = ReturnType<typeof useArcoForm>;
