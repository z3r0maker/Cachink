/**
 * Demo data catalog — sale templates and initial stock. Split from
 * demo-data-catalog.ts to keep both files under the 200-line cap.
 */

// ---------------------------------------------------------------------------
// Sale templates — concepto picks from products
// ---------------------------------------------------------------------------

export interface DemoSaleTemplate {
  readonly concepto: string;
  /** Index into the products array (demoProducts). */
  readonly productIndex: number;
  readonly montoCentavos: bigint;
  readonly cantidad: number;
}

export const DEMO_SALE_TEMPLATES: readonly DemoSaleTemplate[] = [
  { concepto: 'Tacos al Pastor x5', productIndex: 0, montoCentavos: 12_500n, cantidad: 5 },
  { concepto: 'Tacos de Bistec x4', productIndex: 1, montoCentavos: 11_200n, cantidad: 4 },
  {
    concepto: 'Orden familiar (12 tacos + 2 aguas)',
    productIndex: 0,
    montoCentavos: 37_000n,
    cantidad: 12,
  },
  {
    concepto: '2 Tortas de Milanesa + Refrescos',
    productIndex: 3,
    montoCentavos: 18_000n,
    cantidad: 2,
  },
  { concepto: 'Quesadillas x6 + Horchata', productIndex: 4, montoCentavos: 15_500n, cantidad: 6 },
  { concepto: 'Combo 3 Tortas + 3 Aguas', productIndex: 3, montoCentavos: 30_000n, cantidad: 3 },
  { concepto: 'Pedido oficina (20 tacos)', productIndex: 0, montoCentavos: 50_000n, cantidad: 20 },
  {
    concepto: 'Tacos al Pastor x3 + Refresco',
    productIndex: 0,
    montoCentavos: 10_000n,
    cantidad: 3,
  },
  { concepto: 'Refresco lata x6', productIndex: 5, montoCentavos: 15_000n, cantidad: 6 },
  { concepto: 'Agua de Horchata 1L x4', productIndex: 2, montoCentavos: 14_000n, cantidad: 4 },
  { concepto: 'Quesadillas x3', productIndex: 4, montoCentavos: 6_000n, cantidad: 3 },
  { concepto: 'Tacos variados x8', productIndex: 1, montoCentavos: 21_000n, cantidad: 8 },
] as const;

// ---------------------------------------------------------------------------
// Inventory stock quantities — initial "compra a proveedor" per product
// ---------------------------------------------------------------------------

export const INITIAL_STOCK: readonly number[] = [
  /* Taco Pastor   */ 200,
  /* Taco Bistec   */ 150,
  /* Horchata      */ 80,
  /* Torta         */ 100,
  /* Quesadilla    */ 120,
  /* Refresco      */ 80,
  /* Harina        */ 10,
  /* Aceite        */ 2, // low — triggers Director alert
  /* Servilletas   */ 30,
  /* Salsa verde   */ 15,
  /* Tortilla maíz */ 25,
  /* Carne pastor  */ 1, // low — triggers Director alert
] as const;
