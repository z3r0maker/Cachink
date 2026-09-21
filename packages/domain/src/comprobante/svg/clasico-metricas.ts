/** Clásico's canvas: 540 px card, the ficha's paddings and column anchors. */
export const W = 540;
export const PAD = { sup: 36, lat: 34, inf: 26 } as const;
export const X_DER = W - PAD.lat;
export const X_CANT = X_DER - 110 - 12 + 26;
