import { GestorMemoria } from '@/components/GestorMemoria';
import { listarMemoria } from '@/lib/almacen/repositorios';

export const dynamic = 'force-dynamic';

export default async function PaginaMemoria() {
  const entradas = await listarMemoria();
  const orden = [...entradas].sort((a, b) => b.actualizado.localeCompare(a.actualizado));

  return <GestorMemoria entradas={orden.slice(0, 400)} total={entradas.length} />;
}
