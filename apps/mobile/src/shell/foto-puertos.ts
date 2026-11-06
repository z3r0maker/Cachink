/**
 * The phone's half of the product photo (M-13, ADR-134), handed to
 * `<AppProviders fotoPuertos>`: the local `subject-lift` module takes the
 * background off, react-native-skia encodes the 512 px WebP through the
 * shared `encodeProductPhoto`, and `expo-image-picker` is the gallery the
 * tile's long press opens. App-shell only: `packages/ui` never imports a
 * native module directly.
 */
import { Skia } from '@shopify/react-native-skia';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { encodeProductPhoto, type FotoPuertos } from '@xangarro/ui';
import { liftSubject } from '../../modules/subject-lift';

export const fotoPuertos: FotoPuertos = {
  recortar: (uri) => liftSubject(uri),
  codificar: async (uri, lifted) => {
    const data = await Skia.Data.fromURI(uri);
    return encodeProductPhoto(Skia, data, { lifted });
  },
  elegirDeGaleria: async () => {
    const picked = await launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    return picked.canceled ? null : (picked.assets[0]?.uri ?? null);
  },
};
