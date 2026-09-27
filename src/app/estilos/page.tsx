import { GestorEstilos } from '@/components/GestorEstilos';
import { listarEstilos } from '@/lib/almacen/repositorios';

export const dynamic = 'force-dynamic';

export default async function PaginaEstilos() {
  return <GestorEstilos estilos={await listarEstilos()} />;
}
