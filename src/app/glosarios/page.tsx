import { GestorGlosarios } from '@/components/GestorGlosarios';
import { listarGlosarios } from '@/lib/almacen/repositorios';

export const dynamic = 'force-dynamic';

export default async function PaginaGlosarios() {
  return <GestorGlosarios glosarios={await listarGlosarios()} />;
}
