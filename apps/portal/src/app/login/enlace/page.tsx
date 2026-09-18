import { LinkRequestForm } from '../link-request';

/** «Entrar con un enlace» — public, outside the shell like `/login`. */
export default function EnlacePage() {
  return <LinkRequestForm kind="magic" />;
}
