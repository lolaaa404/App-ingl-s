import { notFound } from 'next/navigation';
import { Banco } from '@/components/banco/Banco';
import {
  listarDiccionarios,
  listarEstilos,
  listarGlosarios,
  obtenerProyecto,
} from '@/lib/almacen/repositorios';

export const dynamic = 'force-dynamic';

export default async function PaginaProyecto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [proyecto, estilos, glosarios, diccionarios] = await Promise.all([
    obtenerProyecto(id),
    listarEstilos(),
    listarGlosarios(),
    listarDiccionarios(),
  ]);

  if (!proyecto) notFound();

  return (
    <Banco
      proyectoInicial={proyecto}
      estilos={estilos}
      glosarios={glosarios}
      diccionarios={diccionarios}
    />
  );
}
