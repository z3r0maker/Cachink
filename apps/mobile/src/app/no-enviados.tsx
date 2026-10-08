/**
 * /no-enviados (A-08) became part of Registros por enviar (M-09): the refused
 * records are listed there with their retry. Kept so old links land.
 */
import type { ReactElement } from 'react';
import { Redirect } from 'expo-router';

export default function NoEnviadosRedirect(): ReactElement {
  return <Redirect href="/pendientes" />;
}
