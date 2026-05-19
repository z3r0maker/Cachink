/**
 * EjecutarConversionUseCase — converts materia prima into finished
 * products based on a saved recipe.
 *
 * Creates two inventory movements:
 *   1. Salida on the materia prima (stock decreases)
 *   2. Entrada on the producto resultante (stock increases)
 * Then persists a Conversion record linking both.
 *
 * Phase 18: Conversion feature.
 */

import {
  today,
  type BusinessId,
  type IsoDate,
  type ProductId,
  type Conversion,
  type ConversionReceta,
  type ConversionRecetaId,
  type Product,
} from '@cachink/domain';
import type {
  ConversionRecetasRepository,
  ConversionsRepository,
  InventoryMovementsRepository,
  ProductsRepository,
} from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export interface EjecutarConversionInput {
  readonly recetaId: ConversionRecetaId;
  readonly multiplicador: number;
  readonly today?: IsoDate;
  readonly businessId: BusinessId;
}

export interface EjecutarConversionResult {
  readonly conversion: Conversion;
  readonly movimientoSalidaId: string;
  readonly movimientoEntradaId: string;
}

export class EjecutarConversionUseCase implements UseCase<
  EjecutarConversionInput,
  EjecutarConversionResult
> {
  readonly #recetas: ConversionRecetasRepository;
  readonly #conversions: ConversionsRepository;
  readonly #movements: InventoryMovementsRepository;
  readonly #products: ProductsRepository;

  constructor(
    recetas: ConversionRecetasRepository,
    conversions: ConversionsRepository,
    movements: InventoryMovementsRepository,
    products: ProductsRepository,
  ) {
    this.#recetas = recetas;
    this.#conversions = conversions;
    this.#movements = movements;
    this.#products = products;
  }

  async execute(input: EjecutarConversionInput): Promise<EjecutarConversionResult> {
    if (!Number.isInteger(input.multiplicador) || input.multiplicador < 1) {
      throw new TypeError('Multiplicador debe ser un entero ≥ 1');
    }
    const receta = await this.#recetas.findById(input.recetaId);
    if (!receta) throw new TypeError(`Receta ${input.recetaId} no encontrada`);

    const mp = await this.#validateStock(receta, input.multiplicador);
    const fecha = input.today ?? today();
    const cantidadSalida = receta.cantidadOrigen * input.multiplicador;
    const cantidadEntrada = receta.cantidadResultante * input.multiplicador;

    const movSalida = await this.#createSalida(
      receta.materiaPrimaId,
      fecha,
      cantidadSalida,
      mp.costoUnitCentavos,
      input.businessId,
    );
    const movEntrada = await this.#createEntrada(
      receta.productoResultanteId,
      fecha,
      cantidadEntrada,
      input.businessId,
    );
    return this.#buildResult(
      receta,
      cantidadSalida,
      cantidadEntrada,
      movSalida,
      movEntrada,
      input.businessId,
    );
  }

  async #buildResult(
    receta: ConversionReceta,
    cantidadSalida: number,
    cantidadEntrada: number,
    movSalida: { id: string },
    movEntrada: { id: string },
    businessId: BusinessId,
  ): Promise<EjecutarConversionResult> {
    const conversion = await this.#conversions.create({
      recetaId: receta.id,
      materiaPrimaId: receta.materiaPrimaId as string,
      productoResultanteId: receta.productoResultanteId as string,
      cantidadOrigenUsada: cantidadSalida,
      cantidadResultanteCreada: cantidadEntrada,
      movimientoSalidaId: movSalida.id,
      movimientoEntradaId: movEntrada.id,
      businessId,
    });
    return { conversion, movimientoSalidaId: movSalida.id, movimientoEntradaId: movEntrada.id };
  }

  async #validateStock(receta: ConversionReceta, multiplicador: number): Promise<Product> {
    const mp = await this.#products.findById(receta.materiaPrimaId);
    if (!mp) throw new TypeError('Materia prima no encontrada');

    const cantidadSalida = receta.cantidadOrigen * multiplicador;
    const currentStock = await this.#movements.sumStock(receta.materiaPrimaId);
    if (currentStock < cantidadSalida) {
      throw new TypeError(
        `Stock insuficiente: necesitas ${cantidadSalida} ${mp.unidad} de ${mp.nombre}, disponible ${currentStock}`,
      );
    }
    return mp;
  }

  async #createSalida(
    productoId: ProductId,
    fecha: IsoDate,
    cantidad: number,
    costoUnitCentavos: bigint,
    businessId: BusinessId,
  ) {
    return this.#movements.create({
      productoId,
      fecha,
      tipo: 'salida',
      cantidad,
      costoUnitCentavos,
      motivo: 'Conversión',
      nota: undefined,
      businessId,
    });
  }

  async #createEntrada(
    productoId: ProductId,
    fecha: IsoDate,
    cantidad: number,
    businessId: BusinessId,
  ) {
    const producto = await this.#products.findById(productoId);
    return this.#movements.create({
      productoId,
      fecha,
      tipo: 'entrada',
      cantidad,
      costoUnitCentavos: producto?.costoUnitCentavos ?? 0n,
      motivo: 'Conversión',
      nota: undefined,
      businessId,
    });
  }
}
