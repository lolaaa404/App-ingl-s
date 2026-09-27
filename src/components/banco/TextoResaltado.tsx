'use client';

import clsx from 'clsx';
import { etiqueta as definicionEtiqueta } from '@/lib/etiquetas';
import { aparicionesDe } from '@/lib/utiles';
import type { Anotacion } from '@/lib/tipos';

interface Tramo {
  texto: string;
  anotacion?: Anotacion;
}

/**
 * Parte el texto en tramos marcados y sin marcar. Cada anotación aporta un
 * fragmento literal; se localiza su primera aparición y se descartan las que
 * se solapan con otra ya colocada, para que el resaltado no se enrede.
 */
function partir(texto: string, anotaciones: Anotacion[]): Tramo[] {
  const marcas: { inicio: number; fin: number; anotacion: Anotacion }[] = [];

  for (const anotacion of anotaciones) {
    const fragmento = anotacion.fragmento?.trim();
    if (!fragmento) continue;

    let posicion = aparicionesDe(texto, fragmento)[0];

    // Si no hay coincidencia con límites de palabra, se busca la subcadena.
    if (!posicion) {
      const indice = texto.toLowerCase().indexOf(fragmento.toLowerCase());
      if (indice === -1) continue;
      posicion = { inicio: indice, fin: indice + fragmento.length };
    }

    const solapa = marcas.some((m) => posicion!.inicio < m.fin && posicion!.fin > m.inicio);
    if (solapa) continue;

    marcas.push({ ...posicion, anotacion });
  }

  if (!marcas.length) return [{ texto }];

  marcas.sort((a, b) => a.inicio - b.inicio);

  const tramos: Tramo[] = [];
  let cursor = 0;

  for (const marca of marcas) {
    if (marca.inicio > cursor) tramos.push({ texto: texto.slice(cursor, marca.inicio) });
    tramos.push({ texto: texto.slice(marca.inicio, marca.fin), anotacion: marca.anotacion });
    cursor = marca.fin;
  }

  if (cursor < texto.length) tramos.push({ texto: texto.slice(cursor) });

  return tramos;
}

export function TextoResaltado({
  texto,
  anotaciones,
  ambito,
  className,
  onElegir,
}: {
  texto: string;
  anotaciones: Anotacion[];
  ambito: 'origen' | 'destino';
  className?: string;
  onElegir?: (anotacion: Anotacion) => void;
}) {
  const propias = anotaciones.filter((a) => a.ambito === ambito);
  const tramos = partir(texto, propias);

  return (
    <span className={className}>
      {tramos.map((tramo, indice) => {
        if (!tramo.anotacion) return <span key={indice}>{tramo.texto}</span>;

        const definicion = definicionEtiqueta(tramo.anotacion.etiqueta);

        return (
          <mark
            key={indice}
            onClick={onElegir ? () => onElegir(tramo.anotacion!) : undefined}
            title={`${definicion.nombre}: ${tramo.anotacion.motivo}`}
            className={clsx(
              'rounded-[3px] px-[2px] decoration-clone',
              definicion.clase,
              definicion.negrita && 'font-semibold',
              onElegir && 'cursor-pointer',
            )}
          >
            {tramo.texto}
          </mark>
        );
      })}
    </span>
  );
}
