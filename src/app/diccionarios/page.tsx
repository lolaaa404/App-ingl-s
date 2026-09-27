import { GestorDiccionarios } from '@/components/GestorDiccionarios';
import { listarDiccionarios } from '@/lib/almacen/repositorios';

export const dynamic = 'force-dynamic';

export default async function PaginaDiccionarios() {
  return <GestorDiccionarios diccionarios={await listarDiccionarios()} />;
}
