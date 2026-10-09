/**
 * /productos/<id> became Inventario's movement sheet for that product
 * (Track M, M-09). Kept so old links land.
 */
import type { ReactElement } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ProductoRedirect(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: '/inventario', params: { producto: id } } as never} />;
}
