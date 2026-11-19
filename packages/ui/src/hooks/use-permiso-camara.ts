/**
 * The camera permission, for the screens that show the camera on a phone: the
 * button asks while the system can, and opens the app's Settings page after
 * that. Imported only from `.native` files.
 */
import { useCameraPermissions } from 'expo-camera';
import { Linking } from 'react-native';
import { accionPermisoCamara } from './permiso-camara';

export function usePermisoCamara() {
  const [permiso, pedir] = useCameraPermissions();
  const solicitar = (): void => {
    if (accionPermisoCamara(permiso) === 'ajustes') void Linking.openSettings();
    else void pedir();
  };
  return { permiso, solicitar };
}
