/**
 * How the caja names the owner (M-25, owner decision of 2026-11-20): always
 * «los patrones», with the verb in plural, never a name, on the phone, the
 * tablet and the web caja alike, as the Cierre first said it (ADR-147). Only
 * the device-linking screens, read before any operator exists, still say
 * «el dueño».
 */

export const PATRONES = 'los patrones';

/** «Vuelve el ícono en la caja y en el portal de los patrones». */
export const PORTAL_PATRONES = `el portal de ${PATRONES}`;
