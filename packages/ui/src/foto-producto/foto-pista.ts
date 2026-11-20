/**
 * What a camera's hint says under its guide (MvFotoCamara, CgHoja): two
 * lines, and the line the permission ask says when it is not the product's.
 */
/** What the hint under the guide says. */
export interface PistaCamara {
  readonly titulo: string;
  readonly cuerpo: string;
  /** The permission ask's line, when it is not the product's. */
  readonly permiso?: string;
}

export const PISTA_PRODUCTO: PistaCamara = {
  titulo: 'Ponlo sobre algo liso y con luz',
  cuerpo: 'Se recorta el fondo solo. Si no se puede, se guarda la foto completa.',
};
