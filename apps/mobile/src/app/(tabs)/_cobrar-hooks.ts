/**
 * State for the /cobrar route (Track M, M-07): the catalogue as the tiles
 * read it, the ticket in progress, which sheet is open and the method the
 * tablet's ticket chose. Underscore prefix: Expo Router ignores this file.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { formatMoney, type InventoryCategory, type Product } from '@xangarro/domain';
import {
  impactLight,
  metodosDisponibles,
  productosDeCaja,
  useCrearProducto,
  useDueno,
  useEnabledPaymentMethods,
  useOpenCajaTurno,
  useProductosConStock,
  useProductosParaVenta,
  useSiguienteFolio,
  useStockMap,
  useTicketEnCurso,
  type MetodoCobro,
  type ProductoCobrar,
} from '@xangarro/ui';

export type Hoja = 'ticket' | 'escaner' | 'nuevo' | null;

export function useCatalogoCobrar() {
  const productosQ = useProductosParaVenta();
  const stockMap = useStockMap(useProductosConStock());
  const productos = useMemo(
    () => productosDeCaja(productosQ.data ?? [], stockMap),
    [productosQ.data, stockMap],
  );
  const tipos = useMemo(
    () => [...new Set((productosQ.data ?? []).map((p) => p.categoria))] as InventoryCategory[],
    [productosQ.data],
  );
  const estado: 'cargando' | 'error' | 'listo' = productosQ.isError
    ? 'error'
    : productosQ.isLoading
      ? 'cargando'
      : 'listo';
  return { productos, tipos, estado, reintentar: () => void productosQ.refetch() };
}

/** «Agregaste …»: the quick notice after a new product lands in the ticket. */
function useAviso() {
  const [aviso, setAviso] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => (timer.current ? clearTimeout(timer.current) : undefined), []);
  const mostrar = (texto: string): void => {
    setAviso(texto);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAviso(null), 4000);
  };
  return { aviso, mostrar, cerrar: () => setAviso(null) };
}

export function useCobrarRuta() {
  const router = useRouter();
  const ticket = useTicketEnCurso();
  const [hoja, setHoja] = useState<Hoja>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<MetodoCobro>('Efectivo');
  const aviso = useAviso();
  const crear = useCrearProducto();
  const agregar = (p: ProductoCobrar): void => {
    impactLight();
    ticket.agregar(p);
  };
  const alCobro = (m: MetodoCobro): void => {
    setHoja(null);
    router.push((m === 'Fiado' ? '/checkout/fiado' : `/checkout?metodo=${m}`) as never);
  };
  const nuevoListo = (p: Product): void => {
    ticket.agregar({ id: p.id, nombre: p.nombre, precio: p.precioVentaCentavos });
    setHoja(null);
    aviso.mostrar(`Agregaste ${p.nombre}, ${formatMoney(p.precioVentaCentavos)}`);
  };
  const abrirNuevo = (c: string | null): void => {
    setCodigo(c);
    setHoja('nuevo');
  };
  return {
    ticket,
    hoja,
    setHoja,
    codigo,
    metodo,
    setMetodo,
    aviso,
    crear,
    agregar,
    alCobro,
    nuevoListo,
    abrirNuevo,
  };
}

export function useCobrarContexto() {
  const turno = useOpenCajaTurno();
  const metodos = metodosDisponibles(useEnabledPaymentMethods());
  return { turno, metodos, folio: useSiguienteFolio(), dueno: useDueno() };
}
