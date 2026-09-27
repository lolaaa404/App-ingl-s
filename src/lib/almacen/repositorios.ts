import 'server-only';

import { actualizarJSON, borrarArchivo, escribirJSON, leerJSON, listarArchivos } from './archivos';
import { ESTILOS_PREDEFINIDOS } from '../estilos/presets';
import { SIN_EQUIVALENTE } from '../referencias/sin-equivalente';
import { ahora, id, normalizarSuave } from '../utiles';
import type {
  Diccionario,
  EntradaGlosario,
  EntradaMemoria,
  EstiloTraduccion,
  Glosario,
  Idioma,
  Proyecto,
  ResumenProyecto,
} from '../tipos';

/* ------------------------------------------------------------------ */
/* Estilos                                                             */
/* ------------------------------------------------------------------ */

const ARCHIVO_ESTILOS = 'estilos.json';

export async function listarEstilos(): Promise<EstiloTraduccion[]> {
  const guardados = await leerJSON<EstiloTraduccion[]>(ARCHIVO_ESTILOS, []);
  // Los presets siempre están disponibles; los guardados con el mismo id los pisan.
  const porId = new Map(ESTILOS_PREDEFINIDOS.map((e) => [e.id, e]));
  for (const e of guardados) porId.set(e.id, e);
  return [...porId.values()];
}

export async function obtenerEstilo(estiloId: string): Promise<EstiloTraduccion> {
  const todos = await listarEstilos();
  return todos.find((e) => e.id === estiloId) ?? todos[0];
}

export async function guardarEstilo(estilo: EstiloTraduccion): Promise<EstiloTraduccion> {
  await actualizarJSON<EstiloTraduccion[]>(ARCHIVO_ESTILOS, [], (actual) => {
    const resto = actual.filter((e) => e.id !== estilo.id);
    return [...resto, estilo];
  });
  return estilo;
}

export async function borrarEstilo(estiloId: string): Promise<void> {
  if (ESTILOS_PREDEFINIDOS.some((e) => e.id === estiloId)) {
    throw new Error('Los estilos predefinidos no se pueden borrar. Duplícalos y edita la copia.');
  }
  await actualizarJSON<EstiloTraduccion[]>(ARCHIVO_ESTILOS, [], (actual) =>
    actual.filter((e) => e.id !== estiloId),
  );
}

/* ------------------------------------------------------------------ */
/* Memoria de traducción                                               */
/* ------------------------------------------------------------------ */

const ARCHIVO_MEMORIA = 'memoria.json';

export async function listarMemoria(): Promise<EntradaMemoria[]> {
  return leerJSON<EntradaMemoria[]>(ARCHIVO_MEMORIA, []);
}

/**
 * Guarda un par en la memoria. Si ya existe el mismo origen para el mismo par
 * de idiomas, se actualiza el destino en lugar de duplicar la entrada.
 */
export async function guardarEnMemoria(
  entradas: Omit<EntradaMemoria, 'id' | 'creado' | 'actualizado' | 'usos'>[],
): Promise<number> {
  if (!entradas.length) return 0;
  let guardadas = 0;

  await actualizarJSON<EntradaMemoria[]>(ARCHIVO_MEMORIA, [], (actual) => {
    const indice = new Map(
      actual.map((e) => [`${e.idiomaOrigen}|${e.idiomaDestino}|${normalizarSuave(e.origen)}`, e]),
    );

    for (const nueva of entradas) {
      if (!nueva.origen.trim() || !nueva.destino.trim()) continue;
      const clave = `${nueva.idiomaOrigen}|${nueva.idiomaDestino}|${normalizarSuave(nueva.origen)}`;
      const existente = indice.get(clave);
      if (existente) {
        existente.destino = nueva.destino;
        existente.dominio = nueva.dominio ?? existente.dominio;
        existente.estilo = nueva.estilo ?? existente.estilo;
        existente.proyecto = nueva.proyecto ?? existente.proyecto;
        existente.cliente = nueva.cliente ?? existente.cliente;
        existente.notas = nueva.notas ?? existente.notas;
        existente.actualizado = ahora();
        existente.usos += 1;
      } else {
        const creada: EntradaMemoria = {
          ...nueva,
          id: id('tm'),
          creado: ahora(),
          actualizado: ahora(),
          usos: 1,
        };
        actual.push(creada);
        indice.set(clave, creada);
      }
      guardadas++;
    }
    return actual;
  });

  return guardadas;
}

export async function borrarDeMemoria(ids: string[]): Promise<void> {
  const conjunto = new Set(ids);
  await actualizarJSON<EntradaMemoria[]>(ARCHIVO_MEMORIA, [], (actual) =>
    actual.filter((e) => !conjunto.has(e.id)),
  );
}

export async function reemplazarMemoria(entradas: EntradaMemoria[]): Promise<void> {
  await escribirJSON(ARCHIVO_MEMORIA, entradas);
}

/* ------------------------------------------------------------------ */
/* Glosarios                                                           */
/* ------------------------------------------------------------------ */

const ARCHIVO_GLOSARIOS = 'glosarios.json';

/** Glosario de fábrica con los términos sin equivalencia exacta. */
function glosarioBase(): Glosario {
  const entradas: EntradaGlosario[] = SIN_EQUIVALENTE.map((t) => ({
    id: `base_${t.termino.replace(/\s+/g, '-')}`,
    origen: t.termino,
    destino: t.estrategias[0] ?? '',
    idiomaOrigen: t.idioma,
    contexto: t.ambito,
    definicion: t.explicacion,
    prohibidos: [],
    sensibleContexto: true,
    sinEquivalente: true,
    notas: t.estrategias.join(' · '),
    fuentes: t.fuentes,
  }));

  return {
    id: 'base-sin-equivalente',
    nombre: 'Base · figuras sin equivalente exacto',
    dominio: 'Jurídico comparado',
    descripcion:
      'Glosario de fábrica con figuras del common law y del derecho continental que no tienen equivalente exacto en el otro ordenamiento.',
    entradas,
    creado: ahora(),
    actualizado: ahora(),
  };
}

export async function listarGlosarios(): Promise<Glosario[]> {
  const guardados = await leerJSON<Glosario[]>(ARCHIVO_GLOSARIOS, []);
  if (guardados.some((g) => g.id === 'base-sin-equivalente')) return guardados;
  return [glosarioBase(), ...guardados];
}

export async function obtenerGlosarios(ids: string[]): Promise<Glosario[]> {
  const todos = await listarGlosarios();
  if (!ids.length) return [];
  const conjunto = new Set(ids);
  return todos.filter((g) => conjunto.has(g.id));
}

export async function guardarGlosario(glosario: Glosario): Promise<Glosario> {
  const actualizado = { ...glosario, actualizado: ahora() };
  await actualizarJSON<Glosario[]>(ARCHIVO_GLOSARIOS, [], (actual) => {
    const base = actual.length ? actual : [glosarioBase()];
    const resto = base.filter((g) => g.id !== actualizado.id);
    return [...resto, actualizado];
  });
  return actualizado;
}

export async function borrarGlosario(glosarioId: string): Promise<void> {
  await actualizarJSON<Glosario[]>(ARCHIVO_GLOSARIOS, [], (actual) => {
    const base = actual.length ? actual : [glosarioBase()];
    return base.filter((g) => g.id !== glosarioId);
  });
}

/* ------------------------------------------------------------------ */
/* Diccionarios propios                                                */
/* ------------------------------------------------------------------ */

const ARCHIVO_DICCIONARIOS = 'diccionarios.json';

export async function listarDiccionarios(): Promise<Diccionario[]> {
  return leerJSON<Diccionario[]>(ARCHIVO_DICCIONARIOS, []);
}

export async function obtenerDiccionarios(ids: string[]): Promise<Diccionario[]> {
  if (!ids.length) return [];
  const todos = await listarDiccionarios();
  const conjunto = new Set(ids);
  return todos.filter((d) => conjunto.has(d.id));
}

export async function guardarDiccionario(diccionario: Diccionario): Promise<Diccionario> {
  const actualizado = { ...diccionario, actualizado: ahora() };
  await actualizarJSON<Diccionario[]>(ARCHIVO_DICCIONARIOS, [], (actual) => [
    ...actual.filter((d) => d.id !== actualizado.id),
    actualizado,
  ]);
  return actualizado;
}

export async function borrarDiccionario(diccionarioId: string): Promise<void> {
  await actualizarJSON<Diccionario[]>(ARCHIVO_DICCIONARIOS, [], (actual) =>
    actual.filter((d) => d.id !== diccionarioId),
  );
}

/* ------------------------------------------------------------------ */
/* Proyectos                                                           */
/* ------------------------------------------------------------------ */

function rutaProyecto(proyectoId: string): string {
  return `proyectos/${proyectoId}.json`;
}

export async function listarProyectos(): Promise<ResumenProyecto[]> {
  const archivos = await listarArchivos('proyectos');
  const resumenes: ResumenProyecto[] = [];

  for (const archivo of archivos) {
    if (!archivo.endsWith('.json')) continue;
    const p = await leerJSON<Proyecto | null>(`proyectos/${archivo}`, null);
    if (!p) continue;
    resumenes.push({
      id: p.id,
      nombre: p.nombre,
      idiomaOrigen: p.idiomaOrigen,
      idiomaDestino: p.idiomaDestino,
      estilo: p.estilo,
      segmentos: p.segmentos.length,
      traducidos: p.segmentos.filter((s) => s.estado !== 'pendiente').length,
      confirmados: p.segmentos.filter((s) => s.estado === 'confirmado').length,
      creado: p.creado,
      actualizado: p.actualizado,
    });
  }

  return resumenes.sort((a, b) => b.actualizado.localeCompare(a.actualizado));
}

export async function obtenerProyecto(proyectoId: string): Promise<Proyecto | null> {
  return leerJSON<Proyecto | null>(rutaProyecto(proyectoId), null);
}

export async function guardarProyecto(proyecto: Proyecto): Promise<Proyecto> {
  const actualizado = { ...proyecto, actualizado: ahora() };
  await escribirJSON(rutaProyecto(proyecto.id), actualizado);
  return actualizado;
}

export async function borrarProyecto(proyectoId: string): Promise<void> {
  await borrarArchivo(rutaProyecto(proyectoId));
}

/** Lee, modifica y guarda un proyecto de forma consistente. */
export async function mutarProyecto(
  proyectoId: string,
  transformar: (p: Proyecto) => Proyecto | Promise<Proyecto>,
): Promise<Proyecto> {
  const actual = await obtenerProyecto(proyectoId);
  if (!actual) throw new Error(`No existe el proyecto ${proyectoId}`);
  const nuevo = await transformar(actual);
  return guardarProyecto(nuevo);
}

export function crearProyectoVacio(datos: {
  nombre: string;
  idiomaOrigen: Idioma;
  idiomaDestino: Idioma;
  estilo: string;
  glosarios?: string[];
  diccionarios?: string[];
}): Proyecto {
  return {
    id: id('pr'),
    nombre: datos.nombre,
    idiomaOrigen: datos.idiomaOrigen,
    idiomaDestino: datos.idiomaDestino,
    estilo: datos.estilo,
    glosarios: datos.glosarios ?? [],
    diccionarios: datos.diccionarios ?? [],
    segmentos: [],
    creado: ahora(),
    actualizado: ahora(),
  };
}
