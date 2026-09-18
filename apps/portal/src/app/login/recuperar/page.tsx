import { LinkRequestForm } from '../link-request';

/** «¿Olvidaste tu contraseña?» — public, outside the shell like `/login`. */
export default function RecuperarPage() {
  return <LinkRequestForm kind="reset" />;
}
